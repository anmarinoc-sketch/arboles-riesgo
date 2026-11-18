import { db } from "../db/db";
import type { CategoriaConfig } from "../engine";
import { CATEGORIAS_POR_DEFECTO, categoriasActivas, guardarCategorias, validarCategorias } from "./categorias";
import { guardarModoV, modoVActual } from "./metodo";
import { crearRespaldoZip, type RespaldoLeido } from "./respaldo";

/** Lee todo lo guardado en el dispositivo y arma el ZIP del respaldo completo. */
export async function generarRespaldo(): Promise<{ zip: Uint8Array; evaluaciones: number; fotos: number }> {
  const [evaluaciones, fotos, especies] = await Promise.all([db.evaluaciones.toArray(), db.fotos.toArray(), db.especies.toArray()]);
  const zip = await crearRespaldoZip({
    evaluaciones, fotos, especies,
    ajustes: {
      categorias: categoriasActivas().map(({ id, hasta, inclusivo, color, accion }) => ({ id, hasta, inclusivo, color, accion })),
      modoV: modoVActual(),
    },
  });
  return { zip, evaluaciones: evaluaciones.length, fotos: fotos.length };
}

export interface OpcionesRestauracion {
  /** Si ya existe una evaluacion con el mismo codigo: true la reemplaza, false la deja como esta. */
  reemplazar: boolean;
  /** Restaura tambien el catalogo de especies y los ajustes (umbrales y metodo de vulnerabilidad). */
  ajustes: boolean;
}

export interface ResultadoRestauracion {
  agregadas: number; reemplazadas: number; omitidas: number; fotos: number; especies: number; ajustesAplicados: boolean;
}

/** Restaura un respaldo ya validado. Todo el cambio en evaluaciones, fotos y especies ocurre en una sola transaccion. */
export async function restaurarRespaldo(l: RespaldoLeido, op: OpcionesRestauracion): Promise<ResultadoRestauracion> {
  const r = l.respaldo;
  const res: ResultadoRestauracion = { agregadas: 0, reemplazadas: 0, omitidas: 0, fotos: 0, especies: 0, ajustesAplicados: false };
  const fotosPorCodigo = new Map<string, RespaldoLeido["respaldo"]["fotos"]>();
  for (const f of r.fotos) fotosPorCodigo.set(f.codigo, [...(fotosPorCodigo.get(f.codigo) ?? []), f]);

  await db.transaction("rw", db.evaluaciones, db.fotos, db.especies, async () => {
    for (const e of r.evaluaciones) {
      const existente = await db.evaluaciones.where("codigo").equals(e.codigo).first();
      if (existente) {
        if (!op.reemplazar) { res.omitidas++; continue; }
        await db.fotos.where("evaluacionId").equals(existente.id!).delete();
        await db.evaluaciones.delete(existente.id!);
        res.reemplazadas++;
      } else res.agregadas++;
      // sincronizada = 0: el servidor propio (si hay) debe recibirla de nuevo
      const id = await db.evaluaciones.add({ ...e, sincronizada: 0 });
      for (const f of fotosPorCodigo.get(e.codigo) ?? []) {
        const bytes = l.archivos.get(f.archivo);
        if (!bytes) continue;
        await db.fotos.add({ evaluacionId: id, nombre: f.nombre, blob: new Blob([bytes as BlobPart], { type: f.tipo }) });
        res.fotos++;
      }
    }
    if (op.ajustes) {
      const existentes = await db.especies.toArray();
      for (const s of r.especies) {
        const ex = existentes.find(x => x.cientifico.trim().toLowerCase() === s.cientifico.trim().toLowerCase());
        if (ex) await db.especies.update(ex.id!, { ...s, categoriaAmenaza: s.categoriaAmenaza });
        else await db.especies.add(s);
        res.especies++;
      }
    }
  });

  if (op.ajustes) {
    guardarModoV(r.ajustes.modoV);
    if (r.ajustes.categorias.length) {
      const cats: CategoriaConfig[] = CATEGORIAS_POR_DEFECTO.map(b => {
        const x = r.ajustes.categorias.find(c => c.id === b.id);
        return x ? { ...b, hasta: x.hasta, inclusivo: x.inclusivo, color: x.color, accion: x.accion } : b;
      });
      if (validarCategorias(cats).length === 0) guardarCategorias(cats);
    }
    res.ajustesAplicados = true;
  }
  return res;
}
