export const AVISO_PROBABILISTICO =
  "El cálculo es probabilístico; la decisión final corresponde al técnico evaluador";

export default function Aviso() {
  return (
    <p className="aviso" role="note">
      ⚠️ {AVISO_PROBABILISTICO}.
    </p>
  );
}
