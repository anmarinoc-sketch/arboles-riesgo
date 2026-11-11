import type { EvaluacionDB, FotoDB } from "../db/db";
import type { Especie } from "../engine";
import { AVISO_PROBABILISTICO } from "../components/Aviso";
import { catPorId } from "./filtros";
import { fmt } from "./util";
import { wgs84AOrigenNacional } from "./coordenadas";

const hex = (h: string): [number, number, number] =>
  [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const sn = (b: boolean | null) => (b === null ? "" : b ? "Sí" : "No");
const num = (n: number | null, u: string) => (n === null ? "" : `${fmt(n)} ${u}`);

function leerDataURL(b: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(r.error);
    r.readAsDataURL(b);
  });
}

/** Dibuja una foto dentro de una caja (sin deformarla). Devuelve false si no se pudo leer. */
async function fotoEnCaja(doc: import("jspdf").jsPDF, foto: FotoDB, x: number, y: number, w: number, h: number): Promise<boolean> {
  try {
    const url = await leerDataURL(foto.blob);
    const bmp = await createImageBitmap(foto.blob);
    const k = Math.min(w / bmp.width, h / bmp.height);
    const pw = bmp.width * k, ph = bmp.height * k;
    doc.addImage(url, foto.blob.type === "image/png" ? "PNG" : "JPEG", x + (w - pw) / 2, y + (h - ph) / 2, pw, ph);
    return true;
  } catch {
    return false; // foto ilegible: se omite
  }
}

/**
 * Ficha PDF (A4) de una evaluacion. Sigue los bloques de la ficha tecnica de registro de individuos
 * arboreos (informacion operativa y fotografia, identificacion botanica, medidas y estado, diagnostico,
 * recomendaciones, coordenadas) y agrega la evaluacion de riesgo del numeral 3.7.
 * jsPDF se carga solo cuando se pide la ficha.
 */
