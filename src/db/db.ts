import Dexie, { type Table } from "dexie";
import seed from "../config/especies.seed.json";
import type { Especie, FormEvaluacion, ModoVulnerabilidad, ResultadoRiesgo } from "../engine";

export interface EspecieDB extends Especie {
  id?: number;
}

export interface EvaluacionDB {
  id?: number;
  // Copias planas de campos del formulario, para indexar y filtrar
  codigo: string;
  especie: string;
  catDiametrica: string;
  categoriaId: string; // categoria calculada por el modelo
  creada: number;
  actualizada: number;
  sincronizada: 0 | 1; // para la cola de sincronizacion (fase 8)
  form: FormEvaluacion;
  resultado: ResultadoRiesgo;
  categoriaNombre: string;
  /** Metodo con el que se calculo V; si falta (evaluaciones antiguas) es "al-menos-uno". */
  modoV?: ModoVulnerabilidad;
}

export interface FotoDB {
  id?: number;
  evaluacionId: number;
  nombre: string;
  blob: Blob;
}

class AppDB extends Dexie {
  especies!: Table<EspecieDB, number>;
  evaluaciones!: Table<EvaluacionDB, number>;
  fotos!: Table<FotoDB, number>;
  constructor() {
    super("arboles-riesgo");
    this.version(1).stores({ especies: "++id, &cientifico, comun" });
    this.version(2).stores({
      especies: "++id, &cientifico, comun",
      evaluaciones: "++id, &codigo, especie, catDiametrica, categoriaId, creada, sincronizada",
      fotos: "++id, evaluacionId",
    });
  }
}

export const db = new AppDB();

/** Siembra el catalogo la primera vez (no pisa ediciones del usuario). */
export async function sembrarEspecies(): Promise<void> {
  if ((await db.especies.count()) > 0) return;
  await db.especies.bulkAdd(seed.especies as Especie[]);
}

/** Restaura los valores de la semilla (conserva especies agregadas por el usuario). */
export async function restaurarSemilla(): Promise<void> {
  await db.transaction("rw", db.especies, async () => {
    for (const s of seed.especies as Especie[]) {
      const ex = await db.especies.where("cientifico").equals(s.cientifico).first();
      if (ex) await db.especies.update(ex.id!, s);
      else await db.especies.add(s);
    }
  });
}
