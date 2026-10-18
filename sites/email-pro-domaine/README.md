# Guichet Courriel : mon e-mail pro (outil de démonstration)

Outil interactif fictif qui illustre l'article « Adresse e-mail professionnelle avec son nom de domaine » de sakinadz.com. Toutes les personnes, activités, domaines et coordonnées sont fictifs. La page n'envoie rien, ne vérifie rien en ligne (pas de test de disponibilité de domaine) et n'est pas indexée (`noindex, nofollow`).

## Concept

L'e-mail est traité comme du **courrier postal**. Le héros montre une enveloppe par avion en grand plan, avec les en-têtes De / À / Objet en très grand. Le « De » se met à jour avec le domaine saisi. L'outil est organisé en trois « guichets » (onglets ARIA) :

1. **Mes adresses** : à partir du nom de l'activité et du domaine, l'outil propose contact@, commercial@, facturation@ et recrutement@, ainsi que des adresses nominatives (prénom@, prénom.nom@ ou p.nom@), présentées comme des étiquettes postales. Chaque adresse a un bouton « Comment la dicter » (épellation : arobase, tiret, point), un bouton de copie et un repère de longueur. La saisie est nettoyée : majuscules, accents, espaces, `https://`, `www.`, chemin, port et partie avant `@` sont corrigés. En cas d'erreur, un message utile s'affiche, avec une correction en un clic si possible (extension manquante, tiret en bord, points doublés, caractères non latins, domaine de messagerie gratuite). On y trouve aussi le « règlement du guichet » (bonnes pratiques), les endroits où afficher l'adresse et un **comparateur** des trois façons d'obtenir une adresse, qui met en avant une formule selon la situation choisie, sans nommer de fournisseur.
2. **Ma signature** : formulaire, aperçu en direct dans un e-mail en grand plan, puis une **carte de visite qu'on retourne** (recto : version mise en forme ; verso : texte brut). La copie fonctionne en HTML et en texte brut avec plusieurs replis : API Clipboard, puis `execCommand`, puis zone de texte présélectionnée avec la consigne Ctrl+C si le presse-papiers est indisponible (cas fréquent en `file://`). Le téléphone saisi au format 0XXXXXXXXX est normalisé en +213.
3. **Réglages** : SPF, DKIM et DMARC expliqués en langage simple (liste des bureaux d'envoi autorisés, cachet sur l'enveloppe, consigne laissée au guichet d'arrivée). On y trouve aussi les erreurs fréquentes sous forme de checklist et un carnet de timbres oblitérés au fil des cases cochées.

**Élément signature : « Le trajet de la lettre »**. Choisissez votre vraie lettre ou une lettre usurpée, réglez SPF, DKIM et la consigne DMARC (aucune, « none », quarantaine, rejet), puis lancez le trajet. La lettre parcourt trois points de contrôle. À chacun, un **tampon postal rond daté** (date du jour, texte circulaire, ondulations d'oblitération) vient s'imprimer, puis la lettre arrive dans le bac « Boîte de réception », « Indésirables » ou « Refusée », avec une explication nuancée. Le piège classique est montré : une consigne quarantaine ou rejet sans SPF ni DKIM frappe aussi vos propres e-mails, d'où le conseil de commencer par « none ».

## Choix de design

- Palette du brief : blanc `#ffffff`, violet `#6a4cff` utilisé **en aplat franc** (aucun dégradé), gris `#eceef3`. S'y ajoutent une encre `#17132e` et un violet texte `#5536f0` pour atteindre le contraste AA sur gris.
- Rayures « par avion » (violet / blanc / encre) sur l'enveloppe, la bande défilante, les étiquettes d'adresses et l'en-tête de l'e-mail.
- Typographie : Fraunces (titres monumentaux, italiques violettes), Manrope (texte, en-têtes d'enveloppe très grands). Piles de secours : Georgia et Arial.
- Tampons ronds, timbres à dentelure (bordure pointillée blanche), cachets datés : tout est vectoriel et généré en SVG dans le JS.
- Angles droits, ombres portées pleines (pas d'ombres floues partout), grands chiffres 01 / 02 / 03, compositions asymétriques.

## Structure des fichiers

```
sites/email-pro-domaine/
├── index.html        page unique (3 onglets)
├── css/styles.css    styles, responsive, impression, prefers-reduced-motion
├── js/app.js         logique : nettoyage du domaine, adresses, signature, simulation, checklist, stockage local
├── README.md
├── brief.md
└── source-article.md
```

## Lancer

Double-cliquez sur `index.html`, ou servez le dossier avec XAMPP ou GitHub Pages. Il n'y a aucune dépendance ni étape de build. Les saisies sont conservées dans le `localStorage` du navigateur (dans un try/catch). Le bouton « Effacer mes saisies » en pied de page les supprime. Un bouton « Imprimer mon récapitulatif » imprime les trois guichets sur fond blanc, avec l'URL de l'article.

## Traçabilité des contenus (source-article.md)

Aucun prix chiffré n'apparaît : l'article n'en donne pas.

| Élément de l'outil | Phrase source |
|---|---|
| Une adresse de marque rassure banques, fournisseurs étrangers, grands clients | « une adresse de marque du type contact@votredomaine rassure banques, fournisseurs étrangers et grands clients. Sans domaine, pas d'adresse professionnelle. » |
| Changer de fournisseur sans changer d'adresse ; adresses de rôle qui restent | « propriété (on peut changer de fournisseur sans changer d'adresse), continuité (les adresses de rôle restent à l'entreprise quand une personne part) » |
| Réexpédition : souvent gratuite, serveur d'envoi authentifié, freelances | « redirection (alias) : […] simple et souvent gratuit ; répondre depuis l'adresse demande un serveur d'envoi authentifié ; pour freelances et très petites structures » |
| Boîtes de l'hébergeur | « incluses dans beaucoup d'hébergements mutualisés avec webmail ; stockage et filtrage du spam variables ; pour petites équipes déjà sur un mutualisé » |
| Messagerie payante, par utilisateur et par mois, astuce des alias | « boîtes complètes avec agenda, stockage, outils de collaboration, facturées par utilisateur et par mois ; astuce : une licence avec plusieurs alias (contact@, commercial@, facturation@) redirigés vers elle ». Les noms de fournisseurs ont été retirés volontairement. Le tarif est indiqué « à valider ». |
| SPF, un seul enregistrement | « SPF liste les serveurs autorisés à envoyer pour le domaine (un seul enregistrement SPF par domaine) » |
| DKIM | « DKIM ajoute une signature numérique vérifiée avec une clé publique dans le DNS » |
| DMARC none / quarantaine / rejet, commencer par none | « DMARC indique aux destinataires quoi faire des messages qui échouent à SPF ou DKIM : rien (« none »), quarantaine, rejet ; on commence souvent par « none » pour observer, puis on durcit » |
| « Depuis 2024 » | « Depuis 2024, Gmail et Yahoo exigent l'authentification des expéditeurs à gros volume ; même les petits domaines sans ces réglages sont plus souvent classés en spam. » (Formulé ici « les grands fournisseurs de messagerie gratuite », sans nommer les marques.) |
| Rôles des adresses, courtes et faciles à dicter | « contact@ pour les demandes générales ; adresses de rôle (commercial@, facturation@, recrutement@) qui survivent aux départs ; adresses nominatives pour le contact personnel avec un client ; courtes et faciles à dicter au téléphone » |
| Checklist des erreurs fréquentes (5 points) | « domaine enregistré au nom d'un prestataire ; absence de SPF ou DKIM ; deux enregistrements SPF (ils s'annulent) ; une seule boîte et un seul mot de passe pour toute l'équipe ; adresse gratuite sur le site d'une entreprise qui a un domaine » |
| Où afficher l'adresse | « pied de page et page contact du site, mentions légales, fiche Google Business, signatures d'e-mail, devis et factures ; la cohérence aide clients et moteurs de recherche » (la fiche est décrite de façon générique : « fiche d'établissement sur les cartes en ligne ») |

Hors article (règles techniques de saisie, pas des affirmations de l'article) :
- la validation du domaine (lettres, chiffres, tirets, extension d'au moins deux lettres, morceau de 63 caractères au plus) suit les règles usuelles des noms de domaine, à valider avec votre bureau d'enregistrement ;
- la normalisation du numéro 0XXXXXXXXX vers +213 est une aide de mise en forme.

La simulation est volontairement simplifiée et présentée comme telle. Les valeurs exactes des enregistrements DNS ne sont pas données : elles viennent de l'hébergeur ou de la messagerie (« à valider »).

## Intégration dans l'article

À placer dans la section sur le choix des adresses : le lecteur prépare tout de suite ses adresses et sa signature.

Lien simple :

```html
<a href="https://VOTRE-COMPTE.github.io/sakinadz-demos/sites/email-pro-domaine/">Préparer mes adresses, ma signature et mes réglages e-mail</a>
```

Iframe :

```html
<iframe
  src="https://VOTRE-COMPTE.github.io/sakinadz-demos/sites/email-pro-domaine/"
  title="Mon e-mail pro : adresses, signature et réglages SPF, DKIM, DMARC"
  width="100%" height="1000" loading="lazy"
  style="border:1px solid #eceef3;max-width:100%"></iframe>
```
