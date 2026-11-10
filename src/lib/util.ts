/** Formatos numericos en español (coma decimal). */
export const fmt = (n: number, d = 4) =>
  n.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: d });

/** 1/3, 2/3 o 1 como texto. */
export function fracc(v: number): string {
  if (Math.abs(v - 1 / 3) < 1e-9) return "1/3";
  if (Math.abs(v - 2 / 3) < 1e-9) return "2/3";
  return fmt(v, 2);
}

/** Reduce la foto (lado mayor 1280 px, JPEG 0.75) para ahorrar espacio en el celular. */
export async function comprimirFoto(file: File, max = 1280, calidad = 0.75): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * k);
    c.height = Math.round(bmp.height * k);
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise<Blob | null>(r => c.toBlob(r, "image/jpeg", calidad));
    return blob ?? file;
  } catch {
    return file; // si el navegador no puede decodificarla, se guarda tal cual
  }
}
