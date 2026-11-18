import type { SENALES_ALERTA } from "../../engine";

type Senal = (typeof SENALES_ALERTA)[number];

/** Qué buscar para cada señal de alerta, en palabras de campo. La clave es el texto exacto de la señal. */
export const QUE_BUSCAR: Record<Senal, { corto: string; buscar: string }> = {
  "Inclinación pronunciada del fuste": { corto: "Fuste torcido", buscar: "El tronco se ve claramente fuera de la vertical, sobre todo en la parte baja. Si además el suelo se levanta del lado contrario, es más grave." },
  "Grietas en la base del suelo": { corto: "Suelo agrietado", buscar: "Grietas o abultamientos del suelo o del pavimento alrededor de la base, como si el árbol se estuviera moviendo." },
  "Raíces levantadas, cortadas o expuestas": { corto: "Raíces a la vista", buscar: "Raíces gruesas que sobresalen, están peladas por erosión o se ven cortadas (por zanjas, obras o andenes)." },
  "Cuello del árbol tapado por sustrato": { corto: "Base enterrada", buscar: "Tierra, mulch o andén cubren la zona donde el tronco se ensancha para pasar a raíz; no se ve el arranque." },
  "Hongos": { corto: "Hongos", buscar: "Repisas, sombreros o placas de hongo en el tronco, la base o las raíces. Suelen indicar pudrición por dentro." },
  "Cavidades, pudrición o huecos en el tronco": { corto: "Huecos en el tronco", buscar: "Huecos, madera blanda o aserrín, o zonas que suenan huecas al golpear con el puño o un mazo de goma." },
  "Ramas o frondas secas, quebradas o muertas": { corto: "Ramas secas o rotas", buscar: "Ramas sin hojas en plena época de follaje, ramas colgadas, rotas o desgarradas, o frondas secas en palmas." },
  "Hojas o frondas faltantes": { corto: "Copa rala", buscar: "La copa se ve rala o con vacíos; menos hojas de las que debería tener. Frecuente en árboles debilitados." },
  "Corteza pelada": { corto: "Corteza pelada", buscar: "Zonas sin corteza o con corteza suelta por golpes, quemaduras, plagas o enfermedades." },
  "Manchas hinchadas o protuberancias": { corto: "Bultos en el tronco", buscar: "Bultos, agallas o abultamientos en el tronco o las ramas, a veces con exudados." },
  "Hojas descoloridas": { corto: "Hojas amarillas", buscar: "Hojas amarillas, pálidas o con manchas, fuera de la caída normal de la especie." },
  "Abundancia de líquenes o epífitas": { corto: "Líquenes y epífitas", buscar: "Mucha capa gris verdosa, musgos o plantas creciendo sobre el tronco o las ramas. Indica poca vitalidad o mucha humedad." },
  "Podas inadecuadas": { corto: "Podas mal hechas", buscar: "Muñones largos, cortes al ras sin cicatrizar, topping (copa decapitada) o rebrotes muy gruesos." },
  "Plantas o amarres artificiales sobre el fuste": { corto: "Amarres o trepadoras", buscar: "Alambres, cuerdas, avisos clavados o plantas trepadoras que aprietan o cubren el tronco." },
};

/** Criterios para decidir el estado de las raíces. */
export const CRITERIOS_RAICES = {
  bueno: [
    "Raíces firmes, sin grietas ni levantamientos del suelo alrededor",
    "Cuello (la base ensanchada) visible y sin tapar",
    "Sin raíces cortadas, podridas o con hongos",
    "El suelo alrededor no se mueve al empujar el árbol",
  ],
  malo: [
    "Raíces levantadas, peladas o expuestas",
    "Raíces gruesas cortadas por zanjas, obras o andenes",
    "Hongos o pudrición en la base o en las raíces",
    "Suelo agrietado o abultado, o poca tierra para el tamaño del árbol",
  ],
} as const;

/** Criterios para decidir el estado de la rama más crítica. */
export const CRITERIOS_RAMA = {
  bueno: ["Rama viva, con hojas y corteza sana", "Bien unida al fuste, sin grietas en la unión", "Sin hongos, huecos ni pudrición"],
  malo: ["Seca, muerta o quebrada", "Mal unida: grieta o corteza incluida en la unión", "Con hongos, huecos o pudrición", "Muy larga y pesada para su grosor"],
} as const;
