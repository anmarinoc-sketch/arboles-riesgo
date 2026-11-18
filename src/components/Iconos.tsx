import type { ReactNode } from "react";

/** Íconos de línea, del mismo trazo que el diseño de la app. Heredan el color del texto (currentColor). */
function Svg({ children, size = 24 }: { children: ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

type P = { size?: number };

export const IconoInicio = ({ size }: P) => <Svg size={size}><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10v9.5h13V10" /><path d="M10 19.5v-5h4v5" /></Svg>;
export const IconoLista = ({ size }: P) => <Svg size={size}><path d="M9 6.5h11M9 12h11M9 17.5h11" /><circle cx="4.5" cy="6.5" r="1" /><circle cx="4.5" cy="12" r="1" /><circle cx="4.5" cy="17.5" r="1" /></Svg>;
export const IconoMapa = ({ size }: P) => <Svg size={size}><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" /><circle cx="12" cy="10" r="2.3" /></Svg>;
export const IconoGrafica = ({ size }: P) => <Svg size={size}><path d="M4 20h16" /><rect x="5.5" y="11" width="3" height="7" rx=".8" /><rect x="10.5" y="6" width="3" height="12" rx=".8" /><rect x="15.5" y="13" width="3" height="5" rx=".8" /></Svg>;
export const IconoMas = ({ size }: P) => <Svg size={size}><path d="M12 5v14M5 12h14" /></Svg>;
export const IconoLibro = ({ size }: P) => <Svg size={size}><path d="M12 6.5C10 5 7 4.5 4 5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5Z" /><path d="M12 6.5v13" /></Svg>;
export const IconoAjustes = ({ size }: P) => <Svg size={size}><circle cx="12" cy="12" r="3" /><path d="M19.4 14a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V20a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H4a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H10a1.7 1.7 0 0 0 1-1.5V4a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V10a1.7 1.7 0 0 0 1.5 1H20a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></Svg>;
export const IconoCamara = ({ size }: P) => <Svg size={size}><path d="M4 8.5h3l1.5-2h7L17 8.5h3V19H4Z" /><circle cx="12" cy="13.5" r="3.3" /></Svg>;
export const IconoCheck = ({ size }: P) => <Svg size={size}><path d="m5 12.5 4.5 4.5L19 7.5" /></Svg>;
export const IconoAtras = ({ size }: P) => <Svg size={size}><path d="m14.5 5.5-6.5 6.5 6.5 6.5" /></Svg>;
export const IconoArbol = ({ size }: P) => <Svg size={size}><path d="M12 21v-7" /><path d="M12 14c-4 0-6.5-2.4-6.5-5.5S8 3 12 3s6.5 2.4 6.5 5.5S16 14 12 14Z" /><path d="M12 11 9.5 8.5M12 9.5l2-2" /></Svg>;
