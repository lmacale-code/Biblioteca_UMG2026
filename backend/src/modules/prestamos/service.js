import pool from "../../db/pool.js";
import { calcularMulta } from "../../utils/multas.js";

const CONFIGURACION_PRESTAMO = {
  dias_prestamo: 7,
  multa_por_dia: 5,
};

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function validarId(value, label) {
  if (
    typeof value !== "number"
    && !(typeof value === "string" && /^[1-9]\d*$/.test(value))
  ) {
    throw httpError(400, `El identificador de ${label} no es válido`);
  }
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) {
    throw httpError(400, `El identificador de ${label} no es válido`);
  }
  return id;
}

function fechaGuatemala() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Guatemala",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function sumarDias(fecha, dias) {
  const [year, month, day] = fecha.split("-").map(Number);
  const limite = new Date(Date.UTC(year, month - 1, day + dias));
  if (Number.isNaN(limite.getTime()) || limite.getUTCFullYear() > 9999) {
    throw httpError(400, "El plazo solicitado excede el rango de fechas permitido");
  }
  return limite.toISOString().slice(0, 10);
}

async function obtenerConfiguracion(connection = pool) {
  const [rows] = await connection.query(
    "SELECT clave, valor FROM configuracion WHERE clave IN (?, ?)",
    ["dias_prestamo", "multa_por_dia"],
  );
  const values = { ...CONFIGURACION_PRESTAMO };
  for (const row of rows) {
    const value = Number(row.valor);
    if (Number.isFinite(value) && value >= 0) values[row.clave] = value;
  }
  return values;
}

export async function listarPrestamos(filtros = {}) {
  const where = [];
  const parameters = [];

  if (filtros.estado !== undefined && filtros.estado !== "") {
    if (typeof filtros.estado !== "string" || !["activo", "devuelto"].includes(filtros.estado)) {
      throw httpError(400, "El estado debe ser activo o devuelto");
    }
    where.push("p.estado = ?");
    parameters.push(filtros.estado);
  }
  if (filtros.socio_id !== undefined && filtros.socio_id !== "") {
    where.push("p.socio_id = ?");
    parameters.push(validarId(filtros.socio_id, "socio"));
  }

  const [rows] = await pool.query(
    `SELECT p.id, p.libro_id, p.socio_id, p.fecha_salida, p.fecha_limite,
            p.fecha_devolucion, p.estado, p.dias_retraso, p.multa_monto,
            p.multa_pagada, l.titulo AS libro_titulo, l.isbn AS libro_isbn,
            u.nombre AS socio_nombre, u.carnet AS socio_carnet
       FROM prestamos p
       JOIN libros l ON l.id = p.libro_id
       JOIN usuarios u ON u.id = p.socio_id
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY (p.estado = 'activo') DESC, p.fecha_limite, p.id`,
    parameters,
  );
  const { multa_por_dia: multaPorDia } = await obtenerConfiguracion();
  const hoy = fechaGuatemala();

  return rows.map((prestamo) => {
    const multaActual = prestamo.estado === "activo"
      ? calcularMulta(prestamo.fecha_limite, hoy, multaPorDia)
      : { diasRetraso: Number(prestamo.dias_retraso), monto: Number(prestamo.multa_monto) };

    return {
      ...prestamo,
      dias_retraso: Number(prestamo.dias_retraso),
      multa_monto: Number(prestamo.multa_monto),
      multa_acumulada: multaActual.monto,
      dias_retraso_acumulados: multaActual.diasRetraso,
      multa_pendiente: prestamo.multa_pagada ? 0 : multaActual.monto,
      vencido: prestamo.estado === "activo" && prestamo.fecha_limite < hoy,
    };
  });
}

