import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import { descargar } from "../../lib/descargar";
import { leerRespaldoZip, nombreRespaldo, resumenRestauracion, type RespaldoLeido } from "../../lib/respaldo";
import { generarRespaldo, restaurarRespaldo } from "../../lib/respaldoDb";
import { contarSinRespaldar, describirAntiguedad, marcarRespaldo, useUltimoRespaldo } from "../../lib/ultimoRespaldo";

const TIPO_ZIP = "application/zip";

/** ¿Este navegador puede compartir un archivo (WhatsApp, Drive, correo) desde la hoja de compartir? */
function puedeCompartir(): boolean {
  try { return typeof navigator.canShare === "function" && navigator.canShare({ files: [new File([""], "x.zip", { type: TIPO_ZIP })] }); }
  catch { return false; }
}

export default function RespaldoCard() {
  const evals = useLiveQuery(() => db.evaluaciones.toArray(), []) ?? [];
  const nFotos = useLiveQuery(() => db.fotos.count(), []) ?? 0;
  const ultimo = useUltimoRespaldo();
  const sin = contarSinRespaldar(evals, ultimo);
  const [ocupado, setOcupado] = useState(false);
  const [msg, setMsg] = useState<{ texto: string; error?: boolean } | null>(null);
  const [leido, setLeido] = useState<{ nombre: string; datos: RespaldoLeido } | null>(null);
  const [reemplazar, setReemplazar] = useState(false);
  const [existentes, setExistentes] = useState<Set<string>>(new Set()); // codigos que ya hay, leidos al elegir el archivo
  const [ajustes, setAjustes] = useState(true);
  const compartir = useMemo(puedeCompartir, []);

  async function crear(): Promise<File | null> {
    setOcupado(true); setMsg(null);
    try {
      const { zip } = await generarRespaldo();
      return new File([zip as BlobPart], nombreRespaldo(), { type: TIPO_ZIP });
    } catch (e) {
      setMsg({ texto: `No se pudo crear el respaldo: ${(e as Error).message}`, error: true });
      return null;
    } finally { setOcupado(false); }
  }

  async function bajar() {
    const f = await crear();
    if (!f) return;
    descargar(f, f.name, TIPO_ZIP);
    marcarRespaldo();
    setMsg({ texto: `Respaldo descargado (${f.name}). Guárdalo fuera del celular: envíalo a tu correo o a Drive.` });
  }

  async function enviar() {
    const f = await crear();
    if (!f) return;
    try {
      await navigator.share({ files: [f], title: "Respaldo de Árboles en Riesgo" });
      marcarRespaldo();
      setMsg({ texto: "Respaldo compartido." });
    } catch (e) {
      if ((e as Error).name !== "AbortError") setMsg({ texto: "No se pudo compartir. Prueba con «Descargar»." , error: true });
    }
  }

  async function elegir(file: File | undefined) {
    setMsg(null); setLeido(null);
    if (!file) return;
    try {
      const datos = leerRespaldoZip(new Uint8Array(await file.arrayBuffer()));
      setExistentes(new Set((await db.evaluaciones.toArray()).map(e => e.codigo)));
      setLeido({ nombre: file.name, datos });
    } catch (e) {
      setMsg({ texto: (e as Error).message, error: true });
    }
  }

  const plan = leido ? resumenRestauracion(leido.datos.respaldo, existentes, reemplazar) : null;

  async function restaurar() {
    if (!leido) return;
    if (reemplazar && plan && plan.yaExisten > 0 &&
      !confirm(`Se reemplazarán ${plan.yaExisten} evaluaciones que ya existen en este dispositivo con las del respaldo. ¿Continuar?`)) return;
    setOcupado(true);
    try {
      const r = await restaurarRespaldo(leido.datos, { reemplazar, ajustes });
      setMsg({ texto: `Restaurado: ${r.agregadas} evaluaciones nuevas${r.reemplazadas ? `, ${r.reemplazadas} reemplazadas` : ""}${r.omitidas ? `, ${r.omitidas} omitidas (ya existían)` : ""}, ${r.fotos} fotos${r.ajustesAplicados ? ` y el catálogo (${r.especies} especies) con los ajustes` : ""}.` });
      setLeido(null);
    } catch (e) {
      setMsg({ texto: `No se pudo restaurar: ${(e as Error).message}`, error: true });
    } finally { setOcupado(false); }
  }

  return (
    <section className="card">
      <h2>Copia de seguridad completa</h2>
      <p className="muted">
        Un solo archivo con todas tus evaluaciones, las <b>fotos</b>, el catálogo de especies y los ajustes. Sirve para no perder
        nada y para pasar todo a otro celular. Guárdalo fuera del dispositivo (correo, Drive, WhatsApp).
      </p>
      <p className="muted">
        {evals.length} evaluaciones y {nFotos} fotos en este dispositivo · Última copia: <b>{describirAntiguedad(ultimo)}</b>
      </p>
      {evals.length > 0 && sin > 0 && (
        <p className="alerta">Tienes {sin} {sin === 1 ? "evaluación" : "evaluaciones"} sin respaldar desde la última copia.</p>
      )}
      <button className="grande" disabled={ocupado || evals.length === 0} onClick={bajar}>
        {ocupado ? "Preparando…" : "Descargar respaldo completo (.zip)"}
      </button>
      {compartir && (
        <button className="secundario" disabled={ocupado || evals.length === 0} onClick={enviar}>Compartir respaldo…</button>
      )}

      <h3>Restaurar desde un respaldo</h3>
      <p className="muted">Elige el archivo .zip que descargaste. Las evaluaciones que ya existen no se duplican.</p>
      <label className="boton-archivo">
        📦 Elegir respaldo (.zip)
        <input type="file" accept=".zip,application/zip" hidden onChange={e => { elegir(e.target.files?.[0]); e.target.value = ""; }} />
      </label>

      {leido && plan && (
        <div className="decision">
          <p>
            <b>{leido.nombre}</b><br />
            {leido.datos.respaldo.creado && <>Hecho el {new Date(leido.datos.respaldo.creado).toLocaleString("es-CO")}. </>}
            Trae {leido.datos.respaldo.evaluaciones.length} evaluaciones, {leido.datos.respaldo.fotos.length} fotos y {leido.datos.respaldo.especies.length} especies.
          </p>
          <p className="muted">
            Se agregarían {plan.nuevas} nuevas
            {plan.yaExisten > 0 && <> · {plan.yaExisten} ya existen y {reemplazar ? "se reemplazarían" : "se omitirían"}</>}.
          </p>
          {plan.yaExisten > 0 && (
            <label className="casilla"><input type="checkbox" checked={reemplazar} onChange={e => setReemplazar(e.target.checked)} />
              <span>Reemplazar las que ya existen con las del respaldo</span></label>
          )}
          <label className="casilla"><input type="checkbox" checked={ajustes} onChange={e => setAjustes(e.target.checked)} />
            <span>Restaurar también el catálogo de especies y los ajustes (umbrales y método de vulnerabilidad)</span></label>
          {leido.datos.avisos.length > 0 && (
            <ul className="errores-import">{leido.datos.avisos.slice(0, 20).map(a => <li key={a}>{a}</li>)}</ul>
          )}
          <button className="grande" disabled={ocupado || plan.aplicadas === 0 && !ajustes} onClick={restaurar}>
            {ocupado ? "Restaurando…" : `Restaurar ${plan.aplicadas} evaluaciones`}
          </button>
          <button className="secundario" onClick={() => setLeido(null)}>Cancelar</button>
        </div>
      )}
      {msg && <p className={msg.error ? "error banner" : "ok"} role="status">{msg.texto}</p>}
    </section>
  );
}
