# Riesgo de árboles urbanos

Aplicación web (PWA) para calificar en campo el riesgo de caída de árboles urbanos, **en cualquier lugar**.
Aplica la metodología del numeral 3.7 «Evaluación del riesgo en árboles urbanos» del Plan Maestro de Zonas
Públicas Verdes de Envigado (basada en el convenio AMVA 354 de 2007). Esa es la fuente de la fórmula y de la
calibración inicial; la aplicación en sí no está atada a ningún municipio (ver «Uso en otros lugares»).

- Funciona **sin señal**: la app y los datos viven en el dispositivo (service worker + IndexedDB).
- Cada evaluación lleva coordenadas (GPS o punto en el mapa) y fotos.
- Interfaz en español, con botones grandes para usar con una mano.
- Cálculo en tiempo real. **El cálculo es probabilístico; la decisión final corresponde al técnico evaluador.**

Stack: React 18 + Vite + TypeScript, Dexie (IndexedDB), Leaflet, jsPDF, Vitest.

## Requisitos

- Node.js 20 o superior y npm.

## Instalar y ejecutar

```bash
cd arboles-riesgo
npm install
npm run dev          # http://localhost:5173
```

Para verlo desde el celular en la misma red: `npm run dev -- --host`. Ojo: el GPS, la cámara y el service
worker solo funcionan en `https://` o en `localhost`, así que para probarlos en el celular conviene usar la
versión desplegada.

## Probar

```bash
npm test             # pruebas unitarias (Vitest)
npm run typecheck    # tipos
npm run build        # compila a dist/ y genera el service worker
npm run preview      # sirve dist/ en http://localhost:4173 para probar la PWA
```

Las pruebas cubren el motor de cálculo (casos 1, 2 y 3 de la especificación y los límites exactos en 30, 50 y
60 %), la validación del formulario, el catálogo de especies, filtros, resumen, exportación, importación y
sincronización.

## Desplegar

`npm run build` produce una carpeta `dist/` estática (usa rutas relativas, así que funciona en la raíz de un
dominio o en una subcarpeta). Sírvela por **HTTPS** desde cualquier alojamiento estático:

- **Netlify / Vercel / Cloudflare Pages:** comando de build `npm run build`, carpeta de salida `dist`.
- **GitHub Pages:** publica el contenido de `dist/` en la rama de páginas.
- **Servidor propio (nginx, Apache):** copia `dist/` a la carpeta pública y sirve con HTTPS. No se necesita
  ninguna regla de reescritura: es una aplicación de una sola página sin rutas.

### Instalación en el celular

1. Abre la dirección desplegada en Chrome (Android) con señal y espera a que cargue por completo la primera vez.
2. Menú ⋮ → *Instalar aplicación* (o *Añadir a la pantalla de inicio*).
3. Abre la app una vez con señal: desde ahí funciona sin conexión.
4. Acepta el permiso de ubicación cuando se pida. La app solicita además almacenamiento persistente para que
   el navegador no borre los datos si falta espacio.

Al publicar una versión nueva, la app se actualiza sola la siguiente vez que se abre con señal.

## Uso

| Pestaña | Qué hace |
|---|---|
| **Evaluar** | Formulario por árbol. Barra de riesgo fija arriba, desglose y acción recomendada al final. |
| **Lista** | Evaluaciones guardadas, con filtros por categoría de riesgo, especie y categoría diamétrica. Ficha PDF y eliminar. |
| **Mapa** | Puntos coloreados por categoría (mismos filtros). |
| **Resumen** | Tablas 65 y 66, exportación (CSV, GeoJSON), importación desde CSV y sincronización opcional. |
| **Ajustes** | Umbrales de las categorías de riesgo y catálogo editable de especies con sus factores Sp. |

No se puede guardar una evaluación si falta alguna variable obligatoria: el formulario marca los campos
pendientes. Las variables de riesgo no traen valores por defecto, para que ninguna quede asumida sin querer.
Si el técnico elige una decisión final distinta de la calculada, debe escribir la justificación.

## Metodología implementada

Variables categóricas: solo 1/3, 2/3 o 1. Variables dicotómicas: 0 o 1. Mayor valor = mayor riesgo.

- **Volcamiento:** `Vo = (T + Sp + Eg + I) / 4` — altura del árbol (menos de 10 m = 1/3; 10 a 20 m = 2/3; más de
  20 m = 1), especie, estado general (bueno = 0; regular o malo = 1), inclinación (más de 30° = 1).
- **Caída de ramas:** `Cr = (T + Sp + Eg + H) / 4` — se califica la rama más crítica: diámetro (más de 5 cm = 1),
  especie, estado de la rama, altura (más de 5 m = 1).
- **Raíces:** `Ra` = 0 (buen estado) o 1 (mal estado).
- **Amenaza:** `A = (Vo + Cr + Ra) / 3`.
- **Vulnerabilidad:** `V = 1` si hay al menos uno entre personas, vehículos, construcciones o redes aéreas
  (las subterráneas no cuentan); si no, `V = 0`.
- **Riesgo:** `A × V`, como proporción y como porcentaje.

