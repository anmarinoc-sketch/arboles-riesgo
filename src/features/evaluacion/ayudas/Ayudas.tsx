import { useEffect, useState, type ReactNode } from "react";
import { LIMITES } from "../../../engine";
import {
  LARGO_PASO_DEFECTO_M, alturaPorAngulos, anguloDesdeVertical, diametroDesdeCircunferencia, distanciaPorPasos,
  elevacionCamara, inclinacionPorPlomada, redondear, separacionParaAngulo,
} from "../../../lib/medicion";
import { DiagramaMedicion } from "../../../components/Ilustraciones";
import { useCamara, useGravedad } from "./useGravedad";

/** Número con coma o punto → number, o null si está vacío o no es válido. */
const aNumero = (t: string): number | null => {
  const n = Number(t.trim().replace(",", "."));
  return t.trim() === "" || !Number.isFinite(n) ? null : n;
};
const coma = (n: number, d = 1) => redondear(n, d).toString().replace(".", ",");

function Plegable({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <details className="ayuda">
      <summary>📏 {titulo}</summary>
      <div className="ayuda-cuerpo">{children}</div>
    </details>
  );
}

function Entrada({ etq, valor, onCambia, unidad, ph }: { etq: string; valor: string; onCambia: (v: string) => void; unidad: string; ph?: string }) {
  return (
    <label className="ayuda-campo">
      <span>{etq} ({unidad})</span>
      <input inputMode="decimal" value={valor} placeholder={ph ?? "0"} onChange={e => onCambia(e.target.value)} />
    </label>
  );
}

function Resultado({ texto, onUsar, etiqueta = "Usar este valor" }: { texto: string; onUsar?: () => void; etiqueta?: string }) {
  return (
    <div className="ayuda-resultado" role="status">
      <b>{texto}</b>
      {onUsar && <button type="button" className="grande" onClick={onUsar}>{etiqueta}</button>}
    </div>
  );
}

/** Pasos → metros, con el largo de paso guardado en el dispositivo. */
function useLargoPaso() {
  const [largo, setLargo] = useState(() => {
    try { const v = Number(localStorage.getItem("arboles.largoPaso")); return v > 0.3 && v < 1.5 ? v : LARGO_PASO_DEFECTO_M; } catch { return LARGO_PASO_DEFECTO_M; }
  });
  useEffect(() => { try { localStorage.setItem("arboles.largoPaso", String(largo)); } catch { /* solo esta sesión */ } }, [largo]);
  return [largo, setLargo] as const;
}

function CalculadoraPasos({ onUsar }: { onUsar: (m: number) => void }) {
  const [pasos, setPasos] = useState("");
  const [largo, setLargo] = useLargoPaso();
  const [largoTxt, setLargoTxt] = useState(String(largo).replace(".", ","));
  const n = aNumero(pasos);
  const m = n !== null && n > 0 ? distanciaPorPasos(n, largo) : null;
  return (
    <div className="ayuda-bloque">
      <p><b>Con pasos</b> (sin cinta): camina hasta el punto contando pasos normales.</p>
      <Entrada etq="Pasos contados" valor={pasos} onCambia={setPasos} unidad="n.º" />
      <Entrada etq="Largo de tu paso" valor={largoTxt} unidad="m" ph="0,75" onCambia={t => {
        setLargoTxt(t); const v = aNumero(t); if (v !== null && v > 0.3 && v < 1.5) setLargo(v);
      }} />
      <small className="muted">Un adulto da pasos de 0,70 a 0,80 m. Para calibrarlo: camina 10 pasos y mide con cinta; divide entre 10.</small>
      {m !== null && <Resultado texto={`≈ ${coma(m)} m`} onUsar={() => onUsar(redondear(m, 1))} />}
    </div>
  );
}

/** Distancia del fuste a la construcción más cercana. */
export function AyudaDistancia({ onUsar, alturaArbolM }: { onUsar: (m: number) => void; alturaArbolM: number | null }) {
  return (
    <Plegable titulo="¿Cómo medir esta distancia?">
      <DiagramaMedicion tipo="distancia" />
      <ol>
        <li>Mide <b>en línea recta y en horizontal</b>, desde el <b>centro del fuste, al nivel del suelo</b>, hasta el <b>muro o fachada más cercano</b> (no hasta el techo ni el alero).</li>
        <li>Con cinta o decámetro es lo mejor. Si no hay, usa pasos (abajo).</li>
        <li>Lo que importa es compararla con la <b>altura del árbol</b>: si la distancia es menor que la altura, el árbol puede alcanzar la construcción al caer.{" "}
          {alturaArbolM !== null && <>Con {coma(alturaArbolM)} m de altura, el alcance es de {coma(alturaArbolM)} m.</>}
        </li>
      </ol>
      <CalculadoraPasos onUsar={onUsar} />
    </Plegable>
  );
}

