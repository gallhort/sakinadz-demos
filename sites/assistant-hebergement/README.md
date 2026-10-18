# Où héberger mon site ? L'assistant en 5 questions

Outil de démonstration **fictif** (agence imaginaire « Relais/Hébergement ») qui illustre l'article
« Hébergement de site web en Algérie : où héberger et à quel prix ».

## Concept

Une seule page en deux parties :

1. **L'assistant** : cinq questions (type de site, base de données, vente en ligne, usage commercial,
   budget), une par écran. Il recommande **un** des quatre types d'hébergement de l'article
   (statique, mutualisé, VPS, inclus par le prestataire), avec le pourquoi, les points de vigilance
   et un itinéraire bis.
2. **Le comparatif** : un « tableau des départs » des quatre types avec leurs coûts annuels
   indicatifs (équivalent euros), le coût du nom de domaine, la question Algérie ou étranger, puis
   une checklist « Contrôle avant décollage » : les 5 questions à poser avant de choisir.

## Choix de design

- **Métaphore infrastructure et aéroport** : fond nuit `#0d1b2a`, accent menthe `#5ee6b0`, texte `#e8eef4`,
  trame de plan technique en fond, typographie Space Grotesk (titres monumentaux, un mot en contour) et
  JetBrains Mono (étiquettes, codes, champs de type terminal).
- **Élément signature, le plan du réseau** : un schéma SVG où votre projet (PRJ) traverse cinq baies serveur,
  une par question. À chaque réponse, le câble menthe se dessine jusqu'à la baie suivante, ses LED s'allument
  et la réponse s'affiche au-dessus. À la fin, l'aiguillage bascule vers l'une des quatre portes
  (STA, MUT, VPS, INC). Sur mobile, une « caméra » suit le paquet le long du réseau pour que le schéma reste lisible.
- **Le résultat est une carte d'embarquement** : grand code de destination, champs façon terminal,
  coût annuel indicatif, pourquoi et vigilance, code « ROUTE » unique selon les réponses, code-barres décoratif,
  et un **talon détachable** (perforations, encoches) qui reprend les 5 questions à poser à l'hébergeur.
  Imprimable proprement (fond blanc, comparatif inclus, URL de l'article).
- Grandes tuiles de réponse numérotées : raccourcis clavier `1` à `4` affichés, `Retour arrière` pour revenir.
- La checklist bascule sur un aplat menthe pleine largeur, avec un compteur géant `0/5`.

## Structure des fichiers

```
assistant-hebergement/
├── index.html      page unique (héros, assistant, comparatif, checklist, contact)
├── css/style.css   styles, responsive, impression, prefers-reduced-motion
├── js/app.js       questions, table de décision, plan SVG, carte d'embarquement, checklist
├── README.md
├── brief.md
└── source-article.md
```

## Lancer

Double-cliquez sur `index.html` (ou servez le dossier avec XAMPP, ou via GitHub Pages à `.../sites/assistant-hebergement/`).
Aucune étape de build, aucune dépendance. Sans les polices Google, des piles de secours prennent le relais.

## Comportement et confidentialité

- Aucune donnée n'est envoyée (pas de fetch, pas de formulaire soumis, pas d'analytics).
  Mention affichée : « Démonstration : aucune donnée n'est envoyée ».
- Réponses, étape en cours et checklist sont gardées dans `localStorage` (clé `relais-hebergement-v1`,
  dans des try/catch) ; le bouton « Effacer mes réponses et ma checklist » supprime tout.
- Clavier : `Tab`, flèches dans les groupes de réponses (sans avancer), `Entrée` ou bouton Suivant,
  touches `1`–`4` (sélection et passage à la suite), `Retour arrière`. Lien d'évitement, focus visible,
  messages d'erreur en `aria-live`, progression en `role="progressbar"`.

## Table de décision

Règles appliquées dans l'ordre (la première qui correspond l'emporte), dans `recommend()` de `js/app.js`.

