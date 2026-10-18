# Horizon Immobilier — site de démonstration

Agence immobilière **fictive** à Alger. Ce site sert d'exemple à l'article
[Site web pour agence immobilière en Algérie](https://www.sakinadz.com/site-web/site-web-agence-immobiliere-algerie) :
une vitrine avec un petit catalogue de biens, où chaque annonce ouvre une conversation WhatsApp
dont le message prérempli mentionne déjà l'intitulé et la référence du bien.

Toutes les marques, personnes, adresses, prix, surfaces et plans sont fictifs. Les pages ne sont pas indexées (`noindex, nofollow`).

## Concept

Le site se lit comme **une revue d'architecture** : couverture avec titre de revue géant, numéro et saison,
titres courants et numéros de page (folios) en tête de chaque section, figures numérotées avec légendes,
sommaire avec renvois de pages.

Les visuels des biens ne sont pas des photos mais des **plans d'appartement cotés, dessinés en SVG** :
murs, cloisons, portes avec leur débattement, fenêtres, pièces nommées avec leur surface, cotes en mètres,
échelle graphique et flèche du nord. Chaque bien a son propre plan (12 plans différents, dont une villa,
un duplex, un local, un plateau de bureaux et un terrain).

**Élément signature : « Lire un plan avec nous ».** Sur l'accueil, un écran partagé garde un plan collant
d'un côté pendant que le texte défile de l'autre ; à chaque étape (entrée, réception, cuisine, partie nuit,
pièces d'eau), les pièces concernées s'éclairent en laiton sur le plan et la légende de la figure change.
Les plans se **tracent à l'encre** à leur apparition (murs, puis cloisons, puis portes, puis étiquettes).

## Choix de design

- **Palette** : bleu nuit `#0f2742` en aplats pleine largeur (couverture, annonces en double page, citation),
  laiton `#c8a24a` pour les accents et une section d'adresse en aplat laiton, blanc cassé `#f7f5f0` comme papier.
  Un laiton foncé `#7a5c14` est utilisé pour le texte sur fond clair afin de respecter le contraste AA.
- **Typographies** : Fraunces (titres, chiffres géants des prix, folios en italique) et Manrope (texte, plans, étiquettes).
  Piles de secours : Georgia / Palatino pour Fraunces, Segoe UI / Arial pour Manrope.
- **Prix en chiffres géants**, mis en page comme des titres de magazine ; « DA » et « / mois » en petites capitales laiton.
- **Catalogue en rythme éditorial** plutôt qu'en grille de cartes identiques : doubles pages pleine largeur
  (fond nuit ou papier teinté, plan à gauche ou à droite) alternant avec des demi-pages séparées par un filet.
  Chaque annonce se termine par un **cartouche** façon plan d'architecte (surface et notes).
- Angles droits, filets fins, aucun dégradé décoratif ni ombre portée floue.

## Structure des fichiers

```
agence-immobiliere/
├── index.html             Accueil : couverture, services, « Lire un plan », 3 biens à la une, parcours WhatsApp, adresse
├── biens.html             Catalogue : sommaire des 12 biens + 12 annonces (plan SVG, prix, description, bouton WhatsApp)
├── agence.html            À propos : portrait, méthode, équipe (fictive), communes desservies
├── contact.html           Coordonnées + formulaire de démonstration (rien n'est envoyé)
├── mentions-legales.html  Mentions légales d'exemple (champs « à valider »)
├── css/style.css          Feuille de style unique (variables, grid, clamp, container queries)
├── js/main.js             Menu mobile, apparitions, tracé des plans, écran partagé, validation du formulaire
├── brief.md               Cahier des charges du site
└── source-article.md      Résumé de l'article de référence
```

Les plans sont écrits directement dans le HTML (SVG en ligne) : aucune image externe, aucune étape de build.

## Respect du périmètre de l'offre

Pas de moteur de recherche, pas de filtres, pas de comptes, pas d'agenda en ligne. Le sommaire du catalogue
n'est qu'une table des matières (liens d'ancre). Les étiquettes « Vente » / « Location » sont purement informatives.
Chaque bouton WhatsApp ouvre `https://wa.me/213000000000` avec un message du type :

> Bonjour Horizon Immobilier, je suis intéressé(e) par le bien « F3 traversant avec loggia » à Hydra (réf. HZ-101). Est-il toujours disponible ?

## Accessibilité et performance

- Lien d'évitement, focus visible (laiton ou bleu nuit selon le fond), navigation au clavier, menu mobile fermable avec Échap.
- Chaque plan SVG a un `title` et une `desc` qui listent les pièces et leurs surfaces.
- Contrastes AA vérifiés pour toutes les couleurs de texte.
- `prefers-reduced-motion` : aucune animation, plans affichés directement. Sans JavaScript, tout le contenu reste visible.
- Aucune image matricielle : SVG et CSS uniquement ; seules les polices Google sont chargées (`display=swap`).

## Lancer le site

Double-cliquez sur `index.html`, ou servez le dossier (XAMPP : copiez-le dans `htdocs/` puis ouvrez
`http://localhost/agence-immobiliere/`). Tous les chemins sont relatifs : le site fonctionne aussi depuis
GitHub Pages à l'adresse `.../sites/agence-immobiliere/`.

## Intégration dans l'article

Lien simple :

```html
<a href="https://VOTRE-COMPTE.github.io/sakinadz-demos/sites/agence-immobiliere/" target="_blank" rel="noopener">
  Voir la démo : Horizon Immobilier, vitrine catalogue d'agence immobilière
</a>
```

Aperçu intégré :

```html
<iframe
  src="https://VOTRE-COMPTE.github.io/sakinadz-demos/sites/agence-immobiliere/"
  title="Démo : site vitrine catalogue d'une agence immobilière fictive à Alger"
  width="100%" height="720" loading="lazy"
  style="border:1px solid #d9d4c7; max-width:100%;"></iframe>
```

Pour montrer directement le catalogue, remplacez l'adresse par `.../sites/agence-immobiliere/biens.html`.
