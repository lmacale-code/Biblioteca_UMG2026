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

export async function obtenerPrestamosActivosParaReporte() {
  const hoy = fechaGuatemala();
  const [rows] = await pool.query(
    `SELECT p.id, u.nombre AS socio, u.carnet, l.titulo, l.autor,
            p.fecha_salida AS fechaSalida, p.fecha_limite AS fechaLimite
     FROM prestamos p
     INNER JOIN usuarios u ON u.id = p.socio_id
     INNER JOIN libros l ON l.id = p.libro_id
     WHERE p.estado = ?
     ORDER BY p.fecha_limite, u.nombre, p.id`,
    ["activo"],
  );
  const [[configuracion]] = await pool.query(
    "SELECT valor FROM configuracion WHERE clave = ? LIMIT 1",
    ["multa_por_dia"],
  );
  const multaPorDia = Number(configuracion?.valor ?? 5);

  return rows.map((prestamo) => {
    const multa = calcularMulta(prestamo.fechaLimite, hoy, multaPorDia);
    return {
      ...prestamo,
      ...multa,
      vencido: multa.diasRetraso > 0,
      estadoReporte: multa.diasRetraso > 0 ? "Vencido" : "En plazo",
    };
  });
}
