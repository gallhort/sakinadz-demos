/* Tafoukt : données du catalogue (entièrement fictives). */
(function (root) {
  'use strict';

  var SHOP = {
    nom: 'Tafoukt',
    sousTitre: "céramiques d'atelier",
    exploitant: 'Atelier Tafoukt, artisan céramiste (entreprise fictive)',
    immatriculation: "Registre de l'artisanat n° 00-0000000 (fictif, à remplacer)",
    nif: 'NIF 000 000 000 000 000 (fictif, à remplacer)',
    adresse: "00, rue de l'Exemple, Tlemcen (adresse fictive)",
    tel: '+213 00 00 00 00',
    telHref: 'tel:+21300000000',
    whatsapp: 'https://wa.me/213000000000',
    email: 'contact@exemple.dz',
    domaine: 'exemple.com.dz (fictif)',
    preparation: '1 à 2 jours ouvrables',
    versionCgv: 'CGV démo, version du 1er octobre 2026'
  };

  /* Zones et frais : barème propre à la boutique fictive (pas un chiffre légal). */
  var ZONES = [
    { id: 'z1', nom: 'Zone 1 : wilaya de Tlemcen', court: 'Wilaya de Tlemcen', frais: 400, delai: '2 à 3 jours ouvrables' },
    { id: 'z2', nom: 'Zone 2 : autres wilayas du Nord', court: 'Wilayas du Nord', frais: 700, delai: '3 à 5 jours ouvrables' },
    { id: 'z3', nom: 'Zone 3 : Hauts-Plateaux et Sud', court: 'Hauts-Plateaux et Sud', frais: 1100, delai: '5 à 8 jours ouvrables' }
  ];

  /* statut : 'dispo' | 'precommande' | 'epuise' */
  var PRODUCTS = [
    { ref: 'TF-01', nom: 'Nedjma', type: 'Vase haut', famille: 'vases', prix: 6800, stock: 3, statut: 'dispo',
      dim: 'Hauteur 34 cm, diamètre 18 cm', poids: '1,6 kg',
      glacure: 'Émail céladon brillant, craquelé, coulures sur terre rouge',
      texte: "Un col étroit, une panse qui s'ouvre tard : Nedjma est tournée en une seule levée. L'émail céladon, posé au trempé, s'est craquelé au refroidissement et laisse couler quelques larmes sur la terre nue.",
      usage: 'Décoratif ou fleurs fraîches : intérieur émaillé, étanche.',
      pot: { form: 'vaseHaut', clay: '#b4573a', glaze: '#93a886', glaze2: '#6f8763', level: 0.68, drips: 5, finish: 'brillant', crackle: true, decor: 'none' } },
    { ref: 'TF-02', nom: 'Sebkha', type: 'Bol', famille: 'table', prix: 1900, stock: 12, statut: 'dispo',
      dim: 'Diamètre 15 cm, hauteur 7 cm', poids: '320 g',
      glacure: 'Engobe blanc laiteux mat, coulures sur terre rouge',
      texte: "Le bol de tous les jours, assez large pour une chorba, assez fin pour le thé du soir. L'engobe blanc s'arrête où la main l'a lâché : chaque coulure est différente.",
      usage: 'Contact alimentaire, lave-vaisselle déconseillé.',
      pot: { form: 'bol', clay: '#b4573a', glaze: '#efe7d6', glaze2: '#d9cdb5', level: 0.55, drips: 7, finish: 'mat', crackle: false, decor: 'none' } },
    { ref: 'TF-03', nom: 'Aïn', type: 'Cruche à eau', famille: 'cruches', prix: 3600, stock: 6, statut: 'dispo',
      dim: 'Hauteur 28 cm, contenance 1,5 l', poids: '1,1 kg',
      glacure: 'Engobe crème satiné, bandes brun manganèse',
      texte: "Aïn, la source. Une cruche à anse latérale et bec pincé, dont la terre poreuse garde l'eau fraîche. Les bandes brunes sont tracées au pinceau pendant que la pièce tourne encore.",
      usage: 'Eau uniquement, intérieur non émaillé.',
      pot: { form: 'cruche', clay: '#c06a43', glaze: '#eadcc0', glaze2: '#d8c6a2', level: 1, drips: 0, finish: 'satine', crackle: false, decor: 'bands', decorColor: '#4a2f22' } },
    { ref: 'TF-04', nom: 'Ksar', type: 'Assiette plate', famille: 'table', prix: 2400, stock: 10, statut: 'dispo',
      dim: 'Diamètre 27 cm', poids: '780 g',
      glacure: 'Émail miel brillant, rayons incisés',
      texte: "Les rayons sont incisés à la pointe dans la terre encore humide, puis noyés sous un émail miel qui se fonce dans chaque creux. Une assiette de fête qui supporte le quotidien.",
      usage: 'Contact alimentaire, lavage à la main conseillé.',
      pot: { form: 'assiette', clay: '#b4573a', glaze: '#c98a2e', glaze2: '#a5681c', finish: 'brillant', crackle: false, decor: 'rayons', decorColor: '#7d4a16' } },
    { ref: 'TF-05', nom: 'Kanoun', type: 'Tajine de cuisson', famille: 'cuisine', prix: 4500, stock: 4, statut: 'dispo',
      dim: 'Diamètre 30 cm, hauteur 24 cm', poids: '2,4 kg',
      glacure: 'Terre culinaire nue, couvercle engobé terre cuite',
      texte: "Un tajine pour le feu doux : fond épais, couvercle conique qui renvoie la vapeur vers le plat. La terre est laissée nue à l'intérieur, comme on l'a toujours fait.",
      usage: 'Culottage avant la première utilisation (notice fournie). Pas de choc thermique.',
      pot: { form: 'tajine', clay: '#a9502f', glaze: '#c4633a', glaze2: '#a64d2a', level: 1, drips: 0, finish: 'mat', crackle: false, decor: 'incise', decorColor: '#7e3a1f' } },
    { ref: 'TF-06', nom: 'Tassili', type: 'Grande jarre', famille: 'jarres', prix: 16500, stock: 1, statut: 'dispo', unique: true,
      dim: 'Hauteur 48 cm, diamètre 36 cm', poids: '7,5 kg',
      glacure: 'Émail brun manganèse mat, coulures épaisses',
      texte: "Pièce unique, montée au colombin puis reprise au tour. L'émail brun, très chargé en manganèse, a coulé en larges nappes pendant la cuisson longue : on n'en refera pas une pareille.",
      usage: 'Décoratif, intérieur et extérieur abrité.',
      pot: { form: 'jarre', clay: '#b4573a', glaze: '#4a3226', glaze2: '#2f1f17', level: 0.6, drips: 4, finish: 'mat', crackle: false, decor: 'none' } },
    { ref: 'TF-07', nom: 'Chergui', type: 'Gargoulette', famille: 'cruches', prix: 2900, stock: 8, statut: 'dispo',
      dim: 'Hauteur 26 cm, contenance 1 l', poids: '900 g',
      glacure: 'Engobe blanc mat, losanges et chevrons noirs',
      texte: "La gargoulette rafraîchit l'eau par évaporation. Celle-ci porte un décor géométrique peint à main levée : chevrons au col, losanges sur la panse.",
      usage: 'Eau uniquement, intérieur non émaillé.',
      pot: { form: 'gargoulette', clay: '#c06a43', glaze: '#f0e9db', glaze2: '#ddd2bd', level: 0.8, drips: 0, finish: 'mat', crackle: false, decor: 'losanges', decorColor: '#2b1e17' } },
    { ref: 'TF-08', nom: 'Fadjr', type: 'Tasse', famille: 'table', prix: 1400, stock: 20, statut: 'dispo',
      dim: 'Hauteur 9 cm, contenance 25 cl', poids: '280 g',
      glacure: 'Émail bleu nuit brillant, lèvre crème qui coule',
      texte: "Fadjr, l'aube : un bleu de nuit au fond duquel une lèvre crème descend comme la première lumière. Une anse pensée pour deux doigts, un pied non émaillé pour la prise.",
      usage: 'Contact alimentaire, micro-ondes déconseillé.',
      pot: { form: 'tasse', clay: '#b4573a', glaze: '#263852', glaze2: '#18263b', level: 0.85, drips: 0, finish: 'brillant', crackle: false, decor: 'levre', decorColor: '#eadfc8' } },
    { ref: 'TF-09', nom: 'Mzab', type: 'Plat creux', famille: 'table', prix: 3900, stock: 0, statut: 'precommande', dispoLe: '16 novembre 2026', maxPrecommande: 5,
      dim: 'Diamètre 32 cm, profondeur 6 cm', poids: '1,4 kg',
      glacure: 'Émail sauge mat, spirale terre cuite',
      texte: "Un plat à partager, creusé juste ce qu'il faut. La spirale est tirée au doigt dans l'émail frais, du centre vers le bord. La prochaine fournée sort du four mi-novembre.",
      usage: 'Contact alimentaire, lavage à la main conseillé.',
      pot: { form: 'platCreux', clay: '#b4573a', glaze: '#8a9a7b', glaze2: '#6d7d60', finish: 'mat', crackle: false, decor: 'spirale', decorColor: '#c4633a' } },
    { ref: 'TF-10', nom: 'Rmel', type: 'Vase boule', famille: 'vases', prix: 5200, stock: 0, statut: 'epuise',
      dim: 'Hauteur 22 cm, diamètre 24 cm', poids: '1,3 kg',
      glacure: 'Engobe sable mat, points à la poire',
      texte: "Rmel, le sable : un vase boule à l'engobe granuleux, ponctué de points posés à la poire. La série est épuisée ; elle n'est pas proposée à la commande.",
      usage: 'Décoratif, intérieur non étanche.',
      pot: { form: 'vaseBoule', clay: '#c47a4f', glaze: '#d8c3a0', glaze2: '#c2a97f', level: 0.92, drips: 0, finish: 'mat', crackle: false, decor: 'points', decorColor: '#8e4a32' } },
    { ref: 'TF-11', nom: 'Zitoune', type: 'Coupelle', famille: 'table', prix: 1100, stock: 15, statut: 'dispo',
      dim: 'Diamètre 14 cm', poids: '200 g',
      glacure: 'Émail vert olive brillant, points crème',
      texte: "Pour les olives, le sel, les dattes. Une petite coupelle au vert d'olive profond, piquée de points crème qui s'étalent légèrement à la cuisson.",
      usage: 'Contact alimentaire.',
      pot: { form: 'coupelle', clay: '#b4573a', glaze: '#6f7535', glaze2: '#565b26', finish: 'brillant', crackle: false, decor: 'pointsRond', decorColor: '#eadfc8' } },
    { ref: 'TF-12', nom: 'Safsaf', type: 'Pichet', famille: 'cruches', prix: 3300, stock: 5, statut: 'dispo',
      dim: 'Hauteur 21 cm, contenance 1 l', poids: '850 g',
      glacure: 'Émail crème craquelé brillant, frise terre cuite',
      texte: "Un pichet à lait ou à citronnade, au bec généreux. L'émail crème craquelé est souligné d'une frise ondulée tracée à l'engobe terre cuite.",
      usage: 'Contact alimentaire, lavage à la main conseillé.',
      pot: { form: 'pichet', clay: '#b4573a', glaze: '#ece2cc', glaze2: '#d6c8aa', level: 0.95, drips: 3, finish: 'brillant', crackle: true, decor: 'vagues', decorColor: '#c4633a' } }
  ];

  var FAMILLES = [
    { id: 'tout', nom: 'Toutes les pièces' },
    { id: 'vases', nom: 'Vases' },
    { id: 'table', nom: 'Table' },
    { id: 'cruches', nom: 'Cruches et pichets' },
    { id: 'cuisine', nom: 'Cuisine' },
    { id: 'jarres', nom: 'Jarres' }
  ];

  function byRef(ref) {
    if (!ref) return null;
    ref = String(ref).toUpperCase();
    for (var i = 0; i < PRODUCTS.length; i++) if (PRODUCTS[i].ref === ref) return PRODUCTS[i];
    return null;
  }
  function zone(id) {
    for (var i = 0; i < ZONES.length; i++) if (ZONES[i].id === id) return ZONES[i];
    return null;
  }
  /* Quantité maximale commandable : stock réel, ou plafond de précommande. */
  function maxQty(p) {
    if (!p) return 0;
    if (p.statut === 'epuise') return 0;
    if (p.statut === 'precommande') return p.maxPrecommande || 0;
    return p.stock;
  }
  function fmt(n) {
    var s = String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return s + ' DA';
  }
  function dispoText(p) {
    if (p.statut === 'epuise') return 'Épuisé : non disponible à la commande';
    if (p.statut === 'precommande') return 'En précommande : disponible le ' + p.dispoLe;
    if (p.unique) return 'En stock : pièce unique';
    if (p.stock <= 3) return 'En stock : plus que ' + p.stock + ' pièces';
    return 'En stock (' + p.stock + ' pièces)';
  }

  root.TF = root.TF || {};
  root.TF.SHOP = SHOP;
  root.TF.ZONES = ZONES;
  root.TF.PRODUCTS = PRODUCTS;
  root.TF.FAMILLES = FAMILLES;
  root.TF.byRef = byRef;
  root.TF.zone = zone;
  root.TF.maxQty = maxQty;
  root.TF.fmt = fmt;
  root.TF.dispoText = dispoText;
})(typeof window !== 'undefined' ? window : globalThis);
