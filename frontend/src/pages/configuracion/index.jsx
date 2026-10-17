import { useEffect, useState } from "react";
import { apiRequest } from "../../api/client.js";
import "./configuracion.css";

const valoresIniciales = { dias_prestamo: "", multa_por_dia: "" };

export default function Configuracion() {
  const [configuracion, setConfiguracion] = useState(valoresIniciales);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    apiRequest("/configuracion", { signal: controller.signal })
      .then((result) => {
        const values = result.configuracion ?? {};
        setConfiguracion({
          dias_prestamo: String(values.dias_prestamo ?? ""),
          multa_por_dia: String(values.multa_por_dia ?? ""),
        });
      })
      .catch((requestError) => {
        if (requestError.name !== "AbortError") setError(requestError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [refreshKey]);

  function actualizarCampo(event) {
    setConfiguracion((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function guardar(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const result = await apiRequest("/configuracion", {
        method: "PUT",
        body: JSON.stringify({
          dias_prestamo: Number(configuracion.dias_prestamo),
          multa_por_dia: Number(configuracion.multa_por_dia),
        }),
      });
      const saved = result.configuracion ?? configuracion;
      setConfiguracion({
        dias_prestamo: String(saved.dias_prestamo),
        multa_por_dia: String(saved.multa_por_dia),
      });
      setNotice(result.mensaje ?? "Configuración actualizada correctamente.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="module-page configuracion-page" aria-labelledby="module-title">
      <div className="module-heading">
        <p className="eyebrow">Administración</p>
        <h1 id="module-title">Configuración</h1>
        <p className="module-description">
          Define la duración de los préstamos y el monto de las multas por retraso.
        </p>
      </div>

      <section className="configuracion-panel" aria-labelledby="parametros-prestamo">
        <div className="configuracion-panel-heading">
          <div>
            <p className="configuracion-eyebrow">Reglas de circulación</p>
            <h2 id="parametros-prestamo">Parámetros de préstamo</h2>
            <p>Los cambios se aplican a los préstamos creados a partir de su actualización.</p>
          </div>
          {loading && <span className="configuracion-loading">Cargando...</span>}
        </div>

        {error && <p className="configuracion-alert" role="alert">{error}</p>}
        {notice && <p className="configuracion-notice" role="status">{notice}</p>}

        {!loading && error && (
          <button
            className="configuracion-secondary-button"
            onClick={() => setRefreshKey((value) => value + 1)}
            type="button"
          >
            Intentar de nuevo
          </button>
        )}

        <form className="configuracion-form" onSubmit={guardar}>
          <label className="configuracion-field">
            <span>Días de préstamo</span>
            <input
              disabled={loading || saving || Boolean(error)}
              min="1"
              name="dias_prestamo"
              onChange={actualizarCampo}
              required
              step="1"
              type="number"
              value={configuracion.dias_prestamo}
            />
            <small>El plazo debe ser un número entero de al menos un día.</small>
          </label>
          <label className="configuracion-field">
            <span>Multa por día de retraso (Q)</span>
            <input
              disabled={loading || saving || Boolean(error)}
              max="99999999.99"
              min="0"
              name="multa_por_dia"
              onChange={actualizarCampo}
              required
              step="0.01"
              type="number"
              value={configuracion.multa_por_dia}
            />
            <small>El monto puede ser cero o tener hasta dos decimales.</small>
          </label>
          <div className="configuracion-form-actions">
            <button
              className="configuracion-primary-button"
              disabled={loading || saving || Boolean(error)}
              type="submit"
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </section>
    </section>
  );
}
