import { useState } from "react";

export default function Informes() {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  async function descargarReporte() {
    setDownloading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/reportes/prestamos-activos.pdf", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "No fue posible generar el informe");
      }
      const archivo = await response.blob();
      const url = URL.createObjectURL(archivo);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = "prestamos-activos.pdf";
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (requestError) {
      setError(requestError.message || "No fue posible descargar el informe");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <section className="module-page" aria-labelledby="module-title">
      <div className="module-heading">
        <p className="eyebrow">Resúmenes</p>
        <h1 id="module-title">Informes</h1>
        <p className="module-description">
          Genera un reporte actualizado de préstamos que todavía están activos.
        </p>
      </div>
      <div className="module-card">
        <span className="card-icon" aria-hidden="true">PDF</span>
        <div>
          <h2>Préstamos activos</h2>
          <p>Descarga en PDF los préstamos vigentes, sus fechas límite y días de atraso.</p>
          <button type="button" onClick={descargarReporte} disabled={downloading}>
            {downloading ? "Generando informe…" : "Descargar reporte de préstamos activos (PDF)"}
          </button>
          {error && <p className="socios-alert" role="alert">{error}</p>}
        </div>
      </div>
    </section>
  );
}
