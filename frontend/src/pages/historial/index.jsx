import { useEffect, useState } from "react";
import { apiRequest } from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";
import "../socios/socios.css";

const moneda = new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ" });

function fecha(value) {
  return value ? String(value).slice(0, 10) : "—";
}

export default function Historial() {
  const { user } = useAuth();
  const [prestamos, setPrestamos] = useState([]);
  const [socios, setSocios] = useState([]);
  const [socioId, setSocioId] = useState("");
  const [estado, setEstado] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const isAdmin = user?.rol === "admin";

  useEffect(() => {
    if (!isAdmin) return undefined;
    const controller = new AbortController();
    apiRequest("/socios", { signal: controller.signal })
      .then((result) => setSocios(result.socios ?? []))
      .catch((requestError) => {
        if (requestError.name !== "AbortError") setError(requestError.message);
      });
    return () => controller.abort();
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin && !socioId) {
      setPrestamos([]);
      setLoading(false);
      setError("");
      return undefined;
    }
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (estado) params.set("estado", estado);
    if (desde) params.set("desde", desde);
    if (hasta) params.set("hasta", hasta);
    if (q.trim()) params.set("q", q.trim());
    const query = params.toString();
    const suffix = query ? `?${query}` : "";
    const path = isAdmin
      ? `/historial/${encodeURIComponent(socioId)}${suffix}`
      : `/historial/mi${suffix}`;

    setLoading(true);
    setError("");
    apiRequest(path, { signal: controller.signal })
      .then((result) => setPrestamos(result.prestamos ?? []))
      .catch((requestError) => {
        if (requestError.name !== "AbortError") setError(requestError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [isAdmin, socioId, estado, desde, hasta, q]);

  return (
    <section className="module-page" aria-labelledby="history-title">
      <div className="module-heading">
        <p className="eyebrow">Actividad</p>
        <h1 id="history-title">
          {isAdmin ? (socioId ? "Historial del socio" : "Consultar historial") : "Mi historial"}
        </h1>
        <p className="module-description">
          {isAdmin
            ? "Selecciona un socio para revisar sus préstamos, devoluciones y multas."
            : "Revisa tus préstamos, devoluciones y multas."}
        </p>
      </div>

      <form
        onSubmit={(event) => event.preventDefault()}
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(165px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}
      >
        {isAdmin && (
          <label className="socios-field">
            Socio
            <select value={socioId} onChange={(event) => setSocioId(event.target.value)}>
              <option value="">Selecciona un socio</option>
              {socios.map((socio) => (
                <option key={socio.id} value={socio.id}>{socio.nombre} · {socio.carnet}</option>
              ))}
            </select>
          </label>
        )}
        <label className="socios-field">
          Buscar libro
          <input value={q} onChange={(event) => setQ(event.target.value)} maxLength={100} placeholder="Título, autor o ISBN" />
        </label>
        <label className="socios-field">
          Estado
          <select value={estado} onChange={(event) => setEstado(event.target.value)}>
            <option value="">Todos</option>
            <option value="activo">Activo</option>
            <option value="devuelto">Devuelto</option>
          </select>
        </label>
        <label className="socios-field">
          Desde
          <input type="date" value={desde} onChange={(event) => setDesde(event.target.value)} />
        </label>
        <label className="socios-field">
          Hasta
          <input type="date" value={hasta} onChange={(event) => setHasta(event.target.value)} />
        </label>
      </form>

      {error && <p className="socios-alert" role="alert">{error}</p>}
      <div className="socios-table-wrap">
        <table className="socios-table">
          <thead>
            <tr>
              <th>Libro</th>
              <th>Préstamo</th>
              <th>Fecha límite</th>
              <th>Devolución</th>
              <th>Estado</th>
              <th>Atraso</th>
              <th>Multa</th>
              <th>Pagada</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="socios-table-state" colSpan="8">Cargando historial…</td></tr>
            ) : prestamos.length ? prestamos.map((prestamo) => (
              <tr
                key={prestamo.id}
                style={Number(prestamo.multaMonto) > 0 ? { backgroundColor: "#fff4f4" } : undefined}
              >
                <td>{prestamo.titulo}<br /><small>{prestamo.autor}</small></td>
                <td>{fecha(prestamo.fechaSalida)}</td>
                <td>{fecha(prestamo.fechaLimite)}</td>
                <td>{fecha(prestamo.fechaDevolucion)}</td>
                <td>{prestamo.estado === "activo" ? "Activo" : "Devuelto"}</td>
                <td>{prestamo.diasRetraso} día(s)</td>
                <td>{moneda.format(Number(prestamo.multaMonto) || 0)}</td>
                <td>{prestamo.multaPagada ? "Sí" : "No"}</td>
              </tr>
            )) : (
              <tr><td className="socios-table-state" colSpan="8">
                {isAdmin && !socioId
                  ? "Selecciona un socio para consultar su historial."
                  : "No hay préstamos que coincidan con los filtros."}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="module-description">Se muestran como máximo 250 registros por consulta.</p>
    </section>
  );
}
