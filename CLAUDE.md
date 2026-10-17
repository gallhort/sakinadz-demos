# Règles du dépôt sakinadz-demos

Ce dépôt contient des **sites de démonstration fictifs** qui illustrent des articles de sakinadz.com. Un dossier par site dans `sites/`.

## Organisation
- Chaque session travaille **uniquement** dans le dossier `sites/<nom>/` qu'on lui indique. Ne modifie rien d'autre : ni la racine du dépôt, ni les autres sites.
- Chaque site est autonome (aucun fichier partagé entre sites) et a son `index.html` à la racine de son dossier.
- Tous les chemins sont relatifs (jamais de `/` en début de chemin) : le site doit fonctionner depuis un sous-dossier, via XAMPP, et sur GitHub Pages à l'adresse `.../sites/<nom>/`.
- Lis dans l'ordre : ce fichier, `sites/<nom>/brief.md`, puis `sites/<nom>/source-article.md`.

## Contenu fictif
- Toutes les marques, personnes, adresses, chiffres et contenus sont fictifs. Affiche en haut de chaque page un bandeau discret et permanent « Site de démonstration – contenu fictif ».
- Ajoute `<meta name="robots" content="noindex, nofollow">` sur toutes les pages : ces démos ne doivent pas être indexées comme de vraies entreprises.
- Aucune marque, aucun logo, aucun nom réel (banques, organismes, ordres professionnels, entreprises, clients de l'agence). Les fichiers `source-article.md` citent des clients réels : ne les reprends pas.
- Aucun témoignage ou avis présenté comme réel. Une éventuelle zone d'avis est libellée « zone d'avis (exemple à remplacer par de vrais avis) ».
- Coordonnées factices et clairement génériques (ex. +213 00 00 00 00, contact@exemple.dz). Lien WhatsApp d'exemple : https://wa.me/213000000000.
- Les formulaires, quand il y en a, ne collectent et n'envoient rien : validation dans le navigateur uniquement, avec le message « Démonstration : aucune donnée n'est envoyée ».

## Vérité des informations
- `source-article.md` est la référence pour les faits, prix, lois et le ton. C'est un résumé : n'invente aucun chiffre, article de loi ou délai légal qui n'y figure pas. En cas de doute, reste générique et écris « à valider ».
- Contexte Algérie : français soigné avec vouvoiement (sauf indication contraire dans le brief), prix en dinars (DA) pour les sites métier, villes et wilayas réelles autorisées, numéros au format +213.

## Technique
- HTML5, CSS3 moderne (variables, grid, clamp, container queries), JavaScript vanilla. Aucun framework, aucune étape de build. Le site s'ouvre en double-cliquant `index.html`.
- Polices Google Fonts (2 familles maximum), `font-display: swap`.
- Responsive mobile-first (360 à 1920 px). Accessibilité AA : contrastes, clavier, `alt`, `prefers-reduced-motion`, sémantique correcte.
- Performance : visuels en SVG, CSS ou canvas, pas d'image lourde. Lighthouse visé : 90+.
- Textes réalistes et soignés, zéro « lorem ipsum ».
- Chaque site a un `README.md` : concept, choix de design, structure des fichiers, comment lancer, et une section « Intégration dans l'article » (lien et exemple d'iframe avec `loading="lazy"`).

## Méthode
Travaille par passes : structure, design, interactions, relecture (responsive, accessibilité, performance). Commits réguliers sur la branche de la session.
