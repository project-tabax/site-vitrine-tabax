import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "@/App";
import { installOriginalStyles } from "@/lib/originalAssets";

// Styles d'origine en tête AVANT le rendu (cascade correcte).
installOriginalStyles();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
