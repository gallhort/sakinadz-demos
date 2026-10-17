# Cabinet Maître Démo – site de démonstration

Site vitrine **fictif** d'un cabinet d'avocat à Alger, créé pour illustrer l'article
[Site web pour avocat et cabinet juridique en Algérie](https://www.sakinadz.com/site-web/site-web-avocat-cabinet-juridique-algerie).
Toutes les informations (nom, adresse, parcours, barreau, horaires, coordonnées) sont fictives.

## Concept

Montrer la sobriété attendue d'un site de cabinet : le cabinet en une phrase, ses domaines,
son parcours, et un moyen simple de le joindre. Pas de formulaire (le premier contact se fait
par téléphone ou e-mail, rien de confidentiel ne transite par le site), aucune promesse de
résultat, aucune mention comparative. Une note « textes à faire valider selon les règles de la
profession » figure sur chaque page.

Le site existe en français et en arabe (RTL), avec un sélecteur de langue dans l'en-tête.

## Choix de design

Registre éditorial, sobre et haut de gamme, sans effet tape-à-l'œil.

- **Palette** : marine `#14213d` (en-têtes de page, bande de contact, pied de page),
  pierre `#e5e1da` et papier `#f8f6f2` (fonds), bordeaux `#7a1f2b` en touche discrète
  (filets, numéros, liens, filet sous les en-têtes).
- **Typographie** : Cormorant Garamond (titres, italiques, numéros, coordonnées en grand)
  et Source Sans 3 (texte, petites capitales espacées pour les libellés).
  Ces deux familles n'ont pas de glyphes arabes : la version arabe s'appuie sur les polices
  système (Noto Naskh/Noto Sans Arabic, Amiri, Tahoma…).
- **Composition** : grand titre en deux temps (romain puis italique), façade classique dessinée
  au trait en SVG, bande de coordonnées sous l'en-tête, domaines en liste éditoriale numérotée,
  phrase de principe d'exercice (ce n'est pas un témoignage), étapes jalonnées, bande finale
  « Prendre rendez-vous » avec le numéro en grand.
- **Mouvement** : seulement de légères transitions au survol (soulignement, flèche),
  désactivées avec `prefers-reduced-motion`.
- **RTL** : la feuille de style n'utilise que des propriétés logiques (`margin-inline`,
  `inset-inline-start`, `border-block-end`…), la même CSS sert donc les deux sens d'écriture.
- **Plan d'accès** : plan schématique en SVG (fictif, sans échelle), remplaçable par une carte
  sur le site réel.

## Pages

| Page | FR | AR |
|---|---|---|
| Accueil : cabinet en une phrase, coordonnées, boutons d'appel et d'e-mail | `index.html` | `ar/index.html` |
| Prestations : 6 domaines (affaires, famille, immobilier, pénal, travail, administratif) | `prestations.html` | `ar/prestations.html` |
| À propos : parcours, barreau, langues parlées | `a-propos.html` | `ar/a-propos.html` |
| Contact : adresse, plan SVG, horaires, téléphone, e-mail | `contact.html` | `ar/contact.html` |
| Mentions légales | `mentions-legales.html` | `ar/mentions-legales.html` |

## Structure des fichiers

```
cabinet-avocat/
├── index.html, prestations.html, a-propos.html, contact.html, mentions-legales.html
├── ar/              versions arabes (lang="ar", dir="rtl")
├── css/style.css    styles communs (variables, grid, clamp, container queries)
├── js/main.js       interactions (facultatives)
├── brief.md, source-article.md
└── README.md
```

Interactions (`js/main.js`, le site reste utilisable sans JavaScript) :
menu repliable sur mobile (Échap pour fermer), mise en évidence du jour courant dans les
horaires (heure d'Alger), bouton « Copier l'adresse » de l'e-mail (masqué si le presse-papiers
n'est pas disponible), sommaire de la page Prestations qui suit la section lue.

## Lancer le site

- Double-cliquer sur `index.html`, ou
- via XAMPP : copier le dossier dans `htdocs/` puis ouvrir `http://localhost/cabinet-avocat/`, ou
- sur GitHub Pages : `…/sites/cabinet-avocat/`.

Tous les chemins sont relatifs ; aucune étape de build. Toutes les pages portent
`<meta name="robots" content="noindex, nofollow">` et le bandeau « Site de démonstration – contenu fictif ».

## Intégration dans l'article

Lien simple :

```html
<a href="https://gallhort.github.io/sakinadz-demos/sites/cabinet-avocat/" target="_blank" rel="noopener">
  Voir la démo : Cabinet Maître Démo (site d'avocat fictif)
</a>
```

Iframe :

```html
<iframe
  src="https://gallhort.github.io/sakinadz-demos/sites/cabinet-avocat/"
  title="Démo : site vitrine d'un cabinet d'avocat fictif"
  width="100%" height="720" loading="lazy"
  style="border:1px solid #e5e1da;border-radius:4px">
</iframe>
```

(Adapter l'adresse si GitHub Pages est publié sous un autre domaine.)
