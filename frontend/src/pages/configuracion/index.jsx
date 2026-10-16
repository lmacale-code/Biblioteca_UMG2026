export default function Configuracion() {
  return (
    <section className="module-page" aria-labelledby="module-title">
      <div className="module-heading">
        <p className="eyebrow">Administración</p>
        <h1 id="module-title">Configuración</h1>
        <p className="module-description">Ajusta los parámetros generales de la biblioteca.</p>
      </div>
      <div className="module-card">
        <span className="card-icon" aria-hidden="true">C</span>
        <div><h2>Módulo inicial</h2><p>Los parámetros de la biblioteca se administrarán desde aquí.</p></div>
        <span className="module-status">Módulo inicial</span>
      </div>
    </section>
  );
}