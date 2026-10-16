import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const links = [
  { to: "/", label: "Inicio", roles: ["admin", "encargado", "socio"] },
  { to: "/libros", label: "Libros", roles: ["admin", "encargado", "socio"] },
  { to: "/inventario", label: "Inventario", roles: ["admin", "encargado"] },
  { to: "/rentas", label: "Rentas", roles: ["admin", "encargado"] },
  { to: "/socios", label: "Socios", roles: ["admin", "encargado"] },
  { to: "/informes", label: "Informes", roles: ["admin"] },
  { to: "/historial", label: "Historial", roles: ["admin", "encargado", "socio"] },
  { to: "/configuracion", label: "Configuración", roles: ["admin"] },
];

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="site-header">
      <div className="header-content">
        <Link className="brand" to="/" aria-label="Biblioteca UMG, inicio">
          <span className="brand-mark" aria-hidden="true">B</span>
          <span>
            <strong>Biblioteca UMG</strong>
            <small>Centro de gestión</small>
          </span>
        </Link>
        <nav className="primary-navigation" aria-label="Navegación principal">
          {links.filter((link) => link.roles.includes(user?.rol)).map((link) => (
            <NavLink
              key={link.to}
              className="navigation-link"
              to={link.to}
              end={link.to === "/"}
            >
              {link.label}
            </NavLink>
          ))}
          <span aria-label="Usuario conectado">{user?.nombre}</span>
          <button className="logout-link" onClick={logout} type="button">
            Cerrar sesión
          </button>
        </nav>
      </div>
    </header>
  );
}