export async function generarFichaPDF(e: EvaluacionDB, fotos: FotoDB[], catalogo: Especie[] = []): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210, M = 15, ANCHO = W - 2 * M;
  const VERDE: [number, number, number] = [31, 111, 67];
  let y = M;
  const f = e.form, r = e.resultado;
  const cat = catPorId(e.categoriaId);
  const dec = f.decisionFinalId && f.decisionFinalId !== e.categoriaId ? catPorId(f.decisionFinalId) : null;
  const comun = catalogo.find(s => s.cientifico.trim().toLowerCase() === f.especie.trim().toLowerCase())?.comun ?? "";

  const salto = (h: number) => { if (y + h > 284) { doc.addPage(); y = M; } };

  /** Barra de titulo de bloque. */
  const barra = (t: string, x = M, w = ANCHO) => {
    doc.setFillColor(...VERDE).rect(x, y, w, 6, "F");
    doc.setTextColor(255).setFont("helvetica", "bold").setFontSize(9).text(t, x + 2, y + 4.2);
    doc.setTextColor(0);
  };

  /** Rejilla de celdas "etiqueta / valor". Las vacias se muestran con guion. */
  const celdas = (items: [string, string][], cols: number, x = M, w = ANCHO) => {
    const cw = w / cols;
    for (let i = 0; i < items.length; i += cols) {
      const fila = items.slice(i, i + cols);
      const lineas = fila.map(([, v]) => doc.setFont("helvetica", "normal").setFontSize(10).splitTextToSize(v || "—", cw - 4));
      const h = 4.5 + Math.max(...lineas.map(l => l.length)) * 4.6 + 1.5;
      salto(h);
      fila.forEach(([k], j) => {
        const cx = x + j * cw;
        doc.setDrawColor(210).rect(cx, y, cw, h);
        doc.setFont("helvetica", "normal").setFontSize(7.5).setTextColor(100).text(k, cx + 2, y + 3.6);
        doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(0).text(lineas[j], cx + 2, y + 8.2);
      });
      y += h;
    }
  };

  const texto = (t: string) => {
    const lineas = doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(0).splitTextToSize(t || "—", ANCHO - 4);
    const h = lineas.length * 4.8 + 4;
    salto(h);
    doc.setDrawColor(210).rect(M, y, ANCHO, h);
    doc.text(lineas, M + 2, y + 5);
    y += h;
  };

  // Encabezado
  doc.setFont("helvetica", "bold").setFontSize(13).setTextColor(0).text("FICHA TÉCNICA DE REGISTRO DE INDIVIDUOS ARBÓREOS", W / 2, y + 4, { align: "center" });
  y += 8;
  doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(90)
    .text("Incluye evaluación del riesgo de caída (metodología AMVA 354 de 2007; Plan Maestro de Envigado, 3.7)", W / 2, y, { align: "center" });
  y += 5;

  // Informacion operativa | Fotografia
  const colIzq = 105, colDer = ANCHO - colIzq - 3, xDer = M + colIzq + 3;
  const yTop = y;
  barra("INFORMACIÓN OPERATIVA", M, colIzq);
  y += 6;
  celdas([["ID árbol", f.codigo], ["Fecha de visita", f.fecha]], 2, M, colIzq);
  celdas([["Zona / municipio / proyecto", f.zona]], 1, M, colIzq);
  celdas([["Evaluador", f.evaluador]], 1, M, colIzq);
  const yIzqFin = y;
  y = yTop;
  barra("FOTOGRAFÍA", xDer, colDer);
  const altoFoto = Math.max(yIzqFin - yTop - 6, 38);
  doc.setDrawColor(210).rect(xDer, yTop + 6, colDer, altoFoto);
  const ok = fotos.length > 0 && await fotoEnCaja(doc, fotos[0], xDer + 1, yTop + 7, colDer - 2, altoFoto - 2);
  if (!ok) doc.setFont("helvetica", "italic").setFontSize(9).setTextColor(130).text("Sin fotografía", xDer + colDer / 2, yTop + 6 + altoFoto / 2, { align: "center" });
  doc.setTextColor(0);
  y = Math.max(yIzqFin, yTop + 6 + altoFoto) + 3;

  barra("IDENTIFICACIÓN BOTÁNICA DEL INDIVIDUO");
  y += 6;
  celdas([["Familia", f.familia], ["Nombre científico", f.especie], ["Nombre común", comun]], 3);
  y += 3;

  salto(30);
  barra("MEDIDAS DASOMÉTRICAS Y ESTADO");
  y += 6;
  celdas([
    ["DAP", num(f.dap, "cm")], ["HT (altura total)", num(f.alturaArbolM, "m")],
    ["Diámetro de copa", num(f.diametroCopaM, "m")], ["Categoría diamétrica", f.catDiametrica ?? ""],
    ["Hábito", f.habito ?? ""], ["Madurez", f.madurez ?? ""], ["Origen", f.origen ?? ""], ["Fustes", f.fustes ?? ""],
    ["Fenología", f.fenologia ?? ""], ["Estado fitosanitario y estructural", f.estadoFitosanitario ?? ""],
    ["Prioridad de intervención", f.prioridad ?? ""], ["Tomografía", sn(f.tomografia)],
    ["Tratamiento realizado", f.tratamientoRealizado ?? ""], ["Interferencia (redes o mobiliario)", f.interferencia ?? ""],
    ["Pendiente", f.pendiente], ["Sitio de siembra", f.sitioSiembra],
  ], 4);
  y += 3;

  salto(20);
  barra("DIAGNÓSTICO");
  y += 6;
  texto(f.observaciones);
  y += 3;

  salto(20);
  barra("RECOMENDACIONES DE INTERVENCIÓN");
  y += 6;
  texto(f.recomendacion);
  y += 3;

  salto(20);
  const plano = wgs84AOrigenNacional(f.lat, f.lon);
  barra(plano ? "COORDENADAS (WGS84 Y MAGNA ORIGEN NACIONAL)" : "COORDENADAS (WGS84, EPSG:4326)");
  y += 6;
  celdas([
    ["Latitud (WGS84)", f.lat !== null ? f.lat.toFixed(6) : ""], ["Longitud (WGS84)", f.lon !== null ? f.lon.toFixed(6) : ""],
    ...(plano ? [["X (MAGNA Origen Nacional)", plano.x.toFixed(2).replace(".", ",")], ["Y (MAGNA Origen Nacional)", plano.y.toFixed(2).replace(".", ",")]] as [string, string][] : []),
  ], plano ? 4 : 2);
  y += 5;

  // Evaluacion del riesgo (3.7)
  salto(62);
  barra("EVALUACIÓN DEL RIESGO DE CAÍDA (NUMERAL 3.7)");
  y += 8;
  doc.setFillColor(...hex(cat?.color ?? "#777777")).roundedRect(M, y, ANCHO, 17, 2.5, 2.5, "F");
  doc.setTextColor(255).setFont("helvetica", "bold").setFontSize(15).text(`${e.categoriaNombre} · ${fmt(r.porcentaje, 1)} %`, M + 5, y + 7.5);
  doc.setFontSize(10).setFont("helvetica", "normal").text(`Acción: ${cat?.accion ?? ""}`, M + 5, y + 13.5);
  doc.setTextColor(0);
  y += 20;
  if (dec) {
    const t = doc.splitTextToSize(`Decisión final del técnico: ${dec.nombre}. Justificación: ${f.justificacion}`, ANCHO - 6);
    salto(t.length * 4.8 + 6);
    doc.setFillColor(255, 244, 214).roundedRect(M, y, ANCHO, t.length * 4.8 + 4, 2, 2, "F");
    doc.setFont("helvetica", "bold").setFontSize(10).text(t, M + 3, y + 5.5);
    y += t.length * 4.8 + 7;
  }
  celdas([
    ["Estado general del árbol", f.estadoGeneral === "regular-malo" ? "Regular o malo" : f.estadoGeneral === "bueno" ? "Bueno" : ""],
    ["Inclinación", num(f.inclinacionGrados, "°")],
    ["Rama crítica: diámetro", num(f.ramaDiametroCm, "cm")],
    ["Rama crítica: estado", f.ramaEstado === "malo" ? "Malo" : f.ramaEstado === "bueno" ? "Bueno" : ""],
    ["Rama crítica: altura", num(f.ramaAlturaM, "m")],
    ["Raíces", f.raices === "malo" ? "Mal estado" : f.raices === "bueno" ? "Buen estado" : ""],
    ["Personas", sn(f.personas)], ["Vehículos", sn(f.vehiculos)],
    ["Construcciones", sn(f.construcciones)], ["Redes aéreas", sn(f.redesAereas)],
  ], 5);
  y += 2;
  celdas([
    ["Vo (volcam.)", fmt(r.Vo)], ["Cr (caída ramas)", fmt(r.Cr)], ["Ra (raíces)", String(r.Ra)],
    ["A (amenaza)", fmt(r.A)], ["V (vulnerab.)", fmt(r.V)], ["Riesgo = A × V", `${fmt(r.riesgo)} (${fmt(r.porcentaje, 1)} %)`],
  ], 6);
  doc.setFont("helvetica", "italic").setFontSize(8).setTextColor(100)
    .text(e.modoV === "promedio" ? "Vulnerabilidad: V = (P + Ve + C + Re) / 4" : "Vulnerabilidad: V = 1 si hay al menos un elemento expuesto; si no, 0", M, y + 4);
  doc.setTextColor(0);
  y += 5;

  // Fotografias adicionales
  if (fotos.length > 1) {
    y += 5;
    salto(70);
    barra(`FOTOGRAFÍAS ADICIONALES (${fotos.length - 1})`);
    y += 8;
    const ancho = (ANCHO - 6) / 2, alto = 62;
    for (let i = 1; i < fotos.length; i++) {
      const col = (i - 1) % 2;
      if (col === 0) salto(alto + 4);
      await fotoEnCaja(doc, fotos[i], M + col * (ancho + 6), y, ancho, alto);
      if (col === 1 || i === fotos.length - 1) y += alto + 4;
    }
  }

  // Aviso en todas las paginas
  const n = doc.getNumberOfPages();
  for (let p = 1; p <= n; p++) {
    doc.setPage(p);
    doc.setFontSize(8).setTextColor(90).setFont("helvetica", "italic")
      .text(`${AVISO_PROBABILISTICO}.`, M, 291)
      .text(`Pág. ${p}/${n}`, W - M, 291, { align: "right" });
  }
  return doc.output("blob");
}
