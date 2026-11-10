import proj4 from "proj4";

/**
 * MAGNA-SIRGAS / Origen-Nacional (EPSG:9377), el sistema plano oficial de Colombia:
 * Transversa de Mercator, origen en 4° N, 73° O, factor de escala 0,9992, falso este 5 000 000 m y
 * falso norte 2 000 000 m, elipsoide GRS80. WGS84 y GRS80 difieren por menos de 1 mm: se tratan como iguales.
 */
export const MAGNA_ORIGEN_NACIONAL =
  "+proj=tmerc +lat_0=4 +lon_0=-73 +k=0.9992 +x_0=5000000 +y_0=2000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs";
const WGS84 = "EPSG:4326";

/** Caja que contiene a Colombia continental e insular; fuera de ella no se calculan coordenadas planas. */
export const LIMITES_COLOMBIA = { latMin: -5, latMax: 16, lonMin: -82.5, lonMax: -66 } as const;

export const enColombia = (lat: number, lon: number) =>
  lat >= LIMITES_COLOMBIA.latMin && lat <= LIMITES_COLOMBIA.latMax &&
  lon >= LIMITES_COLOMBIA.lonMin && lon <= LIMITES_COLOMBIA.lonMax;

/** WGS84 (grados) → MAGNA Origen Nacional (metros, 3 decimales). null si el punto no esta en Colombia. */
export function wgs84AOrigenNacional(lat: number | null, lon: number | null): { x: number; y: number } | null {
  if (lat === null || lon === null || !Number.isFinite(lat) || !Number.isFinite(lon) || !enColombia(lat, lon)) return null;
  const [x, y] = proj4(WGS84, MAGNA_ORIGEN_NACIONAL, [lon, lat]);
  return { x: Number(x.toFixed(3)), y: Number(y.toFixed(3)) };
}

/** MAGNA Origen Nacional (metros) → WGS84 (grados, 7 decimales). null si el resultado cae fuera de Colombia. */
export function origenNacionalAWgs84(x: number, y: number): { lat: number; lon: number } | null {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  const [lon, lat] = proj4(MAGNA_ORIGEN_NACIONAL, WGS84, [x, y]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || !enColombia(lat, lon)) return null;
  return { lat: Number(lat.toFixed(7)), lon: Number(lon.toFixed(7)) };
}
