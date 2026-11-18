import type { Especie } from "../engine";

/**
 * Que agregar de la semilla a un catalogo existente: las especies que faltan, y la categoria de amenaza de las que
 * existen y no la tienen. Nunca cambia los factores Sp que el usuario haya editado.
 */
export function planActualizacionSemilla(existentes: (Especie & { id?: number })[], semilla: Especie[]) {
  const clave = (s: string) => s.trim().toLowerCase();
  const porNombre = new Map(existentes.map(e => [clave(e.cientifico), e]));
  const nuevas: Especie[] = [];
  const actualizaciones: { id: number; cambios: Partial<Especie> }[] = [];
  for (const s of semilla) {
    const ex = porNombre.get(clave(s.cientifico));
    if (!ex) nuevas.push(s);
    else if (s.categoriaAmenaza && !ex.categoriaAmenaza) actualizaciones.push({ id: ex.id!, cambios: { categoriaAmenaza: s.categoriaAmenaza } });
  }
  return { nuevas, actualizaciones };
}
