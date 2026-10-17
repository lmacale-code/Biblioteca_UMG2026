import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { apiRequest } from "../api/client.js";
import Header from "../components/Header.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import "./socios/socios.css";

const moneda = new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ" });

function fechaLegible(value) {
  if (!value) return "—";
  const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);
  return new Intl.DateTimeFormat("es-GT", { dateStyle: "medium" })
    .format(new Date(year, month - 1, day));
}

function Dashboard({ user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const isSocio = user?.rol === "socio";

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    apiRequest(isSocio ? "/historial/mi" : "/dashboard", { signal: controller.signal })
      .then(setData)
      .catch((requestError) => {
        if (requestError.name !== "AbortError") setError(requestError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [isSocio]);

  const prestamosSocio = (data?.prestamos ?? []).filter((loan) => loan.estado === "activo");
  const deudaSocio = prestamosSocio.reduce((total, loan) => (
    total + (Number(loan.multa_monto) || 0)
  ), 0);
  const disponibilidad = data?.disponibilidad ?? {};

  return (
    <section className="module-page" aria-labelledby="dashboard-title">
      <div className="module-heading">
        <p className="eyebrow">{isSocio ? "Mi biblioteca" : "Resumen general"}</p>
        <h1 id="dashboard-title">
          {isSocio ? `Hola, ${user?.nombre ?? ""}` : "Dashboard"}
        </h1>
        <p className="module-description">
          {isSocio
            ? "Consulta el estado de tus préstamos, fechas límite y multas."
            : "Disponibilidad de la colección, préstamos destacados y saldos pendientes."}
        </p>
      </div>

      {error && <p className="socios-alert" role="alert">{error}</p>}
      {loading ? (
        <p className="module-card" role="status">Cargando información...</p>
      ) : !error && isSocio ? (
        <>
          <section className="module-card" aria-label="Resumen de préstamos">
            <div>
              <h2>Tu situación actual</h2>
              <p>
                Préstamos activos: <strong>{prestamosSocio.length}</strong>
                {" · "}Multas acumuladas: <strong>{moneda.format(deudaSocio)}</strong>
              </p>
            </div>
          </section>
          {prestamosSocio.length === 0 ? (
            <section className="module-card">
              <div><h2>Sin préstamos activos</h2><p>No tienes libros pendientes de devolución.</p></div>
            </section>
          ) : prestamosSocio.map((loan) => (
            <article className="module-card" key={loan.id}>
              <div>
                <h2>{loan.titulo}</h2>
                <p>
                  Fecha límite: <strong>{fechaLegible(loan.fecha_limite)}</strong>
                  {" · "}Multa: <strong>{moneda.format(Number(loan.multa_monto) || 0)}</strong>
                </p>
              </div>
              <span className="module-status">
                {Number(loan.dias_retraso) > 0 ? "Vencido" : "Activo"}
              </span>
            </article>
          ))}
          <Link to="/historial">Ver mi historial</Link>
        </>
      ) : !error && (user?.rol === "admin" || user?.rol === "encargado") ? (
        <>
          <section className="module-card" aria-labelledby="availability-title">
            <div>
              <h2 id="availability-title">Disponibilidad en tiempo real</h2>
              <p>
                Títulos: <strong>{disponibilidad.titulosTotales ?? "—"}</strong>
                {" · "}Ejemplares: <strong>{disponibilidad.ejemplaresTotales ?? "—"}</strong>
                {" · "}Disponibles: <strong>{disponibilidad.disponibles ?? "—"}</strong>
                {" · "}Prestados: <strong>{disponibilidad.prestados ?? "—"}</strong>
                {" · "}Vencidos: <strong>{disponibilidad.prestamosVencidos ?? "—"}</strong>
              </p>
            </div>
          </section>
          <section className="module-card" aria-labelledby="popular-books-title">
            <div>
              <h2 id="popular-books-title">Libros más prestados</h2>
              <div className="socios-table-wrap">
                <table className="socios-table">
                  <thead>
                    <tr><th>Libro</th><th>Autor</th><th>Préstamos</th></tr>
                  </thead>
                  <tbody>
                    {data?.librosMasPrestados?.length ? data.librosMasPrestados.map((book) => (
                      <tr key={book.id}>
                        <td>{book.titulo}</td>
                        <td>{book.autor}</td>
                        <td>{book.cantidadPrestamos}</td>
                      </tr>
                    )) : <tr><td colSpan="3">Aún no hay préstamos registrados.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
          <section className="module-card" aria-labelledby="debts-title">
            <div>
              <h2 id="debts-title">Socios con deudas</h2>
              {data?.sociosConDeudas?.length ? (
                <ul>
                  {data.sociosConDeudas.map((member) => (
                    <li key={member.socioId}>
                      {member.nombre} ({member.carnet || "Sin carnet"}):{" "}
                      <strong>{moneda.format(member.totalDeuda)}</strong>
                    </li>
                  ))}
                </ul>
              ) : <p>No hay multas pendientes.</p>}
            </div>
          </section>
        </>
      ) : null}
    </section>
  );
}

export default function Home() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const enInicio = pathname === "/";

  return (
    <div className="app-shell">
      <Header />
      <main className="main-content">
        <div className="institution-label">
          <span className="status-dot" aria-hidden="true" />
          Universidad Mariano Gálvez de Guatemala
        </div>
        {enInicio ? <Dashboard user={user} /> : <Outlet />}
        <footer className="page-footer">
          <span>Sistema de biblioteca</span>
          <span>Interfaz de gestión</span>
        </footer>
      </main>
    </div>
  );
}
