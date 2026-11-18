// Genera los íconos de la app (PNG) a partir de public/logo.svg.
// Uso: npm run iconos   (los PNG generados se guardan en el repositorio, no hace falta correrlo para compilar)
import { readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const logo = readFileSync("public/logo.svg", "utf8");
const interior = logo.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");

/** Lienzo cuadrado con fondo y el logo centrado ocupando `proporcion` del lado. */
function lienzo(lado, proporcion, fondo, redondeo) {
  const w = lado * proporcion;
  const x = (lado - w) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${lado}" height="${lado}" viewBox="0 0 ${lado} ${lado}">
  <rect width="${lado}" height="${lado}" rx="${redondeo}" fill="${fondo}"/>
  <svg x="${x}" y="${x - lado * 0.02}" width="${w}" height="${w}" viewBox="0 0 240 240">${interior}</svg>
</svg>`;
}

const FONDO = "#eef5e9";
const salidas = [
  // ícono normal: el logo ocupa casi todo el cuadro
  { archivo: "public/icon-192.png", lado: 192, prop: 0.84, redondeo: 38 },
  { archivo: "public/icon-512.png", lado: 512, prop: 0.84, redondeo: 100 },
  // «maskable»: Android lo recorta en círculo u otras formas; el logo queda dentro de la zona segura (~66 %)
  { archivo: "public/icon-maskable-512.png", lado: 512, prop: 0.62, redondeo: 0 },
  // iOS (sin transparencia ni esquinas redondeadas propias)
  { archivo: "public/apple-touch-icon.png", lado: 180, prop: 0.8, redondeo: 0 },
];

for (const s of salidas) {
  await sharp(Buffer.from(lienzo(s.lado, s.prop, FONDO, s.redondeo))).png().toFile(s.archivo);
  console.log("ok", s.archivo);
}
// versión vectorial del ícono (la usa el navegador como favicon y el manifest como ícono «any»)
writeFileSync("public/icon.svg", lienzo(512, 0.84, FONDO, 100));
console.log("ok public/icon.svg");
