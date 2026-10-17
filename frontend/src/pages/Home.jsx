import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { apiRequest } from "../api/client.js";
import Header from "../components/Header.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const formatoMoneda = new Intl.NumberFormat("es-GT", {
  style: "currency",
  currency: "GTQ",
});

function formatoFecha(fecha) {
  if (!fecha) return "—";
  const [anio, mes, dia] = fecha.slice(0, 10).split("-").map(Number);
  return new Intl.DateTimeFormat("es-GT", {
    dateStyle: "medium",
  }).format(new Date(anio, mes - 1, dia));
}

function EstadoCarga({ loading, error }) {
  if (loading) {
    return <p className="module-card" role="status">Cargando información...</p>;
  }
  if (error) {
    return <p className="module-card" role="alert">{error}</p>;
  }
  return null;
}

function DashboardAdministrativo() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    apiRequest("/dashboard")
      .then((result) => {
        if (active) setDashboard(result);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="module-page" aria-labelledby="module-title">
      <div className="module-heading">
        <p className="eyebrow">Resumen general</p>
        <h1 id="module-title">Dashboard</h1>
        <p className="module-description">
          Disponibilidad de la colección, préstamos destacados y saldos pendientes.
        </p>
      </div>

      <EstadoCarga loading={loading} error={error} />
      {dashboard && (
        <>
          <section className="module-card" aria-labelledby="availability-title">
            <span className="card-icon" aria-hidden="true">B</span>
            <div>
              <h2 id="availability-title">Disponibilidad en tiempo real</h2>
              <p>
                Títulos: <strong>{dashboard.disponibilidad.titulosTotales}</strong>
                {" · "}Ejemplares: <strong>{dashboard.disponibilidad.ejemplaresTotales}</strong>
                {" · "}Disponibles: <strong>{dashboard.disponibilidad.disponibles}</strong>
                {" · "}Prestados: <strong>{dashboard.disponibilidad.prestados}</strong>
                {" · "}Vencidos: <strong>{dashboard.disponibilidad.prestamosVencidos}</strong>
              </p>
            </div>
          </section>

          <section className="module-card" aria-labelledby="popular-books-title">
            <span className="card-icon" aria-hidden="true">L</span>
            <div>
              <h2 id="popular-books-title">Libros más prestados</h2>
              {dashboard.librosMasPrestados.length === 0 ? (
                <p>Aún no hay préstamos registrados.</p>
              ) : (
                <ol>
                  {dashboard.librosMasPrestados.map((book) => (
                    <li key={`${book.titulo}-${book.autor}`}>
                      {book.titulo} — {book.autor}: {book.cantidadPrestamos}{" "}
                      {book.cantidadPrestamos === 1 ? "préstamo" : "préstamos"}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </section>

          <section className="module-card" aria-labelledby="debts-title">
            <span className="card-icon" aria-hidden="true">Q</span>
            <div>
              <h2 id="debts-title">Socios con deudas</h2>
              {dashboard.sociosConDeudas.length === 0 ? (
                <p>No hay multas pendientes.</p>
              ) : (
                <ul>
                  {dashboard.sociosConDeudas.map((member) => (
                    <li key={member.socioId}>
                      {member.nombre} ({member.carnet || "Sin carnet"}):{" "}
                      <strong>{formatoMoneda.format(member.totalDeuda)}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </>
      )}
    </section>
  );
}

function ResumenSocio({ user }) {
  const [prestamos, setPrestamos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    apiRequest("/historial/mi")
      .then((result) => {
        if (active) {
          setPrestamos((result.prestamos ?? []).filter((loan) => loan.estado === "activo"));
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const deudaTotal = prestamos.reduce((total, loan) => total + Number(loan.multa), 0);

  return (
    <section className="module-page" aria-labelledby="module-title">
      <div className="module-heading">
        <p className="eyebrow">Mi biblioteca</p>
        <h1 id="module-title">Hola, {user?.nombre}</h1>
        <p className="module-description">
          Este es el resumen de tus préstamos activos y multas acumuladas.
        </p>
      </div>
      <EstadoCarga loading={loading} error={error} />
      {!loading && !error && (
        <>
          <section className="module-card" aria-label="Resumen de préstamos">
            <span className="card-icon" aria-hidden="true">P</span>
            <div>
              <h2>Tu situación actual</h2>
              <p>
                Préstamos activos: <strong>{prestamos.length}</strong>
                {" · "}Multas acumuladas:{" "}
                <strong>{formatoMoneda.format(deudaTotal)}</strong>
              </p>
            </div>
          </section>
          {prestamos.length === 0 ? (
            <section className="module-card">
              <span className="card-icon" aria-hidden="true">✓</span>
              <div><h2>Sin préstamos activos</h2><p>No tienes libros pendientes de devolución.</p></div>
            </section>
          ) : (
            prestamos.map((loan) => (
              <article className="module-card" key={loan.id}>
                <span className="card-icon" aria-hidden="true">L</span>
                <div>
                  <h2>{loan.titulo}</h2>
                  <p>
                    Fecha límite: <strong>{formatoFecha(loan.fecha_limite)}</strong>
                    {" · "}Multa: <strong>{formatoMoneda.format(Number(loan.multa))}</strong>
                  </p>
                </div>
                <span className="module-status">
                  {Number(loan.multa) > 0 ? "Vencido" : "Activo"}
                </span>
              </article>
            ))
          )}
        </>
      )}
    </section>
  );
}

function DashboardInicio({ user }) {
  if (user?.rol === "admin" || user?.rol === "encargado") {
    return <DashboardAdministrativo />;
  }
  if (user?.rol === "socio") {
    return <ResumenSocio user={user} />;
  }
  return null;
}

export default function Home() {
  const { user } = useAuth();
  const location = useLocation();
  const enInicio = location.pathname === "/";

  return (
    <div className="app-shell">
      <Header />
      <main className="main-content">
        <div className="institution-label">
          <span className="status-dot" aria-hidden="true" />
          Universidad Mariano Gálvez de Guatemala
        </div>
        {enInicio ? <DashboardInicio user={user} /> : <Outlet />}
        <footer className="page-footer">
          <span>Sistema de biblioteca</span>
          <span>Interfaz de gestion</span>
        </footer>
      </main>
    </div>
  );
}
