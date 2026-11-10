import { useEffect, useState, type ReactNode } from "react";

export function Campo({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <div className={"campo" + (error ? " con-error" : "")}>
      <span className="etq">{label}</span>
      {children}
      {hint && !error && <small className="muted">{hint}</small>}
      {error && <small className="error" role="alert">{error}</small>}
    </div>
  );
}

/** Grupo de botones grandes (una sola opcion). */
export function Segmentado<T extends string | boolean>({
  label, value, options, onChange, error, hint, onClear,
}: {
  label: string; value: T | null; error?: string; hint?: string;
  options: { value: T; label: string }[]; onChange: (v: T) => void;
  /** Para campos opcionales: tocar de nuevo la opcion elegida la quita. */
  onClear?: () => void;
}) {
  return (
    <Campo label={label} error={error} hint={hint}>
      <div className="seg" role="radiogroup" aria-label={label}>
        {options.map(o => (
          <button type="button" key={String(o.value)} role="radio" aria-checked={value === o.value}
            className={value === o.value ? "on" : ""} onClick={() => (onClear && value === o.value ? onClear() : onChange(o.value))}>
            {o.label}
          </button>
        ))}
      </div>
    </Campo>
  );
}

/** Numero decimal con coma o punto; null cuando esta vacio. */
export function NumInput({
  label, value, onChange, error, unidad, hint,
}: { label: string; value: number | null; onChange: (v: number | null) => void; error?: string; unidad?: string; hint?: string }) {
  const [txt, setTxt] = useState(value === null ? "" : String(value));
  useEffect(() => {
    // Sincroniza cuando el valor cambia desde fuera (GPS, reinicio del formulario)
    const actual = txt.trim() === "" ? null : Number(txt.replace(",", "."));
    if (actual !== value) setTxt(value === null ? "" : String(value));
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Campo label={unidad ? `${label} (${unidad})` : label} error={error} hint={hint}>
      <input inputMode="decimal" value={txt} placeholder="0"
        onChange={e => {
          const t = e.target.value;
          setTxt(t);
          const n = Number(t.replace(",", "."));
          onChange(t.trim() === "" || !Number.isFinite(n) ? null : n);
        }} />
    </Campo>
  );
}

export const SI_NO = [{ value: true, label: "Sí" }, { value: false, label: "No" }];
