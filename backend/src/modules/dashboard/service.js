import pool from "../../db/pool.js";
import { calcularMulta } from "../../utils/multas.js";

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
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

async function obtenerMultaPorDia() {
  const [rows] = await pool.query(
    "SELECT valor FROM configuracion WHERE clave = ? LIMIT 1",
    ["multa_por_dia"],
  );
  const multaPorDia = Number(rows[0]?.valor ?? 5);
  if (!Number.isFinite(multaPorDia) || multaPorDia < 0) {
    throw httpError(500, "No se pudo consultar la configuración de multas");
  }
  return multaPorDia;
}

async function obtenerDisponibilidad(hoy) {
  const [rows] = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM libros WHERE activo = 1) AS titulosTotales,
       (SELECT COALESCE(SUM(total_ejemplares), 0) FROM libros WHERE activo = 1) AS ejemplaresTotales,
       (SELECT COALESCE(SUM(ejemplares_disponibles), 0) FROM libros WHERE activo = 1) AS disponibles,
       (SELECT COALESCE(SUM(total_ejemplares - ejemplares_disponibles), 0) FROM libros WHERE activo = 1) AS prestados,
       (SELECT COUNT(*) FROM prestamos WHERE estado = ? AND fecha_limite < ?) AS prestamosVencidos`,
    ["activo", hoy],
  );
  return Object.fromEntries(
    Object.entries(rows[0]).map(([key, value]) => [key, Number(value)]),
  );
}

async function obtenerLibrosMasPrestados() {
  const [rows] = await pool.query(
    `SELECT l.id, l.titulo, l.autor, COUNT(p.id) AS cantidadPrestamos
       FROM libros l
       INNER JOIN prestamos p ON p.libro_id = l.id
      WHERE l.activo = 1
      GROUP BY l.id, l.titulo, l.autor
      ORDER BY cantidadPrestamos DESC, l.titulo, l.id
      LIMIT 10`,
  );
  return rows.map((row) => ({
    ...row,
    cantidadPrestamos: Number(row.cantidadPrestamos),
  }));
}

async function obtenerSociosConDeudas(multaPorDia, hoy) {
  const [rows] = await pool.query(
    `SELECT u.id AS socioId, u.nombre, u.carnet,
            SUM(CASE
                  WHEN p.estado = 'devuelto' AND p.multa_pagada = 0
                  THEN p.multa_monto
                  ELSE 0
                END) AS multasSinPagar,
            JSON_ARRAYAGG(
              CASE
                WHEN p.estado = 'activo' AND p.fecha_limite < ?
                THEN JSON_OBJECT('fecha_limite', p.fecha_limite)
                ELSE NULL
              END
            ) AS fechasLimiteVencidas
       FROM prestamos p
       INNER JOIN usuarios u ON u.id = p.socio_id
      WHERE u.rol = 'socio'
        AND (
          (p.estado = 'activo' AND p.fecha_limite < ?)
          OR (p.multa_pagada = 0 AND p.multa_monto > 0)
        )
      GROUP BY u.id, u.nombre, u.carnet`,
    [hoy, hoy],
  );

  return rows
    .map((row) => {
      const fechas = typeof row.fechasLimiteVencidas === "string"
        ? JSON.parse(row.fechasLimiteVencidas)
        : row.fechasLimiteVencidas;
      const multaActiva = (fechas ?? []).reduce((total, item) => (
        item?.fecha_limite
          ? total + calcularMulta(item.fecha_limite, hoy, multaPorDia).monto
          : total
      ), 0);
      const totalDeuda = Number((Number(row.multasSinPagar) + multaActiva).toFixed(2));
      return {
        socioId: Number(row.socioId),
        nombre: row.nombre,
        carnet: row.carnet,
        totalDeuda,
      };
    })
    .filter((socio) => socio.totalDeuda > 0)
    .sort((left, right) => right.totalDeuda - left.totalDeuda
      || left.nombre.localeCompare(right.nombre));
}

export async function obtenerDashboard() {
  const hoy = fechaGuatemala();
  const multaPorDia = await obtenerMultaPorDia();
  const [librosMasPrestados, sociosConDeudas, disponibilidad] = await Promise.all([
    obtenerLibrosMasPrestados(),
    obtenerSociosConDeudas(multaPorDia, hoy),
    obtenerDisponibilidad(hoy),
  ]);

  return { librosMasPrestados, sociosConDeudas, disponibilidad };
}