/**
 * Mide la altura apuntando la cámara del celular: a la copa y al pie, desde una distancia conocida.
 * `tipo` solo cambia los textos; la geometría es la misma para el árbol y para el punto de la rama.
 */
export function AyudaAltura({ tipo, onUsar }: { tipo: "arbol" | "rama"; onUsar: (m: number) => void }) {
  const esArbol = tipo === "arbol";
  const [dist, setDist] = useState("");
  const [arriba, setArriba] = useState<number | null>(null);
  const [abajo, setAbajo] = useState<number | null>(null);
  const [manual, setManual] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const s = useGravedad();
  const cam = useCamara(s.estado === "activo");
  const elev = s.g ? elevacionCamara(s.g) : null;
  const d = aNumero(dist);
  const h = d !== null && d > 0 && arriba !== null && abajo !== null ? alturaPorAngulos(d, arriba, abajo) : NaN;
  const lista = Number.isFinite(h);
  const sinSensor = s.estado === "no-disponible" || s.estado === "denegado";
  const fijar = (poner: (v: number) => void) => { if (elev !== null) poner(elev); };

  return (
    <Plegable titulo={esArbol ? "¿Cómo medir la altura del árbol?" : "¿Cómo medir la altura de la rama?"}>
      <DiagramaMedicion tipo="altura" />
      <ol>
        <li>Aléjate del árbol, en terreno parejo, a una distancia parecida a su altura (así el ángulo no es tan extremo). Mide o cuenta pasos hasta el fuste.</li>
        <li>Escribe esa <b>distancia horizontal</b> aquí.</li>
        <li>Apunta la <b>cámara trasera</b> primero {esArbol ? "a la punta de la copa" : "al punto donde la rama sale del fuste, o a su parte más baja"} y toca <b>Fijar arriba</b>. Luego apunta <b>al pie del fuste</b> (al suelo, donde nace) y toca <b>Fijar abajo</b>.</li>
      </ol>
      <Entrada etq="Distancia hasta el fuste" valor={dist} onCambia={setDist} unidad="m" />
      <CalculadoraPasos onUsar={m => setDist(String(m).replace(".", ","))} />

      {!manual && s.estado === "apagado" && (
        <button type="button" className="secundario" onClick={() => { setAbierto(true); void s.encender(); }}>🎯 Medir con la cámara del celular</button>
      )}
      {s.estado === "pidiendo" && <p className="muted">Pidiendo permiso para el sensor…</p>}
      {sinSensor && (
        <p className="alerta">
          {s.estado === "denegado" ? "No diste permiso al sensor de movimiento. " : "Este equipo no entrega el sensor de movimiento (normal en computador). "}
          Usa el método manual de abajo o la altura estimada.
        </p>
      )}
      {s.estado === "activo" && abierto && (
        <div className="visor">
          {!cam.error && <video ref={cam.video} className="visor-video" playsInline muted aria-hidden />}
          <div className="mira" aria-hidden><span /></div>
          <div className="visor-dato" role="status">Ángulo: <b>{elev !== null ? `${coma(elev)}°` : "…"}</b></div>
        </div>
      )}
      {s.estado === "activo" && (
        <>
          <p className="muted">Mantén el celular <b>vertical</b> (no lo inclines de lado) y apunta la mira al punto.</p>
          <div className="ayuda-fila">
            <button type="button" className="secundario" disabled={elev === null} onClick={() => fijar(v => setArriba(v))}>
              ⬆ Fijar arriba{arriba !== null ? ` (${coma(arriba)}°)` : ""}
            </button>
            <button type="button" className="secundario" disabled={elev === null} onClick={() => fijar(v => setAbajo(v))}>
              ⬇ Fijar abajo{abajo !== null ? ` (${coma(abajo)}°)` : ""}
            </button>
          </div>
          <button type="button" className="enlace" onClick={() => { s.apagar(); setArriba(null); setAbajo(null); setAbierto(false); }}>Apagar la cámara</button>
        </>
      )}
      {lista && <Resultado texto={`Altura ≈ ${coma(h)} m`} onUsar={() => onUsar(redondear(h, 1))} />}
      {arriba !== null && abajo !== null && !lista && (
        <p className="alerta">Esas lecturas no dan una altura válida: «arriba» debe ser mayor que «abajo». Vuelve a fijarlas.</p>
      )}
      <p className="muted"><b>Medición con el celular:</b> da un error típico de ±1 a 2 m, más si el ángulo a la copa pasa de 60°. Si dudas entre dos rangos (10 m o 20 m), repite desde otro lado.</p>

      <details className="ayuda-sub" open={manual || sinSensor} onToggle={e => setManual((e.target as HTMLDetailsElement).open)}>
        <summary>Sin sensor: métodos manuales</summary>
        <ul>
          <li><b>Comparar con una persona:</b> una persona adulta mide ≈ 1,7 m. Pídele que se pare al pie y estima cuántas veces cabe hasta {esArbol ? "la copa" : "la rama"}. Cada piso de una casa suma ≈ 2,5 a 3 m.</li>
          <li><b>Sombra:</b> a la misma hora, mide con cinta la sombra del árbol y la de una vara de 1 m clavada derecha. Altura = sombra del árbol × (1 m ÷ sombra de la vara).</li>
          {esArbol
            ? <li><b>Cortes que importan:</b> solo necesitas saber si es <b>menor de 10 m</b>, <b>entre 10 y 20 m</b> o <b>mayor de 20 m</b>. 10 m son ≈ 3 pisos y 20 m ≈ 7 pisos.</li>
            : <li><b>Corte que importa:</b> solo necesitas saber si la rama está a <b>5 m o menos</b> o a <b>más de 5 m</b> (≈ 2 pisos).</li>}
        </ul>
      </details>
    </Plegable>
  );
}

