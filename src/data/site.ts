// Données du site centralisées (menu, contacts, réseaux sociaux, liens externes).
// Modifier ici plutôt que dans le markup.

export interface NavItem {
  label: string;
  to: string;
  children?: NavItem[];
}

export const mainNav: NavItem[] = [
  { label: "Accueil", to: "/" },
  {
    label: "Le Parti",
    to: "/historique/",
    children: [
      { label: "Historique", to: "/historique/" },
      { label: "Le Président", to: "/le-president/" },
    ],
  },
  { label: "Projet de Société", to: "/projet-de-societe/" },
  { label: "Actualité", to: "/69418-2/" },
  { label: "Galerie", to: "/galerie/" },
];

export const contact = {
  emails: ["contact@tabax-construire.com"],
  membershipFormUrl:
    "https://docs.google.com/forms/d/e/1FAIpQLScqTlCJr_ayAOjnx0vEHdSuxV5MCsyJcTDKPd9cQ7FbGjWLYA/viewform",
};

export const externalLinks = {
  facebook: "https://www.facebook.com/",
  x: "https://x.com/",
  instagram: "https://www.instagram.com/",
};

// Piliers de la vision (page d'accueil) — centralisés pour réutilisation.
export const pillars = [
  { key: "gouvernance", title: "Gouvernance éthique" },
  { key: "economie", title: "Économie souveraine" },
  { key: "capital-humain", title: "Capital humain" },
  { key: "societe", title: "Société inclusive" },
  { key: "diaspora", title: "Diaspora mobilisée" },
  { key: "environnement", title: "Environnement durable" },
];
