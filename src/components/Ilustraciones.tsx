import type { ReactNode } from "react";

/**
 * Dibujos esquemáticos (no fotos) para reconocer en campo las señales de alerta, el estado de las raíces
 * y cómo se toman las medidas. Colores fijos sobre fondo claro para que se vean igual en tema claro u oscuro.
 */
const TRONCO = "#8d6e63", COPA = "#66bb6a", COPA_OSC = "#43a047", SUELO = "#c8b8a6", ALERTA = "#e53935", SECO = "#795548";

function Lienzo({ titulo, children, alto = 90 }: { titulo: string; children: ReactNode; alto?: number }) {
  return (
    <svg className="ilus" viewBox={`0 0 120 ${alto}`} role="img" aria-label={titulo} xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height={alto} fill="#eef6ee" />
      {children}
    </svg>
  );
}
const Suelo = () => <rect y="76" width="120" height="14" fill={SUELO} />;
const Copa = ({ cx = 60, cy = 26, r = 20, fill = COPA }: { cx?: number; cy?: number; r?: number; fill?: string }) => <circle cx={cx} cy={cy} r={r} fill={fill} />;
const Tronco = ({ x = 54, y = 30, w = 12, h = 48 }: { x?: number; y?: number; w?: number; h?: number }) => <rect x={x} y={y} width={w} height={h} rx="2" fill={TRONCO} />;

