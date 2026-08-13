<div align="center">

# Blueprint

**Imposition automatique + repères de coupe pour InDesign**

Un script ExtendScript pensé pour la risographie, la sérigraphie et l'édition en générale. Imposez, ajoutez vos repères, générez vos films de séparation, sans quitter InDesign.

`InDesign CS6 → 2026` · `ExtendScript (.jsx)` · `FR / EN / IT`

</div>

---

Imposer une pièce à la main dans InDesign (grille, marges, repères de coupe, mires, fond perdu, films de séparation) est répétitif et source d'erreurs, surtout en risographie et sérigraphie où chaque encre doit sortir sur son propre film, parfaitement calé.
Blueprint automatise l'ensemble du flux en un seul dialogue : configurez, prévisualisez en direct, lancez.

---

## Fonctionnalités

**Imposition**
- 9 modes de pose : N-Up, Step & Repeat, Cut & Stack, Booklet, Dutch Cut, Shuffle, Riso, Sérigraphie, Patchwork
- Aperçu en direct, calcul automatique des espacements

**Repères & marques**
- Repères de coupe et mires de calage sur chaque copie
- Marques couleurs générées à partir des encres réellement utilisées sur la planche (nuances appliquées, couleurs détectées dans les images, tons directs du nuancier)

**Marges & fond perdu**
- Blanc tournant (marge intérieure uniforme)
- Fond perdu plat ou adapté au visuel (bords en miroir fondu voir plus bas)

**Duplex**
- Génération automatique du verso à partir du recto, retournement court ou long

**Export**
- Un PDF par encre, nommage automatique `<document>-<couleur>.pdf`
- Renommage fiable même avec des pilotes PDF qui ignorent la destination fournie

**Contenu**
- Compatible images, groupes, texte

## Installation

1. Téléchargez `Blueprint_V1.jsx`
2. Placez le fichier dans le dossier Scripts d'InDesign :
   - **macOS** : `~/Library/Preferences/Adobe InDesign/[version]/[langue]/Scripts/Scripts Panel/`
   - **Windows** : `%APPDATA%\Adobe\InDesign\[version]\[langue]\Scripts\Scripts Panel\`
3. Dans InDesign : `Fenêtre > Utilitaires > Scripts`
4. Double-cliquez sur `Blueprint_V1.jsx` pour lancer l'interface

## Utilisation

1. Sélectionnez la ou les pièces à imposer dans le document
2. Lancez le script
3. Choisissez le mode d'imposition, la grille, les marges et le fond perdu
4. Vérifiez l'aperçu en direct
5. Lancez Blueprint pose les copies, ajoute repères et marques, génère le verso si besoin
6. Exportez les films de séparation depuis le panneau dédié

## Modes d'imposition

| Mode | Usage |
|---|---|
| N-Up | Grille simple, plusieurs copies identiques |
| Step & Repeat | Répétition régulière sur toute la feuille |
| Cut & Stack | Pièces destinées à être empilées puis coupées |
| Booklet | Imposition de livret |
| Dutch Cut | Grille avec bande tournée |
| Shuffle | Copies mélangées |
| Riso | Optimisé pour la risographie |
| Sérigraphie | Optimisé pour la sérigraphie |
| Patchwork | Cellules raccordées bord à bord |

## Fond perdu adapté au visuel

Plutôt qu'un aplat de couleur unique, Blueprint peut prolonger chaque bord de la pièce par une fine tranche du bord, réfléchie en miroir puis étirée sur toute la largeur du fond perdu. Résultat : les couleurs se fondent en dégradé, aucun dessin lisible dans la chute, et le raccord au trait de coupe reste exact quel que soit l'étirement.

### Export des films

Chaque encre est exportée en PDF séparé, nommé automatiquement selon le document et la couleur. Le champ de nommage est éditable avec aperçu en direct du résultat.

## Compatibilité

Blueprint fonctionne d'InDesign CS6 à 2026, sans dépendance externe un seul fichier `.jsx` à installer.

`Théorique, n'a pas été testé sur d'autres versions que celle de 2026`

---

<div align="center">

Fait pour la risographie, la sérigraphie et l'édition en générale.

</div>