/** Inclinación del fuste respecto a la vertical. */
export function AyudaInclinacion({ onUsar }: { onUsar: (grados: number) => void }) {
  const s = useGravedad();
  const [fija, setFija] = useState<number | null>(null);
  const [sep, setSep] = useState("");
  const ang = s.g ? anguloDesdeVertical(s.g) : null;
  const sepN = aNumero(sep);
  const desdePlomada = sepN !== null ? inclinacionPorPlomada(sepN) : NaN;
  const sinSensor = s.estado === "no-disponible" || s.estado === "denegado";
  const limite = LIMITES.inclinacionGrados;

  return (
    <Plegable titulo="¿Cómo medir la inclinación?">
      <DiagramaMedicion tipo="inclinacion" />
      <ol>
        <li>Ponte <b>de lado</b>: donde veas al árbol inclinarse hacia la izquierda o la derecha, no hacia ti ni de espaldas.</li>
        <li>Mide los <b>primeros 1,5 a 2 m del fuste</b> desde el suelo (no la copa ni una curva más arriba).</li>
        <li>Se compara con una <b>vertical verdadera</b>, no con una pared ni con el piso de una pendiente.</li>
      </ol>
      <p className="muted">Para que te hagas una idea: <b>{limite}°</b> es un árbol claramente caído; <b>45°</b> es la mitad entre parado y acostado; un árbol «un poquito torcido» suele estar por debajo de 15°.</p>

      <div className="ayuda-bloque">
        <p><b>Opción 1 · Con el celular</b>: apóyalo <b>de canto</b> contra el fuste, con el borde largo pegado a la corteza, y toca <b>Fijar</b> cuando el número se estabilice.</p>
        {s.estado === "apagado" && <button type="button" className="secundario" onClick={() => void s.encender()}>📐 Usar el sensor del celular</button>}
        {s.estado === "pidiendo" && <p className="muted">Pidiendo permiso para el sensor…</p>}
        {sinSensor && <p className="alerta">{s.estado === "denegado" ? "No diste permiso al sensor. " : "Este equipo no tiene sensor de movimiento. "}Usa la plomada (opción 2).</p>}
        {s.estado === "activo" && (
          <>
            <div className="ayuda-lectura" role="status" aria-live="off">{ang !== null && Number.isFinite(ang) ? `${coma(ang)}°` : "…"}</div>
            <button type="button" className="grande" disabled={ang === null || !Number.isFinite(ang)} onClick={() => ang !== null && setFija(redondear(ang, 0))}>
              Fijar esta lectura
            </button>
            <button type="button" className="enlace" onClick={() => { s.apagar(); }}>Apagar el sensor</button>
          </>
        )}
        {fija !== null && (
          <Resultado texto={`Inclinación ≈ ${fija}° (${fija > limite ? `más de ${limite}°: cuenta como inclinado` : `hasta ${limite}°: no cuenta como inclinado`})`} onUsar={() => onUsar(fija)} />
        )}
        <small className="muted">Si el celular tiene funda gruesa o queda separado de la corteza por una bamba, la lectura se corre unos grados. Repite 2 veces.</small>
      </div>

      <div className="ayuda-bloque">
        <p><b>Opción 2 · Con plomada</b> (sin sensor): cuelga unas llaves de un hilo desde un punto <b>a 1 m del suelo, junto al fuste</b>. Mide en <b>centímetros</b> cuánto se separa el fuste del hilo a esa altura.</p>
        <Entrada etq="Separación del fuste a 1 m de altura" valor={sep} onCambia={setSep} unidad="cm" />
        <small className="muted">Referencia a 1 m: {coma(separacionParaAngulo(limite), 0)} cm = {limite}° · 100 cm = 45° · 27 cm ≈ 15°.</small>
        {Number.isFinite(desdePlomada) && (
          <Resultado texto={`Inclinación ≈ ${coma(desdePlomada, 0)}°`} onUsar={() => onUsar(redondear(desdePlomada, 0))} />
        )}
      </div>
    </Plegable>
  );
}

