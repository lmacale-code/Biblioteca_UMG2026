import pool from "../../db/pool.js";
import { calcularMulta } from "../../utils/multas.js";

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export async function obtenerPrestamosActivosParaReporte() {
  const [settings] = await pool.query(
    "SELECT (SELECT valor FROM configuracion WHERE clave = ?) AS multa_por_dia, DATE_FORMAT(CURRENT_DATE(), '%Y-%m-%d') AS hoy",
    ["multa_por_dia"],
  );
  const multaPorDia = Number(settings[0]?.multa_por_dia);
  const hoy = settings[0]?.hoy;
  if (!Number.isFinite(multaPorDia) || multaPorDia < 0 || !hoy) {
    throw httpError(500, "No se pudo consultar la configuración de multas");
  }

  const [rows] = await pool.query(
    `SELECT p.id, u.nombre AS socio, u.carnet, l.titulo AS libro,
            p.fecha_salida, p.fecha_limite, p.dias_retraso, p.multa_monto
     FROM prestamos p
     JOIN usuarios u ON u.id = p.socio_id
     JOIN libros l ON l.id = p.libro_id
     WHERE p.estado = 'activo'
     ORDER BY p.fecha_limite ASC, u.nombre ASC, p.id ASC`,
  );

  return rows.map((row) => {
    const multaGuardada = Number(row.multa_monto);
    const retrasoGuardado = Number(row.dias_retraso);
    const vencido = row.fecha_limite < hoy;
    const multaActual = vencido
      ? calcularMulta(row.fecha_limite, hoy, multaPorDia)
      : { diasRetraso: 0, monto: 0 };
    return {
      ...row,
      estadoReporte: vencido ? "Vencido" : "En plazo",
      dias_retraso: Math.max(retrasoGuardado, multaActual.diasRetraso),
      multa: Number(Math.max(multaGuardada, multaActual.monto).toFixed(2)),
    };
  });
}
