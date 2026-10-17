import pool from "../../db/pool.js";
import { calcularMulta } from "../../utils/multas.js";

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function obtenerParametrosMulta() {
  const [rows] = await pool.query(
    "SELECT (SELECT valor FROM configuracion WHERE clave = ?) AS multa_por_dia, DATE_FORMAT(CURRENT_DATE(), '%Y-%m-%d') AS hoy",
    ["multa_por_dia"],
  );
  const multaPorDia = Number(rows[0]?.multa_por_dia);
  if (!Number.isFinite(multaPorDia) || multaPorDia < 0 || !rows[0]?.hoy) {
    throw httpError(500, "No se pudo consultar la configuración de multas");
  }
  return { multaPorDia, hoy: rows[0].hoy };
}

async function obtenerLibrosMasPrestados() {
  const [rows] = await pool.query(
    `SELECT l.titulo, l.autor, COUNT(p.id) AS cantidadPrestamos
     FROM libros l
     JOIN prestamos p ON p.libro_id = l.id
     WHERE l.activo = 1
     GROUP BY l.id, l.titulo, l.autor
     ORDER BY cantidadPrestamos DESC, l.titulo ASC
     LIMIT 10`,
  );
  return rows.map((row) => ({
    ...row,
    cantidadPrestamos: Number(row.cantidadPrestamos),
  }));
}

async function obtenerSociosConDeudas(multaPorDia, hoy) {
  const [multasGuardadas] = await pool.query(
    `SELECT u.id AS socioId, u.nombre, u.carnet,
            SUM(p.multa_monto) AS multasSinPagar
     FROM prestamos p
     JOIN usuarios u ON u.id = p.socio_id
     WHERE u.rol = 'socio' AND p.multa_pagada = 0 AND p.multa_monto > 0
     GROUP BY u.id, u.nombre, u.carnet`,
  );
  const [prestamosVencidos] = await pool.query(
    `SELECT u.id AS socioId, u.nombre, u.carnet, p.fecha_limite,
            COUNT(*) AS cantidadPrestamos
     FROM prestamos p
     JOIN usuarios u ON u.id = p.socio_id
     WHERE u.rol = 'socio'
       AND p.estado = 'activo'
       AND p.fecha_limite < CURRENT_DATE()
     GROUP BY u.id, u.nombre, u.carnet, p.fecha_limite`,
  );

  const socios = new Map();
  for (const row of multasGuardadas) {
    socios.set(Number(row.socioId), {
      socioId: Number(row.socioId),
      nombre: row.nombre,
      carnet: row.carnet,
      totalDeuda: Number(row.multasSinPagar),
    });
  }
  for (const row of prestamosVencidos) {
    const socioId = Number(row.socioId);
    const socio = socios.get(socioId) ?? {
      socioId,
      nombre: row.nombre,
      carnet: row.carnet,
      totalDeuda: 0,
    };
    const { monto } = calcularMulta(row.fecha_limite, hoy, multaPorDia);
    socio.totalDeuda += monto * Number(row.cantidadPrestamos);
    socios.set(socioId, socio);
  }

  return [...socios.values()]
    .map((socio) => ({
      ...socio,
      totalDeuda: Number(socio.totalDeuda.toFixed(2)),
    }))
    .filter((socio) => socio.totalDeuda > 0)
    .sort((a, b) => b.totalDeuda - a.totalDeuda || a.nombre.localeCompare(b.nombre));
}

async function obtenerDisponibilidad() {
  const [rows] = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM libros WHERE activo = 1) AS titulosTotales,
       (SELECT COALESCE(SUM(total_ejemplares), 0) FROM libros WHERE activo = 1) AS ejemplaresTotales,
       (SELECT COALESCE(SUM(ejemplares_disponibles), 0) FROM libros WHERE activo = 1) AS disponibles,
       (SELECT COALESCE(SUM(total_ejemplares - ejemplares_disponibles), 0) FROM libros WHERE activo = 1) AS prestados,
       (SELECT COUNT(*) FROM prestamos WHERE estado = 'activo' AND fecha_limite < CURRENT_DATE()) AS prestamosVencidos`,
  );
  return Object.fromEntries(
    Object.entries(rows[0]).map(([key, value]) => [key, Number(value)]),
  );
}

export async function obtenerDashboard() {
  const { multaPorDia, hoy } = await obtenerParametrosMulta();
  const [librosMasPrestados, sociosConDeudas, disponibilidad] = await Promise.all([
    obtenerLibrosMasPrestados(),
    obtenerSociosConDeudas(multaPorDia, hoy),
    obtenerDisponibilidad(),
  ]);

  return { librosMasPrestados, sociosConDeudas, disponibilidad };
}