/** Diámetro de la rama más crítica. */
export function AyudaDiametroRama({ onUsar }: { onUsar: (cm: number) => void }) {
  const [circ, setCirc] = useState("");
  const c = aNumero(circ);
  const d = c !== null && c > 0 ? diametroDesdeCircunferencia(c) : null;
  const lim = LIMITES.ramaDiametroCm;
  return (
    <Plegable titulo="¿Cómo medir el diámetro de la rama?">
      <DiagramaMedicion tipo="rama" />
      <ol>
        <li>Elige la rama <b>más crítica</b>: la más gruesa que esté seca, quebrada, mal unida o con hongos; si no hay ninguna así, la más gruesa y larga.</li>
        <li>Mídela <b>donde se une al fuste</b> (la base de la rama), no en la punta.</li>
        <li>Lo que importa es si pasa de <b>{lim} cm</b>.</li>
      </ol>
      <p className="muted"><b>Sin cinta:</b> {lim} cm es un poco menos que el lado corto de una tarjeta bancaria (5,4 cm), y menos que una lata de gaseosa (6,6 cm). El pulgar de un adulto mide ≈ 2 cm; un puño cerrado ≈ 8 a 9 cm.</p>
      <div className="ayuda-bloque">
        <p><b>Con cinta o cuerda:</b> rodea la rama, mide la <b>vuelta completa</b> (circunferencia) y la app calcula el diámetro.</p>
        <Entrada etq="Vuelta alrededor de la rama" valor={circ} onCambia={setCirc} unidad="cm" />
        {d !== null && <Resultado texto={`Diámetro ≈ ${coma(d)} cm (${d > lim ? `más de ${lim} cm` : `hasta ${lim} cm`})`} onUsar={() => onUsar(redondear(d, 1))} />}
        <small className="muted">Una vuelta de {coma(Math.PI * lim)} cm equivale a un diámetro de {lim} cm.</small>
      </div>
      <p className="muted">En palmas, mide el pecíolo o base de la fronda más crítica.</p>
    </Plegable>
  );
}

/** DAP desde la circunferencia a 1,30 m (CAP). */
export function AyudaDap({ onUsar }: { onUsar: (cm: number) => void }) {
  const [circ, setCirc] = useState("");
  const c = aNumero(circ);
  const d = c !== null && c > 0 ? diametroDesdeCircunferencia(c) : null;
  return (
    <Plegable titulo="¿Cómo medir el DAP?">
      <ol>
        <li>Marca <b>1,30 m</b> desde el suelo (a la altura del pecho de un adulto, aproximadamente).</li>
        <li>Rodea el fuste con la cinta o una cuerda a esa altura y mide la <b>vuelta completa</b>. Si usas cuerda, estírala sobre una regla.</li>
        <li>La app convierte la vuelta en diámetro (vuelta ÷ 3,1416).</li>
      </ol>
      <div className="ayuda-bloque">
        <Entrada etq="Vuelta del fuste a 1,30 m" valor={circ} onCambia={setCirc} unidad="cm" />
        {d !== null && <Resultado texto={`DAP ≈ ${coma(d)} cm`} onUsar={() => onUsar(redondear(d, 1))} />}
      </div>
    </Plegable>
  );
}
