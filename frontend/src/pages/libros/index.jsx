export default function Libros() {
  return (
    <section className="module-page" aria-labelledby="module-title">
      <div className="module-heading">
        <p className="eyebrow">Catálogo</p>
        <h1 id="module-title">Libros</h1>
        <p className="module-description">
          Consulta y organiza los títulos que forman parte de la biblioteca.
        </p>
      </div>
      <div className="module-card">
        <span className="card-icon" aria-hidden="true">L</span>
        <div>
          <h2>Gestión de libros</h2>
          <p>
            Este espacio está preparado para incorporar el catálogo de libros y
            sus detalles.
          </p>
        </div>
        <span className="module-status">Modulo inicial</span>
      </div>
    </section>
  );
}
