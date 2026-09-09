# Tabax Construire — version React

Migration du site (WordPress/Elementor) vers **React 18 + TypeScript + Vite**.
Objectif : **même design, même contenu, mêmes fonctionnalités** que l'original,
avec une architecture propre et maintenable.

## Stratégie de fidélité

Le design est reproduit **à l'identique** en réutilisant le CSS/JS d'origine
(thème ThemeREX « Progress » + Elementor + plugins). L'app ne réécrit pas les
styles : elle ré-émet le markup d'origine et le sert avec ses feuilles de style,
ce qui garantit un rendu pixel-identique sans risque de régression visuelle.
L'amélioration porte sur **l'architecture, le typage et la maintenabilité**.

Périmètre : les **9 pages du parti** (Accueil, Historique, Le Président, Projet
de société, Actualité, Galerie, Contact, Adhésion, Don).

## Démarrage

```bash
cd react-app
npm install
npm run prepare-mirror   # extrait les fragments + copie les assets d'origine dans public/
npm run dev              # http://127.0.0.1:5173
```

`prepare-mirror` = `extract` (miroir → fragments React) + `sync-assets`
(copie `wp-content/`, `wp-includes/`, `_ext/` depuis `../mirror-tabax` vers
`public/`, non versionnés car volumineux et reproductibles).

## Déploiement VPS avec PM2

Cette application est pensée pour être déployée comme un site statique servi
depuis un VPS. Le principe est simple :

1. cloner le dépôt React sur le serveur,
2. lancer `deploy.sh`,
3. servir le dossier `dist/` avec PM2.

### Arborescence recommandée sur le VPS

```bash
/var/www/site-tabax/
└── react-app/
```

### Prérequis serveur

- `git`
- `node` et `npm`
- `pm2`

### Étapes de déploiement

```bash
# 1) Créer le dossier de travail
sudo mkdir -p /var/www/site-tabax
sudo chown -R $USER:$USER /var/www/site-tabax
cd /var/www/site-tabax

# 2) Cloner le dépôt React
git clone git@github.com:project-tabax/site-vitrine-tabax.git react-app

# 3) Rendre le script exécutable et lancer le déploiement
cd /var/www/site-tabax/react-app
chmod +x deploy.sh
./deploy.sh

# 4) Initialiser PM2 au démarrage du serveur, une seule fois
pm2 startup
```

### Mise à jour

Quand une nouvelle version est poussée sur GitHub, relance simplement :

```bash
cd /var/www/site-tabax/react-app
./deploy.sh
```

Le script affiche à la fin le port utilisé et l'URL de test sur l'IP du
serveur.

### Variante avec écosystème PM2

Si tu préfères, tu peux remplacer la commande `npx serve` par un fichier
`ecosystem.config.cjs` et démarrer le site avec :

```bash
pm2 start ecosystem.config.cjs
```

Dans ce cas, le serveur PM2 doit pointer vers `dist/` après le build.

## Architecture

```
src/
├── main.tsx / App.tsx        Point d'entrée + Router
├── routes.tsx                Routage centralisé (généré depuis le manifeste)
├── layouts/
│   └── SiteLayout.tsx        Header + Outlet + Footer ; interception des liens internes
├── components/
│   ├── SiteHeader/Footer.tsx Header & footer communs (fragments d'origine)
│   ├── CmsPage.tsx           Page générique : charge contenu + styles inline + réinit JS
│   └── HtmlFragment.tsx      Rendu d'un fragment HTML d'origine
├── pages/
│   └── registry.ts           Point d'extension : slug → composant sur-mesure
├── hooks/
│   └── useOriginalAssets.ts  Injection unique des CSS/JS d'origine + réinit best-effort
├── services/                 Points d'intégration back-end (typés, prêts à brancher)
│   ├── apiClient.ts          Client HTTP (VITE_API_BASE_URL)
│   ├── contactService.ts     POST /contact
│   ├── membershipService.ts  Adhésion (Google Forms + POST /memberships)
│   └── donationService.ts    POST /donations
├── data/site.ts              Menu, contacts, réseaux, piliers (centralisé)
├── content/                  Fragments générés (header, footer, pages/, inline/)
└── generated/                pages.ts (manifeste) + assets.ts (union CSS/JS) — générés
```

### Principes

- **Routage** centralisé et dérivé d'un manifeste (`generated/pages.ts`). Les
  liens internes des fragments sont interceptés pour une navigation client.
- **Séparation** claire pages / composants / layouts / services / hooks / données.
- **Données et config centralisées** dans `data/` (aucune donnée en dur dispersée).
- **Back-end à venir** : la couche `services/` fige les contrats ; tant que
  `VITE_API_BASE_URL` n'est pas défini, les envois renvoient « non configuré ».
- **Évolutivité** : chaque page peut être progressivement recodée en composants
  natifs en l'enregistrant dans `pages/registry.ts`, sans toucher au routage.

## Limites connues

- L'interactivité pilotée par le JS d'origine (menu mobile, sliders, compteurs)
  est réinitialisée en **best-effort** à chaque navigation client ; le rendu
  visuel reste fidèle même si une interaction se dégrade.
- Les fonctionnalités serveur (envoi contact, don, adhésion native) nécessitent
  le back-end à brancher via `services/`.
