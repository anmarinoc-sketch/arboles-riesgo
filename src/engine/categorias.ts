import umbrales from "../config/umbrales.json";
import type { CategoriaConfig } from "./types";

const EPS = 1e-9; // tolera ruido de coma flotante en los bordes (30, 50, 60)

export function categorizar(
  porcentaje: number,
  cats: CategoriaConfig[] = umbrales.categorias as CategoriaConfig[],
): CategoriaConfig {
  for (const c of cats) {
    if (c.hasta === null) return c;
    if (c.inclusivo ? porcentaje <= c.hasta + EPS : porcentaje < c.hasta - EPS) return c;
  }
  return cats[cats.length - 1];
}
