# Bois & Main : menuisier indépendant (site de démonstration)

> Site **fictif** : marque, personne, coordonnées, réalisations et délais sont inventés pour la démonstration. Les pages sont en `noindex, nofollow`.

## Concept

Bois & Main est un menuisier qui travaille seul, en auto-entrepreneur, depuis un atelier à Blida. Le site montre qu'un artisan n'a besoin que d'**une page claire, d'un numéro cliquable et de quelques réalisations** pour être trouvé et contacté, avant même d'avoir reçu sa carte d'auto-entrepreneur.

Le site a la forme d'un atelier : une planche veinée, un crayon de menuisier, un mètre ruban et un plan coté.

## Choix de design

- **Héros typographique géant** : « Bois » (rempli d'un veinage de bois) et « Main » (vert forêt) occupent tout l'écran. Ils sont posés sur un motif de **veines de bois en SVG** avec trois nœuds, et les veines se tracent au chargement. Une esperluette en Source Serif italique ocre et un crayon de menuisier complètent la composition, volontairement asymétrique.
- **Élément signature n° 1 : le mètre ruban.** La barre de progression de lecture est un mètre qui sort de son boîtier vert, avec ses graduations au centimètre, ses repères tous les 10 cm et son crochet métallique. Le boîtier affiche la longueur déroulée (« 53 cm »).
- **Élément signature n° 2 : le plan coté qui se trace au défilement.** Une enfilade en chêne vue de face et de côté, avec cotes et cartouche, se dessine en quatre couches pendant que les quatre étapes de la méthode s'allument. Le fond rappelle un papier millimétré vert.
- **Transitions en dents de scie** entre les sections. Les prestations sont présentées comme une *fiche de débit* numérotée, avec des réglets en pointillés, et la ligne se couvre de bois au survol ou une fois choisie.
- **Le triangle du menuisier** (marque d'assemblage tracée au crayon) sert de logo, de puces et de favicon.
- Palette : bois `#8b5a2b`, crème `#faf6ef`, vert forêt `#2f4f3e`, plus un ocre « mètre ruban » `#e2b04a` et un brun nuit `#3b2614` pour la section À propos.
- Polices : **Bricolage Grotesque** (titres, axe de largeur resserré) et **Source Serif 4** (texte). Les piles de secours ont des proportions proches.

## Fonctionnalités

- Page défilante unique : accueil, prestations (6), méthode, réalisations, à propos, infos pratiques, contact. Les mentions légales sont sur une page à part.
- **Bouton WhatsApp flottant à message prérempli** : choisir une prestation (bouton « Choisir » ou pastilles du bloc Contact) change le libellé du bouton (« Devis cuisine ») et le texte envoyé à `wa.me`. Ce texte demande la wilaya et les dimensions utiles selon la prestation. Un aperçu du message s'affiche dans la section Contact, et l'adresse `index.html?prestation=cuisine` présélectionne une prestation.
- Galerie de 6 réalisations dessinées en SVG (exemples fictifs).
- Infos pratiques : zone d'intervention (Blida, Alger, Tipaza, Médéa, Boumerdès, Aïn Defla), délais habituels et horaires, tous marqués **« à valider »** parce que la source n'en donne aucun.
- Aucun formulaire. Le contact se fait par téléphone, WhatsApp ou e-mail (coordonnées génériques).

## Accessibilité et performance

- Lien d'évitement, focus visible, menu mobile avec `aria-expanded` qui se ferme avec Échap, boutons de choix avec `aria-pressed` et zone `role="status"` qui annonce la prestation choisie.
- Contrastes AA vérifiés (texte courant ≥ 7:1, petits textes ocre sur vert 4,57:1).
- `prefers-reduced-motion` : pas d'animation, plan entièrement dessiné, section non épinglée. Sans JavaScript, tout le contenu reste visible.
- Aucune image matricielle : uniquement du SVG et du CSS. Le veinage vient de `feTurbulence` en data-URI.

## Structure des fichiers

```
auto-entrepreneur/
├── index.html             page défilante (accueil → contact)
├── mentions-legales.html  mentions légales (éléments « à valider »)
├── css/style.css          styles (variables, grid, clamp, container queries)
├── js/main.js             mètre ruban, plan au défilement, menu, apparitions, WhatsApp
├── brief.md               cahier des charges du site
├── source-article.md      résumé de l'article de référence
└── README.md
```

## Lancer le site

Aucune installation ni compilation : double-cliquez sur `index.html`. Le site fonctionne aussi via XAMPP (`http://localhost/.../sites/auto-entrepreneur/`) et sur GitHub Pages (`.../sites/auto-entrepreneur/`), car tous les chemins sont relatifs.

## Intégration dans l'article

Article : [Site web pour auto-entrepreneur en Algérie](https://www.sakinadz.com/site-web/site-web-auto-entrepreneur-algerie)

Lien simple :

```html
<a href="https://<utilisateur>.github.io/sakinadz-demos/sites/auto-entrepreneur/" target="_blank" rel="noopener">
  Voir la démo : site d'un menuisier auto-entrepreneur
</a>
```

Intégration en iframe :

```html
<iframe
  src="https://<utilisateur>.github.io/sakinadz-demos/sites/auto-entrepreneur/"
  title="Démo : site vitrine d'un menuisier auto-entrepreneur (contenu fictif)"
  width="100%" height="720" loading="lazy"
  style="border:0; max-width:100%;">
</iframe>
```
