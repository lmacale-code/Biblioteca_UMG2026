import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Informes() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function descargarReporte() {
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Tu sesión expiró. Inicia sesión nuevamente.");
      }

      const response = await fetch("/api/reportes/prestamos-activos.pdf", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "No se pudo descargar el reporte.");
      }

      const pdf = await response.blob();
      const url = URL.createObjectURL(pdf);
      const link = document.createElement("a");
      link.href = url;
      link.download = "reporte-prestamos-activos.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setNotice("El reporte se descargó correctamente.");
    } catch (downloadError) {
      setError(downloadError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="module-page" aria-labelledby="module-title">
      <div className="module-heading">
        <p className="eyebrow">Resúmenes</p>
        <h1 id="module-title">Informes</h1>
        <p className="module-description">
          Descarga el reporte actualizado de préstamos activos y multas acumuladas.
        </p>
      </div>
      {user?.rol !== "admin" ? (
        <p className="module-card" role="alert">Este informe está disponible solo para administradores.</p>
      ) : (
        <section className="module-card">
          <span className="card-icon" aria-hidden="true">PDF</span>
          <div>
            <h2>Préstamos activos</h2>
            <p>Incluye socio, libro, fechas límite, estado y multas en quetzales.</p>
            <button
              className="login-submit"
              disabled={loading}
              onClick={descargarReporte}
              type="button"
            >
              {loading ? "Generando reporte..." : "Descargar reporte de préstamos activos (PDF)"}
            </button>
            {error && <p className="login-notice" role="alert">{error}</p>}
            {notice && <p className="login-notice" role="status">{notice}</p>}
          </div>
        </section>
      )}
    </section>
  );
}
