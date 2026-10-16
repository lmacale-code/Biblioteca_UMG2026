import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../../db/pool.js";

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export async function iniciarSesion(email, password) {
  const [rows] = await pool.query(
    "SELECT id, nombre, email, password_hash, rol, tipo_socio, carnet, telefono, activo, created_at FROM usuarios WHERE email = ? LIMIT 1",
    [email],
  );
  const usuario = rows[0];

  if (!usuario || !(await bcrypt.compare(password, usuario.password_hash))) {
    throw httpError(401, "Correo electrónico o contraseña incorrectos");
  }
  if (!usuario.activo) {
    throw httpError(403, "La cuenta está inactiva");
  }
  if (!process.env.JWT_SECRET) {
    throw httpError(500, "No fue posible iniciar sesión");
  }

  const token = jwt.sign(
    { id: usuario.id, rol: usuario.rol },
    process.env.JWT_SECRET,
    { expiresIn: "8h" },
  );
  const { password_hash: _passwordHash, ...usuarioPublico } = usuario;
  return { token, usuario: usuarioPublico };
}

export async function obtenerUsuarioActual(id) {
  const [rows] = await pool.query(
    "SELECT id, nombre, email, rol, tipo_socio, carnet, telefono, activo, created_at FROM usuarios WHERE id = ? AND activo = 1 LIMIT 1",
    [id],
  );
  if (!rows[0]) {
    throw httpError(401, "La sesión ya no es válida");
  }
  return rows[0];
}