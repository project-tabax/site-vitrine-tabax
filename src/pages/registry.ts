import type { ComponentType } from "react";

// Point d'extension : associer un slug à un composant de page sur-mesure
// (découpé en sous-composants réutilisables). Tant qu'un slug n'est pas listé
// ici, il est rendu fidèlement par <CmsPage> à partir du fragment d'origine.
//
// Exemple d'évolution future :
//   import { HomePage } from "./HomePage";
//   export const customPages: Record<string, ComponentType> = { home: HomePage };
export const customPages: Record<string, ComponentType> = {};
