import pool from "../../db/pool.js";
import { calcularMulta } from "../../utils/multas.js";

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

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function validarId(id) {
  const numericId = Number(id);
  if (!Number.isSafeInteger(numericId) || numericId < 1) {
    throw httpError(400, "El identificador del socio no es válido");
  }
  return numericId;
}

function validarFecha(value, label) {
  if (value === undefined || value === "") return "";
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw httpError(400, `La fecha ${label} debe tener formato AAAA-MM-DD`);
  }
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw httpError(400, `La fecha ${label} no es válida`);
  }
  return value;
}

function validarFiltros(filtros = {}) {
  const estado = typeof filtros.estado === "string" ? filtros.estado.trim() : "";
  const busqueda = typeof filtros.q === "string" ? filtros.q.trim() : "";
  const desde = validarFecha(filtros.desde, "inicial");
  const hasta = validarFecha(filtros.hasta, "final");
  if (filtros.estado !== undefined && typeof filtros.estado !== "string") {
    throw httpError(400, "El filtro de estado no es válido");
  }
  if (filtros.q !== undefined && typeof filtros.q !== "string") {
    throw httpError(400, "El filtro de búsqueda no es válido");
  }
  if (estado && !["activo", "devuelto"].includes(estado)) {
    throw httpError(400, "El estado debe ser activo o devuelto");
  }
  if (busqueda.length > 100) {
    throw httpError(400, "La búsqueda no debe exceder 100 caracteres");
  }
  if (desde && hasta && desde > hasta) {
    throw httpError(400, "La fecha inicial no puede ser posterior a la fecha final");
  }
  return { estado, busqueda, desde, hasta };
}

export async function listarHistorial(socioId, filtros, permitirUsuarioNoSocio = false) {
  const id = validarId(socioId);
  const { estado, busqueda, desde, hasta } = validarFiltros(filtros);
  const [socios] = await pool.query(
    `SELECT id FROM usuarios WHERE id = ? ${permitirUsuarioNoSocio ? "" : "AND rol = 'socio'"} LIMIT 1`,
    [id],
  );
  if (!socios[0]) {
    throw httpError(404, "No se encontró el socio");
  }

  const where = ["p.socio_id = ?"];
  const parameters = [id];
  if (estado) {
    where.push("p.estado = ?");
    parameters.push(estado);
  }
  if (desde) {
    where.push("p.fecha_salida >= ?");
    parameters.push(desde);
  }
  if (hasta) {
    where.push("p.fecha_salida <= ?");
    parameters.push(hasta);
  }
  if (busqueda) {
    where.push("(l.titulo LIKE ? OR l.autor LIKE ? OR l.isbn LIKE ?)");
    const pattern = `%${busqueda}%`;
    parameters.push(pattern, pattern, pattern);
  }

  const [rows] = await pool.query(
    `SELECT p.id, p.libro_id AS libroId, l.titulo, l.autor, l.isbn,
            p.fecha_salida AS fechaSalida, p.fecha_limite AS fechaLimite,
            p.fecha_devolucion AS fechaDevolucion, p.estado,
            p.dias_retraso AS diasRetrasoRegistrados, p.multa_monto AS multaRegistrada,
            p.multa_pagada AS multaPagada
     FROM prestamos p
     INNER JOIN libros l ON l.id = p.libro_id
     WHERE ${where.join(" AND ")}
     ORDER BY p.fecha_salida DESC, p.id DESC
     LIMIT 250`,
    parameters,
  );
  const [[configuracion]] = await pool.query(
    "SELECT valor FROM configuracion WHERE clave = ? LIMIT 1",
    ["multa_por_dia"],
  );
  const multaPorDia = Number(configuracion?.valor ?? 5);
  const hoy = fechaGuatemala();

  const prestamos = rows.map((prestamo) => {
    if (prestamo.estado !== "activo") {
      return {
        ...prestamo,
        diasRetraso: Number(prestamo.diasRetrasoRegistrados) || 0,
        multaMonto: Number(prestamo.multaRegistrada) || 0,
      };
    }
    const multa = calcularMulta(prestamo.fechaLimite, hoy, multaPorDia);
    return { ...prestamo, diasRetraso: multa.diasRetraso, multaMonto: multa.monto };
  });
  return prestamos;
}
