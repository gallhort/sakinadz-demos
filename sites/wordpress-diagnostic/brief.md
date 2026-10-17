# Brief : WordPress lent : optimiser ou refaire ? Le diagnostic

**Type** : Outil interactif
**Article illustré** : Mon site WordPress est lent : l'optimiser ou le refaire ? (https://www.sakinadz.com/blog/services/wordpress-lent-optimiser-ou-refaire-site)
**Dossier de travail** : `sites/wordpress-diagnostic/` (ne rien modifier en dehors)

## Concept
Diagnostic en deux volets : un testeur de Core Web Vitals où le visiteur saisit ses mesures, et un quiz qui conclut entre optimiser et refaire.

## Pages
Une seule page à deux onglets. « Mes mesures » : le visiteur saisit son LCP, son INP et son CLS (relevés dans PageSpeed Insights, version mobile) et chaque valeur s'affiche en vert, orange ou rouge selon les seuils de l'article, avec une explication. « Optimiser ou refaire ? » : 8 questions sur le site actuel (constructeur de pages, extensions, images, hébergement, scripts tiers, fréquence de modification, piratage passé, design) qui donnent un verdict et un plan d'action en étapes, avec les précautions SEO d'une refonte.

## Direction artistique
Franc et pédagogique. Fond #fbfaf8, orange #e8590c, anthracite #22262b. Polices : Archivo + Source Serif 4.

## Fonctionnalités et points d'attention
Les seuils (LCP 2,5 s ou moins, INP 200 ms ou moins, CLS 0,1 ou moins), les causes, les optimisations et les critères de refonte viennent de `source-article.md`. Jauges animées en SVG. Illustration avant/après des temps de chargement présentée comme exemple, non mesurée. Le verdict reste nuancé : « optimiser », « optimiser puis réévaluer » ou « refaire ».

## Rôle dans l'article
À placer en conclusion : le lecteur obtient une réponse sur son propre site.

## Règles communes
Voir `CLAUDE.md` à la racine du dépôt (contenu fictif, noindex, chemins relatifs, accessibilité, performance, README).
