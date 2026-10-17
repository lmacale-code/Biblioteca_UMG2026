import { useEffect, useState } from "react";
import { apiRequest } from "../../api/client.js";
import "./rentas.css";

const formularioInicial = { libro_id: "", socio_id: "" };

function formatoFecha(value) {
  if (!value) return "—";
  const [year, month, day] = String(value).slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

function formatoMonto(value) {
  return new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
  }).format(Number(value) || 0);
}

function estaPagada(value) {
  return value === true || value === 1;
}

export default function Rentas() {
  const [prestamos, setPrestamos] = useState([]);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [busquedaLibro, setBusquedaLibro] = useState("");
  const [busquedaSocio, setBusquedaSocio] = useState("");
  const [libros, setLibros] = useState([]);
  const [socios, setSocios] = useState([]);
  const [buscandoLibro, setBuscandoLibro] = useState(false);
  const [buscandoSocio, setBuscandoSocio] = useState(false);
  const [errorCatalogo, setErrorCatalogo] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accionId, setAccionId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const prestamosVisibles = prestamos.filter((prestamo) => (
    prestamo.estado === "activo"
    || (Number(prestamo.multa_monto) > 0 && !estaPagada(prestamo.multa_pagada))
  ));

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    apiRequest("/prestamos", { signal: controller.signal })
      .then((result) => setPrestamos(result.prestamos ?? []))
      .catch((requestError) => {
        if (requestError.name !== "AbortError") setError(requestError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [refreshKey]);

  useEffect(() => {
    const query = busquedaLibro.trim();
    if (query.length < 2) {
      setLibros([]);
      setBuscandoLibro(false);
      return undefined;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setBuscandoLibro(true);
      setErrorCatalogo("");
      apiRequest(`/libros?q=${encodeURIComponent(query)}`, { signal: controller.signal })
        .then((result) => setLibros(result.libros ?? []))
        .catch((requestError) => {
          if (requestError.name !== "AbortError") setErrorCatalogo(requestError.message);
        })
        .finally(() => {
          if (!controller.signal.aborted) setBuscandoLibro(false);
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [busquedaLibro]);

  useEffect(() => {
    const query = busquedaSocio.trim();
    if (query.length < 2) {
      setSocios([]);
      setBuscandoSocio(false);
      return undefined;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setBuscandoSocio(true);
      setErrorCatalogo("");
      apiRequest(`/socios?q=${encodeURIComponent(query)}`, { signal: controller.signal })
        .then((result) => setSocios(result.socios ?? []))
        .catch((requestError) => {
          if (requestError.name !== "AbortError") setErrorCatalogo(requestError.message);
        })
        .finally(() => {
          if (!controller.signal.aborted) setBuscandoSocio(false);
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [busquedaSocio]);

  async function registrarPrestamo(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const result = await apiRequest("/prestamos", {
        method: "POST",
        body: JSON.stringify({
          libro_id: Number(formulario.libro_id),
          socio_id: Number(formulario.socio_id),
        }),
      });
      setFormulario(formularioInicial);
      setNotice(result.mensaje ?? "Préstamo registrado correctamente.");
      setRefreshKey((value) => value + 1);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function ejecutarAccion(prestamo, accion) {
    if (accion === "devolver") {
      const multa = formatoMonto(prestamo.multa_acumulada);
      if (!window.confirm(`La multa acumulada al devolver es ${multa}. ¿Confirmas la devolución?`)) {
        return;
      }
    }
    setAccionId(prestamo.id);
    setError("");
    setNotice("");
    try {
      const result = await apiRequest(
        `/prestamos/${prestamo.id}/${accion === "devolver" ? "devolver" : "pagar-multa"}`,
        { method: accion === "devolver" ? "POST" : "PUT" },
      );
      setNotice(result.mensaje ?? (accion === "devolver"
        ? "Libro devuelto correctamente."
        : "Multa pagada correctamente."));
      setRefreshKey((value) => value + 1);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setAccionId(null);
    }
  }

  return (
    <section className="module-page rentas-page" aria-labelledby="module-title">
      <div className="module-heading">
        <p className="eyebrow">Préstamos y devoluciones</p>
        <h1 id="module-title">Rentas</h1>
        <p className="module-description">
          Registra préstamos, controla devoluciones y consulta las multas pendientes.
        </p>
      </div>

      <section className="rentas-panel" aria-labelledby="nuevo-prestamo">
        <div className="rentas-section-heading">
          <div>
            <p className="rentas-eyebrow">Circulación bibliotecaria</p>
            <h2 id="nuevo-prestamo">Registrar préstamo</h2>
          </div>
        </div>
        <form className="rentas-form" onSubmit={registrarPrestamo}>
          <div className="rentas-field">
            <label htmlFor="busqueda-libro">Buscar libro</label>
            <input
              id="busqueda-libro"
              autoComplete="off"
              onChange={(event) => {
                setBusquedaLibro(event.target.value);
                setFormulario((current) => ({ ...current, libro_id: "" }));
              }}
              placeholder="Título, autor o ISBN"
              type="search"
              value={busquedaLibro}
            />
            <label htmlFor="libro-id">Libro disponible</label>
            <select
              id="libro-id"
              onChange={(event) => setFormulario((current) => ({ ...current, libro_id: event.target.value }))}
              required
              value={formulario.libro_id}
            >
              <option value="">{buscandoLibro ? "Buscando libros..." : "Selecciona un libro"}</option>
              {libros.map((libro) => (
                <option
                  disabled={!libro.activo || Number(libro.ejemplares_disponibles) < 1}
                  key={libro.id}
                  value={libro.id}
                >
                  {libro.titulo} — disponibles: {libro.ejemplares_disponibles}
                </option>
              ))}
            </select>
          </div>
          <div className="rentas-field">
            <label htmlFor="busqueda-socio">Buscar socio</label>
            <input
              id="busqueda-socio"
              autoComplete="off"
              onChange={(event) => {
                setBusquedaSocio(event.target.value);
                setFormulario((current) => ({ ...current, socio_id: "" }));
              }}
              placeholder="Nombre o carnet"
              type="search"
              value={busquedaSocio}
            />
            <label htmlFor="socio-id">Socio</label>
            <select
              id="socio-id"
              onChange={(event) => setFormulario((current) => ({ ...current, socio_id: event.target.value }))}
              required
              value={formulario.socio_id}
            >
              <option value="">{buscandoSocio ? "Buscando socios..." : "Selecciona un socio"}</option>
              {socios.map((socio) => (
                <option disabled={!socio.activo} key={socio.id} value={socio.id}>
                  {socio.nombre} · {socio.carnet}{socio.activo ? "" : " (inactivo)"}
                </option>
              ))}
            </select>
          </div>
          <button
            className="rentas-primary-button"
            disabled={saving || !formulario.libro_id || !formulario.socio_id}
            type="submit"
          >
            {saving ? "Registrando..." : "Registrar préstamo"}
          </button>
        </form>
        <p className="rentas-help">
          Escribe al menos dos caracteres para buscar y seleccionar un libro y un socio.
        </p>
      </section>

      {errorCatalogo && <p className="rentas-alert" role="alert">{errorCatalogo}</p>}
      {error && <p className="rentas-alert" role="alert">{error}</p>}
      {notice && <p className="rentas-notice" role="status">{notice}</p>}

      <section className="rentas-panel" aria-labelledby="listado-prestamos">
        <div className="rentas-section-heading">
          <div>
            <p className="rentas-eyebrow">Seguimiento</p>
            <h2 id="listado-prestamos">Préstamos activos y multas pendientes</h2>
          </div>
          <button
            className="rentas-secondary-button"
            disabled={loading}
            onClick={() => setRefreshKey((value) => value + 1)}
            type="button"
          >
            Actualizar
          </button>
        </div>
        <div className="rentas-table-wrap">
          <table className="rentas-table">
            <thead>
              <tr>
                <th scope="col">Libro</th>
                <th scope="col">Socio</th>
                <th scope="col">Salida</th>
                <th scope="col">Límite</th>
                <th scope="col">Devolución</th>
                <th scope="col">Estado</th>
                <th scope="col">Multa acumulada</th>
                <th scope="col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td className="rentas-table-state" colSpan="8">Cargando préstamos...</td></tr>}
              {!loading && prestamosVisibles.length === 0 && (
                <tr><td className="rentas-table-state" colSpan="8">No hay préstamos registrados.</td></tr>
              )}
              {!loading && prestamosVisibles.map((prestamo) => {
                const active = prestamo.estado === "activo";
                const paid = estaPagada(prestamo.multa_pagada);
                const multa = Number(prestamo.multa_acumulada) || 0;
                return (
                  <tr key={prestamo.id}>
                    <td>
                      <strong>{prestamo.libro_titulo || `Libro #${prestamo.libro_id}`}</strong>
                      <small>#{prestamo.libro_id}{prestamo.libro_isbn ? ` · ISBN ${prestamo.libro_isbn}` : ""}</small>
                    </td>
                    <td>
                      {prestamo.socio_nombre || `Socio #${prestamo.socio_id}`}
                      <small>{prestamo.socio_carnet || `#${prestamo.socio_id}`}</small>
                    </td>
                    <td>{formatoFecha(prestamo.fecha_salida)}</td>
                    <td>{formatoFecha(prestamo.fecha_limite)}</td>
                    <td>{formatoFecha(prestamo.fecha_devolucion)}</td>
                    <td><span className={`rentas-status ${active ? (prestamo.vencido ? "is-overdue" : "is-active") : "is-returned"}`}>
                      {active && prestamo.vencido ? "Vencido" : active ? "Activo" : "Devuelto"}
                    </span></td>
                    <td>
                      <strong>{formatoMonto(prestamo.multa_acumulada)}</strong>
                      <small>{paid ? "Pagada / sin saldo" : multa > 0 ? "Pendiente" : "Sin multa generada"}</small>
                    </td>
                    <td className="rentas-actions">
                      {active && (
                        <button
                          className="rentas-text-button"
                          disabled={accionId === prestamo.id}
                          onClick={() => ejecutarAccion(prestamo, "devolver")}
                          type="button"
                        >
                          {accionId === prestamo.id ? "Procesando..." : "Registrar devolución"}
                        </button>
                      )}
                      {!active && Number(prestamo.multa_monto) > 0 && !paid && (
                        <button
                          className="rentas-text-button is-pay"
                          disabled={accionId === prestamo.id}
                          onClick={() => ejecutarAccion(prestamo, "pagar")}
                          type="button"
                        >
                          {accionId === prestamo.id ? "Procesando..." : "Marcar multa pagada"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
