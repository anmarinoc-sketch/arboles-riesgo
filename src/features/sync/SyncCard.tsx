import { Campo } from "../../components/controles";
import { usePendientes, useSync } from "./useSync";

export default function SyncCard() {
  const { cfg, setCfg, estado, enLinea, sincronizarAhora } = useSync();
  const pendientes = usePendientes();
  return (
    <section className="card">
      <h2>Sincronización (opcional)</h2>
      <p className="muted">
        La app funciona completa sin servidor: todo se guarda en este dispositivo. Si tienes un servidor propio,
        escribe su dirección y las evaluaciones nuevas se envían cuando haya señal. Las fotos no se envían.
        Exporta un CSV como copia de seguridad.
      </p>
      <Campo label="Dirección del servidor (POST)">
        <input type="url" inputMode="url" placeholder="https://…" value={cfg.url} onChange={e => setCfg({ ...cfg, url: e.target.value })} />
      </Campo>
      <Campo label="Token de acceso (opcional)" hint="Se guarda en este dispositivo, sin cifrar.">
        <input type="password" autoComplete="off" value={cfg.token} onChange={e => setCfg({ ...cfg, token: e.target.value })} />
      </Campo>
      <p className="muted">
        {enLinea ? "En línea" : "Sin conexión"} · {pendientes} evaluaciones sin sincronizar
      </p>
      <button className="grande" disabled={!cfg.url.trim() || !enLinea || estado.ocupado} onClick={sincronizarAhora}>
        {estado.ocupado ? "Sincronizando…" : "Sincronizar ahora"}
      </button>
      {estado.mensaje && <p className="muted" role="status">{estado.mensaje}</p>}
    </section>
  );
}
