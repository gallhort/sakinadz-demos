# Tafoukt, céramiques d'atelier : boutique de démonstration

Boutique en ligne **fictive** d'un atelier de poterie à Tlemcen, créée pour illustrer l'article
[Créer une boutique en ligne en Algérie : loi et paiement](https://www.sakinadz.com/blog/services/creer-boutique-en-ligne-algerie-loi-paiement).
La marque Tafoukt (« le soleil »), l'atelier, les pièces, les personnes, les adresses et les numéros sont inventés.
Aucune commande n'est réellement passée et aucune donnée n'est envoyée.

## Concept

Le lecteur de l'article parcourt une commande conforme, étape par étape, pendant qu'il lit la checklist :
fiches produits complètes (prix TTC, disponibilité, délais et frais de livraison, retours), commande en
trois étapes sans case pré-cochée, récapitulatif modifiable, confirmation, copie du contrat et facture,
paiement à la livraison ou carte bancaire **simulée**. La page « Ce que cette démo applique » relie chaque
point de la checklist à l'élément précis du site, et présente comme **à faire hors site** ce qui ne se règle
pas dans le code (registre du commerce, domaine .com.dz, hébergement en Algérie, contrat bancaire).

Tout ce qui est juridique vient du résumé de l'article (`source-article.md`) ; le reste est marqué « à valider ».
Les pages légales sont des modèles génériques « à adapter ».

## Choix de design : « la table d'atelier et le plan coté »

- **Palette** : crème `#f4efe6`, terre cuite `#c4633a` (poussée en `#933d20` pour les aplats et boutons,
  `#9e4325` pour le texte), sauge `#8a9a7b` (et `#4c5a43` pour le texte), encre brune `#2b1e17`.
- **Typographie** : DM Serif Display monumentale (titres jusqu'à 12,5 rem, chiffres d'étapes géants au trait),
  DM Sans pour le texte. Piles de secours Georgia et Helvetica/Arial.
- **Pièces dessinées en SVG** (`js/pots.js`) : chaque pièce est générée à partir d'un profil, comme au tour
  (vase, bol, cruche, jarre, gargoulette, tasse, tajine, pichet, assiette, plat, coupelle), avec une recette de
  glaçure : coulures, craquelures, engobes, bandes, losanges, émail mat, satiné ou brillant. Un générateur
  pseudo-aléatoire initialisé par la référence rend chaque pièce unique mais identique d'une page à l'autre.
- **Pièces qui débordent de leurs socles** : chaque carte pose la pièce sur un aplat de couleur dont elle dépasse.
- **Coulures entre sections** : les bandeaux encre et terre cuite « coulent » sur la section suivante.
- **Élément signature n° 1, le tour** : les décors et glaçures sont tuilables ; en faisant défiler l'accueil,
  la grande jarre tourne sur elle-même, et chaque pièce tourne au survol ou au focus clavier. Désactivé avec
  `prefers-reduced-motion`.
- **Élément signature n° 2, le plan coté** (`conformite.html`) : fond de calque vert sombre quadrillé, planches
  numérotées avec cartouche, maquettes réduites des éléments du site, repères A, B, C… et lignes de cote ;
  les démarches hors site sont dessinées en pointillés.
- **Indicateur de commande massif** : trois chiffres géants (au trait = à venir, terre cuite = en cours,
  sauge = faite) ; une étape faite redevient cliquable pour y revenir.

## Parcours et règles de fonctionnement

- **Fiche produit** : une seule page `produit.html?ref=TF-01` … `TF-12`, pilotée par JavaScript. La page
  livrée contient déjà la fiche TF-01 en HTML : sans paramètre, elle s'affiche ; avec une référence inconnue,
  un message l'indique et liste les autres pièces. Choix fait pour éviter 12 pages dupliquées.
- **Stock** : quantités bornées au stock ; TF-10 est épuisé (non commandable) ; TF-09 est en précommande
  (limitée à 5, réglée à la disponibilité, exclue du montant dû maintenant, frais d'envoi séparés).
- **Panier** : `localStorage` (clé `tafoukt-panier`), lu et écrit dans des `try/catch` avec repli en mémoire ;
  quantités modifiables, suppression avec « Annuler », panier vide illustré.
- **Commande** (`commande.html`) : état dans `sessionStorage` (clé `tafoukt-commande`), donc conservé au
  rechargement et au bouton Précédent (`#etape-1`, `#etape-2`, `#etape-3`). Une étape ne s'ouvre que si la
  précédente est valide. Erreurs listées en tête avec liens vers les champs, et sous chaque champ.
  Frais par zone : 400, 700 ou 1 100 DA (barème fictif de la boutique).
- **Carte bancaire (simulation)** : aucun champ, aucun logo, aucune page imitant une banque ; boutons
  « Simuler un paiement accepté / refusé ».
- **Confirmation** (`confirmation.html`) : numéro et horodatage, copie du contrat et facture simulée,
  imprimables séparément (`@media print`), registre local des transactions (effaçable).
- **Formulaires** (contact, désinscription) : validation dans le navigateur, message « Démonstration :
  aucune donnée n'est envoyée ».

## Structure des fichiers

```
index.html                 Accueil
boutique.html              12 pièces, filtres par famille
produit.html               Fiche produit (?ref=TF-01 … TF-12)
panier.html                Panier
commande.html              Commande en 3 étapes
confirmation.html          Confirmation, contrat, facture, registre
conformite.html            Ce que cette démo applique (plan coté)
mentions-legales.html  cgv.html  retours.html  donnees-personnelles.html  contact.html
css/style.css              Styles (variables, grid, clamp, impression, mouvement réduit)
js/data.js                 Catalogue, zones de livraison, identité fictive du vendeur
js/pots.js                 Générateur de poteries SVG
js/templates.js            Gabarits HTML partagés (cartes, fiche produit)
js/core.js                 Stockage protégé, panier, totaux, en-tête, apparitions, rotation
js/lines.js                Lignes de panier modifiables (panier et étape 2)
js/boutique.js  produit.js  panier.js  commande.js  confirmation.js  contact.js  donnees.js
```

Le HTML des cartes et de la fiche par défaut est écrit en dur dans les pages (lisible sans JavaScript) ;
les mêmes gabarits (`js/templates.js`) servent au rendu dynamique.

## Lancer le site

Aucune installation ni étape de build : double-cliquez sur `index.html`, ou servez le dossier
(XAMPP : `http://localhost/sakinadz-demos/sites/boutique-conforme/`). Tous les chemins sont relatifs.
Pour repartir de zéro : page « Données personnelles », bouton « Effacer toutes les données de démonstration ».

## Intégration dans l'article

Lien : `https://<compte>.github.io/sakinadz-demos/sites/boutique-conforme/`
(page la plus utile à côté de la checklist : `conformite.html`).

```html
<iframe
  src="https://<compte>.github.io/sakinadz-demos/sites/boutique-conforme/conformite.html"
  title="Démonstration : une commande conforme à la loi 18-05 (boutique fictive)"
  width="100%" height="760" loading="lazy"
  style="border:1px solid #2b1e17"></iframe>
```

Toutes les pages portent `noindex, nofollow` et le bandeau « Site de démonstration – contenu fictif ».
