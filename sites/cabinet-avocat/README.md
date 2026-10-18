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

## Choix de design : « Frontispice »

Refonte visuelle : audacieuse dans la composition et la typographie, sobre dans le ton.
Le site se lit comme la page de titre d'un ouvrage de droit posée sur une façade classique.

- **Palette noir d'encre / ivoire** : le marine du brief (`#14213d`) est poussé jusqu'à un noir
  d'encre `#0b1120` (en-têtes, maxime, bande de contact, pied de page), face à un ivoire `#f4f0e8`
  et à la pierre `#e5e1da`. Le bordeaux `#7a1f2b` est réservé à de rares touches : le sceau,
  la ligne de justification, les numéros d'articles, les appels de note, le jour courant.
- **Typographie monumentale** : Cormorant Garamond en capitales géantes (jusqu'à 17,5 rem) pour le
  nom du cabinet et les titres de page ; Source Sans 3 en petites capitales espacées pour les
  libellés. L'arabe garde ces deux familles pour le latin et les chiffres et retombe sur les
  polices système (Noto Naskh Arabic, Amiri…), sans capitales ni interlettrage.
- **Coupe nette** : le titre monumental de chaque page est coupé à sa base par l'aplat ivoire
  de la section suivante (marge négative + `overflow: hidden`), souligné d'un filet bordeaux.
  En arabe, l'aplat affleure sans couper les points sous la ligne.
- **Architecture** : les six domaines forment un temple dessiné en CSS (entablement à denticules,
  colonnes cannelées entre les articles, emmarchement) ; numérotation en chiffres romains géants
  au trait (« Art. I » à « Art. VI ») ; folio romain géant sur chaque page intérieure ; niche à
  colonnes en SVG pour l'emplacement du portrait ; mentions légales en articles numérotés.
  Version arabe : chiffres occidentaux (« المادة 1 »), d'usage courant en Algérie.
- **Composition d'ouvrage** : colonne de marge + corps de texte, notes de bas de page appelées
  par un exposant bordeaux (la note « Textes à faire valider selon les règles de la profession »),
  filets doubles en tête des registres (cartouche, horaires, barreau).
- **Élément signature** : le sceau « MD » qui se grave une seule fois au chargement (les anneaux
  se tracent, l'inscription circulaire se révèle par un masque qui tourne, le disque bordeaux se
  pose) ; puis la ligne de justification bordeaux qui se trace sous le titre coupé.
  Le sceau est un monogramme : son inscription reste en latin dans les deux langues.
- **Mouvement très retenu** : le sceau, la montée du titre, la ligne de justification, l'apparition
  douce de quelques blocs au défilement (une seule fois). Tout est neutralisé par
  `prefers-reduced-motion`, et rien n'est masqué si le JavaScript ne s'exécute pas
  (la classe `.rv` qui conditionne les apparitions est posée par `main.js` lui-même).
- **RTL** : une seule feuille de style à propriétés logiques (`inset-inline-start`,
  `border-block-end`…) ; seuls quelques réglages propres à l'arabe (interlignage, absence de
  capitales et d'italique, sens des flèches).
- **Plan d'accès** : plan schématique en SVG aux couleurs du site (fictif, sans échelle),
  remplaçable par une carte sur le site réel.

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
├── css/style.css    styles communs FR/AR (variables, grid, clamp, container queries, propriétés logiques)
├── js/main.js       interactions (facultatives)
├── brief.md, source-article.md
└── README.md
```

Interactions (`js/main.js`, le site reste utilisable sans JavaScript) :
menu repliable sur mobile (Échap pour fermer), mise en évidence du jour courant dans les
horaires (heure d'Alger), bouton « Copier l'adresse » de l'e-mail (affiché seulement si le
presse-papiers est disponible), sommaire de la page Prestations qui suit la section lue,
apparitions au défilement. Le sceau et la ligne de justification sont animés en CSS pur.

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
  style="border:1px solid #0b1120">
</iframe>
```

(Adapter l'adresse si GitHub Pages est publié sous un autre domaine.)
