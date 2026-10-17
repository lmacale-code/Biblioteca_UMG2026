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

export async function obtenerDashboard() {
  const [[disponibilidadRow]] = await pool.query(
    `SELECT COUNT(*) AS titulos,
            COALESCE(SUM(total_ejemplares), 0) AS ejemplares,
            COALESCE(SUM(ejemplares_disponibles), 0) AS disponibles,
            COALESCE(SUM(total_ejemplares - ejemplares_disponibles), 0) AS prestados,
            (SELECT COUNT(*) FROM prestamos
              WHERE estado = ? AND fecha_limite < ?) AS vencidos
       FROM libros
      `,
    ["activo", fechaGuatemala()],
  );
  const [librosMasPrestados] = await pool.query(
    `SELECT l.id, l.titulo, l.autor, COUNT(p.id) AS cantidad_prestamos
       FROM libros l
       LEFT JOIN prestamos p ON p.libro_id = l.id
      GROUP BY l.id, l.titulo, l.autor
     HAVING COUNT(p.id) > 0
      ORDER BY cantidad_prestamos DESC, l.titulo, l.id
      LIMIT 10`,
  );
  const [[configuracion]] = await pool.query(
    "SELECT valor FROM configuracion WHERE clave = ? LIMIT 1",
    ["multa_por_dia"],
  );
  const multaPorDia = Number(configuracion?.valor ?? 5);
  const hoy = fechaGuatemala();
  const [sociosConDeudasRows] = await pool.query(
    `SELECT u.id, u.nombre, u.carnet,
            SUM(CASE
                  WHEN p.multa_pagada = 0
                  THEN p.multa_monto
                  ELSE 0
                END) AS multas_registradas,
            JSON_ARRAYAGG(
              CASE
                WHEN p.estado = 'activo' AND p.fecha_limite < ?
                THEN JSON_OBJECT('fecha_limite', p.fecha_limite)
                ELSE NULL
              END
            ) AS fechas_limite_vencidas
       FROM prestamos p
       INNER JOIN usuarios u ON u.id = p.socio_id
      WHERE (p.estado = 'activo' AND p.fecha_limite < ?)
         OR (p.multa_pagada = 0 AND p.multa_monto > 0)
      GROUP BY u.id, u.nombre, u.carnet
      ORDER BY u.nombre, u.id`,
    [hoy, hoy],
  );

  const sociosConDeudas = sociosConDeudasRows
    .map((socio) => {
      const fechas = typeof socio.fechas_limite_vencidas === "string"
        ? JSON.parse(socio.fechas_limite_vencidas)
        : socio.fechas_limite_vencidas;
      const multasActivas = (fechas ?? []).reduce((total, item) => {
        if (!item?.fecha_limite) return total;
        return total + calcularMulta(item.fecha_limite, hoy, multaPorDia).monto;
      }, 0);
      return {
        id: socio.id,
        nombre: socio.nombre,
        carnet: socio.carnet,
        deuda_total: Number((Number(socio.multas_registradas) + multasActivas).toFixed(2)),
      };
    })
    .filter((socio) => socio.deuda_total > 0)
    .sort((left, right) => right.deuda_total - left.deuda_total);

  return {
    disponibilidad: Object.fromEntries(
      Object.entries(disponibilidadRow).map(([key, value]) => [key, Number(value)]),
    ),
    librosMasPrestados: librosMasPrestados.map((libro) => ({
      ...libro,
      cantidad_prestamos: Number(libro.cantidad_prestamos),
    })),
    sociosConDeudas,
  };
}
