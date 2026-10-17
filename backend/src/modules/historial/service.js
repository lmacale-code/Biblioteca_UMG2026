import pool from "../../db/pool.js";
import { calcularMulta } from "../../utils/multas.js";

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function validarIdSocio(id) {
  const socioId = Number(id);
  if (!Number.isSafeInteger(socioId) || socioId < 1) {
    throw httpError(400, "El identificador del socio no es válido");
  }
  return socioId;
}

function validarEstado(estado) {
  if (estado !== undefined && estado !== "" && !["activo", "devuelto"].includes(estado)) {
    throw httpError(400, "El filtro de estado no es válido");
  }
  return estado || "";
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

export async function listarHistorial(socioId, estado) {
  const socio = validarIdSocio(socioId);
  const filtroEstado = validarEstado(estado);
  const parameters = [socio];
  let stateFilter = "";
  if (filtroEstado) {
    stateFilter = " AND p.estado = ?";
    parameters.push(filtroEstado);
  }

  const [rows] = await pool.query(
    `SELECT p.id, l.titulo, p.fecha_salida, p.fecha_limite, p.fecha_devolucion,
            p.estado, p.dias_retraso, p.multa_monto, p.multa_pagada
     FROM prestamos p
     JOIN libros l ON l.id = p.libro_id
     WHERE p.socio_id = ?${stateFilter}
     ORDER BY p.fecha_salida DESC, p.id DESC`,
    parameters,
  );
  const { multaPorDia, hoy } = await obtenerParametrosMulta();

  return rows.map((row) => {
    const multaGuardada = Number(row.multa_monto);
    const retrasoGuardado = Number(row.dias_retraso);
    if (row.estado !== "activo" || row.fecha_limite >= hoy) {
      return {
        ...row,
        dias_retraso: retrasoGuardado,
        multa: Number(multaGuardada.toFixed(2)),
      };
    }

    const multaActual = calcularMulta(row.fecha_limite, hoy, multaPorDia);
    return {
      ...row,
      dias_retraso: Math.max(retrasoGuardado, multaActual.diasRetraso),
      multa: Number(Math.max(multaGuardada, multaActual.monto).toFixed(2)),
    };
  });
}
