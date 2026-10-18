import pool from "../../db/pool.js";

const bookFields = "id, titulo, autor, isbn, categoria_id, anio, total_ejemplares, ejemplares_disponibles, activo, created_at";

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function validId(value) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) {
    throw httpError(400, "El identificador del libro no es válido");
  }
  return id;
}

function positiveInteger(value, name, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) {
    throw httpError(400, `${name} no es válido`);
  }
  return number;
}

function optionalText(value, name, maxLength, required = false) {
  if (value === undefined && !required) return undefined;
  if (typeof value !== "string") {
    throw httpError(400, `${name} debe ser texto`);
  }
  const text = value.trim();
  if (!text && !required) return null;
  if (!text || text.length > maxLength) {
    throw httpError(400, `${name} es obligatorio y no debe exceder ${maxLength} caracteres`);
  }
  return text;
}

function validateBookInput(input, { creating = false } = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw httpError(400, "Los datos del libro no son válidos");
  }

  const book = {};
  for (const [field, label, maxLength] of [
    ["titulo", "El título", 255],
    ["autor", "El autor", 180],
    ["isbn", "El ISBN", 20],
  ]) {
    const value = optionalText(input[field], label, maxLength, creating);
    if (value === null) throw httpError(400, `${label} no puede estar vacío`);
    if (value !== undefined) book[field] = value;
  }

  if (input.categoria_id !== undefined || creating) {
    book.categoria_id = positiveInteger(input.categoria_id, "La categoría");
  }
  if (input.anio !== undefined) {
    if (input.anio === null) {
      book.anio = null;
    } else {
      book.anio = positiveInteger(input.anio, "El año", { min: 1, max: 9999 });
    }
  } else if (creating) {
    book.anio = null;
  }
  if (input.total_ejemplares !== undefined || creating) {
    book.total_ejemplares = positiveInteger(input.total_ejemplares, "El total de ejemplares", {
      min: 0,
      max: 4294967295,
    });
  }

  return book;
}

function translateDatabaseError(error) {
  if (error?.code === "ER_DUP_ENTRY") {
    throw httpError(409, "Ya existe un libro con ese ISBN");
  }
  if (error?.code === "ER_NO_REFERENCED_ROW_2") {
    throw httpError(400, "La categoría seleccionada no existe");
  }
  throw error;
}

function validateFilters(query) {
  const filters = [];
  const parameters = [];
  for (const [key, column, label, maxLength] of [
    ["titulo", "l.titulo", "El título", 255],
    ["autor", "l.autor", "El autor", 180],
    ["isbn", "l.isbn", "El ISBN", 20],
  ]) {
    if (query[key] !== undefined) {
      const value = optionalText(query[key], label, maxLength);
      if (value) {
        filters.push(`${column} = ?`);
        parameters.push(value);
      }
    }
  }
  if (query.q !== undefined) {
    if (typeof query.q !== "string" || query.q.trim().length > 100) {
      throw httpError(400, "La búsqueda no debe exceder 100 caracteres");
    }
    const term = query.q.trim();
    if (term) {
      filters.push("(l.titulo LIKE ? OR l.autor LIKE ? OR l.isbn LIKE ?)");
      const pattern = `%${term}%`;
      parameters.push(pattern, pattern, pattern);
    }
  }
  if (query.categoria_id !== undefined && query.categoria_id !== "") {
    filters.push("l.categoria_id = ?");
    parameters.push(positiveInteger(query.categoria_id, "La categoría"));
  }
  if (query.disponibles !== undefined) {
    if (query.disponibles !== "1" && query.disponibles !== "0") {
      throw httpError(400, "El filtro de disponibilidad no es válido");
    }
    if (query.disponibles === "1") filters.push("l.ejemplares_disponibles > 0");
  }
  return { filters, parameters };
}

