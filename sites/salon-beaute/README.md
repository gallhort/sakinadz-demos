# Salon Lumière : coiffure et beauté (site de démonstration)

Site vitrine **fictif** d'un salon de coiffure et de beauté à Hydra (Alger). Il illustre l'article
[Site web pour salon de coiffure et de beauté en Algérie](https://www.sakinadz.com/site-web/site-web-salon-coiffure-beaute-algerie) :
une cliente choisit surtout visuellement (ambiance, prestations, prix), puis demande son rendez-vous
par WhatsApp, sans système de réservation lourd.

Marque, adresse, numéros, tarifs et textes sont inventés. Les pages portent un bandeau
« Site de démonstration – contenu fictif » et `noindex, nofollow`.

## Concept

**Une couverture de magazine de mode.** L'accueil s'ouvre comme un numéro de magazine (« N°01 · Saison d'automne ») :
le mot *Lumière* en italique géante traverse une arche noire et passe derrière un miroir ovale en or rose.
Le titre est en `mix-blend-mode: difference` : noir sur le rose poudré, il devient rose en entrant dans l'arche.

Éléments signature :
- **Rideau d'ouverture** : deux pans noirs liserés d'or rose s'écartent sur le mot *Lumière* (une fois par visite).
- **Ruban de satin** : un double trait or rose et rose se déroule au fil du défilement dans les sections noires.
- **Reflet du miroir** qui glisse périodiquement, **tampon rond** qui tourne, sections qui se révèlent en rideau.
- **Curseur ovale** (forme de miroir) sur ordinateur, qui grossit sur les liens et affiche « Voir » sur les planches.
  Le curseur système reste visible ; tout cela est désactivé au tactile et en mouvement réduit.
- **Préparateur de message WhatsApp** présenté comme une carte en arche : prestation, jour, créneau, prénom facultatif,
  aperçu du message en direct, bouton « Ouvrir dans WhatsApp » et « Copier le message ».
  Il est dit clairement que ce n'est **pas une réservation**.

## Choix de design

- Palette : rose poudré `#f2c9c4`, noir `#1b1b1b`, or rose `#b76e79`, plus deux dérivés pour le texte :
  `#7a3a46` (or rose foncé, texte sur rose : 5,5:1) et `#e0aab1` (or rose clair, texte sur noir : 8,7:1).
  L'or rose pur ne fait que 2,5:1 sur le rose : il n'y est employé qu'en décor (rubans, cadres, miroir) ;
  sur noir (4,5:1) il sert aux grands titres en italique.
- Polices : Cormorant Garamond (titres, italique monumentale) et Jost (texte, capitales espacées), `display=swap`,
  avec piles de secours (Garamond / Times, Futura / Century Gothic / system-ui).
- Formes récurrentes : arches, ovales de miroir, angles coupés. Tarifs en grand serif, numéros 01 à 06 en italique.
- Galerie : 8 planches SVG (outils, matières, ambiance), aucune photo ni représentation de personne,
  mise en page asymétrique et visionneuse au clavier (flèches, Échap).
- « Ouvert maintenant / Fermé » calculé à l'heure d'Alger (UTC+1 toute l'année), quel que soit le fuseau de l'appareil.

## Structure des fichiers

```
sites/salon-beaute/
├── index.html             Accueil : couverture, manifeste, carte, galerie, préparateur WhatsApp, horaires
├── prestations.html       Les 6 prestations détaillées, bon à savoir, préparateur WhatsApp
├── galerie.html           8 planches illustrées + visionneuse
├── a-propos.html          Histoire, repères, principes
├── contact.html           Coordonnées, horaires, plan schématique SVG, accès
├── mentions-legales.html  Mentions (champs « à compléter » / « à valider »)
├── css/style.css          Feuille de style unique (variables, grid, clamp)
├── js/main.js             Menu, statut d'ouverture, révélations, ruban, curseur, préparateur, visionneuse
├── img/                   8 illustrations SVG de la galerie + favicon
├── brief.md / source-article.md
└── README.md
```

## Lancer le site

Aucune installation ni compilation : double-cliquez sur `index.html`, ou servez le dossier
(XAMPP, `python3 -m http.server`, GitHub Pages). Tous les chemins sont relatifs.

Sans JavaScript, tout le contenu reste visible ; seul le préparateur renvoie vers un lien WhatsApp générique.
Le numéro `+213 00 00 00 00` / `https://wa.me/213000000000` est fictif : aucune donnée n'est envoyée.

## Intégration dans l'article

Lien : `https://<utilisateur>.github.io/sakinadz-demos/sites/salon-beaute/` (adresse à adapter au dépôt publié).

```html
<iframe
  src="https://<utilisateur>.github.io/sakinadz-demos/sites/salon-beaute/"
  title="Démonstration : site vitrine d'un salon de coiffure et de beauté (fictif)"
  width="100%" height="720" loading="lazy"
  style="border:0; max-width:100%;">
</iframe>
<p><a href="https://<utilisateur>.github.io/sakinadz-demos/sites/salon-beaute/" target="_blank" rel="noopener">Ouvrir la démonstration en plein écran</a></p>
```
