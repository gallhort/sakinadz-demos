# Comparateur de prestataire : 12 questions avant de signer

Outil de démonstration **fictif** (marque « Contrôle Devis ») qui illustre l'article
[Choisir un prestataire pour son site web en Algérie : 12 questions et erreurs qui coûtent cher](https://www.sakinadz.com/blog/services/choisir-prestataire-site-web-algerie-questions-erreurs).
Toutes les coordonnées sont génériques (+213 00 00 00 00, contact@exemple.dz, wa.me/213000000000). Les pages portent `noindex, nofollow`.

## Concept

Un **bureau d'inspection des devis**. Le visiteur passe le devis qu'il a reçu au contrôle qualité :

1. **Évaluer un devis** : 12 questions en 5 thèmes (A à E) + une section F de signaux d'alerte observés.
   Réponses Oui / Non / Je ne sais pas. Le rapport d'inspection affiche une **règle graduée monumentale**
   (une graduation par question), un score, deux **tampons encrés** (verdict et signaux), l'explication de
   chaque point faible avec la question à poser, et le registre des **7 erreurs qui coûtent cher**.
2. **Comparer deux devis** (ou trois) : tableau de 9 critères. Chaque case vide ou « Non précisé » est
   **hachurée en rouge** (élément signature : les hachures défilent au survol/focus), les cases à risque
   sont marquées « Signal d'alerte », un tampon fait le bilan de chaque colonne.

## Choix de design

- Papier quadrillé `#fafaf7`, encre noire, accent bleu `#2d5bff` (aiguille, tampons « à clarifier »),
  rouge `#d64545` et vert `#2e9b5f` (assombris en `#b32f2f` / `#1c7344` pour le texte, contraste AA).
- Inter Tight (titres capitales 800–900, chiffres géants) + Newsreader (commentaires, « remarques de l'inspecteur »).
- Tampons encrés de travers (bordure double, filtre SVG `feTurbulence` pour l'encre irrégulière), qui
  « claquent » à chaque changement de verdict et sur chaque question répondue ; ils s'impriment.
- Numéros de questions géants en contour, qui se remplissent de la couleur de la réponse.
- Aplat encre pleine largeur pour le registre des erreurs, aplat bleu pour l'appel final.
- `prefers-reduced-motion` : aucune animation (tampons, apparitions, hachures).

## Comment « Je ne sais pas » est compté

- **Score** = nombre de « Oui » sur 12 (réponses solides). Seul un Oui fait avancer l'aiguille.
- **« Je ne sais pas »** ne retire rien et n'est pas un point faible : la graduation est hachurée en bleu,
  la question rejoint la liste « À clarifier » avec la phrase à poser au prestataire.
- **« Non »** est un point faible, expliqué dans le rapport (la question 7 passe en premier : l'article
  qualifie le domaine au nom du prestataire d'erreur « la plus grave »).
- Verdict (tampon) : *En attente* (0 réponse) → *En cours* (réponses partielles, rapport provisoire) →
  avec 12 réponses : *À renégocier* s'il y a au moins un Non (« Domaine d'abord » si c'est la question 7),
  *À clarifier* s'il ne reste que des Je ne sais pas, *Sans case vide* si 12 Oui. Ce sont des règles
  qualitatives de l'outil, sans seuil chiffré (aucun seuil n'existe dans la source).
- Signaux d'alerte : cochés par l'utilisateur (section F) ou **déduits** d'un Non aux questions 3
  (prix flou), 7 (domaine/hébergement) et 11 (portfolio sans sites en ligne).

## Traçabilité (tout vient de `source-article.md`)

| Élément de l'outil | Phrase de la source |
|---|---|
| 12 questions, 5 thèmes | « Ce que vous achetez : contenu inclus ; design créé ou adapté d'un modèle ; coût total sur trois ans ; qui rédige textes et photos. Le calendrier : point de départ du délai ; nombre de tours de révisions inclus. La propriété : titulaire du domaine et de l'hébergement ; remise des fichiers du site. La suite : qui gère les modifications après la mise en ligne ; peut-on les faire soi-même. La qualité : sites réellement en ligne à consulter ; vitesse mobile mesurable avec PageSpeed Insights ou Lighthouse. » |
| 7 erreurs | « laisser le domaine au nom du prestataire (la plus grave) ; payer intégralement sans échéancier, ni devis ni facture ; commencer sans contenu prêt ; vouloir tout dans le premier site ; négliger le test mobile ; croire que le site attirera seul des clients ; choisir un hébergement gratuit interdisant l'usage commercial. » |
| 6 signaux d'alerte | « prix flou ou changeant ; portfolio de maquettes sans sites en ligne ; domaine ou hébergement au nom du prestataire ; promesses de première position sur Google ; absence de conditions écrites ; réponses qui ralentissent à l'approche du paiement. » |
| 9 critères du tableau | « tableau à trois colonnes couvrant prix, pages et langues, design, révisions, point de départ du délai, titulaire du domaine et de l'hébergement, remise des fichiers, maintenance, coût sur trois ans. » |
| « 3 ans » (question 3, ligne du tableau) | « coût total sur trois ans » |
| Verdict de la comparaison | « Le meilleur devis n'est pas le moins cher : c'est celui qui n'a pas de case vide. » |
| Trois types de prestataires (champ facultatif) | « le freelance (…) ; l'agence (…) ; l'offre à prix fixe (…) » |

Aucun montant n'est fourni par l'outil : les prix sont saisis par l'utilisateur, en DA, à titre indicatif.
L'offre à 390 € / 290 € citée en fin d'article n'est pas reprise. Garde-fous techniques de saisie (non issus
de l'article) : montant négatif refusé, montant nul signalé « à vérifier », montant ≥ 100 milliards signalé
« hors norme », virgule décimale et séparateurs de milliers acceptés (« 2,5 », « 120.000 », « 1 200 000,50 »,
« 150000 DA »).

## Structure des fichiers

```
comparateur-prestataire/
├── index.html        page unique, deux onglets (motif ARIA tablist)
├── css/style.css     styles, container queries, @media print
├── js/data.js        contenu : questions, signaux, erreurs, critères du tableau
├── js/app.js         logique : rapport, jauge, tampons, comparaison, stockage local, impression
├── README.md
├── brief.md
└── source-article.md
```

Aucune donnée n'est envoyée (ni fetch, ni formulaire soumis, ni mesure d'audience). Les réponses sont
gardées dans le `localStorage` du navigateur (dans un try/catch) ; le bouton « Effacer les données
enregistrées » du pied de page les supprime. « Recommencer » et « Vider le tableau » demandent une confirmation.

## Lancer

Double-cliquez `index.html`, ou servez le dossier (XAMPP, `python3 -m http.server`, GitHub Pages à
`.../sites/comparateur-prestataire/`). Tous les chemins sont relatifs. Sans les polices Google, les piles de
secours (Arial Narrow / Arial, Georgia) prennent le relais.

Impression : bouton « Imprimer le rapport » (onglet 1 : rapport + relevé des 12 réponses + 7 erreurs, plus le
tableau comparatif s'il est rempli) ou « Imprimer la comparaison » (onglet 2). Fond blanc, sans navigation,
avec l'URL de l'article.

## Intégration dans l'article

À placer juste après la liste des 12 questions : le lecteur évalue tout de suite le devis qu'il a reçu.

Lien simple :

```html
<a href="https://VOTRE-COMPTE.github.io/sakinadz-demos/sites/comparateur-prestataire/">Évaluer votre devis avec le comparateur (12 questions)</a>
```

Iframe :

```html
<iframe
  src="https://VOTRE-COMPTE.github.io/sakinadz-demos/sites/comparateur-prestataire/"
  title="Comparateur de prestataire : 12 questions avant de signer"
  width="100%" height="900" loading="lazy"
  style="border:1px solid #d6d4ca;max-width:100%"></iframe>
```