const SENALES: Record<string, (t: string) => ReactNode> = {
  "Inclinación pronunciada del fuste": t => (
    <Lienzo titulo={t}>
      <Suelo />
      <line x1="60" y1="8" x2="60" y2="78" stroke={ALERTA} strokeWidth="1.5" strokeDasharray="4 3" />
      <g transform="rotate(24 60 78)"><Tronco /><Copa /></g>
      <path d="M60 58a20 20 0 0 1 8 2" fill="none" stroke={ALERTA} strokeWidth="1.5" />
    </Lienzo>
  ),
  "Grietas en la base del suelo": t => (
    <Lienzo titulo={t}>
      <Suelo /><Tronco /><Copa />
      <g stroke={ALERTA} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M54 77l-10 4 6 3-14 3" /><path d="M66 77l12 3-5 3 15 4" /><path d="M60 78l1 6-3 4" />
      </g>
    </Lienzo>
  ),
  "Raíces levantadas, cortadas o expuestas": t => (
    <Lienzo titulo={t}>
      <Suelo /><Tronco /><Copa />
      <g fill="none" stroke={SECO} strokeWidth="5" strokeLinecap="round">
        <path d="M54 76q-8-6-20-2" /><path d="M66 76q8-8 22-2" /><path d="M58 77q-4 8-10 9" />
      </g>
      <path d="M26 76q8-6 14-2" stroke={SUELO} strokeWidth="3" fill="none" />
    </Lienzo>
  ),
  "Cuello del árbol tapado por sustrato": t => (
    <Lienzo titulo={t}>
      <Suelo /><Tronco /><Copa />
      <path d="M20 78q18-22 40-22t40 22z" fill="#a1887f" />
      <line x1="38" y1="52" x2="82" y2="52" stroke={ALERTA} strokeWidth="1.5" strokeDasharray="3 2" />
      <path d="M92 44l-8 6m8-6l-1 8" stroke={ALERTA} strokeWidth="1.5" fill="none" />
    </Lienzo>
  ),
  "Hongos": t => (
    <Lienzo titulo={t}>
      <Suelo /><Tronco /><Copa />
      <g fill="#ff9800" stroke="#e65100" strokeWidth="1"><path d="M66 50a10 5 0 0 1 14 0z" /><path d="M66 62a8 4 0 0 1 11 0z" /><path d="M54 66a8 4 0 0 0-11 0z" /></g>
    </Lienzo>
  ),
  "Cavidades, pudrición o huecos en el tronco": t => (
    <Lienzo titulo={t}>
      <Suelo /><Tronco /><Copa />
      <ellipse cx="60" cy="56" rx="4.5" ry="9" fill="#3e2723" /><ellipse cx="60" cy="56" rx="4.5" ry="9" fill="none" stroke={ALERTA} strokeWidth="1.5" />
    </Lienzo>
  ),
  "Ramas o frondas secas, quebradas o muertas": t => (
    <Lienzo titulo={t}>
      <Suelo /><Tronco />
      <Copa cx={48} cy={26} r={15} />
      <g stroke={SECO} strokeWidth="3" strokeLinecap="round" fill="none"><path d="M60 40l22-22" /><path d="M72 28l12 0" /><path d="M66 34l10 8" /><path d="M82 18l5-7" /></g>
      <path d="M72 27l6 5" stroke={ALERTA} strokeWidth="2" /><path d="M80 18l-3 6" stroke={ALERTA} strokeWidth="2" />
    </Lienzo>
  ),
  "Hojas o frondas faltantes": t => (
    <Lienzo titulo={t}>
      <Suelo /><Tronco />
      <g fill={COPA}><circle cx="45" cy="26" r="7" /><circle cx="75" cy="22" r="6" /><circle cx="60" cy="12" r="6" /><circle cx="52" cy="38" r="5" /></g>
      <g stroke={SECO} strokeWidth="2.5" fill="none" strokeLinecap="round"><path d="M60 34l-14-10" /><path d="M60 34l16-12" /><path d="M60 34l0-18" /></g>
    </Lienzo>
  ),
  "Corteza pelada": t => (
    <Lienzo titulo={t}>
      <Suelo /><Tronco /><Copa />
      <path d="M54 46h12v14l-5-3-3 4-4-3z" fill="#e0c9a6" /><path d="M54 46h12v14l-5-3-3 4-4-3z" fill="none" stroke={ALERTA} strokeWidth="1" strokeDasharray="2 2" />
    </Lienzo>
  ),
  "Manchas hinchadas o protuberancias": t => (
    <Lienzo titulo={t}>
      <Suelo /><Tronco /><Copa />
      <g fill="#a1887f" stroke={ALERTA} strokeWidth="1.2"><circle cx="54" cy="50" r="5" /><circle cx="67" cy="58" r="4.5" /><circle cx="54" cy="66" r="3.5" /></g>
    </Lienzo>
  ),
  "Hojas descoloridas": t => (
    <Lienzo titulo={t}>
      <Suelo /><Tronco /><Copa />
      <g fill="#fdd835"><circle cx="50" cy="22" r="7" /><circle cx="70" cy="30" r="6" /><circle cx="58" cy="12" r="5" /></g>
      <g fill="#c0ca33"><circle cx="64" cy="20" r="4" /><circle cx="46" cy="34" r="4" /></g>
    </Lienzo>
  ),
  "Abundancia de líquenes o epífitas": t => (
    <Lienzo titulo={t}>
      <Suelo /><Tronco /><Copa />
      <g fill="#9e9d8a"><ellipse cx="55" cy="50" rx="4" ry="3" /><ellipse cx="65" cy="58" rx="4" ry="3.5" /><ellipse cx="56" cy="66" rx="3" ry="3" /></g>
      <g stroke="#2e7d32" strokeWidth="2" strokeLinecap="round"><path d="M66 44l-3-8m3 8l1-9m-1 9l5-7" /></g>
    </Lienzo>
  ),
  "Podas inadecuadas": t => (
    <Lienzo titulo={t}>
      <Suelo /><Tronco y={22} h={56} />
      <g fill={TRONCO}><rect x="66" y="34" width="14" height="6" rx="1" /><rect x="40" y="44" width="14" height="6" rx="1" /><rect x="66" y="54" width="10" height="6" rx="1" /></g>
      <g fill="#f5e6c8" stroke={ALERTA} strokeWidth="1"><rect x="79" y="34" width="2.5" height="6" /><rect x="38" y="44" width="2.5" height="6" /><rect x="75" y="54" width="2.5" height="6" /></g>
      <path d="M52 22l8-8 8 8z" fill={COPA_OSC} />
    </Lienzo>
  ),
  "Plantas o amarres artificiales sobre el fuste": t => (
    <Lienzo titulo={t}>
      <Suelo /><Tronco /><Copa />
      <g stroke={ALERTA} strokeWidth="2.5" fill="none"><path d="M53 48l14 4" /><path d="M53 54l14 4" /><path d="M53 60l14 4" /></g>
      <path d="M67 62q16-4 14-22" stroke="#2e7d32" strokeWidth="2" fill="none" /><circle cx="81" cy="40" r="3" fill="#2e7d32" />
    </Lienzo>
  ),
};

/** Dibujo de una señal de alerta (por su texto exacto en SENALES_ALERTA). */
export function IlustracionSenal({ senal }: { senal: string }) {
  const f = SENALES[senal];
  return f ? <>{f(senal)}</> : null;
}

