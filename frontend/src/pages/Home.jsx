import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { apiRequest } from "../api/client.js";
import Header from "../components/Header.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import "./socios/socios.css";

const currency = new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ" });

function Dashboard({ user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    apiRequest(user?.rol === "socio" ? "/historial/mi" : "/dashboard", {
      signal: controller.signal,
    })
      .then(setData)
      .catch((requestError) => {
        if (requestError.name !== "AbortError") setError(requestError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [user?.rol]);

  const isSocio = user?.rol === "socio";
  const prestamosSocio = (data?.prestamos ?? []).filter((prestamo) => prestamo.estado === "activo");
  const multaSocio = prestamosSocio.reduce(
    (total, prestamo) => total + (Number(prestamo.multaMonto) || 0),
    0,
  );
  const disponibilidad = data?.disponibilidad ?? {};
  const cards = isSocio
    ? [
        ["Préstamos activos", prestamosSocio.length],
        ["Préstamos vencidos", prestamosSocio.filter((prestamo) => Number(prestamo.diasRetraso) > 0).length],
        ["Multas acumuladas", currency.format(multaSocio)],
      ]
    : [
        ["Títulos", disponibilidad.titulos],
        ["Ejemplares", disponibilidad.ejemplares],
        ["Disponibles", disponibilidad.disponibles],
        ["Prestados", disponibilidad.prestados],
        ["Préstamos vencidos", disponibilidad.vencidos],
      ];

  return (
    <section className="module-page" aria-labelledby="dashboard-title">
      <div className="module-heading">
        <p className="eyebrow">{isSocio ? "Mi biblioteca" : "Resumen general"}</p>
        <h1 id="dashboard-title">Bienvenido{user?.nombre ? `, ${user.nombre}` : ""}</h1>
        <p className="module-description">
          {isSocio
            ? "Consulta el estado de tus préstamos y fechas de devolución."
            : "Indicadores actuales de la biblioteca y seguimiento de préstamos."}
        </p>
      </div>
      {error && <p className="socios-alert" role="alert">{error}</p>}
      {loading ? (
        <p role="status">Cargando resumen…</p>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(165px, 1fr))", gap: "1rem" }}>
            {cards.map(([label, value]) => (
              <article className="module-card" key={label}>
                <div>
                  <p>{label}</p>
                  <h2>{value ?? "—"}</h2>
                </div>
              </article>
            ))}
          </div>
          {isSocio ? (
            <section aria-labelledby="recent-loans-title" style={{ marginTop: "2rem" }}>
              <h2 id="recent-loans-title">Mis préstamos activos</h2>
              {prestamosSocio.length ? (
                <ul>
                  {prestamosSocio.map((loan) => (
                    <li key={loan.id}>
                      <strong>{loan.titulo}</strong> — vence {String(loan.fechaLimite).slice(0, 10)}
                      {" · Multa: "}{currency.format(Number(loan.multaMonto) || 0)}
                      {Number(loan.diasRetraso) > 0 ? " · Vencido" : ""}
                    </li>
                  ))}
                </ul>
              ) : <p>No tienes préstamos activos.</p>}
              <Link to="/historial">Ver mi historial</Link>
            </section>
          ) : (
            <section style={{ marginTop: "2rem" }}>
              <div className="module-heading">
                <h2>Libros más prestados</h2>
              </div>
              <div className="socios-table-wrap">
                <table className="socios-table">
                  <thead>
                    <tr><th>Libro</th><th>Autor</th><th>Préstamos</th></tr>
                  </thead>
                  <tbody>
                    {data?.librosMasPrestados?.length ? data.librosMasPrestados.map((libro) => (
                      <tr key={libro.id}>
                        <td>{libro.titulo}</td>
                        <td>{libro.autor}</td>
                        <td>{libro.cantidad_prestamos}</td>
                      </tr>
                    )) : <tr><td colSpan="3">Aún no hay préstamos registrados.</td></tr>}
                  </tbody>
                </table>
              </div>
              <h2 style={{ marginTop: "2rem" }}>Socios con deudas</h2>
              {data?.sociosConDeudas?.length ? (
                <ul>
                  {data.sociosConDeudas.map((socio) => (
                    <li key={socio.id}>
                      <strong>{socio.nombre}</strong> ({socio.carnet}) — {currency.format(socio.deuda_total)}
                    </li>
                  ))}
                </ul>
              ) : <p>No hay socios con multas pendientes.</p>}
            </section>
          )}
        </>
      )}
    </section>
  );
}

export default function Home() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const isDashboard = pathname === "/";

  return (
    <div className="app-shell">
      <Header />
      <main className="main-content">
        <div className="institution-label">
          <span className="status-dot" aria-hidden="true" />
          Universidad Mariano Gálvez de Guatemala
        </div>
        {isDashboard ? <Dashboard user={user} /> : <Outlet />}
        <footer className="page-footer">
          <span>Sistema de biblioteca</span>
          <span>Interfaz de gestión</span>
        </footer>
      </main>
    </div>
  );
}
