import { useState } from "react";
import MapaLeaflet from "./MapaLeaflet";

interface Props {
  inicial: { lat: number; lon: number } | null;
  onConfirmar: (lat: number, lon: number) => void;
  onCerrar: () => void;
}

/** Pantalla completa: toca el mapa para fijar el punto del árbol. */
export default function SelectorPunto({ inicial, onConfirmar, onCerrar }: Props) {
  const [punto, setPunto] = useState(inicial);
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="Elegir punto en el mapa">
      <p className="muted">Toca el mapa para marcar la ubicación del árbol.</p>
      <MapaLeaflet puntos={[]} seleccion={punto} alto="calc(100dvh - 170px)"
        centro={inicial ? [inicial.lat, inicial.lon] : undefined}
        onClick={(lat, lon) => setPunto({ lat, lon })} />
      <div className="modal-botones">
        <button type="button" onClick={onCerrar}>Cancelar</button>
        <button type="button" className="grande" disabled={!punto}
          onClick={() => punto && onConfirmar(punto.lat, punto.lon)}>
          {punto ? `Usar ${punto.lat}, ${punto.lon}` : "Elige un punto"}
        </button>
      </div>
    </div>
  );
}
