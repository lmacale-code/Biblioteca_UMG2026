import pool from "../../db/pool.js";

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export async function listarCategorias() {
  const [rows] = await pool.query(
    "SELECT id, nombre FROM categorias ORDER BY nombre, id",
  );
  return rows;
}

export async function crearCategoria(input) {
  const nombre = typeof input?.nombre === "string" ? input.nombre.trim() : "";
  if (!nombre || nombre.length > 100) {
    throw httpError(400, "El nombre es obligatorio y no debe exceder 100 caracteres");
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO categorias (nombre) VALUES (?)",
      [nombre],
    );
    const [rows] = await pool.query(
      "SELECT id, nombre FROM categorias WHERE id = ?",
      [result.insertId],
    );
    return rows[0];
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY") {
      throw httpError(409, "Ya existe una categoría con ese nombre");
    }
    throw error;
  }
}
