export default function Inventario() {
  return (
    <section className="module-page" aria-labelledby="module-title">
      <div className="module-heading">
        <p className="eyebrow">Existencias</p>
        <h1 id="module-title">Inventario</h1>
        <p className="module-description">
          Revisa y organiza las existencias y movimientos del material
          bibliográfico.
        </p>
      </div>
      <div className="module-card">
        <span className="card-icon" aria-hidden="true">I</span>
        <div>
          <h2>Inventario bibliotecario</h2>
          <p>
            Este espacio está preparado para visualizar existencias y mantener
            el inventario organizado.
          </p>
        </div>
        <span className="module-status">Modulo inicial</span>
      </div>
    </section>
  );
}
