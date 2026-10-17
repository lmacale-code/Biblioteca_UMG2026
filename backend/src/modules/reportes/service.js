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

export async function obtenerPrestamosActivosParaReporte() {
  const [settings] = await pool.query(
    "SELECT valor FROM configuracion WHERE clave = ? LIMIT 1",
    ["multa_por_dia"],
  );
  const multaPorDia = Number(settings[0]?.valor ?? 5);
  if (!Number.isFinite(multaPorDia) || multaPorDia < 0) {
    throw httpError(500, "No se pudo consultar la configuración de multas");
  }

  const [rows] = await pool.query(
    `SELECT p.id, u.nombre AS socio, u.carnet, l.titulo, l.autor,
            p.fecha_salida AS fechaSalida, p.fecha_limite AS fechaLimite,
            p.dias_retraso AS diasRetrasoGuardados, p.multa_monto AS multaGuardada
       FROM prestamos p
       INNER JOIN usuarios u ON u.id = p.socio_id
       INNER JOIN libros l ON l.id = p.libro_id
      WHERE p.estado = ?
      ORDER BY p.fecha_limite, u.nombre, p.id`,
    ["activo"],
  );
  const hoy = fechaGuatemala();

  return rows.map((prestamo) => {
    const multaActual = calcularMulta(prestamo.fechaLimite, hoy, multaPorDia);
    const diasRetraso = Math.max(Number(prestamo.diasRetrasoGuardados) || 0, multaActual.diasRetraso);
    const monto = Number(Math.max(
      Number(prestamo.multaGuardada) || 0,
      multaActual.monto,
    ).toFixed(2));
    return {
      ...prestamo,
      diasRetraso,
      monto,
      vencido: diasRetraso > 0,
      estadoReporte: diasRetraso > 0 ? "Vencido" : "En plazo",
    };
  });
}
