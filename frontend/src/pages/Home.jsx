import { Outlet } from "react-router-dom";
import Header from "../components/Header.jsx";

export default function Home() {
  return (
    <div className="app-shell">
      <Header />
      <main className="main-content">
        <div className="institution-label">
          <span className="status-dot" aria-hidden="true" />
          Universidad Mariano Gálvez de Guatemala
        </div>
        <Outlet />
        <footer className="page-footer">
          <span>Sistema de biblioteca</span>
          <span>Interfaz de gestion</span>
        </footer>
      </main>
    </div>
  );
}