export async function crearPrestamo(input, usuarioId) {
  const libroId = validarId(input?.libro_id, "libro");
  const socioId = validarId(input?.socio_id, "socio");
  const registradoPor = validarId(usuarioId, "usuario");
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const [books] = await connection.query(
      "SELECT id, ejemplares_disponibles, activo FROM libros WHERE id = ? FOR UPDATE",
      [libroId],
    );
    const book = books[0];
    if (!book || !book.activo) {
      throw httpError(404, "No se encontró un libro activo con ese identificador");
    }
    if (Number(book.ejemplares_disponibles) < 1) {
      throw httpError(409, "No hay ejemplares disponibles de este libro");
    }

    const [members] = await connection.query(
      "SELECT id, activo FROM usuarios WHERE id = ? AND rol = ? FOR UPDATE",
      [socioId, "socio"],
    );
    if (!members[0] || !members[0].activo) {
      throw httpError(404, "No se encontró un socio activo con ese identificador");
    }

    const [[prestamosActivos]] = await connection.query(
      "SELECT COUNT(*) AS total FROM prestamos WHERE socio_id = ? AND estado = ?",
      [socioId, "activo"],
    );
    if (Number(prestamosActivos.total) >= 3) {
      throw httpError(409, "El socio ya tiene el máximo de tres préstamos activos");
    }

    const [multasPendientes] = await connection.query(
      `SELECT id FROM prestamos
        WHERE socio_id = ? AND multa_pagada = ? AND multa_monto > 0
        LIMIT 1`,
      [socioId, false],
    );
    if (multasPendientes.length > 0) {
      throw httpError(409, "El socio tiene multas pendientes de pago");
    }

    const [mismoLibroActivo] = await connection.query(
      `SELECT id FROM prestamos
        WHERE socio_id = ? AND libro_id = ? AND estado = ?
        LIMIT 1`,
      [socioId, libroId, "activo"],
    );
    if (mismoLibroActivo.length > 0) {
      throw httpError(409, "El socio ya tiene un préstamo activo de este libro");
    }

    const { dias_prestamo: diasPrestamo } = await obtenerConfiguracion(connection);
    const hoy = fechaGuatemala();
    const fechaLimite = sumarDias(hoy, diasPrestamo);
    const [result] = await connection.query(
      `INSERT INTO prestamos
         (libro_id, socio_id, fecha_salida, fecha_limite, estado, registrado_por)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [libroId, socioId, hoy, fechaLimite, "activo", registradoPor],
    );
    const [inventory] = await connection.query(
      `UPDATE libros
          SET ejemplares_disponibles = ejemplares_disponibles - 1
        WHERE id = ? AND ejemplares_disponibles > 0`,
      [libroId],
    );
    if (inventory.affectedRows !== 1) {
      throw httpError(409, "No hay ejemplares disponibles de este libro");
    }

    await connection.commit();
    return {
      id: result.insertId,
      libro_id: libroId,
      socio_id: socioId,
      fecha_salida: hoy,
      fecha_limite: fechaLimite,
      fecha_devolucion: null,
      estado: "activo",
      dias_retraso: 0,
      multa_monto: 0,
      multa_pagada: false,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function devolverPrestamo(id) {
  const prestamoId = validarId(id, "préstamo");
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const [loans] = await connection.query(
      `SELECT id, libro_id, socio_id, fecha_salida, fecha_limite, estado
         FROM prestamos WHERE id = ? FOR UPDATE`,
      [prestamoId],
    );
    const loan = loans[0];
    if (!loan) throw httpError(404, "No se encontró el préstamo");
    if (loan.estado !== "activo") {
      throw httpError(409, "El préstamo ya fue devuelto");
    }

    const [books] = await connection.query(
      "SELECT id, total_ejemplares, ejemplares_disponibles FROM libros WHERE id = ? FOR UPDATE",
      [loan.libro_id],
    );
    if (!books[0]) throw httpError(404, "No se encontró el libro del préstamo");

    const fechaDevolucion = fechaGuatemala();
    const { multa_por_dia: multaPorDia } = await obtenerConfiguracion(connection);
    const multa = calcularMulta(loan.fecha_limite, fechaDevolucion, multaPorDia);
    await connection.query(
      `UPDATE prestamos
          SET fecha_devolucion = ?, estado = ?, dias_retraso = ?, multa_monto = ?,
              multa_pagada = ?
        WHERE id = ?`,
      [
        fechaDevolucion,
        "devuelto",
        multa.diasRetraso,
        multa.monto,
        multa.monto === 0,
        prestamoId,
      ],
    );
    const [inventory] = await connection.query(
      `UPDATE libros
          SET ejemplares_disponibles = ejemplares_disponibles + 1
        WHERE id = ? AND ejemplares_disponibles < total_ejemplares`,
      [loan.libro_id],
    );
    if (inventory.affectedRows !== 1) {
      throw httpError(409, "No se puede actualizar el inventario de este libro");
    }

    const [[prestamoActualizado]] = await connection.query(
      `SELECT id, libro_id, socio_id, fecha_salida, fecha_limite, fecha_devolucion,
              estado, dias_retraso, multa_monto, multa_pagada
         FROM prestamos WHERE id = ?`,
      [prestamoId],
    );
    await connection.commit();
    return prestamoActualizado;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function pagarMulta(id) {
  const prestamoId = validarId(id, "préstamo");
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const [loans] = await connection.query(
      "SELECT id, estado, multa_monto, multa_pagada FROM prestamos WHERE id = ? FOR UPDATE",
      [prestamoId],
    );
    const loan = loans[0];
    if (!loan) throw httpError(404, "No se encontró el préstamo");
    if (loan.estado !== "devuelto") {
      throw httpError(409, "La multa solo puede pagarse después de devolver el libro");
    }
    if (Number(loan.multa_monto) <= 0) {
      throw httpError(409, "El préstamo no tiene una multa pendiente");
    }
    if (loan.multa_pagada) {
      throw httpError(409, "La multa de este préstamo ya fue pagada");
    }

    await connection.query(
      "UPDATE prestamos SET multa_pagada = ? WHERE id = ?",
      [true, prestamoId],
    );
    await connection.commit();
    return { id: prestamoId, multa_pagada: true };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
