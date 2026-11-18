import type { ReactNode } from "react";
import { LIMITES, SENALES_ALERTA } from "../../engine";
import { describirRangos, useCategorias } from "../../lib/categorias";
import { DESCRIPCION_MODO } from "../../lib/metodo";

function Tema({ titulo, abierto, children }: { titulo: string; abierto?: boolean; children: ReactNode }) {
  return (
    <details className="card tema" open={abierto}>
      <summary>{titulo}</summary>
      <div className="tema-cuerpo">{children}</div>
    </details>
  );
}

/** Guía corta de la metodología y de cómo medir en campo. Los valores salen de las mismas constantes del cálculo. */
export default function AprenderPage() {
  const categorias = useCategorias();
  const rangos = describirRangos(categorias);
  return (
    <>
      <section className="card">
        <h2>Aprender y guía</h2>
        <p className="muted">
          Cómo se calcula el riesgo, cómo medir en campo y qué significa cada resultado. Metodología del convenio AMVA 354
          de 2007, tal como la recoge el numeral 3.7 del Plan Maestro de Zonas Públicas Verdes de Envigado.
        </p>
      </section>

      <Tema titulo="¿Cómo se calcula el riesgo?" abierto>
        <p>El riesgo combina la <b>amenaza</b> (qué tan probable es que el árbol o sus ramas caigan) con la <b>vulnerabilidad</b> (qué hay expuesto debajo):</p>
        <ul>
          <li><b>Volcamiento</b> Vo = (T + Sp + Eg + I) / 4: altura del árbol, especie, estado general e inclinación.</li>
          <li><b>Caída de ramas</b> Cr = (T + Sp + Eg + H) / 4: diámetro, especie, estado y altura de la rama más crítica.</li>
          <li><b>Raíces</b> Ra: 0 si están bien, 1 si están mal.</li>
          <li><b>Amenaza</b> A = (Vo + Cr + Ra) / 3.</li>
          <li><b>Riesgo</b> = A × V, en proporción y en porcentaje.</li>
        </ul>
        <p>Las variables categóricas valen 1/3, 2/3 o 1; las de sí o no valen 0 o 1. El valor más alto es siempre el de mayor riesgo.</p>
        <table className="tabla guia">
          <thead><tr><th>Variable</th><th>Valor</th></tr></thead>
          <tbody>
            <tr><td>Altura del árbol</td><td>menos de {LIMITES.arbolBajoM} m = 1/3 · {LIMITES.arbolBajoM} a {LIMITES.arbolAltoM} m = 2/3 · más de {LIMITES.arbolAltoM} m = 1</td></tr>
            <tr><td>Inclinación</td><td>hasta {LIMITES.inclinacionGrados}° = 0 · más de {LIMITES.inclinacionGrados}° = 1</td></tr>
            <tr><td>Diámetro de la rama</td><td>hasta {LIMITES.ramaDiametroCm} cm = 0 · más de {LIMITES.ramaDiametroCm} cm = 1</td></tr>
            <tr><td>Altura de la rama</td><td>hasta {LIMITES.ramaAlturaM} m = 0 · más de {LIMITES.ramaAlturaM} m = 1</td></tr>
            <tr><td>Estado (árbol, rama, raíces)</td><td>bueno = 0 · regular o malo = 1</td></tr>
            <tr><td>Especie (Sp)</td><td>se sabe que no se vuelca o no pierde ramas = 1/3 · sin información = 2/3 · se sabe que sí = 1</td></tr>
          </tbody>
        </table>
        <p className="muted">Pendiente y sitio de siembra se registran, pero no entran en el cálculo: el numeral 3.7.5 no los halló estadísticamente significativos.</p>
      </Tema>

      <Tema titulo="Vulnerabilidad: qué hay expuesto">
        <p>Se mira si hay <b>personas</b> (transitan, permanecen o viven cerca), <b>vehículos</b>, <b>construcciones</b> o <b>redes aéreas</b> cerca de la copa, las ramas o el fuste. Las redes subterráneas no cuentan.</p>
        <p>Hay dos formas de convertirlo en un número; se elige en Ajustes:</p>
        <ul>
          {(["al-menos-uno", "promedio"] as const).map(m => (
            <li key={m}><b>{DESCRIPCION_MODO[m].titulo}:</b> {DESCRIPCION_MODO[m].formula}.</li>
          ))}
        </ul>
        <p className="muted">Con el mismo árbol pueden dar categorías distintas: usa siempre el mismo dentro de un inventario.</p>
      </Tema>

      <Tema titulo="Qué significa el resultado">
        <ul className="categorias-guia">
          {categorias.map((c, i) => (
            <li key={c.id}>
              <i className="punto" style={{ background: c.color }} />
              <span><b>{rangos[i]}</b><br />{c.accion}</span>
            </li>
          ))}
        </ul>
        <p className="muted">Los límites se pueden cambiar en Ajustes. El cálculo es probabilístico: la decisión final corresponde al técnico evaluador, y si difiere del resultado debe justificarla.</p>
      </Tema>

      <Tema titulo="Cómo medir en campo">
        <ul>
          <li><b>DAP</b> (diámetro a la altura del pecho): a 1,30 m desde la base. En terreno inclinado o con el árbol inclinado, mide desde el lado más cercano al suelo. Con bambas, raíces aéreas, heridas o bifurcaciones a esa altura, mide en el punto óptimo de medición (POM).</li>
          <li><b>Altura total:</b> en vertical, desde el suelo donde está anclado hasta el ápice de la copa.</li>
          <li><b>Inclinación:</b> ángulo del fuste respecto a la vertical. Más de {LIMITES.inclinacionGrados}° cuenta como inclinado.</li>
          <li><b>Rama crítica:</b> califica la más peligrosa del árbol, no un promedio. En palmas, la hoja (fronda) más crítica.</li>
          <li><b>Distancia a la construcción:</b> del fuste a la construcción más cercana. Si es menor que la altura del árbol, la construcción está dentro de su alcance de caída.</li>
          <li><b>Pendiente:</b> 100 % equivale a 45°. Se convierte con % = tan(°) × 100.</li>
          <li><b>Ubicación:</b> con GPS o tocando el mapa. Mejor a cielo abierto y esperando a que la precisión baje de unos 10 m.</li>
        </ul>
      </Tema>

      <Tema titulo="Señales de alerta">
        <p>Marca las que veas en la tarjeta de inventario. Ayudan a decidir el estado general y a redactar el diagnóstico:</p>
        <ul>{SENALES_ALERTA.map(s => <li key={s}>{s}</li>)}</ul>
      </Tema>

      <Tema titulo="Alcance y límites">
        <ul>
          <li>La evaluación es una <b>inspección visual externa</b>. No mide pudriciones internas ni el sistema radicular enterrado; para eso hacen falta pruebas como la tomografía.</li>
          <li>No evalúa el estado estructural de <b>terrazas, muros o rellenos</b> donde esté plantado el árbol: eso requiere un profesional competente.</li>
          <li>Una especie <b>amenazada</b> (CR, EN o VU) exige permiso de la autoridad ambiental para talarla o trasplantarla, y suele exigir compensación.</li>
          <li>Una especie fuera del catálogo se trata como «sin información» (2/3). Mientras más especies tengas bien calibradas, más confiable el resultado.</li>
        </ul>
      </Tema>
    </>
  );
}
