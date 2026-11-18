import type { ReactNode } from "react";
import { Campo } from "./controles";

/** Dos tarjetas grandes con dibujo y criterios para elegir «Bueno» o «Malo» (una sola opción). */
export function EstadoIlustrado({ label, value, onChange, error, dibujo, criterios }: {
  label: string; value: "bueno" | "malo" | null; onChange: (v: "bueno" | "malo") => void; error?: string;
  dibujo: (v: "bueno" | "malo") => ReactNode;
  criterios: { bueno: readonly string[]; malo: readonly string[] };
}) {
  return (
    <Campo label={label} error={error} hint="Mira los dibujos y los criterios; elige el que más se parezca a lo que ves.">
      <div className="op-ilus" role="radiogroup" aria-label={label}>
        {(["bueno", "malo"] as const).map(v => (
          <button type="button" key={v} role="radio" aria-checked={value === v} className={"op-tarjeta " + v + (value === v ? " on" : "")} onClick={() => onChange(v)}>
            {dibujo(v)}
            <b>{v === "bueno" ? "Buen estado" : "Mal estado"}</b>
            <ul>{criterios[v].map(c => <li key={c}>{c}</li>)}</ul>
          </button>
        ))}
      </div>
    </Campo>
  );
}

/** Señales de alerta: cuadrícula de tarjetas con dibujo y «qué buscar»; se activan varias. */
export function SenalesIlustradas({ senales, activas, onToggle, dibujo, info }: {
  senales: readonly string[]; activas: string[]; onToggle: (s: string) => void;
  dibujo: (s: string) => ReactNode; info: Record<string, { corto: string; buscar: string }>;
}) {
  return (
    <div className="senales-grid">
      {senales.map(s => {
        const on = activas.includes(s);
        return (
          <div key={s} className={"senal-tarjeta" + (on ? " on" : "")}>
            <button type="button" aria-pressed={on} aria-label={s} onClick={() => onToggle(s)} className="senal-boton">
              {dibujo(s)}
              <span className="senal-nombre">{on ? "✓ " : ""}{info[s]?.corto ?? s}</span>
            </button>
            <details className="senal-detalle">
              <summary>Qué buscar</summary>
              <p>{info[s]?.buscar}</p>
            </details>
          </div>
        );
      })}
    </div>
  );
}
