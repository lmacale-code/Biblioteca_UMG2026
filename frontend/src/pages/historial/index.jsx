export default function Historial() {
  return (
    <section className="module-page" aria-labelledby="module-title">
      <div className="module-heading">
        <p className="eyebrow">Actividad</p>
        <h1 id="module-title">Historial</h1>
        <p className="module-description">Revisa los préstamos y devoluciones registrados.</p>
      </div>
      <div className="module-card">
        <span className="card-icon" aria-hidden="true">H</span>
        <div><h2>Módulo inicial</h2><p>El historial de préstamos estará disponible en este espacio.</p></div>
        <span className="module-status">Módulo inicial</span>
      </div>
    </section>
  );
}