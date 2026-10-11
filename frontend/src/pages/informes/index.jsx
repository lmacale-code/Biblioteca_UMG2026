export default function Informes() {
  return (
    <section className="module-page" aria-labelledby="module-title">
      <div className="module-heading">
        <p className="eyebrow">Resúmenes</p>
        <h1 id="module-title">Informes</h1>
        <p className="module-description">
          Encuentra en esta sección los informes y resúmenes de la biblioteca.
        </p>
      </div>
      <div className="module-card">
        <span className="card-icon" aria-hidden="true">I</span>
        <div>
          <h2>Información centralizada</h2>
          <p>
            Este espacio está preparado para presentar informes cuando se
            incorpore la gestión de datos.
          </p>
        </div>
        <span className="module-status">Modulo inicial</span>
      </div>
    </section>
  );
}
