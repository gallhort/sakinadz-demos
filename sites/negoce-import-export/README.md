# Tamarisk Trade : site de démonstration d'une société de négoce (en anglais)

Site vitrine **fictif** d'une société d'import-export basée à Alger. Il illustre l'article
[Site web pour import-export et négoce en Algérie](https://www.sakinadz.com/site-web/site-web-import-export-negoce-algerie) :
un partenaire étranger doit pouvoir vérifier en quelques secondes que la société existe, ce qu'elle fait et comment la joindre directement.

Toutes les informations (nom, adresse, coordonnées, couloirs commerciaux, familles de produits) sont inventées. Le site est en anglais, comme le recommande l'article pour un acteur tourné vers l'export.

## Concept

**« Le manifeste »** : le site emprunte son langage visuel aux documents du commerce international (connaissement, manifeste de chargement, tableau des départs d'un port) et le pose sur une carte du monde en points, centrée sur Alger.

- **Élément signature** : une carte du monde en matrice de points, plein écran, d'où partent des routes commerciales ambrées tracées depuis Alger, parcourues par de petites « cargaisons » animées. Plus bas, un **tableau des départs** interactif (TT-01 à TT-11) : sélectionner un couloir l'allume sur la carte, avec son mode (mer/route) et un temps de transit honnêtement marqué « TBC ».
- **Crédibilité sans invention** : aucune certification, aucun chiffre d'affaires, aucun volume. Les données manquantes sont affichées comme telles (« TBC », « To be provided »), y compris dans un bloc « Before you sign, check us » qui liste ce qu'un partenaire peut vérifier.
- **Horloges réelles** des fuseaux partenaires (Alger, Marseille, Istanbul, Dubaï, Shanghai, São Paulo, Houston), avec l'état ouvert/fermé du bureau calculé à l'heure d'Alger.

## Choix de design

- **Palette** : bleu pétrole `#12324a` (et sa nuit `#0b2233`), ambre `#e0b84c`, gris clair `#f4f6f8`. L'ambre sert de couleur de signal (routes, bandeau, couloir actif), jamais de texte sur fond clair (on utilise alors un ambre foncé `#8a6410`, contraste 4,96:1).
- **Typographie** : IBM Plex Serif en titres monumentaux (jusqu'à 10,5 rem, italique pour la seconde ligne), IBM Plex Sans en chiffres tabulaires pour les données. Piles de secours : Georgia / Helvetica Neue, Arial.
- **Grille corporate franche** : filets de 1 et 2 px, tableaux de type document (manifeste de services, tableau des départs, fiche société, mentions légales), quadrillage de méridiens en fond des en-têtes.
- **Mouvement** : tracé des routes au chargement, cargaisons animées (requestAnimationFrame, en pause hors écran), bandeau défilant des familles de produits, tampon circulaire en rotation lente, apparitions au défilement. Tout est désactivé avec `prefers-reduced-motion` ; le contenu reste visible sans JavaScript.
- **Contact toujours visible** : numéro dans l'en-tête collant, registre e-mail / téléphone / WhatsApp en bas du premier écran, adresse e-mail monumentale en fin de page.
- **Légèreté** : aucune image matricielle. La carte du monde est un SVG de 36 Ko (1,6 Ko compressé) généré à partir des données géographiques du domaine public Natural Earth, puis réutilisé et mis en cache sur toutes les pages. Accueil : environ 110 Ko hors polices.

## Structure des fichiers

```
negoce-import-export/
├── index.html        Accueil : carte héros, familles de produits, manifeste des 6 services,
│                     tableau des départs interactif, vérifications, horloges, contact
├── services.html     Les 6 services (familles de produits, sourcing, contrôle qualité,
│                     transport, douane, livraison) avec chaîne de navigation
├── about.html        Société, expérience (valeurs « TBC »), méthode, marchés + carte
├── contact.html      E-mail, téléphone, WhatsApp, siège avec carte méditerranéenne, horaires
├── legal.html        Mentions légales : emplacements « company name » et « registration numbers »
├── css/style.css     Feuille de style unique (variables, grid, clamp, container queries)
├── js/main.js        Menu mobile, apparitions, horloges, cartes et routes, tableau des départs
├── img/world-dots.svg  Carte du monde en points (équirectangulaire, 1 unité = 0,8°)
├── img/med-dots.svg    Carte de la Méditerranée en points (page contact)
├── img/favicon.svg
├── brief.md / source-article.md
└── README.md
```

Projections utilisées par `js/main.js` pour placer les routes : monde `x = (lon + 180) × 1,25`, `y = (78 − lat) × 1,25` ; Méditerranée `x = (lon + 14) × 4`, `y = (52 − lat) × 4`.

## Lancer le site

Aucune installation ni compilation : double-cliquez sur `index.html`, ou servez le dossier avec XAMPP, `python3 -m http.server` ou GitHub Pages. Tous les chemins sont relatifs.

## Avant une mise en ligne réelle

- Remplacer les emplacements « To be provided / TBC » (raison sociale, forme juridique, RC, NIF, NIS, AI, hébergeur, date de création, horaires) par les informations officielles du client.
- Ne lister une certification qu'avec son numéro et son organisme émetteur.
- Retirer le bandeau « Demo website – fictitious content » et la balise `noindex, nofollow`.

## Intégration dans l'article

Lien direct :

```
https://<utilisateur>.github.io/sakinadz-demos/sites/negoce-import-export/
```

Exemple d'iframe :

```html
<iframe
  src="https://<utilisateur>.github.io/sakinadz-demos/sites/negoce-import-export/"
  title="Démo : site d'une société de négoce import-export (Tamarisk Trade, contenu fictif)"
  width="100%" height="720" loading="lazy"
  style="border:1px solid #c9d3db;border-radius:4px"></iframe>
```
