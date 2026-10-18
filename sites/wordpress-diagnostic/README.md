# Banc d'essai WP : « WordPress lent : optimiser ou refaire ? Le diagnostic »

Outil interactif de démonstration (contenu fictif, non indexé) qui illustre l'article
« Mon site WordPress est lent : l'optimiser ou le refaire ? »
(https://www.sakinadz.com/blog/services/wordpress-lent-optimiser-ou-refaire-site).

## Concept

Un **banc d'essai d'instruments de bord** : le visiteur recopie ses trois Core Web Vitals
(relevés dans PageSpeed Insights, version mobile) et lit trois cadrans analogiques ; il
répond ensuite à huit questions et obtient un verdict affiché sur un **feu tricolore
monumental** (« optimiser », « optimiser puis réévaluer », « refaire »), suivi d'une
**check-list de pré-vol** (plan d'action à cocher) et des précautions SEO d'une refonte.

Élément signature : le **chronomètre** du héros. Deux aiguilles partent ensemble : l'aiguille
« après » s'arrête sous le repère vert des 2,5 s, l'aiguille « avant » continue bien au-delà.
C'est l'illustration avant/après demandée par le brief, **présentée comme exemple, non
mesurée** (aucune durée chiffrée n'est affichée en dehors du seuil de 2,5 s de l'article).

## Choix de design

- Palette du brief poussée au contraste : fond papier `#fbfaf8`, panneaux anthracite
  `#22262b` rivetés (rivets et brossage en `radial-gradient` / `repeating-linear-gradient`),
  orange `#e8590c` en aplats (règle graduée pleine largeur, rail de progression, colonne SEO).
- Typographie Archivo exploitée sur son axe de largeur : très étendue (125 %) pour
  « WORDPRESS », très condensée (62 %) pour « LENT ? », les titres de cadrans et le verdict.
  Source Serif 4 pour les textes explicatifs. Piles de secours : Arial Narrow / Helvetica / Arial
  et Georgia.
- Cadrans SVG générés en JS (zones vert / orange / rouge, graduations, butée, aiguille avec
  ombre) et **aiguilles amorties** (ressort légèrement sous-amorti, `requestAnimationFrame`).
- Questions présentées comme des **interrupteurs à bascule** ; 8 voyants de progression.
- Les états couleur sont toujours doublés d'un libellé texte (« Vert : bon », etc.).
- Boutons orange à texte anthracite (contraste 4,9:1) ; orange foncé `#b23f00` pour le petit
  texte sur fond clair (5,6:1), orange clair `#ff8a3d` sur anthracite (6,5:1).
- `prefers-reduced-motion` : aiguilles positionnées sans animation, chronomètre statique,
  apparitions désactivées. Sans JavaScript, le contenu reste visible et un message `noscript`
  rappelle les seuils.

## Structure des fichiers

```
sites/wordpress-diagnostic/
├── index.html        page unique, deux onglets (motif ARIA tablist)
├── css/style.css     styles, responsive, impression
├── js/app.js         lecture des mesures, cadrans, questions, verdict, persistance locale
├── README.md
├── brief.md
└── source-article.md
```

## Lancer

Double-cliquez sur `index.html` (ou ouvrez-le via XAMPP / GitHub Pages à l'adresse
`.../sites/wordpress-diagnostic/`). Aucune étape de build, aucun envoi de données : pas de
`fetch`, pas de formulaire soumis, pas d'analytics. Les saisies sont conservées dans le
`localStorage` du navigateur (dans un `try/catch`) et peuvent être effacées par le bouton
« Effacer toutes mes données locales » du pied de page.

## Onglet 01 : « Mes mesures »

### Règle de couleur

| Mesure | Vert (seuil de l'article) | Orange | Rouge |
|---|---|---|---|
| LCP | 2,5 s ou moins | plus de 2,5 s, jusqu'à 5 s | plus de 5 s |
| INP | 200 ms ou moins | plus de 200 ms, jusqu'à 400 ms | plus de 400 ms |
| CLS | 0,1 ou moins | plus de 0,1, jusqu'à 0,2 | plus de 0,2 |

**À valider** : l'article ne donne que le seuil du « bon » résultat. La limite orange/rouge
est une **convention de l'outil** (le double du seuil), signalée dans l'interface (astérisque
sur les cadrans, encart « Comment les couleurs sont-elles attribuées ? », note imprimée).
Elle se règle dans `METRICS` (champ `limit`) en tête de `js/app.js`. Les fins de cadran
(7,5 s / 600 ms / 0,3) sont purement graphiques ; au-delà, l'aiguille reste en butée.

### Saisie et unités

- Virgule française ou point (« 2,5 » = « 2.5 »), espaces de milliers (« 2 500 »), unités
  `s`, `sec`, `seconde(s)`, `ms`, `milliseconde(s)`.
- **LCP** : attendu en secondes. Sans unité, une valeur **de 100 ou plus est lue en
  millisecondes** (« 2500 » devient 2,5 s, avec une note qui l'indique) : un LCP de 100 s ou
  plus n'aurait pas de sens. Entre 60 et 100 sans unité : refusé (plus d'une minute), avec
  l'invitation à ajouter « ms ».
- **INP** : attendu en millisecondes. Sans unité, une valeur **inférieure à 1** est lue en
  secondes (« 0,24 » devient 240 ms, avec une note).
- **CLS** : score sans unité ; une unité ou un « % » est refusé.
- Refusés avec message en ligne : texte non numérique, notation « 1e5 », négatif, LCP ou
  INP à 0, LCP de plus de 60 s, INP de plus de 20 000 ms, CLS supérieur à 5.
- Acceptés avec avertissement « à vérifier » : LCP inférieur à 0,3 s, INP inférieur à
  10 ms, CLS supérieur à 1.
- Ces bornes de plausibilité sont des garde-fous de saisie propres à l'outil, pas des
  données de l'article.
- Champ vide : cadran éteint, aucune erreur ; aucun champ rempli : message dédié.

## Onglet 02 : « Optimiser ou refaire ? » — règle de verdict

Chaque réponse peut apporter des **points de refonte** (critères « Quand refaire » de
l'article) et/ou un **levier d'optimisation** (causes principales et optimisations sans
refonte de l'article).

| Question | Réponse | Effet |
|---|---|---|
| 1. Constructeur de pages | « Oui, et il reste lent malgré les optimisations » | **+2 points** (critère le plus direct de l'article) |
| | « Oui, jamais optimisé » / « Je ne sais pas » | levier « constructeur » |
| 2. Extensions | « Accumulées au fil des années » | **+1 point** + levier « extensions » |
| | « Nombreuses, mais maîtrisées » / « Je ne sais pas » | levier « extensions » |
| 3. Images | « Mises en ligne telles quelles » / « Je ne sais pas » | levier « images » |
| 4. Hébergement | « Entrée de gamme » / « Je ne sais pas » | levier « hébergement » |
| 5. Scripts tiers | « Quelques-uns », « Beaucoup », « Je ne sais pas » | levier « scripts tiers » |
| 6. Fréquence de modification | « Presque jamais » (site vitrine peu modifié) | **+1 point** |
| 7. Piratage passé | « Oui, au moins une fois » | **+1 point** |
| 8. Design | « Il est daté » | **+1 point** |

Total possible : 6 points.

- **3 points ou plus → « Refaire »**.
- **2 points → « Optimiser puis réévaluer »**, sauf si ces 2 points viennent du constructeur
  qui reste lent **et** qu'aucun levier d'optimisation ne reste ouvert → « Refaire ».
- **0 ou 1 point → « Optimiser »** (le texte s'adapte s'il n'y a aucun levier : le
  diagnostic complet est alors recommandé).

Les pondérations et paliers sont une **convention de l'outil, à valider** : l'article liste
les critères, pas leur poids. Ils se règlent dans `QUESTIONS` et `computeVerdict()`.

Plan d'action : diagnostic (toujours) ; puis, selon le verdict, les optimisations
correspondant aux leviers détectés + cache, polices locales, CDN, et un contrôle
(remesurer, réévaluer) ; ou, pour une refonte, la préparation (contenus, adresses,
construction légère) et l'après-mise en ligne. Les précautions SEO sont toujours affichées
(« Pendant la refonte » ou « Si vous refaites un jour »). Si des mesures ont été saisies,
le verdict les rappelle, avec une nuance si les trois sont au vert.

## Traçabilité : chiffres et règles utilisés, et leur source

Toutes les phrases citées viennent de `source-article.md`.

| Élément utilisé | Phrase source |
|---|---|
| Seuils LCP 2,5 s, INP 200 ms, CLS 0,1 (vert) et noms « chargement », « réactivité », « stabilité visuelle » | « Core Web Vitals (indicateurs Google) : LCP (chargement) 2,5 s ou moins ; INP (réactivité) 200 ms ou moins ; CLS (stabilité visuelle) 0,1 ou moins. » |
| « Sur WordPress, c'est surtout le LCP qui pose problème » (explications LCP) | « Sur WordPress, c'est surtout le LCP qui pose problème. » |
| Questions 1 à 5 (constructeur, extensions, images, hébergement, scripts tiers) | « Causes principales : thème et constructeur de pages lourds ; extensions nombreuses ; images non optimisées ; hébergement d'entrée de gamme ; scripts tiers. » |
| Mesure en version mobile, étapes « Diagnostic » du plan | « Diagnostic : PageSpeed Insights en version mobile ; poids de la page ; audit des extensions ; temps de réponse du serveur ; images les plus lourdes. » |
| Étapes « Optimiser sans refonte » | « Optimisations possibles sans refonte : compression et format moderne des images ; cache bien configuré ; nettoyage des extensions ; gestion des scripts tiers ; polices locales ; hébergement adapté ; CDN. » |
| Points de refonte (questions 1, 2, 6, 7, 8) | « Quand refaire : constructeur de pages lourd qui reste lent après optimisation ; site vitrine peu modifié ; accumulation d'extensions ; piratage passé ; design daté. » |
| Précautions SEO | « Référencement pendant une refonte : conserver les adresses ou mettre en place des redirections 301 ; reprendre les contenus utiles ; soumettre le nouveau plan de site à Search Console. » |
| Texte d'introduction | « un WordPress lent n'est pas une fatalité ; ses causes sont généralement identifiables et le choix entre optimisation et refonte dépend de ce qui ralentit réellement le site. » |

Éléments **non issus de l'article**, signalés comme tels :

- limite orange/rouge (double du seuil) : **à valider** ;
- pondération et paliers du verdict : **à valider** ;
- causes précises du CLS : non détaillées par l'article, l'outil renvoie au rapport
  PageSpeed Insights et à un audit (« à valider ») ;
- bornes de plausibilité de saisie : garde-fous techniques ;
- valeurs du bouton « Charger un exemple » (3,9 s / 180 ms / 0,14) : exemple fictif,
  annoncé comme tel ;
- chronomètre avant/après : illustration, non mesurée.

## Accessibilité et interactions

Onglets ARIA (flèches, Début, Fin), groupes radio natifs (flèches), messages d'erreur en
ligne `aria-live`, focus visible, lien d'évitement, cibles de 44 px minimum, retour
arrière, « Modifier mes réponses », « Recommencer », double clic sans effet, état conservé
entre onglets et au rechargement, impression soignée (fond blanc, mesures + verdict + plan,
URL de l'article en pied de page).

## Intégration dans l'article

À placer en conclusion de l'article : le lecteur obtient une réponse sur son propre site.

Lien simple :

```html
<a href="https://<votre-domaine>/sites/wordpress-diagnostic/">Faire le diagnostic de votre site WordPress</a>
```

Iframe :

```html
<iframe
  src="https://<votre-domaine>/sites/wordpress-diagnostic/"
  title="Diagnostic : WordPress lent, optimiser ou refaire ?"
  width="100%" height="1400"
  loading="lazy"
  style="border:0; max-width:100%;">
</iframe>
```