export async function listarLibros(query = {}) {
  const { filters, parameters } = validateFilters(query);
  const page = positiveInteger(query.page ?? 1, "La página");
  const limit = positiveInteger(query.limit ?? 10, "El límite", { max: 100 });
  const offset = (page - 1) * limit;
  if (!Number.isSafeInteger(offset)) throw httpError(400, "La página solicitada no es válida");

  const where = ["l.activo = 1", ...filters].join(" AND ");
  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM libros l WHERE ${where}`,
    parameters,
  );
  const [items] = await pool.query(
    `SELECT l.${bookFields.split(", ").join(", l.")}, c.nombre AS categoria_nombre
     FROM libros l
     JOIN categorias c ON c.id = l.categoria_id
     WHERE ${where}
     ORDER BY l.titulo, l.id
     LIMIT ? OFFSET ?`,
    [...parameters, limit, offset],
  );

  return {
    libros: items,
    items,
    total: Number(countRows[0].total),
    page,
    limit,
  };
}

export async function obtenerLibro(id) {
  const numericId = validId(id);
  const [rows] = await pool.query(
    `SELECT l.${bookFields.split(", ").join(", l.")}, c.nombre AS categoria_nombre
     FROM libros l
     JOIN categorias c ON c.id = l.categoria_id
     WHERE l.id = ? AND l.activo = 1
     LIMIT 1`,
    [numericId],
  );
  if (!rows[0]) throw httpError(404, "No se encontró el libro");
  return rows[0];
}

export async function crearLibro(input) {
  const book = validateBookInput(input, { creating: true });
  try {
    const [result] = await pool.query(
      `INSERT INTO libros (titulo, autor, isbn, categoria_id, anio, total_ejemplares, ejemplares_disponibles)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        book.titulo,
        book.autor,
        book.isbn,
        book.categoria_id,
        book.anio ?? null,
        book.total_ejemplares,
        book.total_ejemplares,
      ],
    );
    return obtenerLibro(result.insertId);
  } catch (error) {
    translateDatabaseError(error);
  }
}

export async function actualizarLibro(id, input) {
  const numericId = validId(id);
  const book = validateBookInput(input);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const [rows] = await connection.query(
      `SELECT ${bookFields} FROM libros WHERE id = ? AND activo = 1 FOR UPDATE`,
      [numericId],
    );
    const current = rows[0];
    if (!current) throw httpError(404, "No se encontró el libro");

    const next = { ...current, ...book };
    const borrowed = Number(current.total_ejemplares) - Number(current.ejemplares_disponibles);
    if (book.total_ejemplares !== undefined && next.total_ejemplares !== Number(current.total_ejemplares)) {
      if (next.total_ejemplares < borrowed) {
        throw httpError(409, "El total no puede ser menor que los ejemplares prestados");
      }
    }

    try {
      const assignments = [];
      const values = [];
      for (const field of ["titulo", "autor", "isbn", "categoria_id", "anio"]) {
        if (book[field] !== undefined) {
          assignments.push(`${field} = ?`);
          values.push(next[field]);
        }
      }
      if (book.total_ejemplares !== undefined) {
        assignments.push("total_ejemplares = ?");
        values.push(next.total_ejemplares);
        if (next.total_ejemplares !== Number(current.total_ejemplares)) {
          assignments.push("ejemplares_disponibles = ?");
          values.push(Number(current.ejemplares_disponibles) + next.total_ejemplares - Number(current.total_ejemplares));
        }
      }
      if (assignments.length > 0) {
        await connection.query(
          `UPDATE libros SET ${assignments.join(", ")} WHERE id = ?`,
          [...values, numericId],
        );
      }
    } catch (error) {
      translateDatabaseError(error);
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  return obtenerLibro(numericId);
}

export async function eliminarLibro(id) {
  const numericId = validId(id);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const [rows] = await connection.query(
      "SELECT id FROM libros WHERE id = ? AND activo = 1 FOR UPDATE",
      [numericId],
    );
    if (!rows[0]) throw httpError(404, "No se encontró el libro");

    const [[{ activeLoans }]] = await connection.query(
      "SELECT COUNT(*) AS activeLoans FROM prestamos WHERE libro_id = ? AND estado = 'activo'",
      [numericId],
    );
    if (Number(activeLoans) > 0) {
      throw httpError(409, "No se puede eliminar el libro porque tiene préstamos activos");
    }

    const [[{ historyCount }]] = await connection.query(
      "SELECT COUNT(*) AS historyCount FROM prestamos WHERE libro_id = ?",
      [numericId],
    );
    if (Number(historyCount) > 0) {
      await connection.query("UPDATE libros SET activo = 0 WHERE id = ?", [numericId]);
    } else {
      await connection.query("DELETE FROM libros WHERE id = ?", [numericId]);
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
