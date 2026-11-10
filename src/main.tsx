import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { sembrarEspecies } from "./db/db";
import "./styles.css";

// Pide almacenamiento persistente para que el navegador no borre los datos de campo si falta espacio
navigator.storage?.persist?.().catch(() => {});

sembrarEspecies().finally(() => {
  createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
});
