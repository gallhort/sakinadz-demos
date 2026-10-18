# Centre Cèdre Formation : site de démonstration

Site vitrine **fictif** d'un centre de formation privé à Alger (bureautique, langues, comptabilité, informatique). Il illustre l'article [Site web pour école et centre de formation en Algérie](https://www.sakinadz.com/site-web/site-web-ecole-formation-algerie).

> Contenu entièrement fictif : établissement, équipe, adresse, dates de session et coordonnées sont inventés. Toutes les pages portent `noindex, nofollow` et un bandeau « Site de démonstration – contenu fictif ».

## Concept

Le parcours que l'article décrit, sans détour : **trouver sa formation, voir la prochaine session, écrire sur WhatsApp**.

- Parti pris « récré géométrique » : des aplats francs violet `#4b3fa6` et corail `#ff6b4a` en pleine largeur, des formes géantes (cercles, demi-lunes, anneaux), des sections découpées en zigzag, des étiquettes posées de travers et une typographie monumentale. Le ton est vif et joyeux, avec ce qu'il faut de sérieux pour rassurer les parents.
- **Élément signature : le calendrier détachable** de l'accueil. Chaque feuille présente une session à venir (date, formations qui démarrent), avec un compte à rebours « J-… ». On l'arrache en la tirant vers le bas (souris ou doigt) ou avec le bouton « Détacher la feuille » (clavier). Une zone `aria-live` annonce la session suivante.
- **Anneaux de progression animés** sur chaque fiche formation : durée, niveau et rythme hebdomadaire.
- Les dates de session sont **fictives** et calculées à l'ouverture de la page (le deuxième dimanche de chaque mois, avec deux groupes de formations qui alternent). La démo reste ainsi toujours à jour. Sans JavaScript, des dates de repli s'affichent.

## Choix de design

| Élément | Choix |
|---|---|
| Couleurs | Violet `#4b3fa6` en aplat franc (aucun dégradé), corail `#ff6b4a`, blanc, encre `#1c1636`, lilas `#eeecfa`. Corail assombri `#c2381b` pour les petits textes sur fond blanc. |
| Polices | Outfit (titres, 600 à 900) et DM Sans (texte), Google Fonts avec `display=swap`, polices de secours aux proportions proches. |
| Contrastes (AA) | Encre sur blanc 17,3:1 · blanc sur violet 8,2:1 · encre sur corail 6,1:1 · violet sur blanc 8,2:1 · corail foncé sur blanc 5,4:1. Aucun texte blanc sur corail. |
| Pictogrammes | SVG en trait, dessinés pour le site (tableur, bulles, calculatrice, code, WhatsApp, téléphone, e-mail, repère). |
| Visuels | 100 % CSS et SVG : plan des locaux, plan d'accès schématique, horaires en barres. Aucune image matricielle. |
| Mobile | Barre d'action fixe « Formations / Écrire sur WhatsApp ». Sur chaque fiche, la prochaine session et le bouton WhatsApp suivent directement le titre. |

## Pages

- `index.html` : accueil. Accroche, calendrier détachable des prochaines sessions, 4 filières, « ce qui change » (chiffres géants), inscription en 3 étapes, FAQ parents, appel final.
- `formations.html` : 6 formations (filière, niveau, durée, rythme, public, prérequis, programme). Accès direct, filtre par filière, prochaine session et bouton WhatsApp avec message prérempli (formation et date) pour chacune.
- `a-propos.html` : projet pédagogique, équipe fictive sans photo (monogrammes), plan schématique des locaux.
- `contact.html` : WhatsApp, téléphone, e-mail, adresse fictive, horaires d'accueil (le jour courant est mis en évidence), plan d'accès SVG.
- `mentions-legales.html` : éditeur, hébergeur, données personnelles. Les éléments manquants sont marqués « à compléter / à valider ».

Il n'y a ni formulaire, ni espace élève, ni paiement en ligne. Le site ne stocke aucune donnée et ne dépose aucun cookie. Les tarifs, l'attestation délivrée et son éventuelle reconnaissance sont marqués « à valider ».

## Structure des fichiers

```
ecole-formation/
├── index.html
├── formations.html
├── a-propos.html
├── contact.html
├── mentions-legales.html
├── css/style.css   (variables, grid, clamp, formes, animations, responsive)
├── js/main.js      (menu, apparitions, anneaux, sessions fictives, calendrier, filtre, horaires)
├── README.md
├── brief.md
└── source-article.md
```

## Lancer le site

Aucune installation ni étape de build : double-cliquez sur `index.html`. Le site fonctionne aussi via XAMPP (`http://localhost/.../sites/ecole-formation/`) et sur GitHub Pages. Tous les chemins sont relatifs.

Accessibilité : lien d'évitement, focus visible, navigation au clavier (menu, filtre, calendrier, FAQ en `details`), `prefers-reduced-motion` respecté. Le contenu reste visible sans JavaScript.

## Intégration dans l'article

Lien direct :

```html
<a href="https://VOTRE-COMPTE.github.io/sakinadz-demos/sites/ecole-formation/" target="_blank" rel="noopener">
  Voir la démo : site d'un centre de formation
</a>
```

Aperçu intégré :

```html
<iframe
  src="https://VOTRE-COMPTE.github.io/sakinadz-demos/sites/ecole-formation/"
  title="Démo : site vitrine d'un centre de formation (contenu fictif)"
  width="100%" height="720" loading="lazy"
  style="border:2px solid #1c1636;border-radius:12px">
</iframe>
```
