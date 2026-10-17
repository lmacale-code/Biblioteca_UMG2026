import { useEffect, useState } from "react";
import { apiRequest } from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";

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

export default function Historial() {
  const { user } = useAuth();
  const esAdmin = user?.rol === "admin";
  const [socios, setSocios] = useState([]);
  const [socioId, setSocioId] = useState("");
  const [estado, setEstado] = useState("");
  const [prestamos, setPrestamos] = useState([]);
  const [cargandoSocios, setCargandoSocios] = useState(esAdmin);
  const [cargandoHistorial, setCargandoHistorial] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!esAdmin) return undefined;

    let active = true;
    apiRequest("/socios")
      .then((result) => {
        if (!active) return;
        const members = result.socios ?? [];
        setSocios(members);
        setSocioId((current) => current || String(members[0]?.id ?? ""));
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setCargandoSocios(false);
      });

    return () => {
      active = false;
    };
  }, [esAdmin]);

  useEffect(() => {
    if (esAdmin && !socioId) {
      setPrestamos([]);
      setCargandoHistorial(false);
      return undefined;
    }

    let active = true;
    setCargandoHistorial(true);
    setError("");
    const query = new URLSearchParams();
    if (estado) query.set("estado", estado);
    const suffix = query.size ? `?${query.toString()}` : "";
    const path = esAdmin
      ? `/historial/${encodeURIComponent(socioId)}${suffix}`
      : `/historial/mi${suffix}`;

    apiRequest(path)
      .then((result) => {
        if (active) setPrestamos(result.prestamos ?? []);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setCargandoHistorial(false);
      });

    return () => {
      active = false;
    };
  }, [esAdmin, socioId, estado]);

  return (
    <section className="module-page" aria-labelledby="module-title">
      <div className="module-heading">
        <p className="eyebrow">Actividad</p>
        <h1 id="module-title">Historial</h1>
        <p className="module-description">
          Revisa los préstamos, devoluciones y multas registradas.
        </p>
      </div>

      <section className="module-card" aria-label="Filtros de historial">
        <div>
          {esAdmin && (
            <label>
              Socio{" "}
              <select
                disabled={cargandoSocios || socios.length === 0}
                onChange={(event) => setSocioId(event.target.value)}
                value={socioId}
              >
                {socios.length === 0 && <option value="">No hay socios</option>}
                {socios.map((socio) => (
                  <option key={socio.id} value={socio.id}>
                    {socio.nombre} — {socio.carnet}
                  </option>
                ))}
              </select>
            </label>
          )}
          {" "}
          <label>
            Estado{" "}
            <select onChange={(event) => setEstado(event.target.value)} value={estado}>
              <option value="">Todos</option>
              <option value="activo">Activo</option>
              <option value="devuelto">Devuelto</option>
            </select>
          </label>
        </div>
      </section>

      {cargandoHistorial && <p className="module-card" role="status">Cargando historial...</p>}
      {error && <p className="module-card" role="alert">{error}</p>}
      {!cargandoHistorial && !error && prestamos.length === 0 && (
        <section className="module-card">
          <span className="card-icon" aria-hidden="true">H</span>
          <div><h2>Sin resultados</h2><p>No hay préstamos para los filtros seleccionados.</p></div>
        </section>
      )}
      {!cargandoHistorial && !error && prestamos.map((prestamo) => {
        const multa = Number(prestamo.multa);
        return (
          <article className="module-card" key={prestamo.id}>
            <span className="card-icon" aria-hidden="true">L</span>
            <div>
              <h2>{prestamo.titulo}</h2>
              <p>
                Salida: <strong>{formatoFecha(prestamo.fecha_salida)}</strong>
                {" · "}Límite: <strong>{formatoFecha(prestamo.fecha_limite)}</strong>
                {" · "}Devolución: <strong>{formatoFecha(prestamo.fecha_devolucion)}</strong>
              </p>
              <p>
                Días de retraso: <strong>{prestamo.dias_retraso}</strong>
                {" · "}Multa: <strong>{formatoMoneda.format(multa)}</strong>
              </p>
            </div>
            <span className="module-status">
              {multa > 0
                ? prestamo.multa_pagada ? "Multa pagada" : "Multa pendiente"
                : prestamo.estado}
            </span>
          </article>
        );
      })}
    </section>
  );
}
