import { useSyncExternalStore } from "react";
import umbrales from "../config/umbrales.json";
import { categorizar, type CategoriaConfig } from "../engine";

/** Valores de la Tabla 64 (src/config/umbrales.json). */
export const CATEGORIAS_POR_DEFECTO = umbrales.categorias as CategoriaConfig[];

/** Lo unico que se puede editar de cada categoria; el id, el nombre y el orden son fijos. */
type Editable = Pick<CategoriaConfig, "id" | "hasta" | "inclusivo" | "color" | "accion">;

export function validarCategorias(cats: CategoriaConfig[]): string[] {
  const e: string[] = [];
  const base = CATEGORIAS_POR_DEFECTO;
  if (cats.length !== base.length || cats.some((c, i) => c.id !== base[i].id)) return ["Las categorías no coinciden con las del modelo."];
  let previo = 0;
  cats.forEach((c, i) => {
    const ultima = i === cats.length - 1;
    if (ultima) {
      if (c.hasta !== null) e.push(`${c.nombre}: la última categoría no tiene límite superior.`);
    } else if (typeof c.hasta !== "number" || !Number.isFinite(c.hasta)) {
      e.push(`${c.nombre}: escribe el límite superior en %.`);
    } else {
      if (c.hasta <= previo) e.push(`${c.nombre}: el límite (${c.hasta} %) debe ser mayor que el de la categoría anterior (${previo} %).`);
      if (c.hasta > 100) e.push(`${c.nombre}: el límite no puede pasar de 100 %.`);
      previo = c.hasta;
    }
    if (!/^#[0-9a-f]{6}$/i.test(c.color)) e.push(`${c.nombre}: el color no es válido.`);
    if (!c.accion.trim()) e.push(`${c.nombre}: escribe la acción recomendada.`);
  });
  return e;
}

/**
 * Texto de los rangos resultantes, p. ej. «Medio-Alto: ≥ 50 y ≤ 60 %».
 * `inclusivo` significa que el limite superior pertenece a ESA categoria; si no, pertenece a la siguiente.
 */
export function describirRangos(cats: CategoriaConfig[]): string[] {
  return cats.map((c, i) => {
    const previa = i > 0 ? cats[i - 1] : null;
    const inferior = previa && previa.hasta !== null ? `${previa.inclusivo ? ">" : "≥"} ${previa.hasta}` : null;
    const superior = c.hasta !== null ? `${c.inclusivo ? "≤" : "<"} ${c.hasta}` : null;
    const t = [inferior, superior].filter(Boolean).join(" y ");
    return `${c.nombre}: ${t} %`;
  });
}

const KEY = "arboles.categorias";

function combinar(base: CategoriaConfig[], ed: Editable[]): CategoriaConfig[] {
  return base.map(b => {
    const x = ed.find(e => e.id === b.id);
    return x ? { ...b, hasta: x.hasta, inclusivo: x.inclusivo, color: x.color, accion: x.accion } : b;
  });
}

function cargar(): CategoriaConfig[] {
  try {
    const crudo = localStorage.getItem(KEY);
    if (crudo) {
      const cats = combinar(CATEGORIAS_POR_DEFECTO, JSON.parse(crudo));
      if (validarCategorias(cats).length === 0) return cats;
    }
  } catch { /* sin almacenamiento o dato danado: se usan los valores por defecto */ }
  return CATEGORIAS_POR_DEFECTO;
}

let actuales: CategoriaConfig[] = cargar();
const oyentes = new Set<() => void>();
const avisar = () => oyentes.forEach(f => f());

export const categoriasActivas = () => actuales;

/** Guarda nuevos umbrales; devuelve los errores si no son validos (y no guarda nada). */
export function guardarCategorias(cats: CategoriaConfig[]): string[] {
  const err = validarCategorias(cats);
  if (err.length) return err;
  actuales = cats;
  try {
    const ed: Editable[] = cats.map(({ id, hasta, inclusivo, color, accion }) => ({ id, hasta, inclusivo, color, accion }));
    localStorage.setItem(KEY, JSON.stringify(ed));
  } catch { /* sin almacenamiento: vale solo para esta sesion */ }
  avisar();
  return [];
}

export function restaurarCategorias(): void {
  actuales = CATEGORIAS_POR_DEFECTO;
  try { localStorage.removeItem(KEY); } catch { /* nada */ }
  avisar();
}

/** Hook: las pantallas se vuelven a dibujar cuando cambian los umbrales. */
export function useCategorias(): CategoriaConfig[] {
  return useSyncExternalStore(f => { oyentes.add(f); return () => { oyentes.delete(f); }; }, categoriasActivas);
}

/** Categoria segun los umbrales vigentes. */
export const categorizarActual = (porcentaje: number) => categorizar(porcentaje, categoriasActivas());

/** Evaluaciones cuya categoria calculada cambiaria con los umbrales dados. */
export function cambiosDeCategoria<T extends { id?: number; categoriaId: string; resultado: { porcentaje: number } }>(
  evals: T[], cats: CategoriaConfig[],
): { id: number; categoriaId: string; categoriaNombre: string }[] {
  const out: { id: number; categoriaId: string; categoriaNombre: string }[] = [];
  for (const e of evals) {
    const c = categorizar(e.resultado.porcentaje, cats);
    if (c.id !== e.categoriaId) out.push({ id: e.id!, categoriaId: c.id, categoriaNombre: c.nombre });
  }
  return out;
}
