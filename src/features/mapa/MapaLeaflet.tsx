import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface PuntoMapa {
  id: number | string;
  lat: number;
  lon: number;
  color: string;
  titulo: string;
  detalle: string;
}

/** Vista inicial sin datos ni ubicación: el mundo. No se asume ninguna ciudad. */
const VISTA_MUNDO: { centro: [number, number]; zoom: number } = { centro: [20, 0], zoom: 2 };

interface Props {
  puntos: PuntoMapa[];
  /** Punto elegido manualmente (selector). */
  seleccion?: { lat: number; lon: number } | null;
  onClick?: (lat: number, lon: number) => void;
  centro?: [number, number];
  alto?: string;
}

export default function MapaLeaflet({ puntos, seleccion, onClick, centro, alto = "60vh" }: Props) {
  const div = useRef<HTMLDivElement>(null);
  const mapa = useRef<L.Map | null>(null);
  const capa = useRef<L.LayerGroup | null>(null);
  const sel = useRef<L.Marker | L.CircleMarker | null>(null);
  const clickRef = useRef(onClick);
  clickRef.current = onClick;
  const ajustado = useRef(false);

  useEffect(() => {
    const m = L.map(div.current!, { zoomControl: true });
    if (centro) m.setView(centro, 17);
    else {
      m.setView(VISTA_MUNDO.centro, VISTA_MUNDO.zoom);
      // Sin puntos que mostrar, acerca el mapa a donde está la persona (si da permiso)
      navigator.geolocation?.getCurrentPosition(
        p => { if (mapa.current && !ajustado.current) mapa.current.setView([p.coords.latitude, p.coords.longitude], 16); },
        () => { /* sin permiso o sin señal GPS: se queda la vista general */ },
        { timeout: 10000, maximumAge: 60000 },
      );
    }
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap",
    }).addTo(m);
    capa.current = L.layerGroup().addTo(m);
    m.on("click", e => clickRef.current?.(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6))));
    mapa.current = m;
    // El contenedor puede cambiar de tamaño al mostrarse (pestañas, modal)
    const ro = new ResizeObserver(() => m.invalidateSize());
    ro.observe(div.current!);
    return () => { ro.disconnect(); m.remove(); mapa.current = null; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const g = capa.current, m = mapa.current;
    if (!g || !m) return;
    g.clearLayers();
    for (const p of puntos) {
      const mk = L.circleMarker([p.lat, p.lon], {
        radius: 11, color: "#fff", weight: 2, fillColor: p.color, fillOpacity: 0.95,
      });
      // Contenido con textContent: los textos los escribe el usuario
      const box = document.createElement("div");
      const t = document.createElement("b"); t.textContent = p.titulo;
      const d = document.createElement("div"); d.textContent = p.detalle;
      box.append(t, d);
      mk.bindPopup(box).addTo(g);
    }
    if (!ajustado.current && puntos.length > 0 && !centro) {
      m.fitBounds(L.latLngBounds(puntos.map(p => [p.lat, p.lon] as [number, number])), { padding: [30, 30], maxZoom: 18 });
      ajustado.current = true;
    }
  }, [puntos, centro]);

  useEffect(() => {
    const m = mapa.current;
    if (!m) return;
    sel.current?.remove();
    sel.current = null;
    if (seleccion) {
      sel.current = L.circleMarker([seleccion.lat, seleccion.lon], {
        radius: 9, color: "#fff", weight: 3, fillColor: "#0b57d0", fillOpacity: 1,
      }).addTo(m);
    }
  }, [seleccion]);

  return <div ref={div} className="mapa" style={{ height: alto }} role="application" aria-label="Mapa" />;
}
