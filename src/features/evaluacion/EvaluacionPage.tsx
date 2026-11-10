import { useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import {
  CATEGORIAS_DIAMETRICAS, OPCIONES_INVENTARIO, aEntrada, calcularRiesgo, formVacio, resolverSp, validarForm,
  type FormEvaluacion,
} from "../../engine";
import { Campo, NumInput, SI_NO, Segmentado } from "../../components/controles";
import { comprimirFoto, fracc } from "../../lib/util";
import { wgs84AOrigenNacional } from "../../lib/coordenadas";
import { categorizarActual, useCategorias } from "../../lib/categorias";
import ResultadoPanel from "./ResultadoPanel";
import SelectorPunto from "../mapa/SelectorPunto";
import { fmt } from "../../lib/util";

const ETIQUETAS = {
  habito: "Hábito", madurez: "Madurez", origen: "Origen", fustes: "Fustes", fenologia: "Fenología",
  estadoFitosanitario: "Estado fitosanitario y estructural", prioridad: "Prioridad de intervención",
  tratamientoRealizado: "Tratamiento realizado", interferencia: "Interferencia con redes o mobiliario",
} as const;

const KEY_EVALUADOR = "arboles.evaluador";
const leerEvaluador = () => { try { return localStorage.getItem(KEY_EVALUADOR) ?? ""; } catch { return ""; } };
const guardarEvaluador = (v: string) => { try { localStorage.setItem(KEY_EVALUADOR, v); } catch { /* sin almacenamiento */ } };

const KEY_ZONA = "arboles.zona";
const leerZona = () => { try { return localStorage.getItem(KEY_ZONA) ?? ""; } catch { return ""; } };
const guardarZona = (v: string) => { try { localStorage.setItem(KEY_ZONA, v); } catch { /* sin almacenamiento */ } };

// Evaluador y zona se recuerdan entre árboles: lo normal es evaluar varios seguidos en el mismo sitio
const nuevoForm = (): FormEvaluacion => ({ ...formVacio(), evaluador: leerEvaluador(), zona: leerZona() });

export default function EvaluacionPage() {
  const catalogo = useLiveQuery(() => db.especies.toArray(), []) ?? [];
  const [form, setForm] = useState<FormEvaluacion>(nuevoForm);
  const [fotos, setFotos] = useState<{ blob: Blob; nombre: string; url: string }[]>([]);
  const [intentado, setIntentado] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [gps, setGps] = useState("");
  const [mapaAbierto, setMapaAbierto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);

  const set = (c: Partial<FormEvaluacion>) => setForm(f => ({ ...f, ...c }));

  const entrada = useMemo(() => aEntrada(form, catalogo), [form, catalogo]);
  const resultado = useMemo(() => (entrada ? calcularRiesgo(entrada) : null), [entrada]);
  const categorias = useCategorias(); // vuelve a calcular si cambian los umbrales
  const categoria = useMemo(() => (resultado ? categorizarActual(resultado.porcentaje) : null), [resultado, categorias]);
  const errores = useMemo(() => validarForm(form, categoria?.id), [form, categoria]);
  const ver = (k: keyof FormEvaluacion) => (intentado ? errores[k] : undefined);
  const sp = resolverSp(form.especie, catalogo);
  const plano = wgs84AOrigenNacional(form.lat, form.lon); // solo dentro de Colombia
  // Familia y origen se repiten por especie: se ofrecen los de la ultima evaluacion de la misma especie
  const [sugerencia, setSugerencia] = useState<{ familia: string; origen: FormEvaluacion["origen"] } | null>(null);
  useEffect(() => {
    const e = form.especie.trim();
    if (!e) return setSugerencia(null);
    let vivo = true;
    db.evaluaciones.where("especie").equalsIgnoreCase(e).reverse().sortBy("creada").then(rs => {
      const r = rs.find(x => x.form.familia || x.form.origen);
      if (vivo) setSugerencia(r ? { familia: r.form.familia, origen: r.form.origen } : null);
    });
    return () => { vivo = false; };
  }, [form.especie]);
  const enCatalogo = catalogo.some(e => e.cientifico.trim().toLowerCase() === form.especie.trim().toLowerCase());

  useEffect(() => () => fotos.forEach(f => URL.revokeObjectURL(f.url)), []); // eslint-disable-line react-hooks/exhaustive-deps

  function ubicar() {
    if (!navigator.geolocation) return setGps("Este dispositivo no ofrece GPS.");
    setGps("Buscando señal GPS…");
    navigator.geolocation.getCurrentPosition(
      p => {
        set({ lat: Number(p.coords.latitude.toFixed(6)), lon: Number(p.coords.longitude.toFixed(6)) });
        setGps(`Precisión ±${Math.round(p.coords.accuracy)} m`);
      },
      e => setGps(e.code === 1 ? "Permiso de ubicación denegado." : "No se pudo obtener la ubicación."),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  }

  async function agregarFotos(files: FileList | null) {
    if (!files) return;
    const nuevas: { blob: Blob; nombre: string; url: string }[] = [];
    for (const f of Array.from(files)) {
      const blob = await comprimirFoto(f);
      nuevas.push({ blob, nombre: f.name || "foto.jpg", url: URL.createObjectURL(blob) });
    }
    setFotos(a => [...a, ...nuevas]);
  }

  async function guardar() {
    setIntentado(true);
    setMensaje(null);
    if (Object.keys(errores).length > 0 || !resultado || !categoria) {
      setMensaje({ tipo: "error", texto: `Faltan datos obligatorios (${Object.keys(errores).length}). Revisa los campos marcados.` });
      setTimeout(() => raiz.current?.querySelector(".con-error")?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
      return;
    }
    const codigo = form.codigo.trim();
    if ((await db.evaluaciones.where("codigo").equals(codigo).count()) > 0) {
      setMensaje({ tipo: "error", texto: `Ya existe una evaluación con el código ${codigo}.` });
      return;
    }
    const ahora = Date.now();
    await db.transaction("rw", db.evaluaciones, db.fotos, async () => {
      const id = await db.evaluaciones.add({
        codigo, especie: form.especie.trim(), catDiametrica: form.catDiametrica!, categoriaId: categoria.id,
        categoriaNombre: categoria.nombre, creada: ahora, actualizada: ahora, sincronizada: 0,
        form: { ...form, codigo, especie: form.especie.trim() }, resultado,
      });
      for (const f of fotos) await db.fotos.add({ evaluacionId: id, nombre: f.nombre, blob: f.blob });
    });
    guardarEvaluador(form.evaluador.trim());
    guardarZona(form.zona.trim());
    fotos.forEach(f => URL.revokeObjectURL(f.url));
    setFotos([]);
    setForm({ ...nuevoForm(), evaluador: form.evaluador.trim(), zona: form.zona.trim() });
    setIntentado(false);
    setGps("");
    setMensaje({ tipo: "ok", texto: `Evaluación ${codigo} guardada (${categoria.nombre}, ${fmt(resultado.porcentaje, 1)} %).` });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const ESTADO_EG = [{ value: "bueno" as const, label: "Bueno" }, { value: "regular-malo" as const, label: "Regular o malo" }];
  const ESTADO = [{ value: "bueno" as const, label: "Bueno" }, { value: "malo" as const, label: "Malo" }];

  return (
    <div ref={raiz}>
      <div className="barra-riesgo" style={{ background: categoria?.color ?? "var(--card)", color: categoria ? "#fff" : "var(--muted)" }}>
        {categoria && resultado
          ? <><strong>{categoria.nombre}</strong><span>{fmt(resultado.porcentaje, 1)} %</span></>
          : <span>Riesgo: completa las variables</span>}
      </div>

      {mensaje && <p className={mensaje.tipo === "ok" ? "ok" : "error banner"} role="status">{mensaje.texto}</p>}

      <section className="card">
        <h2>Identificación</h2>
        <Campo label="Código del árbol" error={ver("codigo")}
          hint="Sugerencia: inicial de la zona + número de parque + consecutivo, p. ej. SD2_1">
          <input value={form.codigo} onChange={e => set({ codigo: e.target.value })} autoCapitalize="characters" />
        </Campo>
        <Campo label="Especie" error={ver("especie")}
          hint={form.especie.trim() ? `Sp volcamiento ${fracc(sp.spVolcamiento)} · Sp caída de ramas ${fracc(sp.spCaidaRamas)}${enCatalogo ? " (catálogo)" : " (sin información)"}` : "Escribe y elige del catálogo"}>
          <input list="lista-especies" value={form.especie} onChange={e => set({ especie: e.target.value })} />
          <datalist id="lista-especies">
            <option value="Indeterminado" />
            {catalogo.map(e => <option key={e.id} value={e.cientifico}>{e.comun}</option>)}
          </datalist>
        </Campo>
        <Campo label="Evaluador" error={ver("evaluador")}>
          <input value={form.evaluador} onChange={e => set({ evaluador: e.target.value })} />
        </Campo>
        <Campo label="Zona o proyecto (opcional)" hint="Municipio, barrio, parque o proyecto. No entra en el cálculo.">
          <input value={form.zona} onChange={e => set({ zona: e.target.value })} />
        </Campo>
        <Campo label="Fecha" error={ver("fecha")}>
          <input type="date" value={form.fecha} onChange={e => set({ fecha: e.target.value })} />
        </Campo>
      </section>

      <section className="card">
        <h2>Ubicación</h2>
        <button type="button" className="grande" onClick={ubicar}>📍 Usar mi ubicación (GPS)</button>
        <button type="button" className="secundario" onClick={() => setMapaAbierto(true)}>🗺️ Elegir punto en el mapa</button>
        {gps && <p className="muted">{gps}</p>}
        {mapaAbierto && (
          <SelectorPunto
            inicial={form.lat !== null && form.lon !== null ? { lat: form.lat, lon: form.lon } : null}
            onCerrar={() => setMapaAbierto(false)}
            onConfirmar={(lat, lon) => { set({ lat, lon }); setGps("Punto elegido en el mapa"); setMapaAbierto(false); }} />
        )}
        <NumInput label="Latitud" value={form.lat} onChange={lat => set({ lat })} error={ver("lat")} hint="Grados decimales, WGS84" />
        <NumInput label="Longitud" value={form.lon} onChange={lon => set({ lon })} error={ver("lon")} />
        {plano && <p className="muted">MAGNA Origen Nacional: X {plano.x.toFixed(2).replace(".", ",")} · Y {plano.y.toFixed(2).replace(".", ",")}</p>}
      </section>

      <section className="card">
        <h2>Árbol</h2>
        <NumInput label="DAP" unidad="cm" value={form.dap} onChange={dap => set({ dap })} error={ver("dap")}
          hint="A 1,30 m. En pendiente o inclinado, desde el lado más cercano al suelo; con bambas o heridas, en el punto óptimo de medición" />
        <Segmentado label="Categoría diamétrica" value={form.catDiametrica} error={ver("catDiametrica")}
          options={CATEGORIAS_DIAMETRICAS.map(c => ({ value: c, label: c }))} onChange={catDiametrica => set({ catDiametrica })} />
        <NumInput label="Altura total" unidad="m" value={form.alturaArbolM} onChange={alturaArbolM => set({ alturaArbolM })}
          error={ver("alturaArbolM")} hint="Menos de 10 m = 1/3 · 10 a 20 m = 2/3 · más de 20 m = 1" />
      </section>

      <section className="card">
        <h2>Inventario (opcional)</h2>
        <p className="muted">Datos de la ficha técnica del individuo. No entran en el cálculo del riesgo. Toca de nuevo una opción para quitarla.</p>
        <Campo label="Familia botánica">
          <input value={form.familia} onChange={e => set({ familia: e.target.value })} />
        </Campo>
        {sugerencia && (!form.familia || !form.origen) && (sugerencia.familia !== form.familia || sugerencia.origen !== form.origen) && (
          <button type="button" className="secundario"
            onClick={() => set({ familia: form.familia || sugerencia.familia, origen: form.origen ?? sugerencia.origen })}>
            Usar datos de la última vez: {[sugerencia.familia, sugerencia.origen].filter(Boolean).join(" · ")}
          </button>
        )}
        {(["habito", "madurez", "origen", "fustes"] as const).map(k => (
          <Segmentado key={k} label={ETIQUETAS[k]} value={form[k]} onClear={() => set({ [k]: null })}
            options={OPCIONES_INVENTARIO[k].map(o => ({ value: o, label: o }))} onChange={v => set({ [k]: v })} />
        ))}
        <NumInput label="Diámetro de copa" unidad="m" value={form.diametroCopaM} onChange={diametroCopaM => set({ diametroCopaM })} error={ver("diametroCopaM")} />
        {(["fenologia", "estadoFitosanitario", "prioridad", "tratamientoRealizado", "interferencia"] as const).map(k => (
          <Segmentado key={k} label={ETIQUETAS[k]} value={form[k]} onClear={() => set({ [k]: null })}
            hint={k === "estadoFitosanitario" ? "Estado fitosanitario y estructural del individuo en la visita" : undefined}
            options={OPCIONES_INVENTARIO[k].map(o => ({ value: o, label: o }))} onChange={v => set({ [k]: v })} />
        ))}
        <Segmentado label="Tomografía realizada" value={form.tomografia} options={SI_NO} onClear={() => set({ tomografia: null })}
          onChange={tomografia => set({ tomografia })} />
        <Campo label="Tratamiento o intervención recomendada">
          <textarea rows={2} value={form.recomendacion} onChange={e => set({ recomendacion: e.target.value })} />
        </Campo>
      </section>

      <section className="card">
        <h2>Amenaza · Volcamiento (Vo)</h2>
        <Segmentado label="Estado general del árbol" value={form.estadoGeneral} options={ESTADO_EG} error={ver("estadoGeneral")}
          hint="Daño mecánico, estado fitosanitario, plagas" onChange={estadoGeneral => set({ estadoGeneral })} />
        <NumInput label="Inclinación respecto a la vertical" unidad="°" value={form.inclinacionGrados}
          onChange={inclinacionGrados => set({ inclinacionGrados })} error={ver("inclinacionGrados")} hint="Hasta 30° = 0 · más de 30° = 1" />
      </section>

      <section className="card">
        <h2>Amenaza · Caída de ramas (Cr)</h2>
        <p className="muted">Califica la rama más crítica del árbol.</p>
        <NumInput label="Diámetro de la rama" unidad="cm" value={form.ramaDiametroCm}
          onChange={ramaDiametroCm => set({ ramaDiametroCm })} error={ver("ramaDiametroCm")} hint="Menos de 5 cm = 0 · más de 5 cm = 1" />
        <Segmentado label="Estado de la rama" value={form.ramaEstado} options={ESTADO} error={ver("ramaEstado")}
          onChange={ramaEstado => set({ ramaEstado })} />
        <NumInput label="Altura de la rama" unidad="m" value={form.ramaAlturaM} onChange={ramaAlturaM => set({ ramaAlturaM })}
          error={ver("ramaAlturaM")} hint="Menos de 5 m = 0 · más de 5 m = 1" />
      </section>

      <section className="card">
        <h2>Amenaza · Raíces (Ra)</h2>
        <Segmentado label="Estado de las raíces" value={form.raices} options={ESTADO} error={ver("raices")}
          onChange={raices => set({ raices })} />
      </section>

      <section className="card">
        <h2>Vulnerabilidad (V)</h2>
        <p className="muted">Si hay al menos un elemento expuesto, V = 1.</p>
        <Segmentado label="Personas que transitan, permanecen o viven cerca" value={form.personas} options={SI_NO} error={ver("personas")} onChange={personas => set({ personas })} />
        <Segmentado label="Vehículos" value={form.vehiculos} options={SI_NO} error={ver("vehiculos")} onChange={vehiculos => set({ vehiculos })} />
        <Segmentado label="Construcciones cercanas" value={form.construcciones} options={SI_NO} error={ver("construcciones")} onChange={construcciones => set({ construcciones })} />
        <Segmentado label="Redes aéreas cerca de copa, ramas o fuste" value={form.redesAereas} options={SI_NO} error={ver("redesAereas")}
          hint="Las redes subterráneas no cuentan" onChange={redesAereas => set({ redesAereas })} />
      </section>

      <section className="card">
        <h2>Datos descriptivos (opcional)</h2>
        <p className="muted">No entran en el cálculo: según el numeral 3.7.5 no fueron estadísticamente significativos.</p>
        <Campo label="Pendiente"><input value={form.pendiente} onChange={e => set({ pendiente: e.target.value })} placeholder="p. ej. 15 % o plano" /></Campo>
        <Campo label="Sitio de siembra"><input value={form.sitioSiembra} onChange={e => set({ sitioSiembra: e.target.value })} placeholder="p. ej. andén, separador, talud" /></Campo>
        <Campo label="Diagnóstico u observaciones" hint="Daño mecánico, inclinación, raíces expuestas, ramas quebradas, plagas…">
          <textarea rows={3} value={form.observaciones} onChange={e => set({ observaciones: e.target.value })} />
        </Campo>
      </section>

      <section className="card">
        <h2>Fotos</h2>
        <label className="boton-archivo">
          📷 Tomar o elegir fotos
          <input type="file" accept="image/*" capture="environment" multiple hidden
            onChange={e => { agregarFotos(e.target.files); e.target.value = ""; }} />
        </label>
        <div className="fotos">
          {fotos.map((f, i) => (
            <figure key={f.url}>
              <img src={f.url} alt={`Foto ${i + 1}`} />
              <button type="button" aria-label={`Quitar foto ${i + 1}`}
                onClick={() => { URL.revokeObjectURL(f.url); setFotos(a => a.filter(x => x !== f)); }}>✕</button>
            </figure>
          ))}
        </div>
      </section>

      <ResultadoPanel resultado={resultado} categoria={categoria} form={form} errores={intentado ? errores : {}} set={set} />

      <button className="grande" onClick={guardar}>Guardar evaluación</button>
    </div>
  );
}
