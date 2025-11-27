# Compliance Map (React + Vite)

Application monopage de visualisation et d’édition de données de conformité par pays. Elle s’appuie sur une carte SVG interactive, un back-office intégré et le stockage local via `localStorage`. Aucun backend ni dépendance CDN n’est nécessaire.

## Fonctionnalités principales
- Carte du monde SVG interactive (hover + modal sur clic).
- Légendes colorées par groupes de pays et valeurs par pays.
- Back-office intégré pour créer/éditer/supprimer groupes, champs de fiche et valeurs par pays.
- Gestion multi jeux de données (duplication, suppression, sélection).
- Zoom contrôles, focus rapide sur l’Europe.
- Fiches pays dynamiques (champs configurables pour infobulle et modal).
- Persistance locale, export/import JSON, réinitialisation instantanée.

## Structure du projet
```
public/
  world.svg
src/
  components/ (MapView, LegendPanel, AdminPanel, CountryModal, CountryForm)
  services/storageService.js
  App.jsx
  main.jsx
  index.css
```

## Démarrage rapide
1. Installer les dépendances (nécessite Node 18+) :
   ```bash
   npm install
   ```
2. Lancer le serveur de développement :
   ```bash
   npm run dev
   ```
3. Construire pour production :
   ```bash
   npm run build
   ```
4. Prévisualiser le build :
   ```bash
   npm run preview
   ```

## Configuration & données
- Toutes les données sont stockées dans `localStorage` sous la clé `compliance-map-data`.
- `storageService.js` centralise la lecture/écriture, l’export/import JSON et la réinitialisation.
- Un jeu de données par défaut est fourni, duplicable depuis l’UI.

## Déploiement GitHub Pages
Le projet est compatible avec GitHub Pages :
- Construisez avec `npm run build`.
- Publiez le contenu du dossier `dist/` (par exemple via l’action GitHub Pages ou `npm run deploy` si vous ajoutez un script dédié).

## Accessibilité & UX
- Design responsive (desktop/laptop), palette sombre, transitions douces.
- Infobulle contextuelle et modal détaillé.
- Back-office en panneaux cartés pour une édition guidée.

## Version
- Numéro de version affiché dans le footer : **1.0.1**.
