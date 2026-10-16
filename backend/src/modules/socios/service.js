import bcrypt from "bcryptjs";
import pool from "../../db/pool.js";

const camposPublicos = "id, nombre, email, carnet, telefono, tipo_socio, activo, created_at";

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

function validarSocio(input) {
  const nombre = typeof input?.nombre === "string" ? input.nombre.trim() : "";
  const email = typeof input?.email === "string" ? input.email.trim().toLowerCase() : "";
  const carnet = typeof input?.carnet === "string" ? input.carnet.trim() : "";
  const telefono = typeof input?.telefono === "string" ? input.telefono.trim() : "";
  const tipoSocio = input?.tipo_socio;

  if (!nombre || nombre.length > 150) {
    throw httpError(400, "El nombre es obligatorio y no debe exceder 150 caracteres");
  }
  if (email.length > 190 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw httpError(400, "Ingresa un correo electrónico válido");
  }
  if (!carnet || carnet.length > 40) {
    throw httpError(400, "El carnet es obligatorio y no debe exceder 40 caracteres");
  }
  if (!['estudiante', 'docente'].includes(tipoSocio)) {
    throw httpError(400, "El tipo de socio debe ser estudiante o docente");
  }
  if (input?.telefono !== undefined && input.telefono !== null && typeof input.telefono !== "string") {
    throw httpError(400, "El teléfono debe ser texto");
  }
  if (telefono.length > 30) {
    throw httpError(400, "El teléfono no debe exceder 30 caracteres");
  }

  return {
    nombre,
    email,
    carnet,
    telefono: telefono || null,
    tipo_socio: tipoSocio,
  };
}

function traducirErrorDuplicado(error) {
  if (error?.code === "ER_DUP_ENTRY") {
    throw httpError(409, "Ya existe un socio con ese correo electrónico o carnet");
  }
  throw error;
}

export async function listarSocios({ q = "", tipo = "" } = {}) {
  if (typeof q !== "string" || typeof tipo !== "string") {
    throw httpError(400, "Los filtros de búsqueda no son válidos");
  }
  const search = q.trim();
  const memberType = tipo.trim();
  if (search.length > 100) {
    throw httpError(400, "La búsqueda no debe exceder 100 caracteres");
  }
  if (memberType && !['estudiante', 'docente'].includes(memberType)) {
    throw httpError(400, "El filtro debe ser estudiante o docente");
  }

  const filters = ["rol = 'socio'"];
  const parameters = [];
  if (search) {
    filters.push("(nombre LIKE ? OR carnet LIKE ? OR email LIKE ?)");
    const pattern = `%${search}%`;
    parameters.push(pattern, pattern, pattern);
  }
  if (memberType) {
    filters.push("tipo_socio = ?");
    parameters.push(memberType);
  }

  const [rows] = await pool.query(
    `SELECT ${camposPublicos} FROM usuarios WHERE ${filters.join(" AND ")} ORDER BY nombre, id`,
    parameters,
  );
  return rows;
}

export async function obtenerSocio(id) {
  const numericId = validarId(id);
  const [rows] = await pool.query(
    `SELECT ${camposPublicos} FROM usuarios WHERE id = ? AND rol = 'socio' LIMIT 1`,
    [numericId],
  );
  if (!rows[0]) {
    throw httpError(404, "No se encontró el socio");
  }
  return rows[0];
}

export async function crearSocio(input) {
  const socio = validarSocio(input);
  const passwordHash = await bcrypt.hash(socio.carnet, 10);

  try {
    const [result] = await pool.query(
      "INSERT INTO usuarios (nombre, email, password_hash, rol, tipo_socio, carnet, telefono) VALUES (?, ?, ?, 'socio', ?, ?, ?)",
      [socio.nombre, socio.email, passwordHash, socio.tipo_socio, socio.carnet, socio.telefono],
    );
    return obtenerSocio(result.insertId);
  } catch (error) {
    traducirErrorDuplicado(error);
  }
}

export async function actualizarSocio(id, input) {
  const numericId = validarId(id);
  const socio = validarSocio(input);

  try {
    const [result] = await pool.query(
      "UPDATE usuarios SET nombre = ?, email = ?, carnet = ?, telefono = ?, tipo_socio = ? WHERE id = ? AND rol = 'socio'",
      [socio.nombre, socio.email, socio.carnet, socio.telefono, socio.tipo_socio, numericId],
    );
    if (result.affectedRows === 0) {
      return obtenerSocio(numericId);
    }
    return obtenerSocio(numericId);
  } catch (error) {
    traducirErrorDuplicado(error);
  }
}

export async function desactivarSocio(id) {
  const numericId = validarId(id);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const [users] = await connection.query(
      "SELECT id FROM usuarios WHERE id = ? AND rol = 'socio' FOR UPDATE",
      [numericId],
    );
    if (!users[0]) {
      throw httpError(404, "No se encontró el socio");
    }

    const [loans] = await connection.query(
      "SELECT COUNT(*) AS total FROM prestamos WHERE socio_id = ? AND estado = 'activo'",
      [numericId],
    );
    if (Number(loans[0].total) > 0) {
      throw httpError(409, "No se puede desactivar el socio porque tiene préstamos activos");
    }

    await connection.query(
      "UPDATE usuarios SET activo = 0 WHERE id = ? AND rol = 'socio'",
      [numericId],
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}