import { useState } from "react";
import EspeciesPage from "./features/especies/EspeciesPage";
import EvaluacionPage from "./features/evaluacion/EvaluacionPage";
import ListaPage from "./features/lista/ListaPage";
import MapaPage from "./features/mapa/MapaPage";
import ResumenPage from "./features/resumen/ResumenPage";
import InicioPage, { type Destino } from "./features/inicio/InicioPage";
import AprenderPage from "./features/aprender/AprenderPage";
import { SIN_FILTROS, type Filtros } from "./lib/filtros";
import Aviso from "./components/Aviso";
import Logo, { NOMBRE_APP } from "./components/Logo";
import { IconoAjustes, IconoGrafica, IconoInicio, IconoLista, IconoMapa, IconoMas } from "./components/Iconos";
import { useEnLinea } from "./features/sync/useSync";

type Vista = "inicio" | Destino;

const TITULOS: Partial<Record<Vista, string>> = {
  lista: "Evaluaciones", mapa: "Mapa", resumen: "Resumen", aprender: "Aprender y guía", ajustes: "Ajustes", evaluar: "Evaluar árbol",
};

export default function App() {
  const enLinea = useEnLinea();
  const [vista, setVista] = useState<Vista>("inicio");
  const [filtros, setFiltros] = useState<Filtros>(SIN_FILTROS); // compartidos entre Lista y Mapa

  const item = (id: Vista, etiqueta: string, icono: React.ReactNode) => (
    <button key={id} type="button" className={vista === id ? "on" : ""} onClick={() => setVista(id)}
      aria-current={vista === id ? "page" : undefined}>
      {icono}
      <span>{etiqueta}</span>
    </button>
  );

  return (
    <div className="app">
      {vista !== "inicio" && (
        <header className="top">
          <button type="button" className="marca" onClick={() => setVista("inicio")} aria-label="Ir al inicio">
            <Logo tam={36} />
          </button>
          <div className="titulos">
            <h1>{TITULOS[vista] ?? NOMBRE_APP}</h1>
            <span className={"estado " + (enLinea ? "en-linea" : "sin-linea")} role="status">
              {enLinea ? "● En línea" : "● Sin conexión: se guarda en el dispositivo"}
            </span>
          </div>
          <button type="button" className={"icono-btn" + (vista === "ajustes" ? " on" : "")} onClick={() => setVista("ajustes")} aria-label="Ajustes">
            <IconoAjustes />
          </button>
        </header>
      )}
      <main className={vista === "inicio" ? "sin-margen" : ""}>
        {vista === "inicio" && <InicioPage ir={setVista} />}
        {/* La pagina de evaluacion se mantiene montada para no perder lo digitado al cambiar de pestaña */}
        <div hidden={vista !== "evaluar"}><EvaluacionPage activa={vista === "evaluar"} /></div>
        {vista === "ajustes" && <EspeciesPage />}
        {vista === "lista" && <ListaPage filtros={filtros} onFiltros={setFiltros} />}
        {vista === "mapa" && <MapaPage filtros={filtros} onFiltros={setFiltros} />}
        {vista === "resumen" && <ResumenPage />}
        {vista === "aprender" && <AprenderPage />}
        {vista !== "evaluar" && vista !== "inicio" && <Aviso />}
      </main>
      <nav className="tabs" aria-label="Secciones">
        {item("inicio", "Inicio", <IconoInicio />)}
        {item("lista", "Lista", <IconoLista />)}
        <button type="button" className={"fab" + (vista === "evaluar" ? " on" : "")} onClick={() => setVista("evaluar")}
          aria-label="Evaluar un árbol" aria-current={vista === "evaluar" ? "page" : undefined}>
          <IconoMas size={30} />
        </button>
        {item("mapa", "Mapa", <IconoMapa />)}
        {item("resumen", "Resumen", <IconoGrafica />)}
      </nav>
    </div>
  );
}
