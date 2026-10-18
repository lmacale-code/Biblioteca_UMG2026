import pool from "../../db/pool.js";

const valoresPredeterminados = {
  dias_prestamo: 7,
  multa_por_dia: 5,
};

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function parsearConfiguracion(rows) {
  const configuracion = { ...valoresPredeterminados };
  for (const row of rows) {
    const value = Number(row.valor);
    if (Number.isFinite(value)) configuracion[row.clave] = value;
  }
  return configuracion;
}

function validarConfiguracion(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw httpError(400, "Envía una configuración válida");
  }
  const dias = input.dias_prestamo;
  const multa = input.multa_por_dia;
  if (dias === undefined || multa === undefined) {
    throw httpError(400, "Indica los días de préstamo y la multa por día");
  }
  if (
    (typeof dias !== "number" && typeof dias !== "string")
    || (typeof multa !== "number" && typeof multa !== "string")
    || (typeof dias === "string" && !/^\d+$/.test(dias.trim()))
    || (typeof multa === "string" && !/^\d+(?:\.\d{1,2})?$/.test(multa.trim()))
  ) {
    throw httpError(400, "Los valores de configuración deben ser numéricos");
  }

  const diasPrestamo = Number(dias);
  if (!Number.isSafeInteger(diasPrestamo) || diasPrestamo < 1) {
    throw httpError(400, "Los días de préstamo deben ser un número entero mayor o igual a 1");
  }
  const multaPorDia = Number(multa);
  if (
    !Number.isFinite(multaPorDia)
    || multaPorDia < 0
    || multaPorDia > 99_999_999.99
    || Math.abs(Math.round(multaPorDia * 100) - multaPorDia * 100) > 1e-7
  ) {
    throw httpError(400, "La multa diaria debe ser un monto no negativo con hasta dos decimales");
  }

  return { dias_prestamo: diasPrestamo, multa_por_dia: multaPorDia };
}

export async function obtenerConfiguracion() {
  const [rows] = await pool.query(
    "SELECT clave, valor FROM configuracion WHERE clave IN (?, ?)",
    ["dias_prestamo", "multa_por_dia"],
  );
  return parsearConfiguracion(rows);
}

export async function guardarConfiguracion(input) {
  const configuracion = validarConfiguracion(input);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await connection.query(
      `INSERT INTO configuracion (clave, valor) VALUES (?, ?), (?, ?)
       ON DUPLICATE KEY UPDATE valor = VALUES(valor)`,
      [
        "dias_prestamo",
        String(configuracion.dias_prestamo),
        "multa_por_dia",
        configuracion.multa_por_dia.toFixed(2),
      ],
    );
    await connection.commit();
    return configuracion;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
