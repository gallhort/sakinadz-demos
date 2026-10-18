# Pupitre maintenance : calculateur du coût annuel de maintenance d'un site

Outil de démonstration (contenu fictif, `noindex`) qui illustre l'article
« Combien coûte la maintenance d'un site web : prix, contenu réel, formules à éviter »
(https://www.sakinadz.com/blog/services/cout-maintenance-site-web-algerie).

## Concept

Le visiteur règle un **pupitre** (une table de mixage) : technologie du site (statique ou CMS),
tarifs de référence (Algérie ou France), canaux de contenu (technique, éditoriale, référencement,
et évolution « hors forfait »), puis deux faders horizontaux (volume de demandes, délai de traitement).
L'écran de lecture affiche en direct la **fourchette publiée dans l'article** qui correspond à ce cas,
ramenée à l'année. Si l'article ne permet pas de chiffrer la combinaison, l'écran affiche
« Non chiffrable » et explique pourquoi, au lieu d'inventer un montant.

La section suivante multiplie cette fourchette par trois et la confronte au prix de création saisi
par le visiteur (barres monumentales et anneau de répartition en SVG fait main).

**Élément signature** : le compteur à rouleaux (odomètre) en IBM Plex Mono vert sur écran bleu nuit :
chaque chiffre est une colonne 0–9 qui défile jusqu'à sa valeur, avec un léger décalage entre les colonnes.

## Choix de design

- Palette du brief réinterprétée : fond `#f6f8fb`, bleu `#1f4eb4` (touches enfoncées, aplats), bleu nuit
  `#0a1c44` / `#0f2a66` (écran de lecture, section trois ans), vert `#2e9b5f` décliné en vert lumineux
  `#7ee2a8` (afficheur, voyants) et vert profond `#1c6b40` (boutons « Activé », formule saine, texte AA).
- Matière « pupitre » : panneau aluminium brossé (dégradés CSS), vis aux coins, touches à course (bordure
  basse épaisse qui s'écrase à l'appui), canaux avec voyant, faders à capuchon strié. Aucune jauge
  analogique (réservées à un autre outil du dépôt).
- Typographie : Plus Jakarta Sans 800 en très grand corps pour les titres, IBM Plex Mono pour tous les
  chiffres, étiquettes et numéros de section en contour.
- Mouvement : odomètre, curseur de position dans la fourchette, barres et anneau animés, apparitions au
  défilement ; tout est neutralisé avec `prefers-reduced-motion`.
- Mobile : l'écran de lecture passe au-dessus des commandes et une mini-barre fixe rappelle l'estimation
  quand on règle les commandes sans voir l'écran.
- Impression : fond blanc, commandes masquées, résultat, explications, comparaison sur trois ans,
  formules et URL de l'article conservés.

## Structure des fichiers

```
calculateur-maintenance/
├── index.html        page unique (outil + contenus)
├── css/style.css     styles (variables, grid, container queries, print)
├── js/app.js         logique, odomètre, validation, graphiques, localStorage
├── README.md
├── brief.md          (fourni)
└── source-article.md (fourni)
```

## Lancer

Double-cliquez sur `index.html`, ou servez le dossier (XAMPP, `python3 -m http.server`, GitHub Pages).
Tous les chemins sont relatifs. Aucune donnée n'est envoyée ; les réglages sont gardés dans le
`localStorage` du navigateur (bouton « Effacer mes réglages enregistrés »).

## Règles de calcul (et leur limite)

Le calculateur **ne fabrique pas de prix** : il choisit la fourchette de l'article la plus proche des
réglages et la ramène à l'année (mensuel × 12). Ce rapprochement est présenté comme une aide à la lecture
« à valider avec votre prestataire ».

| Réglages | Fourchette affichée |
|---|---|
| Algérie, CMS, technique et/ou éditoriale | 65 € (forfait annuel simple, bas) à 780 € (pack d'agence 65 €/mois × 12) |
| Algérie, site statique, technique et/ou éditoriale | 65 à 330 € par an |
| Algérie, référencement coché | ≈ 2 760 € par an (230 €/mois × 12), montant unique |
| France, éditoriale (avec ou sans technique) | 960 à 3 000 € par an (80 à 250 €/mois) |
| France, technique seule | 600 à 1 080 € HT par an (50 à 90 € HT/mois) |
| France, référencement seul | non chiffrable : l'article ne donne pas ce tarif |
| Évolution seule, ou aucun canal | non chiffrable : l'évolution est du développement facturé à part |
| Évolution, en plus | jamais ajoutée ; France : 150 à 300 € HT/mois signalés à part ; Algérie : « devis séparé » |

Le volume de demandes et le délai de traitement **ne modifient pas les montants** (l'article les cite
comme facteurs sans les chiffrer) : ils déplacent seulement un curseur « bas / milieu / haut de
fourchette » et allument des voyants (plafond de demandes, délai écrit).
Comparaison sur trois ans : fourchette annuelle × 3, sans évolution ni hausse de prix.
Limites de saisie du prix de création (choix d'interface, pas des chiffres de l'article) : supérieur à
0, au plus 1 000 000 €, virgule ou point décimal acceptés.

## Traçabilité des chiffres (source-article.md)

| Chiffre utilisé | Phrase de la source |
|---|---|
| 65 à 330 € par an | « forfaits annuels simples en Algérie environ 65 à 330 € par an » |
| 65 € par mois | « pack maintenance d'agence en Algérie environ 65 € par mois » |
| 230 € par mois | « pack maintenance et référencement en Algérie environ 230 € par mois » |
| 80 à 250 € par mois | « forfait basique pour site vitrine en France environ 80 à 250 € par mois » |
| 50 à 90 € HT par mois | « maintenance corrective seule en France environ 50 à 90 € HT par mois » |
| 150 à 300 € HT par mois | « maintenance évolutive en France environ 150 à 300 € HT par mois » |
| Trois ans | « Sur trois ans, ces montants peuvent dépasser le prix de création du site. » |
| 20 € par mois (mentionné, non utilisé dans le calcul) | « L'article se termine par l'offre de maintenance de l'agence (20 €/mois). » |
| Facteurs de variation | « la technologie, le volume de demandes, le délai de traitement, le contenu inclus » |
| Trois types de maintenance | « technique (mises à jour, failles, sauvegardes ; indispensable pour WordPress ou tout CMS, très réduite pour un site statique) ; éditoriale (…) ; évolution (…) : du développement, facturé à part » |
| Formules à éviter / saine | listes reprises telles quelles de la source |
| Faut-il une maintenance ? | « Oui pour WordPress ou CMS ; pas forcément pour un site statique qui change peu ; utile pour un site dont les informations changent souvent ou qui sert à vendre » |

Les montants sont des **équivalents euros, fourchettes relevées dans l'article, à titre indicatif**.
`source-article.md` est un résumé : à revalider avec le texte intégral de l'article.

## Intégration dans l'article

À placer juste après la section des prix, pour que le lecteur chiffre son propre cas.

Lien : `https://<votre-domaine>/sites/calculateur-maintenance/`

```html
<iframe
  src="https://<votre-domaine>/sites/calculateur-maintenance/"
  title="Calculateur du coût annuel de maintenance d'un site"
  width="100%" height="1400"
  style="border:0; max-width:100%;"
  loading="lazy">
</iframe>
```