Pendiente y sitio de siembra se registran como datos descriptivos y **no entran en el cálculo** (numeral 3.7.5:
no fueron estadísticamente significativos).

### Umbrales editables

En **Ajustes → Umbrales de riesgo** se cambian, por categoría: el límite superior en %, si el valor exacto del
límite pertenece a esa categoría o a la siguiente, la acción recomendada y el color. El nombre y el orden de las
cuatro categorías son fijos. La pantalla muestra los rangos resultantes y no deja guardar límites que no sean
crecientes, que pasen de 100 %, o colores y acciones vacíos. «Restaurar Tabla 64» vuelve a los valores iniciales.

Los umbrales se guardan en el dispositivo (no en el archivo de configuración): cada celular tiene los suyos, así
que conviene fijarlos igual en todos los equipos de un proyecto. Las evaluaciones ya guardadas **conservan la
categoría con la que se calcularon**; si cambias los umbrales, la app avisa cuántas quedarían en otra categoría y
ofrece «Recalcular», que no toca la decisión final del técnico y las marca como pendientes de sincronizar. Los
valores iniciales siguen en [`src/config/umbrales.json`](src/config/umbrales.json).

### Decisiones donde el documento no define el límite

El documento no precisa qué pasa justo en los bordes. Quedaron así y se pueden cambiar:

- **Categorías (Tabla 64)**, valores iniciales en [`src/config/umbrales.json`](src/config/umbrales.json) y editables en Ajustes: Bajo < 30; Medio-Bajo desde
  30 hasta menos de 50; Medio-Alto desde 50 hasta 60 inclusive; Alto > 60. Cada categoría tiene `hasta`,
  `inclusivo`, color y acción. La comparación tolera ruido de coma flotante en los bordes.
- **Variables**, en `LIMITES` de [`src/engine/riesgo.ts`](src/engine/riesgo.ts): 10 y 20 m exactos cuentan como
  2/3; una rama de exactamente 5 cm o a exactamente 5 m cuenta como 0; 30° exactos cuentan como 0.

### Uso en otros lugares

La fórmula no depende del sitio: cualquier árbol de cualquier ciudad se califica con las mismas variables. Lo que
sí conviene revisar al salir de Envigado:

- **Zona o proyecto:** cada evaluación admite una zona (municipio, barrio, parque, proyecto), que se recuerda
  entre árboles, aparece en la lista, el CSV, el GeoJSON y la ficha PDF, y no entra al cálculo. Los códigos de árbol
  deben ser únicos en todo el dispositivo, así que conviene incluir un prefijo de zona.
- **Mapa:** no hay centro fijo. Sin evaluaciones guardadas se abre en vista mundial y se acerca a tu posición si
  das permiso de ubicación; con evaluaciones, se ajusta a ellas.
- **Catálogo de especies:** la lista inicial y su calibración (eucalipto = 1, el resto 1/3) vienen de Envigado.
  Cualquier especie que no esté en el catálogo usa 2/3 («sin información»), así que la app sirve con especies de
  cualquier parte. Para una región nueva, edita los factores, **importa tu propio catálogo en CSV** o vacíalo.
- **Umbrales de categoría:** los iniciales son los de la Tabla 64 (30 / 50 / 60 %), definidos con el grupo de
  interventores de la región del estudio. Si tu entidad usa otros, edítalos en la app (ver «Umbrales editables»).
- **Idioma:** la interfaz está en español; las unidades son métricas.

### Catálogo de especies

[`src/config/especies.seed.json`](src/config/especies.seed.json) trae 38 especies de las Tablas 67 y 68.
Calibración del numeral 3.7.5: *Eucalyptus* spp. = 1 en volcamiento y en caída de ramas; las demás = 1/3.
Una especie que no está en el catálogo, o «Indeterminado», usa 2/3. En la pestaña **Especies** se puede editar
cada factor entre 1/3, 2/3 y 1 cuando haya información, y exportar o importar el catálogo como CSV
(`cientifico, comun, sp_volcamiento, sp_caida_ramas`; admite `1/3`, `2/3`, `1` o sus decimales; si una especie
ya existe se actualiza y las demás no se tocan). La semilla se carga solo la primera vez; *Restaurar*
vuelve a los valores de la semilla sin borrar las especies agregadas.

## Inventario (campos opcionales)

Además del cálculo de riesgo, cada árbol admite los datos de una ficha técnica de inventario. Son **opcionales y
no entran en el cálculo**; se llenan en la tarjeta «Inventario (opcional)» (tocar de nuevo una opción la quita):

- **Botánica:** familia, hábito (árbol o palma), madurez (juvenil o adulto), origen (nativa o introducida), fustes.
- **Estado:** diámetro de copa, fenología, estado fitosanitario y estructural (bueno, regular o deficiente),
  prioridad de intervención (alta, media o baja), interferencia con redes o mobiliario.
- **Manejo:** tomografía (sí o no), tratamiento realizado (ninguno, drench, endoterapia), tratamiento recomendado.
- **Diagnóstico u observaciones:** texto libre (es el campo «observaciones»).