« Besoin d'une base de données » est vrai si : réponse « Oui » à la question 2, **ou** vente en ligne « Oui »,
**ou** type « Boutique en ligne » ou « Projet sur mesure », **ou** « Je ne sais pas » pour un site de contenu/blog
(l'article indique que le mutualisé est adapté à WordPress, qui utilise une base de données).

| # | Condition | Recommandation | Justification (source-article.md) |
|---|-----------|----------------|-----------------------------------|
| 1 | Budget = « Mon prestataire s'en occupe » | **INC** Inclus par le prestataire | « inclus par le prestataire (pratique, mais risqué si l'on ne maîtrise ni les accès ni la sortie) » |
| 2 | Pas besoin de base de données | **STA** Statique | « statique (souvent gratuit, rapide, peu de maintenance, adapté à un site vitrine simple) » |
| 3 | Base de données **et** (projet sur mesure **ou** budget ~100–200 €) | **VPS** | « VPS (serveur privé, à administrer soi-même ou avec un prestataire) » ; « pour un site avec base de données, la proximité et la puissance comptent plus » |
| 4 | Tous les autres cas avec base de données | **MUT** Mutualisé | « mutualisé (abordable, e-mails souvent inclus, adapté à WordPress) » |

Points de vigilance ajoutés selon les réponses :

| Condition | Vigilance | Source |
|-----------|-----------|--------|
| Vente en ligne « Oui » ou type « Boutique » | L'auteur affirme qu'une boutique en ligne doit être hébergée en Algérie (loi 18-05) ; à faire valider par un juriste | « L'auteur affirme qu'une boutique en ligne doit être hébergée en Algérie (loi 18-05). » |
| STA + usage commercial | Certains plans gratuits interdisent les sites commerciaux, d'autres l'acceptent dans la limite de leurs quotas | « certains réservent l'usage personnel et interdisent les sites commerciaux […] compatibles avec un usage professionnel dans la limite de leurs quotas » (noms de services volontairement non repris) |
| VPS + budget 0 € ou ~35–65 € | La fourchette VPS dépasse le budget indiqué | « VPS environ 100 à 200 € » |
| MUT + budget 0 € | Seul le statique est présenté comme gratuit | « statique 0 € ; mutualisé environ 35 à 65 € » |
| INC | Exiger les accès, la sortie, un compte à son nom | « risqué si l'on ne maîtrise ni les accès ni la sortie » ; « compte au nom du client » |
| MUT / VPS | Demander où se trouve le serveur | « pour un site avec base de données, la proximité et la puissance comptent plus » |
| Toujours | HTTPS, sauvegardes, support joignable, conditions claires | « Un bon hébergement inclut : HTTPS, sauvegardes, compte au nom du client, support joignable, conditions claires. » |
| STA + site vitrine (dans le « pourquoi ») | Approche recommandée par l'auteur | « pour un site vitrine, un compte d'hébergement au nom du client, sans abonnement d'hébergement » |

Itinéraire bis : INC → MUT (avec base de données) ou STA (sans) ; STA → MUT ; VPS → MUT ; MUT → VPS.

## Chiffres utilisés et leur source

Tous viennent de la ligne de `source-article.md` : « Coûts annuels indicatifs (équivalent euros) : statique 0 € ;
mutualisé environ 35 à 65 € ; VPS environ 100 à 200 € ; domaine .com environ 13 à 27 € ; domaine .dz environ 10 à 20 €. »

| Chiffre affiché | Usage |
|-----------------|-------|
| 0 € | Statique (tableau, carte, option budget Q5) |
| ~35–65 € / an | Mutualisé (tableau, carte, option budget Q5) |
| ~100–200 € / an | VPS (tableau, carte, option budget Q5) |
| ~13–27 € / an | Domaine .com |
| ~10–20 € / an | Domaine .dz |
| Loi 18-05 | Vigilance boutique en ligne, présentée comme affirmation de l'auteur, « à valider » |

Le coût de l'hébergement **inclus par le prestataire** n'est pas chiffré dans l'article : il est affiché « selon l'offre, à valider ».
Tous les montants portent la mention « indicatif ». Les noms de services cités dans l'article ne sont pas repris (règle du dépôt).

## Intégration dans l'article

À placer en fin d'article, comme conclusion pratique.

Lien : `https://<compte>.github.io/sakinadz-demos/sites/assistant-hebergement/`

```html
<iframe
  src="https://<compte>.github.io/sakinadz-demos/sites/assistant-hebergement/#assistant"
  title="Où héberger mon site ? L'assistant en 5 questions (démonstration)"
  width="100%" height="1100" loading="lazy"
  style="border:0;max-width:100%;"></iframe>
```
