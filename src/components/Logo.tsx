/** Logo de la app (public/logo.svg). El archivo es el mismo que se usa para los íconos instalables. */
export default function Logo({ tam = 40, alt = "" }: { tam?: number; alt?: string }) {
  return <img src={`${import.meta.env.BASE_URL}logo.svg`} width={tam} height={tam} alt={alt} className="logo" draggable={false} />;
}

export const NOMBRE_APP = "Árboles en Riesgo";
export const LEMA_APP = "Monitorea · Reporta · Protege";
