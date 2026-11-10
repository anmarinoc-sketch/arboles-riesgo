import { CATEGORIAS_DIAMETRICAS } from "../engine";
import { categoriasActivas } from "./categorias";

interface Item { categoriaId: string; catDiametrica: string; especie: string }

export const esEucalipto = (especie: string) => /^eucalyptus\b/i.test(especie.trim());

/** Tabla 65: individuos por categoria diametrica y categoria de riesgo. */
export interface Tabla65 {
  columnas: { id: string; nombre: string }[];
  filas: { catDiametrica: string; conteos: Record<string, number>; total: number }[];
  totales: Record<string, number>;
  total: number;
}

export function tabla65(items: Item[]): Tabla65 {
  const columnas = [...categoriasActivas()].reverse().map(c => ({ id: c.id, nombre: c.nombre })); // Alto → Bajo, como en el documento
  const cero = () => Object.fromEntries(columnas.map(c => [c.id, 0])) as Record<string, number>;
  const totales = cero();
  const filas = CATEGORIAS_DIAMETRICAS.map(cd => {
    const conteos = cero();
    for (const i of items) if (i.catDiametrica === cd && i.categoriaId in conteos) conteos[i.categoriaId]++;
    for (const c of columnas) totales[c.id] += conteos[c.id];
    return { catDiametrica: cd, conteos, total: Object.values(conteos).reduce((a, b) => a + b, 0) };
  });
  return { columnas, filas, totales, total: filas.reduce((a, f) => a + f.total, 0) };
}

/** Tabla 66: eucaliptos frente al resto de especies, por categoria de riesgo. */
export interface Tabla66 {
  filas: { categoriaId: string; nombre: string; resto: number; eucaliptos: number; total: number; pctResto: number; pctEucaliptos: number }[];
  totalResto: number;
  totalEucaliptos: number;
  total: number;
}

export function tabla66(items: Item[]): Tabla66 {
  const base = [...categoriasActivas()].reverse().map(c => {
    const delCat = items.filter(i => i.categoriaId === c.id);
    const eucaliptos = delCat.filter(i => esEucalipto(i.especie)).length;
    return { categoriaId: c.id, nombre: c.nombre, resto: delCat.length - eucaliptos, eucaliptos, total: delCat.length };
  });
  const totalResto = base.reduce((a, f) => a + f.resto, 0);
  const totalEucaliptos = base.reduce((a, f) => a + f.eucaliptos, 0);
  const pct = (n: number, d: number) => (d === 0 ? 0 : (n / d) * 100);
  return {
    filas: base.map(f => ({ ...f, pctResto: pct(f.resto, totalResto), pctEucaliptos: pct(f.eucaliptos, totalEucaliptos) })),
    totalResto, totalEucaliptos, total: totalResto + totalEucaliptos,
  };
}

/** Inventario: cantidad por especie y origen, y conteos por prioridad y estado fitosanitario. */
interface ItemInventario {
  especie: string;
  form: { origen: string | null; prioridad: string | null; estadoFitosanitario: string | null };
}

export interface Inventario {
  especies: { especie: string; origen: "Nativa" | "Introducida" | "Mixto" | ""; cantidad: number }[];
  total: number;
  nativas: { especies: number; individuos: number };
  introducidas: { especies: number; individuos: number };
  sinOrigen: number; // individuos sin origen registrado
  porPrioridad: Record<string, number>;
  porEstado: Record<string, number>;
}

export function inventario(items: ItemInventario[]): Inventario {
  const grupos = new Map<string, { nombre: string; origenes: Set<string>; n: number }>();
  for (const i of items) {
    const k = i.especie.trim().toLowerCase();
    const g = grupos.get(k) ?? { nombre: i.especie.trim(), origenes: new Set<string>(), n: 0 };
    g.n++;
    if (i.form.origen) g.origenes.add(i.form.origen);
    grupos.set(k, g);
  }
  const especies = [...grupos.values()]
    .map(g => ({
      especie: g.nombre, cantidad: g.n,
      origen: (g.origenes.size > 1 ? "Mixto" : ([...g.origenes][0] ?? "")) as "Nativa" | "Introducida" | "Mixto" | "",
    }))
    .sort((a, b) => b.cantidad - a.cantidad || a.especie.localeCompare(b.especie));
  const por = (o: string) => ({
    especies: especies.filter(e => e.origen === o).length,
    individuos: items.filter(i => i.form.origen === o).length,
  });
  const cuenta = (campo: "prioridad" | "estadoFitosanitario", orden: string[]) => {
    const r: Record<string, number> = Object.fromEntries(orden.map(o => [o, 0]));
    r["Sin dato"] = 0;
    for (const i of items) { const v = i.form[campo]; r[v && v in r ? v : "Sin dato"]++; }
    return r;
  };
  return {
    especies, total: items.length, nativas: por("Nativa"), introducidas: por("Introducida"),
    sinOrigen: items.filter(i => !i.form.origen).length,
    porPrioridad: cuenta("prioridad", ["Alta", "Media", "Baja"]),
    porEstado: cuenta("estadoFitosanitario", ["Bueno", "Regular", "Deficiente"]),
  };
}
