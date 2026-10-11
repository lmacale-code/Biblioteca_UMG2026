export default function Rentas() {
  return (
    <section className="module-page" aria-labelledby="module-title">
      <div className="module-heading">
        <p className="eyebrow">Prestamos</p>
        <h1 id="module-title">Rentas</h1>
        <p className="module-description">
          Administra desde aquí el flujo de alquiler de libros de la biblioteca.
        </p>
      </div>
      <div className="module-card">
        <span className="card-icon" aria-hidden="true">R</span>
        <div>
          <h2>Control de rentas</h2>
          <p>
            Este espacio está preparado para consultar préstamos y organizar
            sus fechas de devolución.
          </p>
        </div>
        <span className="module-status">Modulo inicial</span>
      </div>
    </section>
  );
}
