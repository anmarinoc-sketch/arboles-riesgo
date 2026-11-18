import { useCallback, useEffect, useRef, useState } from "react";
import type { Gravedad } from "../../../lib/medicion";

export type EstadoSensor = "apagado" | "pidiendo" | "activo" | "denegado" | "no-disponible";

/**
 * Lee la gravedad del acelerómetro del celular (devicemotion) con un suavizado, para medir ángulos.
 * El permiso (iPhone) debe pedirse dentro de un toque del usuario: por eso `encender` se llama desde un botón.
 */
export function useGravedad() {
  const [estado, setEstado] = useState<EstadoSensor>("apagado");
  const [g, setG] = useState<Gravedad | null>(null);
  const suave = useRef<Gravedad | null>(null);
  const llego = useRef(false);

  const apagar = useCallback(() => { setEstado("apagado"); setG(null); suave.current = null; llego.current = false; }, []);

  const encender = useCallback(async () => {
    if (typeof DeviceMotionEvent === "undefined") { setEstado("no-disponible"); return; }
    setEstado("pidiendo");
    try {
      const pedir = (DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission;
      if (typeof pedir === "function" && (await pedir.call(DeviceMotionEvent)) !== "granted") { setEstado("denegado"); return; }
    } catch { setEstado("denegado"); return; }
    llego.current = false;
    setEstado("activo");
  }, []);

  useEffect(() => {
    if (estado !== "activo") return;
    const alMover = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      if (!a || a.x == null || a.y == null || a.z == null) return;
      llego.current = true;
      const k = 0.25; // suavizado: cada lectura pesa 25 %
      const p = suave.current;
      suave.current = p ? { x: p.x + k * (a.x - p.x), y: p.y + k * (a.y - p.y), z: p.z + k * (a.z - p.z) } : { x: a.x, y: a.y, z: a.z };
      setG({ ...suave.current });
    };
    window.addEventListener("devicemotion", alMover);
    // Sin lecturas en 2 s = el equipo no tiene sensor (computador) o el navegador lo bloquea
    const t = window.setTimeout(() => { if (!llego.current) setEstado("no-disponible"); }, 2000);
    return () => { window.removeEventListener("devicemotion", alMover); window.clearTimeout(t); };
  }, [estado]);

  return { estado, g, encender, apagar };
}

/** Vista previa de la cámara trasera con mira, para apuntar a la copa. Falla en silencio si no hay permiso. */
export function useCamara(activa: boolean) {
  const video = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!activa) return;
    let flujo: MediaStream | null = null;
    let cancelado = false;
    (async () => {
      try {
        flujo = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        if (cancelado) { flujo.getTracks().forEach(t => t.stop()); return; }
        if (video.current) { video.current.srcObject = flujo; void video.current.play().catch(() => undefined); }
      } catch { setError(true); }
    })();
    return () => { cancelado = true; flujo?.getTracks().forEach(t => t.stop()); };
  }, [activa]);
  return { video, error };
}
