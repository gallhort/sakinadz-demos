# Équilibre Conseil – site de démonstration

Site vitrine **fictif** d'un cabinet d'expertise comptable et de conseil à Oran, créé pour illustrer l'article
[Site web pour cabinet comptable en Algérie](https://www.sakinadz.com/site-web/site-web-cabinet-comptable-algerie).
Le cabinet, l'équipe, le parcours, l'adresse, les horaires et les coordonnées sont fictifs.

## Concept

Le site est la carte de visite du cabinet avant le premier rendez-vous : ce qu'il fait, pour qui, depuis quand,
comment le joindre. Le ton rassure sans rien promettre : aucun tarif affiché (honoraires « sur demande, après étude »),
aucun taux, aucun montant, aucune échéance légale, pas d'espace client, pas de formulaire (contact direct par
téléphone, WhatsApp ou e-mail). L'ordre professionnel et les titres sont marqués « à valider », et la note
« Textes à faire valider selon les règles de la profession » figure sur chaque page.

## Choix de design : « Grand livre »

Le site se lit comme un registre comptable.

- **Papier de registre** : fond sable `#f4efe6` réglé de lignes horizontales, double filet rouge de marge fixe
  à gauche, bandeau d'intitulés de colonnes (Date · Libellé · Débit · Crédit) sous l'en-tête, navigation présentée
  en colonnes numérotées (« Col. 01 »…).
- **Folios** : chaque page est un folio (01 à 05) avec un numéro géant au trait vert-bleu, souligné deux fois
  comme un total.
- **Chiffres monumentaux à chasse fixe** : chiffres tabulaires de Figtree (graisse fine) et de Newsreader,
  sans troisième police. Totaux soulignés d'un double trait.
- **Élément signature : la balance**. Sur l'accueil, une balance dessinée en SVG accompagne un journal à deux
  colonnes « Débit · vous nous confiez » / « Crédit · nous vous rendons ». Au chargement elle penche du côté débit
  (les pièces en vrac). À chaque écriture passée au défilement, un registre relié tombe dans le plateau crédit,
  le fléau oscille (ressort amorti) puis se pose ; l'écart affiché décroît de 04 à 00 et le tampon « ÉQUILIBRÉ »
  s'imprime quand la balance est à niveau. Sur mobile, la balance reste collée en haut de l'écran pendant la
  lecture des écritures.
- **Prestations en comptes en T** : chaque prestation est un compte (« Compte 01 »…) avec, à gauche, ce que le client
  transmet et, à droite, ce que le cabinet prend en charge. Les comptes passent sur une colonne grâce à une
  container query quand leur largeur est réduite.
- **Listing zébré** : sur l'accueil, le plan des prestations est imprimé sur papier listing continu (bandes
  vert-bleu alternées, bandes d'entraînement perforées).
- **Aplats** : bande vert-bleu « Nos comptes clients », méthode en aplat encre `#1d2b36`, bloc d'appel vert-bleu
  avec le numéro de téléphone en très grand et un signe « = » géant en filigrane.
- **Plan d'accès** : plan schématique en SVG sur papier millimétré, sans échelle, à remplacer par une carte réelle.
- **Accessibilité** : lien d'évitement, focus visible (contour rouge 3 px), contrastes AA (encre/sable 12,6:1 ;
  vert-bleu/sable 5,3:1 ; blanc/vert-bleu 6,1:1), menu mobile au clavier (Échap pour fermer), jour courant mis en
  évidence dans les horaires. Tout le contenu est visible sans JavaScript (balance à l'équilibre, apparitions
  désactivées) et `prefers-reduced-motion` supprime oscillations et transitions.

## Structure des fichiers

```
cabinet-comptable/
├── index.html             Accueil (folio 01) : spécialité, balance, plan des prestations, méthode, contact
├── prestations.html       Six prestations en comptes en T (folio 02)
├── cabinet.html           À propos : parcours, équipe fictive, règles de méthode (folio 03)
├── contact.html           Téléphone, WhatsApp, e-mail, adresse, horaires, plan SVG (folio 04)
├── mentions-legales.html  Mentions légales à compléter (folio 05)
├── css/style.css          Feuille de style unique
├── js/main.js             Menu mobile, apparitions, horaires du jour, balance
├── brief.md               Cahier des charges
└── source-article.md      Résumé de l'article source
```

## Lancer le site

Double-cliquez sur `index.html`, ou servez le dossier avec XAMPP ou tout serveur statique
(`python3 -m http.server` depuis le dossier). Aucune dépendance ni étape de build ; seules les polices
Figtree et Newsreader sont chargées depuis Google Fonts (polices de secours prévues).

## Intégration dans l'article

Lien simple :

```html
<a href="https://gallhort.github.io/sakinadz-demos/sites/cabinet-comptable/" target="_blank" rel="noopener">
  Voir la démo : Équilibre Conseil (site de cabinet comptable fictif)
</a>
```

Iframe :

```html
<iframe
  src="https://gallhort.github.io/sakinadz-demos/sites/cabinet-comptable/"
  title="Démo : site vitrine d'un cabinet comptable fictif"
  width="100%" height="720" loading="lazy"
  style="border:1px solid #1d2b36">
</iframe>
```
