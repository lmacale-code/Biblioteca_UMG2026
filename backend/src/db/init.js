import "dotenv/config";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

const schemaPath = new URL("./schema.sql", import.meta.url);
const schema = await readFile(fileURLToPath(schemaPath), "utf8");
const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  multipleStatements: true,
  charset: "utf8mb4",
  timezone: "local",
});

try {
  await connection.query(schema);
  console.log("Esquema de biblioteca_umg inicializado correctamente.");
} finally {
  await connection.end();
}