La familia y el origen se ofrecen automáticamente si ya evaluaste otro árbol de la misma especie. Ojo: el *estado
general* del cálculo (bueno o regular/malo) y el *estado fitosanitario y estructural* del inventario son campos
distintos; el primero entra en la fórmula y el segundo no.

La **ficha PDF** sigue los bloques de una ficha técnica de registro de individuos arbóreos (información
operativa y fotografía, identificación botánica, medidas dasométricas y estado, diagnóstico, recomendaciones de
intervención, coordenadas) y agrega la evaluación del riesgo. El **Resumen** suma un inventario por especie, con
origen, nativas frente a introducidas, y conteos por prioridad y estado.

## Datos, exportación e importación

- Todo se guarda en IndexedDB del navegador del dispositivo. **Borrar los datos del sitio borra las
  evaluaciones**: exporta un CSV con regularidad como copia de seguridad.
- **CSV:** columnas de entrada (las mismas que lee la importación) y de resultado. Con BOM UTF-8 para Excel.
- **Coordenadas planas (Colombia):** el CSV y las propiedades del GeoJSON incluyen `x_origen_nacional` y
  `y_origen_nacional` (MAGNA-SIRGAS / Origen Nacional, EPSG:9377, en metros), calculadas desde lat y lon con proj4;
  la ficha PDF y el formulario también las muestran. Se dejan vacías si el punto está fuera de Colombia. Al
  importar, si el CSV no trae `lat` y `lon` pero sí X/Y, la app las convierte a WGS84; si no caen en Colombia, la fila
  se rechaza. No hay captura manual en el formulario: la ubicación se toma por GPS, por el mapa o por CSV.
- **GeoJSON:** `FeatureCollection` de puntos en EPSG:4326, coordenadas `[lon, lat]`, con todas las propiedades
  y un campo `color`. Las evaluaciones sin coordenadas se omiten.
- **Ficha PDF:** una por árbol, desde la pestaña Lista (formato de ficha técnica más evaluación de riesgo).
- **Importación:** acepta el CSV exportado o la plantilla (descargable en Resumen). Admite coma o punto y coma,
  coma decimal y «Sí/No». Antes de importar muestra las filas con errores; solo se importan las válidas.
  Los códigos deben ser únicos.

Columnas de entrada: `codigo, especie, evaluador, fecha, zona, lat, lon, dap, cat_diametrica, altura_m,
estado_general, inclinacion_grados, rama_diametro_cm, rama_estado, rama_altura_m, raices, personas, vehiculos,
construcciones, redes_aereas, pendiente, sitio_siembra, observaciones, familia, habito, madurez, origen, fustes, diametro_copa_m, fenologia,
estado_fitosanitario, prioridad, tomografia, tratamiento_realizado, interferencia, recomendacion, decision_final,
justificacion`. Las de inventario (de `familia` a `recomendacion`) pueden faltar.

## Sincronización (opcional)

Sin servidor la app sirve completa. Si tienes uno, en **Resumen → Sincronización** escribe su dirección. Cuando
hay señal envía las evaluaciones nuevas, por lotes de 50:

```
POST <dirección>
Content-Type: application/json
Authorization: Bearer <token>        (solo si se escribió un token)

{ "version": 1,
  "evaluaciones": [ { "codigo": "A-001", "creada": 0, "actualizada": 0, "especie": "…",
                      "catDiametrica": "Fustal", "categoriaId": "alto", "categoriaNombre": "Alto",
                      "form": { … }, "resultado": { "Vo": 0, "Cr": 0, "Ra": 0, "A": 0, "V": 0, "riesgo": 0, "porcentaje": 0 } } ] }
```

El servidor debe responder 2xx cuando guardó el lote y hacer *upsert* por `codigo`. Ante cualquier otra
respuesta el lote queda pendiente y se reintenta. Limitaciones de esta versión: **las fotos no se envían**, el
servidor y su CORS los pone el usuario (esta app no incluye backend), y el token queda guardado sin cifrar en el
dispositivo.

## Estructura

```
src/
├─ engine/      Motor de cálculo puro (sin React ni DOM) y sus pruebas
├─ config/      umbrales.json (Tabla 64) y especies.seed.json
├─ db/          Dexie: especies, evaluaciones, fotos
├─ lib/         Filtros, resumen, CSV, exportar, importar, ficha PDF, sincronización
├─ components/  Controles reutilizables y aviso probabilístico
└─ features/    evaluacion, lista, mapa, resumen, especies, sync
```

## Limitaciones conocidas

- El mapa base (OpenStreetMap) solo se ve sin señal en las zonas que ya se miraron con conexión; se guardan hasta
  30 días. No hay descarga masiva de teselas, porque la política de uso de OpenStreetMap no la permite.
- No hay edición de una evaluación ya guardada (solo crear y eliminar).
- La ubicación se guarda en WGS84. Las coordenadas planas son solo para Colombia (MAGNA Origen Nacional); otros sistemas planos no están soportados.
- Verificado en el navegador de escritorio, incluido el arranque sin servidor con el service worker. Falta
  probar en un celular real el GPS, la cámara y la instalación.
