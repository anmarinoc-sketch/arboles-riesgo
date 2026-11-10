import { categoriasActivas } from "./categorias";

/** Categoria segun los umbrales vigentes (editables en Ajustes). */
export const catPorId = (id: string) => categoriasActivas().find(c => c.id === id);

export interface Filtros {
  categoriaId: string;    // "" = todas
  especie: string;
  catDiametrica: string;
}
export const SIN_FILTROS: Filtros = { categoriaId: "", especie: "", catDiametrica: "" };

interface Filtrable { categoriaId: string; especie: string; catDiametrica: string }

export function filtrar<T extends Filtrable>(items: T[], f: Filtros): T[] {
  const esp = f.especie.trim().toLowerCase();
  return items.filter(i =>
    (!f.categoriaId || i.categoriaId === f.categoriaId) &&
    (!esp || i.especie.trim().toLowerCase() === esp) &&
    (!f.catDiametrica || i.catDiametrica === f.catDiametrica));
}
