import "dotenv/config";
import bcrypt from "bcryptjs";
import pool from "./pool.js";

function dateOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const passwordHash = await bcrypt.hash("Umg2026!", 10);
const users = [
  ["Administración UMG", "admin@umg.edu.gt", passwordHash, "admin", null, null, "502 7888 1000"],
  ["Encargado de biblioteca", "encargado@umg.edu.gt", passwordHash, "encargado", null, null, "502 7888 1001"],
  ["Ana López", "ana.lopez@umg.edu.gt", passwordHash, "socio", "estudiante", "2026001", "502 5555 1001"],
  ["Carlos García", "carlos.garcia@umg.edu.gt", passwordHash, "socio", "estudiante", "2026002", "502 5555 1002"],
  ["María Hernández", "maria.hernandez@umg.edu.gt", passwordHash, "socio", "docente", "D-2026-01", "502 5555 1003"],
  ["José Morales", "jose.morales@umg.edu.gt", passwordHash, "socio", "estudiante", "2026004", "502 5555 1004"],
  ["Lucía Pérez", "lucia.perez@umg.edu.gt", passwordHash, "socio", "docente", "D-2026-02", "502 5555 1005"],
];

const categories = ["Literatura", "Ciencias", "Historia", "Tecnología"];
const books = [
  ["Cien años de soledad", "Gabriel García Márquez", "9780307474728", 1, 1967, 3],
  ["El principito", "Antoine de Saint-Exupéry", "9780156012195", 1, 1943, 2],
  ["Don Quijote de la Mancha", "Miguel de Cervantes", "9788420412146", 1, 1605, 2],
  ["La casa de los espíritus", "Isabel Allende", "9788401352836", 1, 1982, 2],
  ["Introducción a la biología", "Helena Curtis", "9789500603348", 2, 2008, 2],
  ["Cosmos", "Carl Sagan", "9780345539434", 2, 1980, 2],
  ["Física universitaria", "Hugh D. Young", "9786071508756", 2, 2012, 2],
  ["Historia de Guatemala", "Francisco Pérez de Antón", "9789929586008", 3, 2013, 2],
  ["Breve historia del mundo", "Ernst H. Gombrich", "9788467045427", 3, 1935, 2],
  ["La era de la revolución", "Eric Hobsbawm", "9788446042335", 3, 1962, 2],
  ["Clean Code", "Robert C. Martin", "9780132350884", 4, 2008, 2],
  ["Eloquent JavaScript", "Marijn Haverbeke", "9781593279509", 4, 2018, 2],
  ["Fundamentos de bases de datos", "Abraham Silberschatz", "9780078022159", 4, 2010, 2],
  ["The Pragmatic Programmer", "David Thomas", "9780135957059", 4, 2019, 2],
  ["Algorithms", "Robert Sedgewick", "9780321573513", 4, 2011, 2],
];

const loans = [
  [1, 3, -18, -11, null, "activo", 0, 0, false],
  [2, 4, -14, -7, null, "activo", 0, 0, false],
  [3, 5, -10, -3, null, "activo", 0, 0, false],
  [4, 6, -5, 2, null, "activo", 0, 0, false],
  [5, 7, -4, 3, null, "activo", 0, 0, false],
  [6, 3, -2, 5, null, "activo", 0, 0, false],
  [7, 4, -30, -23, -20, "devuelto", 3, 15, true],
  [8, 5, -25, -18, -15, "devuelto", 3, 15, false],
  [9, 6, -12, -5, -4, "devuelto", 1, 5, true],
  [10, 7, -9, -2, -4, "devuelto", 0, 0, false],
];

try {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query("DELETE FROM prestamos");
    await connection.query("DELETE FROM libros");
    await connection.query("DELETE FROM categorias");
    await connection.query("DELETE FROM configuracion");
    await connection.query("DELETE FROM usuarios");

    const userPlaceholders = users.map(() => "(?, ?, ?, ?, ?, ?, ?)").join(", ");
    await connection.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol, tipo_socio, carnet, telefono) VALUES ${userPlaceholders}`,
      users.flat(),
    );
    await connection.query(
      `INSERT INTO categorias (nombre) VALUES ${categories.map(() => "(?)").join(", ")}`,
      categories,
    );
    const [categoryRows] = await connection.query("SELECT id, nombre FROM categorias");
    const categoryIds = new Map(categoryRows.map(({ id, nombre }) => [nombre, id]));

    const bookPlaceholders = books.map(() => "(?, ?, ?, ?, ?, ?, ?)").join(", ");
    await connection.query(
      `INSERT INTO libros (titulo, autor, isbn, categoria_id, anio, total_ejemplares, ejemplares_disponibles) VALUES ${bookPlaceholders}`,
      books.flatMap(([title, author, isbn, categoryIndex, year, total]) => [
        title, author, isbn, categoryIds.get(categories[categoryIndex - 1]), year, total, total,
      ]),
    );
    const [bookRows] = await connection.query("SELECT id, isbn FROM libros");
    const bookIds = new Map(bookRows.map(({ id, isbn }) => [isbn, id]));
    const [userRows] = await connection.query("SELECT id, email FROM usuarios");
    const userIds = new Map(userRows.map(({ id, email }) => [email, id]));

    const loanRows = loans.map(([bookIndex, memberIndex, startOffset, dueOffset, returnedOffset, status, delay, fine, paid]) => [
      bookIds.get(books[bookIndex - 1][2]),
      userIds.get(users[memberIndex - 1][1]),
      dateOffset(startOffset),
      dateOffset(dueOffset),
      returnedOffset === null ? null : dateOffset(returnedOffset),
      status,
      delay,
      fine,
      paid,
      userIds.get(users[1][1]),
    ]);
    const loanPlaceholders = loanRows.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").join(", ");
    await connection.query(
      `INSERT INTO prestamos (libro_id, socio_id, fecha_salida, fecha_limite, fecha_devolucion, estado, dias_retraso, multa_monto, multa_pagada, registrado_por) VALUES ${loanPlaceholders}`,
      loanRows.flat(),
    );
    await connection.query(
      "INSERT INTO configuracion (clave, valor) VALUES (?, ?), (?, ?)",
      ["multa_por_dia", "5", "dias_prestamo", "7"],
    );

    const activeCounts = new Map();
    for (const [bookIndex, , , , , status] of loans) {
      const bookId = bookIds.get(books[bookIndex - 1][2]);
      if (status === "activo") activeCounts.set(bookId, (activeCounts.get(bookId) || 0) + 1);
    }
    for (const [bookId, count] of activeCounts) {
      await connection.query(
        "UPDATE libros SET ejemplares_disponibles = total_ejemplares - ? WHERE id = ?",
        [count, bookId],
      );
    }

    await connection.commit();
    console.log("Datos de prueba cargados correctamente.");
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
} finally {
  await pool.end();
}