/** Raíces: buen estado y mal estado. */
export function IlustracionRaices({ estado }: { estado: "bueno" | "malo" }) {
  if (estado === "bueno") {
    return (
      <Lienzo titulo="Raíces en buen estado: bien ancladas, suelo firme y cuello visible">
        <Suelo /><Tronco x={54} y={30} w={12} h={46} /><Copa />
        <path d="M54 76q-6 0-9 2M66 76q6 0 9 2" stroke={TRONCO} strokeWidth="4" fill="none" strokeLinecap="round" />
        <g stroke="#a1887f" strokeWidth="2" fill="none" strokeLinecap="round"><path d="M56 80l-10 8M64 80l10 8M60 80v9" /></g>
        <path d="M20 76h20M80 76h20" stroke="#6d8f4e" strokeWidth="3" />
      </Lienzo>
    );
  }
  return (
    <Lienzo titulo="Raíces en mal estado: levantadas, cortadas, expuestas o con el suelo agrietado">
      <Suelo />
      <g transform="rotate(8 60 78)"><Tronco x={54} y={30} w={12} h={46} /><Copa /></g>
      <path d="M56 76q-14-10-30-2" stroke={SECO} strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M26 74l-5-5" stroke="#f5e6c8" strokeWidth="5" strokeLinecap="round" />
      <path d="M68 78q10-10 24-4" stroke={SECO} strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M88 78l5 8-4 2 7 2" stroke={ALERTA} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M44 82l-8 3 5 3" stroke={ALERTA} strokeWidth="2" fill="none" strokeLinecap="round" />
    </Lienzo>
  );
}

/** Esquemas de cómo se toma cada medida. */
export function DiagramaMedicion({ tipo }: { tipo: "distancia" | "altura" | "inclinacion" | "rama" }) {
  if (tipo === "distancia") {
    return (
      <Lienzo titulo="Medir en horizontal desde el centro del fuste, al nivel del suelo, hasta el muro más cercano">
        <Suelo /><Tronco x={24} y={30} w={9} h={48} /><Copa cx={28} cy={24} r={16} />
        <rect x="84" y="24" width="32" height="52" fill="#d7ccc8" stroke="#8d6e63" /><rect x="94" y="34" width="10" height="12" fill="#90caf9" />
        <line x1="30" y1="72" x2="84" y2="72" stroke={ALERTA} strokeWidth="2" />
        <path d="M30 72l5-3v6zM84 72l-5-3v6z" fill={ALERTA} />
        <text x="57" y="68" fontSize="8" textAnchor="middle" fill="#b71c1c">distancia</text>
      </Lienzo>
    );
  }
  if (tipo === "altura") {
    return (
      <Lienzo titulo="Medir la altura: desde una distancia conocida, apuntar a la copa y al pie del fuste">
        <Suelo /><Tronco x={90} y={30} w={9} h={48} /><Copa cx={94} cy={24} r={16} />
        <circle cx="16" cy="58" r="4" fill="#5d4037" /><rect x="14" y="62" width="4" height="14" fill="#5d4037" />
        <line x1="16" y1="58" x2="94" y2="12" stroke={ALERTA} strokeWidth="1.5" strokeDasharray="4 3" />
        <line x1="16" y1="58" x2="94" y2="78" stroke="#1565c0" strokeWidth="1.5" strokeDasharray="4 3" />
        <line x1="16" y1="58" x2="94" y2="58" stroke="#9e9e9e" strokeWidth="1" />
        <line x1="16" y1="84" x2="94" y2="84" stroke="#555" strokeWidth="1.2" /><text x="55" y="82" fontSize="7" textAnchor="middle" fill="#333">distancia</text>
        <text x="38" y="38" fontSize="7" fill="#b71c1c">arriba</text><text x="38" y="72" fontSize="7" fill="#1565c0">abajo</text>
      </Lienzo>
    );
  }
  if (tipo === "inclinacion") {
    return (
      <Lienzo titulo="Inclinación: ángulo del fuste respecto a la vertical, medido de lado">
        <Suelo />
        <line x1="60" y1="6" x2="60" y2="78" stroke="#1565c0" strokeWidth="1.5" strokeDasharray="4 3" />
        <g transform="rotate(18 60 78)"><Tronco /><Copa /></g>
        <path d="M60 52a26 26 0 0 1 8 2" fill="none" stroke={ALERTA} strokeWidth="2" />
        <text x="74" y="50" fontSize="9" fill="#b71c1c">°</text><text x="28" y="14" fontSize="7" fill="#1565c0">vertical</text>
      </Lienzo>
    );
  }
  return (
    <Lienzo titulo="Diámetro de la rama: se mide en la base, donde se une al fuste">
      <Suelo />
      <Tronco x={20} y={20} w={14} h={58} />
      <path d="M34 36l60-10v12l-60 14z" fill={TRONCO} />
      <line x1="62" y1="22" x2="62" y2="46" stroke={ALERTA} strokeWidth="2" /><path d="M62 22l-3 5h6zM62 46l-3-5h6z" fill={ALERTA} />
      <text x="70" y="40" fontSize="8" fill="#b71c1c">diámetro</text>
      <path d="M36 54a16 6 0 0 0 14 6" stroke="#9e9e9e" fill="none" />
    </Lienzo>
  );
}
