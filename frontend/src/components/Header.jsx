export default function Header({ sections, activeSectionId }) {
  return (
    <header className="site-header">
      <div className="header-content">
        <a className="brand" href="#libros" aria-label="Biblioteca UMG, inicio">
          <span className="brand-mark" aria-hidden="true">B</span>
          <span>
            <strong>Biblioteca UMG</strong>
            <small>Centro de gestión</small>
          </span>
        </a>
        <nav className="primary-navigation" aria-label="Navegación principal">
          {sections.map((section) => (
            <a
              key={section.id}
              className="navigation-link"
              href={`#${section.id}`}
              aria-current={activeSectionId === section.id ? "page" : undefined}
            >
              {section.label}
            </a>
          ))}
          <a className="logout-link" href="#login">
            Cerrar sesión
          </a>
        </nav>
      </div>
    </header>
  );
}
