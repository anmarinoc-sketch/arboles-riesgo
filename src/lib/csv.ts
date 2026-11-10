/** Lee CSV (comillas, saltos de linea dentro de campos). Detecta coma o punto y coma. */
export function parseCSV(texto: string): string[][] {
  const t = texto.replace(/^﻿/, "");
  const primera = t.split(/\r?\n/, 1)[0] ?? "";
  const sep = (primera.match(/;/g)?.length ?? 0) > (primera.match(/,/g)?.length ?? 0) ? ";" : ",";
  const filas: string[][] = [];
  let fila: string[] = [], campo = "", comillas = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (comillas) {
      if (c === '"') { if (t[i + 1] === '"') { campo += '"'; i++; } else comillas = false; }
      else campo += c;
    } else if (c === '"') comillas = true;
    else if (c === sep) { fila.push(campo); campo = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && t[i + 1] === "\n") i++;
      fila.push(campo); campo = "";
      filas.push(fila); fila = [];
    } else campo += c;
  }
  if (campo !== "" || fila.length > 0) { fila.push(campo); filas.push(fila); }
  return filas.filter(f => f.some(x => x.trim() !== ""));
}

const escapar = (v: string) => (/[",\n\r;]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

/** Escribe CSV con coma; con BOM para que Excel respete las tildes. */
export function aCSV(filas: (string | number | null | undefined)[][]): string {
  return "﻿" + filas.map(f => f.map(v => escapar(v === null || v === undefined ? "" : String(v))).join(",")).join("\r\n") + "\r\n";
}
