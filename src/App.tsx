import { useState } from "react";
import EspeciesPage from "./features/especies/EspeciesPage";
import EvaluacionPage from "./features/evaluacion/EvaluacionPage";
import ListaPage from "./features/lista/ListaPage";
import MapaPage from "./features/mapa/MapaPage";
import ResumenPage from "./features/resumen/ResumenPage";
import { SIN_FILTROS, type Filtros } from "./lib/filtros";
import Aviso from "./components/Aviso";
import { useEnLinea } from "./features/sync/useSync";

type Tab = "evaluar" | "lista" | "mapa" | "resumen" | "especies";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "evaluar", label: "Evaluar", icon: "🌳" },
  { id: "lista", label: "Lista", icon: "📋" },
  { id: "mapa", label: "Mapa", icon: "🗺️" },
  { id: "resumen", label: "Resumen", icon: "📊" },
  { id: "especies", label: "Ajustes", icon: "⚙️" },
];

export default function App() {
  const enLinea = useEnLinea();
  const [tab, setTab] = useState<Tab>("evaluar");
  const [filtros, setFiltros] = useState<Filtros>(SIN_FILTROS); // compartidos entre Lista y Mapa
  return (
    <div className="app">
      <header className="top">
        <h1>Riesgo de árboles urbanos</h1>
        <span className="muted">Metodología AMVA 354 de 2007</span>
        <span className={"estado " + (enLinea ? "en-linea" : "sin-linea")} role="status">
          {enLinea ? "● En línea" : "● Sin conexión: todo se guarda en el dispositivo"}
        </span>
      </header>
      <main>
        {/* La pagina de evaluacion se mantiene montada para no perder lo digitado al cambiar de pestaña */}
        <div hidden={tab !== "evaluar"}><EvaluacionPage /></div>
        {tab === "especies" && <EspeciesPage />}
        {tab === "lista" && <ListaPage filtros={filtros} onFiltros={setFiltros} />}
        {tab === "mapa" && <MapaPage filtros={filtros} onFiltros={setFiltros} />}
        {tab === "resumen" && <ResumenPage />}
        {tab !== "evaluar" && <Aviso />}
      </main>
      <nav className="tabs" aria-label="Secciones">
        {TABS.map(t => (
          <button key={t.id} className={t.id === tab ? "on" : ""} onClick={() => setTab(t.id)}
            aria-current={t.id === tab ? "page" : undefined}>
            <span aria-hidden>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
