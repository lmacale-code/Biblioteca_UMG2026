import { useEffect, useState } from "react";
import Header from "../components/Header.jsx";
import Libros from "./libros/index.jsx";
import Rentas from "./rentas/index.jsx";
import Inventario from "./inventario/index.jsx";
import Informes from "./informes/index.jsx";

const sections = [
  { id: "libros", label: "Libros", Component: Libros },
  { id: "rentas", label: "Rentas", Component: Rentas },
  { id: "inventario", label: "Inventario", Component: Inventario },
  { id: "informes", label: "Informes", Component: Informes },
];

function getSectionIdFromHash() {
  const sectionId = window.location.hash.slice(1);
  return sections.some((section) => section.id === sectionId)
    ? sectionId
    : sections[0].id;
}

export default function Home() {
  const [activeSectionId, setActiveSectionId] = useState(getSectionIdFromHash);
  const activeSection = sections.find(
    (section) => section.id === activeSectionId,
  );
  const ActiveComponent = activeSection.Component;

  useEffect(() => {
    function updateActiveSection() {
      setActiveSectionId(getSectionIdFromHash());
    }

    window.addEventListener("hashchange", updateActiveSection);
    return () => window.removeEventListener("hashchange", updateActiveSection);
  }, []);

  return (
    <div className="app-shell">
      <Header sections={sections} activeSectionId={activeSectionId} />
      <main className="main-content">
        <div className="institution-label">
          <span className="status-dot" aria-hidden="true" />
          Universidad Mariano Gálvez de Guatemala
        </div>
        <ActiveComponent />
        <footer className="page-footer">
          <span>Sistema de biblioteca</span>
          <span>Interfaz de gestion</span>
        </footer>
      </main>
    </div>
  );
}
