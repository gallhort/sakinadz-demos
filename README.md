# sakinadz-demos

Sites de démonstration fictifs pour illustrer les articles de sakinadz.com. Un dossier par site dans `sites/`.

| # | Dossier | Démo | Type | Priorité |
|---|---------|------|------|----------|
| 1 | `sites/auto-entrepreneur/` | Bois & Main : menuisier indépendant (auto-entrepreneur) | Vitrine sectorielle | A |
| 2 | `sites/agence-immobiliere/` | Horizon Immobilier : agence immobilière | Vitrine sectorielle | A |
| 3 | `sites/negoce-import-export/` | Tamarisk Trade : société de négoce import-export (en anglais) | Vitrine sectorielle | A |
| 4 | `sites/ecole-formation/` | Centre Cèdre Formation : école et centre de formation | Vitrine sectorielle | A |
| 5 | `sites/salon-beaute/` | Salon Lumière : coiffure et beauté | Vitrine sectorielle | A |
| 6 | `sites/cabinet-avocat/` | Cabinet Maître Démo : cabinet d'avocat | Vitrine sectorielle | A |
| 7 | `sites/cabinet-comptable/` | Équilibre Conseil : cabinet comptable et conseil | Vitrine sectorielle | A |
| 8 | `sites/boutique-conforme/` | Boutique en ligne démo : une commande conforme à la loi 18-05 | Site complexe | C |
| 9 | `sites/comparateur-prestataire/` | Comparateur de prestataire : 12 questions avant de signer | Outil interactif | B |
| 10 | `sites/assistant-hebergement/` | Où héberger mon site ? L'assistant en 5 questions | Outil interactif | B |
| 11 | `sites/calculateur-maintenance/` | Calculateur du coût annuel de maintenance d'un site | Outil interactif | B |
| 12 | `sites/email-pro-domaine/` | Mon e-mail pro : choisir ses adresses, la signature et les réglages | Outil interactif | B |
| 13 | `sites/wordpress-diagnostic/` | WordPress lent : optimiser ou refaire ? Le diagnostic | Outil interactif | B |

Priorité : A = vitrines sectorielles (les pages de l'offre), B = outils interactifs (une page à glisser dans un article), C = site plus complexe.

## Utilisation
1. Les sessions cloud se lancent depuis claude.ai/code sur ce dépôt. Les prompts prêts à coller sont dans `PROMPTS.md`.
2. Chaque session travaille dans son dossier et pousse sur sa propre branche `claude/...`. Les dossiers étant séparés, les fusions ne se gênent pas.
3. Pour tester : `git fetch`, `git checkout <branche>`, puis ouvrir `sites/<nom>/index.html` (ou via XAMPP).
4. Après fusion dans `main`, activez GitHub Pages (Settings, Pages, branche `main`, dossier racine). Chaque démo sera disponible à `https://<compte>.github.io/sakinadz-demos/sites/<nom>/`.

## Intégration dans un article
- Lien : bouton « Ouvrir la démo » vers l'adresse publiée.
- Iframe : `<iframe src="URL" title="Démo" loading="lazy" style="width:100%;height:640px;border:1px solid #ddd;border-radius:12px"></iframe>`
- Gardez le bandeau « Site de démonstration » et le `noindex`.

## Sources
Les fichiers `sites/*/source-article.md` sont des résumés des articles, récupérés automatiquement. Pour plus de précision, remplacez-les par le texte complet.
