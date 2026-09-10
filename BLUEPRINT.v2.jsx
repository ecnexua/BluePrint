// ============================================================
//  IMPOSITION + REPÈRES DE COUPE v2
//  InDesign ExtendScript (.jsx) — Compatible CS6 -> 2026
//
//  Étape 1 : Imposition automatique (grille, zone marges)
//  Étape 2 : Repères de coupe sur chaque copie imposée
//  Tout en automatique, un seul dialogue.
// ============================================================
//
//  ─────────────────────────────────────────────────────────
//  HISTORIQUE DES VERSIONS
//  ─────────────────────────────────────────────────────────
//  v2  (ergonomie de l'interface — le MOTEUR est inchangé)
//    Filtrage FIN par type de document
//      • Le masquage descend désormais à la RANGÉE, plus au panneau. Le
//        masquage par panneau avait un défaut de fond : il privait le
//        FANZINE de sa gouttière centrale. Vérification faite dans
//        addBookletImposition, le moteur lit `gapH` comme l'écart entre les
//        deux pages du couple — un réglage indispensable, qui vivait dans le
//        panneau « Espacement » masqué en bloc.
//      • Le champ est en outre RENOMMÉ selon le contexte : « Espacement
//        horizontal » dans les autres types, « Gouttière centrale » en livret.
//        Même champ, autre sens, autre libellé.
//      • Ce que le moteur IGNORE en livret est maintenant masqué : nombre de
//        copies, tête-bêche, rotation des copies, espacement vertical
//        (L.cols/L.rows y sont forcés à 2×1). Les afficher laissait croire
//        qu'ils agissaient.
//      • NEUTRALISATION : un réglage masqué ne produit plus rien. La fonction
//        `neutralize` de chaque type s'exécute à CHAQUE application, y compris
//        au chargement d'un preset — sans quoi un preset pouvait faire agir en
//        douce un réglage que l'écran ne montrait plus (un verso sur un
//        sticker, une répétition sur une affiche).
//      • Un panneau dont toutes les rangées sont masquées se replie au lieu de
//        rester à l'écran en cadre vide.
//    Correction d'un AVERTISSEMENT FAUX
//      • Le panneau « Pré-traitement des pages » annonçait modifier le
//        document. C'est inexact : iwExecute calcule bien un plan de pages à
//        partir de ces champs (ppReorder / ppClone / ppDeletePage /
//        ppDuplicatePage), puis la variable `plan` n'est JAMAIS relue —
//        baseCfg ne la référence pas. Ces champs ne produisent rien. Le
//        panneau le dit désormais, au lieu de laisser craindre une suppression
//        de pages qui n'a pas lieu.
//    Disposition reprise des dialogues d'InDesign
//      • Les onglets HORIZONTAUX d'un `tabbedpanel` ne ressemblaient à rien de
//        ce que fait l'application. Ils sont remplacés par une LISTE DE
//        SECTIONS en colonne à gauche — le motif d'« Imprimer le cahier »,
//        « Imprimer » et « Exporter en PDF ». Une listbox reçoit en prime le
//        bleu de sélection du système, comme la liste Format / Aperçu /
//        Synthèse.
//      • Corps de fenêtre en trois colonnes : SECTIONS | RÉGLAGES | APERÇU.
//        Les cinq sections sont empilées (orientation « stack ») dans la
//        colonne centrale, une seule visible à la fois.
//      • L'APERÇU occupe toute la hauteur de la fenêtre : il n'est plus
//        plafonné indépendamment (l'ancien plafond de 620 px laissait du vide
//        sous lui sur un grand écran). Colonne et canvas sont en « fill »
//        vertical, le canvas absorbant la hauteur restante.
//      • Le TYPE DE DOCUMENT passe en tête, sur toute la largeur : il gouverne
//        les cinq sections, sa portée doit se voir.
//      • Garde-fou d'écran étroit : trois colonnes côte à côte élargissent la
//        fenêtre ; la colonne des réglages se resserre en premier (jusqu'à
//        420 px) pour que celle de droite ne sorte pas de l'écran.
//    Mires : UNE seule taille, et de vrais cercles dans l'aperçu
//      • Les croix de BORD échappaient au plafond : leur taille était calculée
//        à part, « longueur × 1,6 » (11,2 mm par défaut), dans le moteur
//        (addPageSideCrosses) comme dans l'aperçu. D'où des mires de bord bien
//        plus grosses que celles des coins, sur la même planche. Les neuf
//        sites de calcul passent désormais tous par iwRegDiam.
//      • L'aperçu dessinait un CARRÉ en guise de cercle — son propre
//        commentaire disait « cercle approx en aperçu ». Croix + carré se
//        lisaient comme une grille de quatre carreaux, sans rapport avec la
//        croix-dans-un-cercle que le moteur pose réellement. L'aperçu trace
//        maintenant un vrai cercle (polygonalisé, ScriptUI n'ayant pas d'arc)
//        avec le plus inscrit dedans, bras de croix = rayon, exactement comme
//        iwPlaceRegMark.
//      • `regDiam` n'était pas transmis au moteur : il manquait dans le bloc
//        d'options d'iwExecute, si bien que le réglage de Réglages ne pilotait
//        que l'aperçu et que la sortie retombait sur la valeur par défaut.
//    Mires plafonnées à 4 mm, légende retirée, paramètres morts supprimés
//      • DIAMÈTRE DES MIRES borné à 4 mm (IW_REG_MAX_MM). La taille était le
//        produit « longueur de repère × multiplicateur », soit 7 × 2,4 =
//        16,8 mm par défaut : une mire plus large qu'un repère de coupe cesse
//        d'être un point de visée et devient un objet graphique qui déborde
//        des marges. Le plafond est appliqué par UNE fonction partagée
//        (iwRegDiam), donc identiquement dans le moteur et dans l'aperçu — 7
//        sites de calcul.
//      • Le multiplicateur « Mires centre/bord (×) » devient un DIAMÈTRE EN MM
//        (1 à 4). Une fois le plafond posé, tout multiplicateur au-dessus de
//        0,57 donnait le même résultat : le réglage ne réglait plus rien.
//      • BANDEAU LÉGENDE supprimé sous la feuille. Il énumérait en toutes
//        lettres les repères actifs (« fond perdu · coupe · centre page… »),
//        c'est-à-dire ce que les cases à cocher montrent déjà et ce que le
//        dessin montre lui-même — une ligne de hauteur pour redire deux fois
//        ce qui était visible.
//    Paramètres NON FONCTIONNELS supprimés
//      • `cornerMult` : stocké, transmis au moteur et aux marques, mais plus
//        jamais utilisé pour dessiner — les mires de COIN ont été retirées en
//        v4 et le réglage a survécu à ce qu'il pilotait.
//      • `colorNamePt` : idem, son propre commentaire disait « (hérité) le nom
//        est désormais fixé à 8 pt ».
//      • PANNEAU « Pré-traitement des pages » retiré de l'interface : cinq
//        champs qui ne produisaient rien (le plan de pages est calculé dans
//        iwExecute puis jamais relu). Les contrôles restent déclarés hors
//        interface pour que gatherConfig/applyConfig et les presets déjà
//        enregistrés continuent de fonctionner sans cas particulier.
//    Compréhension des panneaux
//      • Les titres disent CE QUI EST PRODUIT, plus la mécanique interne.
//        « Repères de pièce » / « Repères de page » ne disaient pas la seule
//        différence qui compte — sur CHAQUE copie posée, ou UNE FOIS sur la
//        feuille — et c'est maintenant leur titre. De même : « Destination »
//        -> « Sur quelle page imposer », « Répétition » -> « Combien de
//        copies », « Alignement de la grille » -> « Où poser la grille sur la
//        feuille », « Marques couleurs » -> « Pastilles des encres utilisées ».
//    Aperçu plus grand, plus lisible, et COINS ARRONDIS
//      • L'aperçu passe de 35 % à 44 % de la largeur d'écran (plafond 700 ->
//        900 px), sa marge interne de 26 à 16 px, et le bandeau de contrôles
//        qui l'entoure de 150 à 122 px de haut : la feuille occupe donc
//        nettement plus de surface à zoom égal.
//      • LISIBILITÉ : fond de l'aperçu assombri (0,20 -> 0,13). Ce n'est pas
//        cosmétique — la feuille est blanche, et plus le fond est sombre, plus
//        son contour se détache ; l'ancien gris-ardoise la faisait fondre dans
//        le panneau. Ombre portée en deux passes décalées (retombée
//        progressive au lieu d'un liseré net). Traits épaissis : le trait de
//        coupe passe de 1,2 à 1,8 px, les repères de 1,2 à 1,7.
//      • COINS ARRONDIS partout où le script DESSINE lui-même : fond de
//        l'aperçu, feuille et son ombre, lignes et cadre de la liste des
//        presets, cellules et cadre de la grille d'alignement, pastilles
//        d'encre de l'export, nuancier et roue chromatique, rectangle de
//        calibrage — ce dernier au vrai rayon d'une carte ISO/IEC 7810
//        (3,18 mm), pour qu'il se superpose exactement à la carte posée sur
//        l'écran.
//      • La bibliothèque graphique de ScriptUI n'ayant NI arc NI courbe de
//        Bézier, l'arrondi est polygonalisé (iwRoundRectPts) : quatre segments
//        par quart de cercle, rayon borné à la demi-plus-petite-dimension.
//      • DEUX LIMITES, assumées. (1) Les contrôles NATIFS — boutons, listes
//        déroulantes, cases à cocher, listbox — sont rendus par le système :
//        ScriptUI n'expose aucun moyen de les redessiner, ils gardent leurs
//        angles. (2) Les PIÈCES IMPOSÉES restent à angles vifs dans l'aperçu :
//        leur contour EST le trait de coupe, l'arrondir ferait mentir l'aperçu
//        sur ce que le massicot va produire.
//    Aspect « panneau InDesign »
//      • ScriptUI ne permet pas de redessiner les contrôles natifs. Les trois
//        leviers réellement disponibles sont exploités, en une passe qui
//        parcourt tout l'arbre de la fenêtre : corps de police ramené à 11 pt
//        (celui de l'interface d'InDesign, contre 13 pt par défaut sur macOS),
//        densité resserrée (marges 6 px, gouttières 4 px), et bleu de
//        SÉLECTION d'InDesign pour l'état actif des panneaux dessinés.
//      • Les textes d'aide gardent l'italique un corps en dessous : au même
//        corps que les libellés, ils cesseraient de se lire comme du
//        commentaire.
//    Interface pilotée par le TYPE DE DOCUMENT
//      • Blueprint demandait d'abord un MODE D'IMPOSITION — N-Up, Cut & Stack,
//        Dutch Cut, Shuffle, Step & Repeat… — c'est-à-dire le vocabulaire du
//        FAÇONNAGE, pas celui du travail. On sait qu'on fait des cartes de
//        visite ; on ne sait pas forcément que cela s'impose en N-Up.
//      • Un sélecteur « TYPE DE DOCUMENT » est posé AU-DESSUS des onglets,
//        parce qu'il les gouverne tous. Six entrées : Carte de visite,
//        Flyer / carton, Affiche, Sticker / étiquette, Fanzine / livret,
//        Personnalisé.
//      • Chaque type décide de TROIS choses : le mode d'imposition (qui n'est
//        donc plus demandé), les valeurs de départ (fond perdu, espacement,
//        repères, alignement), et les panneaux qui restent AFFICHÉS. Une
//        affiche n'a ni répétition, ni espacement, ni recto/verso : ces
//        panneaux disparaissent au lieu d'être là sans servir.
//      • « Personnalisé » ne masque rien et fait réapparaître le sélecteur de
//        mode : aucun réglage n'est devenu inatteignable, il est seulement
//        rangé derrière le seul type qui en a besoin.
//      • Les presets enregistrent le type. Un preset d'AVANT la V2 n'a pas ce
//        champ : il se recharge en « Personnalisé », le seul type qui n'impose
//        aucun mode — son imposition d'origine est donc conservée telle quelle.
//      • Un onglet vidé par le type (« Recto/verso » sur une affiche) affiche
//        « Sans objet pour ce type de document » : un onglet vide et muet
//        ressemble à un bug.
//    Organisation
//      • ONGLETS REGROUPÉS PAR TÂCHE. Le trio géométrique
//        ESPACEMENT + FOND PERDU + BLANC TOURNANT vivait dans DEUX onglets
//        différents (« Repères » et « Couleurs ») alors que fond perdu et
//        blanc tournant sont MUTUELLEMENT EXCLUSIFS : on ne voyait donc pas
//        pourquoi l'un annulait l'autre. Les trois sont désormais dans un
//        onglet « Marges » unique. « Couleurs » (marques couleurs) rejoint
//        « Repères », dont c'est le sujet.
//        → Composition · Marges · Repères · Recto/verso · Presets.
//      • BORD DE LA PIÈCE : l'exclusion fond perdu / blanc tournant devient
//        un CHOIX EXPLICITE à trois états (Aucun · Fond perdu · Blanc
//        tournant) au lieu de deux cases qui s'éteignaient l'une l'autre en
//        silence. Le panneau correspondant est seul actif ; l'autre est grisé
//        au lieu d'être vidé, donc plus aucune valeur saisie n'est perdue.
//    Retour d'information
//      • BARRE D'ÉTAT permanente en bas de fenêtre : dit en une ligne si la
//        planche est réalisable, et sinon POURQUOI (aucune sélection, grille
//        qui ne rentre pas, pièce plus grande que la zone).
//      • Le bouton LANCER est DÉSACTIVÉ tant que la planche n'est pas
//        réalisable, au lieu de laisser cliquer puis d'afficher une alerte.
//      • La barre d'état signale aussi les réglages qu'un changement de mode
//        a modifiés (Riso/Sérigraphie/Patchwork ajustent alignement, trait et
//        espacement) : ces changements n'étaient jusqu'ici visibles nulle part.
//      • Le titre de la fenêtre était VIDE (new Window("dialog", "")) : il
//        affiche maintenant « Blueprint V2 ».
//    Contrôles
//      • OPTIONS DE MODE GRISÉES hors contexte : les champs Booklet ne sont
//        actifs qu'en mode Booklet, l'ordre Shuffle qu'en mode Shuffle, le pas
//        des croix de bord que si les croix de bord sont cochées, le nom de
//        page verso que si le verso est demandé.
//      • ALIGNEMENT : grille 3×3 DESSINÉE avec une cellule active réellement
//        mise en évidence, au lieu de crochets typographiques « [↖] » posés
//        autour du glyphe d'un bouton natif.
//      • PAGE CIBLE : liste déroulante des pages du document au lieu d'un
//        champ libre où l'on pouvait taper un numéro inexistant.
//      • CHAMPS NUMÉRIQUES normalisés à la validation : une saisie invalide
//        revient à la dernière valeur correcte au lieu d'être silencieusement
//        lue comme 0.
//      • Libellés ALIGNÉS sur une largeur unique (IW_UI_LABEL_W) : les champs
//        des différents panneaux étaient sur 8 largeurs de libellé distinctes.
//    Aperçu
//      • ZOOM À LA MOLETTE dans l'aperçu, et curseur de zoom dont la plage
//        (10–2000 %) correspond enfin à celle réellement acceptée : au-delà de
//        400 % le curseur restait bloqué en bout de course.
//      • Bouton RECENTRER (le déplacement de la vue ne pouvait être remis à
//        zéro que par « Ajuster », qui changeait aussi le zoom).
//      • Lecture DÉFENSIVE des coordonnées de souris pour le déplacement de la
//        vue (offsetX/localX/clientX), comme le reste du fichier : clientX seul
//        n'existe pas sur toutes les versions d'InDesign.
//    Presets
//      • CHAMP DE RECHERCHE : la liste se filtre au fil de la frappe (les
//        dossiers dont un preset correspond restent visibles).
//      • Les presets sans couleur étaient écrits en BLANC EN DUR, donc
//        invisibles sur une interface InDesign en thème CLAIR : la couleur du
//        texte s'adapte maintenant au thème détecté.
//    Divers
//      • Les fenêtres d'erreur et d'avertissement de l'export des films
//        étaient rédigées EN DUR EN FRANÇAIS dans un script par ailleurs
//        traduit : elles passent par i18n (FR/EN/IT).
//      • La liste des encres à l'export DÉFILE : au-delà d'une dizaine
//        d'encres, la fenêtre dépassait de l'écran sans moyen d'atteindre le
//        bouton Exporter.
//
//  v1  (fond perdu adaptatif : bords en miroir FONDU)
//      • FOND PERDU « ADAPTÉ AU VISUEL » (mode extérieur) : nouvelle option
//        par DÉFAUT du sélecteur « Couleur du fond perdu ». Au lieu d'un
//        rectangle d'une seule couleur plate, chaque bord est prolongé par
//        une TRÈS FINE TRANCHE du bord (IW_BLEED_SMEAR_SRC_PT ≈ 0,18 mm),
//        réfléchie en miroir puis FORTEMENT ÉTIRÉE sur toute la largeur du
//        fond perdu, ROGNÉE à la seule bande ; les 4 coins sont couverts en
//        double étirement (le point de coin devient un aplat). Chaque point
//        du bord devient une traînée de SA couleur : les couleurs se
//        FONDENT, aucun dessin lisible dans la chute, et le raccord au
//        trait de coupe est EXACT (le miroir garantit la continuité quel
//        que soit l'étirement).
//      • Itérations : (1) étirement global de la pièce au slot — abandonné,
//        l'échelle déplace tout ce qui n'est pas au centre (raccords
//        décalés) et la copie vit sous la pièce (doublage, chevauchements) ;
//        (2) miroir pur — raccord exact mais le dessin restait lisible dans
//        la chute ; (3) miroir + fondu (retenu).
//      • Propriétés : chaque bande est CONFINÉE à sa pose (aucun
//        chevauchement entre poses, même à espacement nul) ; rien n'existe
//        sous la pièce (aucun doublage par transparence).
//      • Implémentation (iwPlaceCopyExt) : bandes construites à partir des
//        BOUNDS FINAUX de la copie posée (correct après rotation 90/180 :
//        flipAlt, Dutch Cut, duplex). Miroir en coordonnées pasteboard
//        autour du CENTRE (AnchorPoint.CENTER_ANCHOR, aucune coordonnée
//        absolue ; repli flipItem comme le duplex), translation, rognage.
//      • Rognage (iwCropToBand) : cadres -> geometricBounds (le contenu ne
//        bouge pas, même principe éprouvé que le rognage Patchwork) ;
//        groupes -> « Coller dedans » (cut + pasteInto dans un rectangle
//        hôte ; utilise le presse-papiers). Échec -> bande simplement
//        absente, jamais fausse.
//      • L'ancien « Auto (couleur de la pièce) » (rectangle plat) et les
//        nuances restent disponibles dans la liste, juste en dessous.
//      • Aperçu : inchangé, la bande de fond perdu reste en BLEU CLAIR
//        générique en mode adapté (simuler le miroir dans ScriptUI
//        n'apporterait rien).
//
//  v20  (corrections : blanc tournant, calibrage, espacements)
//    Aperçu & cohérence
//      • Fond perdu affiché en BLEU CLAIR (au lieu du sable) pour mieux le
//        distinguer de l'image.
//      • BLANC TOURNANT et FOND PERDU sont désormais MUTUELLEMENT EXCLUSIFS
//        (logique : soit l'image déborde la coupe, soit une marge l'entoure).
//        Le dernier réglage touché désactive l'autre : activer le blanc
//        tournant met le fond perdu à 0 ; saisir un fond perdu > 0 décoche le
//        blanc tournant. Verrouillé aussi côté aperçu/export.
//      • Mode INTÉRIEUR/EXTÉRIEUR câblé dans TOUS les modes du moteur :
//        N-Up, Step & Repeat, Cut & Stack, Booklet, Dutch Cut (grille + bande
//        tournée), Shuffle, Riso, Sérigraphie, et le verso duplex. Seul
//        PATCHWORK l'ignore (une marge extérieure casserait le raccord bord
//        à bord des cellules). Repères du blanc tournant : sur le bord
//        EXTÉRIEUR du cadre dans les deux modes (passe-partout gardé au fini).
//      • FOND PERDU GÉNÉRÉ (mode extérieur) : Blueprint CRÉE le rectangle
//        coloré qui constitue le fond perdu (taille du slot, sous la pièce).
//        Sélecteur « Couleur du fond perdu » : Auto (couleur de fond de la
//        pièce), Aucune, ou une nuance du document. L'aperçu teinte la bande.
//    Export des films — nommage
//      • CHAMP « Nom des fichiers » dans la fenêtre d'export, éditable et
//        pré-rempli avec le nom du document. Un aperçu vivant montre
//        « <nom>-<Couleur>.pdf ». Chaque film sort sous ce schéma
//        (ex. « MonAffiche-Bleu.pdf »). Le nom de la couleur reste en suffixe.
//      • RENOMMAGE FIABLE, quel que soit le pilote. Le nom voulu est passé
//        à `printFile` (les imprimantes coopératives écrivent directement au
//        bon nom). Pour les pilotes PDF qui ignorent la destination et
//        nomment eux-mêmes le fichier : Blueprint prend un instantané des PDF
//        présents AVANT impression (dossier choisi + Bureau + Documents +
//        dossier utilisateur), puis RETROUVE le PDF fraîchement écrit APRÈS et
//        le DÉPLACE/RENOMME en « <nom>-<couleur>.pdf ». `printToFile` n'est
//        PAS forcé (évite une redirection PostScript qui casserait un pilote
//        PDF normal). Plus de boîte d'erreur : l'export se termine en silence.
//      • Par défaut, AUCUNE encre n'est cochée dans la fenêtre d'export.
//      • Plus de pop-up de SUCCÈS d'export : l'export réussi se termine
//        silencieusement (erreurs et avertissement « croix coupées » restent).
//    Blanc tournant — marge ENFIN uniforme
//      • Le liseré était INÉGAL et « toujours présent » sur deux côtés : le
//        fond coloré remplissait tout le SLOT, alors que l'image (ratio
//        conservé) ne remplissait pas le rectangle réduit -> bande résiduelle.
//        Désormais le fond est créé APRÈS mise à l'échelle/placement/rotation
//        et épouse EXACTEMENT l'image finale + la marge demandée : la marge
//        visible vaut précisément haut/bas/gauche/droite sur chaque côté.
//      • Aperçu aligné sur ce comportement : l'image ajustée (ratio conservé)
//        est centrée dans le rectangle réduit et le cadre coloré se resserre
//        autour d'elle -> l'aperçu montre la vraie marge uniforme.
//    Calibrage écran — saisie fiable
//      • La largeur tapée au clavier n'est plus appliquée à CHAQUE frappe :
//        « 1 » puis « 12 »… étaient clampés à la valeur mini et empêchaient
//        de saisir un nombre à plusieurs chiffres. Application à la validation
//        (Entrée / perte de focus) uniquement.
//    Espacements — aperçu = sortie, et bouton AUTO stable
//      • MESURE DE LA PIÈCE CENTRALISÉE (iwMeasurePieceBounds) et partagée par
//        l'aperçu ET le moteur : plus aucun risque d'écart de taille de pièce
//        (donc d'espacement) entre ce qu'on voit et ce qui est produit.
//      • Bouton AUTO : le gap calculé est désormais STABLE pour le moteur.
//        Avant, AUTO répartissait sur la zone RÉDUITE (marge retirée) alors
//        que le moteur recompte les colonnes sur la zone ENTIÈRE avec le même
//        gap -> il retrouvait la place d'une colonne en plus, qui débordait
//        dans la marge et faussait l'espacement. AUTO vérifie maintenant que
//        son gap ne fait pas rentrer une colonne supplémentaire.
//
//  v19  (fiabilité)
//    Export des films — cadrage
//      • Le format sur-mesure du support (page + marge anti-rognage des
//        croix) est désormais RELU après écriture : beaucoup d'imprimantes
//        PDF virtuelles l'ignorent et retombent sur un format standard plus
//        petit -> croix coupées. 2e tentative automatique, puis ALERTE
//        claire avec diagnostic (taille voulue/appliquée/débord) si refusé.
//      • Réglages d'impression réordonnés : échelle 100 % + centrage posés
//        AVANT paperSize = CUSTOM (changer scaleMode re-verrouillait les
//        dimensions sur certaines versions).
//      • Coussin de marge élargi (4 pt) pour couvrir l'épaisseur de trait et
//        l'arrondi de format de l'imprimante.
//      • Auto-marge bornée à 90 mm : un objet traîné loin hors page ne fait
//        plus exploser la taille du support.
//    Nettoyage
//      • Suppression de collisions de noms de variables dans les fenêtres
//        de l'export (pas de bug actif, mais robustesse ES3).
//
//  v17
//    Export des films
//      • MOTEUR PAR DÉFAUT = IMPRESSION en SÉPARATIONS vers l'imprimante PDF
//        du document (« Print to PDF »), comme la V16-27.3 : printFile écrit
//        chaque film directement dans le dossier, sans fenêtre. L'imprimante
//        par défaut est celle déjà active dans le document.
//      • Option « Export PDF natif (sans imprimante) » : exporte 1 PDF/encre
//        via doc.exportFile() sans imprimante, pour qui le préfère (case
//        DÉCOCHÉE par défaut).
//      • Options PRÉPRESSE : film NÉGATIF (inversion) et MIROIR (émulsion
//        dessous). En impression via pp.negative / pp.flip ; en export natif
//        via post-traitement hors-écran (aplat noir « Différence » + flip).
//    Nouvelles aides atelier
//      • PREFLIGHT : contrôle avant export (images RVB/CMJN non séparables,
//        résolution effective < 300 dpi, absence de ton direct). Récap avec
//        choix continuer/annuler.
//      • ESTAMPILLE par film (encre · document · date · n° de film) en
//        [Repérage], en pied de planche, hors zone de coupe. Activée par défaut.
//      • ÉCHELLE DE DENSITÉ 10→100 % de [Repérage] pour calibrer l'insolation.
//      • PDF couleur « bon à tirer » (BAT) optionnel pour validation.
//      • JOURNAL d'export (_export_log.txt) : date, doc, encres, options, cotes.
//      • OUVERTURE automatique du dossier de destination après export.
//      • Surimpression (overprint) du texte d'estampille (ne troue pas les
//        autres films).
//
//  v14
//    Presets
//      • Marge entre dossiers AGRANDIE dans le tableau (groupes plus
//        nettement séparés).
//      • Cadre de SÉLECTION en BLANC.
//
//  v12
//    Corrections
//      • Faute d'affichage « COULEUR DE FON » : le libellé « Couleur du
//        fond : » était TRONQUÉ (largeur trop courte). Largeur élargie ;
//        audit des autres libellés susceptibles d'être coupés.
//    Presets
//      • SUPPRESSION DE DOSSIER : le bouton Supprimer efface le dossier
//        sélectionné (ses presets repassent à la racine, sans être
//        supprimés), après confirmation.
//    Espacement
//      • Bouton AUTO : place le MAXIMUM de pièces dans la zone utile en
//        gardant une marge de 3 mm tout autour (les pièces ne touchent
//        plus les bords) ; l'espacement est réparti uniformément et la
//        grille reste centrée.
//    Fluidité / UX
//      • Liste des presets : défilement à la MOLETTE et SURVOL de ligne
//        (la ligne sous le curseur est légèrement éclaircie).
//      • Marge de 3 px au-dessus de chaque dossier (groupes mieux séparés).
//      • Espacements de quelques rangées harmonisés (constante IW_UI_GAP).
//
//  v11
//    Mire perso
//      • NE se met PLUS au-dessus de chaque carte. Elle sert UNIQUEMENT
//        aux croix de CENTRE et aux croix SUPPLÉMENTAIRES de page.
//        La mire de registration par pièce redevient vectorielle.
//    Presets
//      • COULEUR DE DOSSIER : un dossier peut recevoir une couleur (toute
//        sa ligne est colorée). Clic sur la FLÈCHE = replier/déplier ;
//        clic sur le NOM = sélectionner le dossier (pour le colorer).
//      • HÉRITAGE : un preset dans un dossier coloré prend automatiquement
//        la couleur du dossier, mais garde la possibilité d'avoir sa
//        propre couleur (qui prime). « Aucune » fait réhériter du dossier.
//      • Bouton METTRE À JOUR : remplace le preset sélectionné par les
//        réglages courants (couleur et dossier conservés).
//      • Les presets SANS couleur sont écrits en BLANC.
//    Interface
//      • Harmonisation des BOUTONS et ESPACEMENTS dans toute la fenêtre
//        (constantes IW_UI_*).
//
//  v10
//    Aperçu
//      • RETOURNEMENT : les pièces retournées (180°, une rangée sur
//        deux) sont peintes dans une COULEUR DISTINCTE (lilas) dans
//        l'aperçu, en plus de la flèche tête-bêche.
//    Rotation (onglet Mode)
//      • Boutons 90° refaits : vrais boutons RONDS dessinés, avec une
//        GRANDE FLÈCHE seule (plus de texte « 90° »). Effet d'enfoncement
//        au clic. Cliquables sans lire de coordonnées d'événement (évite
//        les plantages de certaines versions d'InDesign).
//    Blanc tournant
//      • DÉSACTIVÉ PAR DÉFAUT : une case « Activer le blanc tournant »
//        commande tout le panneau (grisé tant qu'éteint). Aucune marge
//        interne appliquée à l'aperçu NI à l'export tant que c'est éteint.
//    Presets
//      • CORRECTION DU PLANTAGE : la liste repasse sur un LISTBOX NATIF
//        ScriptUI (l'ancien tableau dessiné lisait des propriétés
//        d'événement instables -> crash au clic). Plus de crash.
//      • MARQUEUR DE COULEUR : petite pastille de couleur (image PNG
//        générée à la volée) placée DEVANT le nom — le tableau lui-même
//        n'est plus coloré. L'ÉTOILE du preset par défaut reste À DROITE.
//      • DOSSIERS : en-têtes repliables (double-clic), presets indentés
//        dessous, presets sans dossier à la racine. Boutons « Couleur… »,
//        « Nouveau dossier… », « Ranger dans… ». Métadonnées dans un index
//        séparé (_meta.iwjson) — les fichiers de preset ne sont pas modifiés.
//    Calibrage écran
//      • RÉPARÉ : repaint fiable pendant le glissement, plage du curseur
//        élargie (Retina/4K) et saisie numérique directe de la largeur.
//
//  v5.2
//    Moteur
//      • Moteur V1 RETIRÉ (~230 lignes). Lancement direct sur mainV2().
//        Plus de dialogue de choix de moteur au démarrage.
//    Interface
//      • Fenêtre plus haute (92% de l'écran, au lieu de 88%).
//      • Aperçu plus grand (plafond 720 px au lieu de 620).
//      • Onglets plus hauts (280 px pref, au lieu de 230).
//      • Tableau des presets plus haut (160 px au lieu de 100).
//
//    Renommage
//      • Le script s'appelle désormais « Imposition » (sans « Wizard »).
//    Fusion d'onglets
//      • « Espacement » fusionné dans « Repères » (un seul onglet).
//      • « Pages (pré-traitement) » fusionné dans « Recto/Verso ».
//      → 4 onglets au lieu de 6 : Mode, Repères, Recto/Verso, Presets.
//    Presets
//      • Ligne de création (nom + Enregistrer) EN HAUT de l'onglet.
//      • Sélection en TABLEAU (listbox) au lieu d'un volet déroulant,
//        avec Charger / Supprimer en dessous.
//    Traduction
//      • Les 8 descriptions de mode sont désormais traduites (FR/EN/IT).
//
//    Traduction complète
//      • 100 clés i18n, 141 appels tr(). TOUTES les chaînes de
//        l'interface (onglets, tooltips, fenêtre Réglages, dropdown
//        duplex) sont traduites en français, anglais et italien.
//        Les numéros d'onglets sont supprimés (plus compact).
//    Interface
//      • Onglets compactés (numéros retirés).
//      • Boutons Réglages / Annuler / Lancer en bas à gauche.
//    Code
//      • Audit complet : syntaxe vérifiée, chaînes en dur éliminées,
//        tooltips traduits, dropdown duplex traduit.
//
//  v4.0  (passage en version 4)
//    Disposition
//      • Boutons « Réglages… / Annuler / Lancer » regroupés dans une
//        BARRE EN BAS de la fenêtre (sous les deux colonnes), au lieu
//        d'être sous la seule colonne de gauche.
//    Repères de coin
//      • AUCUNE mire dans les coins (retirées) : il ne reste que la croix
//        centrale et les 4 mires de bord. Les croix de bord évitent les
//        coins et la zone des couleurs.
//    Couleurs
//      • Noms de couleurs toujours en BLANC (défonce) et 8 pt, dans les
//        deux styles (sérigraphie et riso).
//    Personnalisation (fenêtre Réglages)
//      • Panneau « Personnalisation de l'interface » : fond de l'aperçu
//        transparent, affichage des cotes. + Panneau « Repères et
//        couleurs (avancé) » : taille des mires centre/bord, marge
//        d'angle des croix, dimensions des pastilles. Conservé entre
//        sessions (prefs.iwjson). Appliqué à l'impression ET à l'aperçu.
//    Fiabilité
//      • Réglages MÉMORISÉS : la config est enregistrée à chaque
//        lancement et rechargée à l'ouverture suivante (fichier de
//        préférences, via IWJSON). Repli sur les valeurs par défaut si
//        absent/illisible ; non écrasé lors d'une relance de langue.
//    Interface
//      • Aides des champs et cases passées en INFOBULLES (survol) au
//        lieu de textes sous les contrôles -> plus épuré. Les intros de
//        section restent visibles comme contexte.
//    Aperçu
//      • COTES / MESURES : lignes de cote (largeur en haut, hauteur à
//        gauche) avec ticks + étiquette « l × h mm ». Affichées à
//        échelle normale uniquement.
//    Repères
//      • Texte perso enrichi de JETONS auto : {date} {page} {mode}
//        {w} {h} {n} (codes de calage). addMarks() inchangé.
//    Interface RESPONSIVE
//      • La fenêtre se dimensionne d'après l'écran : hauteur plafonnée
//        à 88 % de l'écran (toujours plus petite que l'écran), aperçu
//        qui remplit l'espace disponible (plus grand sur grand écran,
//        plus compact sur portable). Repli 1440×900 si l'écran est
//        indétectable.
//      • Onglets resserrés (marges/espacements réduits), descriptions
//        raccourcies, champs cachés cols/rows mis à taille nulle (fin
//        de la hauteur morte), aperçu élargi.
//    Couleurs (pastilles de page)
//      • Couleurs prises dans le NUANCIER, filtrées sur celles
//        réellement utilisées (fonds/contours/textes + images
//        colorisées). Décodeur PNG intégré : analyse des PIXELS des
//        images PNG en couleurs pour en extraire les teintes dominantes.
//      • Pastilles jointives, départ sur la marge gauche, nom en blanc
//        8 pt à l'intérieur ; mires de centre agrandies + mires de coin
//        alignées sur les deux axes de marge.
//    (Note : moteur interne toujours "v2" — mainV2 — la V4 est la
//     version du SCRIPT, pas une refonte du moteur.)
//
//  v2-8  (Imposition___Repères_v2-7-8 -> v2-8)
//    Moteur d'aperçu réécrit (artefacts corrigés)
//      • Chaque primitive ouvre désormais son PROPRE chemin
//        (g.newPath) avant fill/stroke. Cause n°1 des artefacts :
//        rectPath() réutilisait l'état de chemin précédent et
//        laissait des segments parasites entre les formes.
//      • Fond perdu : peint dans le bon ordre (bande sable ->
//        intérieur -> trait de coupe), fini le double-painting.
//      • Garde-fou sur l'échelle (sc fini et > 0) ; ombre portée
//        légère sous la feuille ; glyphes en \u (encodage sûr).
//    Nouveaux modes d'imposition
//      • Riso (6)        : grille N-Up calée EN BAS et centrée
//        horizontalement (force align = "BC"), repères FINS
//        (~0,1 pt). Préréglage calage risographie.
//      • Sérigraphie (7) : grille N-Up centrée, repères PLUS
//        LARGES (~1 pt). Le choix du mode ajuste automatiquement
//        l'alignement et l'épaisseur dans l'UI.
//    Outils / interface
//      • Mire de calage importée (PDF/EPS/PNG) qui REMPLACE la
//        croix+cercle dessinée. Désormais RÉELLEMENT prise en
//        compte : posée dès qu'un fichier valide est fourni, même
//        si la case « Registration target » n'est pas cochée
//        (place + fit FRAME_TO_CONTENT/proportionnel/centré, avec
//        recadrage à la taille « Longueur trait » et repli
//        vectoriel si le placement échoue). Reflétée dans l'aperçu.
//      • « Réglages » accessible via un BOUTON « Réglages… » en bas
//        à gauche (à part des autres), qui ouvre une fenêtre modale
//        regroupant la mire personnalisée + la langue. Les réglages
//        sont stockés dans des variables lues par l'aperçu/l'export.
//      • Mire personnalisée MÉMORISABLE entre sessions (case à cocher
//        dans Réglages ; chemin conservé sous ~/ImpositionWizard/).
//    Marques couleurs de page (onglet Repères) — calque DÉDIÉ
//      • Couleurs lues sur la SÉLECTION (fond/contour/textes, hors
//        [None]/[Papier]/[Repérage]), une marque par couleur.
//      • Sérigraphie : rectangle rempli (nom EN DÉFONCE, [Papier])
//        en BAS À GAUCHE + carré rempli en HAUT À GAUCHE, par
//        couleur, juxtaposés vers la DROITE (horizontal), sans
//        chevauchement.
//      • Riso : seulement le NOM de chaque couleur, en bas à gauche
//        (juxtaposés horizontalement).
//    Croix de bord supplémentaires (onglet Repères)
//      • Croix DANS UN CERCLE (mire) le long des 4 bords, à
//        intervalle réglable, CENTRÉES dans l'épaisseur de la marge
//        (comme les pastilles couleurs), taille bornée à la marge.
//        Les croix de CENTRE ne sont JAMAIS retirées. En sérigraphie,
//        coins HAUT-GAUCHE et BAS-GAUCHE laissés libres (couleurs).
//      • Repères de CENTRE DE PAGE : désormais des mires croix+cercle
//        comme les croix de bord, mais UN PEU PLUS GROSSES (×1.8), et
//        CENTRÉES dans l'épaisseur de marge (plus collées au bord).
//    Marques couleurs : réglages affinés
//      • Pastilles CENTRÉES dans l'épaisseur de marge (carrés en
//        marge haute, rectangles en marge basse), un peu plus
//        grandes (carré 12 mm, rectangle 46×11 mm).
//      • Nom EN DÉFONCE blanc ([Papier]), taille auto-adaptée à la
//        hauteur du rectangle, centré horizontalement et verticalement.
//      • Couleurs lues sur la SÉLECTION : fond, contour, textes ET
//        nuances/tons directs des GRAPHIQUES PLACÉS (PDF/AI/EPS) du
//        cadre — pour voir les couleurs même quand l'objet est une
//        image vectorielle placée. (Une image PNG/JPG/TIFF n'a pas de
//        nuance nommée.)
//    Interface plus compacte
//      • Fenêtre resserrée : colonne gauche 330 px, aperçu 262×344,
//        onglets 260 px de haut, marges 8, descriptions 290 px —
//        nettement moins encombrant (largeur ~630 px).
//    Vérifié : moteur de layout testé hors-ligne (18 assertions,
//      dont alignement bas-centre Riso et géométrie Sérigraphie).
//
//  v2-7  Alignement, zoom/pan de l'aperçu, rotation, redimensionnement
//        proportionnel, logique de répétition, i18n FR/EN/IT.
//  v1    Imposition simple + repères de coupe (un seul dialogue).
// ============================================================
// @target indesign

#target "InDesign"

var MM_TO_PT = 2.8346457;

// ─────────────────────────────────────────────────────────────────────
//  V20 — MESURE DE LA PIÈCE, PARTAGÉE APERÇU/MOTEUR
//  L'aperçu (mesure au démarrage) et le moteur (mesure à l'export)
//  DOIVENT mesurer la pièce de façon IDENTIQUE, sinon l'espacement calculé
//  (qui dépend de la taille de pièce) diffère entre ce qu'on voit et ce qui
//  est produit. On centralise donc la mesure ici.
//
//  Choix : geometricBounds (bord du CADRE, hors trait de contour). C'est le
//  repère sur lequel l'imposition doit travailler pour que les CADRES soient
//  espacés EXACTEMENT de la valeur saisie. (visibleBounds inclut le trait de
//  contour et l'ombre portée : l'utiliser décalerait l'espacement d'une
//  demi-épaisseur de trait et le rendrait dépendant du style d'objet.)
//  iwMeasurePieceBounds renvoie [top,left,bottom,right] en points.
// ─────────────────────────────────────────────────────────────────────
function iwMeasurePieceBounds(item) {
    var b = null;
    try { b = item.geometricBounds; } catch (e1) { b = null; }
    if (!b || b.length !== 4) { try { b = item.visibleBounds; } catch (e2) { b = null; } }
    return b;
}

// ============================================================
//  V5.2 : le moteur V1 a été retiré. Lancement direct sur mainV2().
//  L'appel est placé À LA FIN du fichier (voir bloc [H]) car les
//  var objets (IW, IWJSON) doivent être assignés avant l'appel.
// ============================================================


// ── Dessin des repères ─────────────────────────────────────
function drawMarksForBounds(page, layer, color, weight,
                             t, l, b, r,
                             bleed, markLength, gap,
                             doCorners, doSides) {
    var midX = (l + r) / 2;
    var midY = (t + b) / 2;

    if (doCorners) {
        // Haut-Gauche
        addLine(page, layer, color, weight, l + bleed, t - gap - markLength, l + bleed, t - gap);
        addLine(page, layer, color, weight, l - gap - markLength, t + bleed,  l - gap,  t + bleed);
        // Haut-Droit
        addLine(page, layer, color, weight, r - bleed, t - gap - markLength, r - bleed, t - gap);
        addLine(page, layer, color, weight, r + gap,   t + bleed, r + gap + markLength, t + bleed);
        // Bas-Gauche
        addLine(page, layer, color, weight, l + bleed, b + gap, l + bleed, b + gap + markLength);
        addLine(page, layer, color, weight, l - gap - markLength, b - bleed, l - gap,  b - bleed);
        // Bas-Droit
        addLine(page, layer, color, weight, r - bleed, b + gap, r - bleed, b + gap + markLength);
        addLine(page, layer, color, weight, r + gap,   b - bleed, r + gap + markLength, b - bleed);
    }

    if (doSides) {
        addLine(page, layer, color, weight, midX, t - gap - markLength, midX, t - gap); // Haut
        addLine(page, layer, color, weight, midX, b + gap, midX, b + gap + markLength); // Bas
        addLine(page, layer, color, weight, l - gap - markLength, midY, l - gap, midY); // Gauche
        addLine(page, layer, color, weight, r + gap, midY, r + gap + markLength, midY); // Droit
    }
}

// ── Helpers ────────────────────────────────────────────────
function addLine(page, layer, color, weight, x1, y1, x2, y2) {
    var doc = app.activeDocument;
    var ln  = page.graphicLines.add(layer);
    ln.paths[0].entirePath = [[x1, y1], [x2, y2]];
    ln.strokeColor  = color;
    ln.strokeWeight = weight;
    ln.fillColor    = doc.swatches.itemByName("None");
    return ln;
}

function getRegistrationColor(doc) {
    try {
        var s = doc.swatches.itemByName("Registration");
        if (s.isValid) return s;
    } catch (e) {}
    return doc.swatches[1];
}

function getOrCreateLayer(doc, name) {
    for (var i = 0; i < doc.layers.length; i++) {
        if (doc.layers[i].name === name) return doc.layers[i];
    }
    var nl = doc.layers.add();
    nl.name = name;
    return nl;
}

function objHasGraphic(obj) {
    try {
        if (obj.graphics && obj.graphics.length > 0) return true;
        if (obj.images  && obj.images.length  > 0) return true;
    } catch (e) {}
    return false;
}

function r2(n) { return Math.round(n * 100) / 100; }

// ─────────────────────────────────────────────────────────────────────
//  V2 — LECTURE DÉFENSIVE DES COORDONNÉES D'UN ÉVÉNEMENT SOURIS.
//  Selon la version d'InDesign, un événement ScriptUI expose offsetX/offsetY,
//  localX/localY ou clientX/clientY — et jamais les trois. Le code lisait ces
//  propriétés à trois endroits, chacun à sa façon (le déplacement de l'aperçu
//  se contentait de clientX, absent sur certaines versions). Une seule fonction
//  sert désormais partout. Renvoie null si aucune coordonnée n'est lisible.
// ─────────────────────────────────────────────────────────────────────
function iwEvXY(ev) {
    var x = null, y = null;
    try { if (ev.offsetX != null && ev.offsetY != null) { x = ev.offsetX; y = ev.offsetY; } } catch (e1) {}
    if (x == null) { try { if (ev.localX != null && ev.localY != null) { x = ev.localX; y = ev.localY; } } catch (e2) {} }
    if (x == null) { try { if (ev.clientX != null && ev.clientY != null) { x = ev.clientX; y = ev.clientY; } } catch (e3) {} }
    return (x == null) ? null : { x: x, y: y };
}

// V2 — delta de molette, lu de façon tout aussi défensive (wheelDelta/deltaY).
//  Renvoie un nombre : > 0 = vers le haut / avant, < 0 = vers le bas, 0 = rien.
function iwEvWheel(ev) {
    var d = 0;
    try { if (ev.wheelDelta != null) d = ev.wheelDelta; } catch (e1) {}
    if (d === 0) { try { if (ev.deltaY != null) d = -ev.deltaY; } catch (e2) {} }
    return d;
}

function dateStamp() {
    var d   = new Date();
    var pad = function(n) { return n < 10 ? "0" + n : String(n); };
    return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) +
           "-" + pad(d.getHours()) + pad(d.getMinutes());
}

// ════════════════════════════════════════════════════════════════════
//
//   IMPOSITION WIZARD — MOTEUR v2
//   Ajouts incrémentaux. Aucune fonction v1 n'est modifiée.
//   Tout est préfixé / namespacé pour éviter les collisions.
//
//   Sommaire :
//     [A] Constantes & état global v2
//     [B] Presets (save / load / list)  -> fichiers JSON
//     [C] Preprocessors (réordonner, cloner, supprimer, dupliquer)
//     [D] Modes d'imposition :
//           addNUpImposition()        N-Up
//           addStepRepeatImposition() Step & Repeat
//           addCutStackImposition()   Cut & Stack
//           addBookletImposition()    Booklet + creep
//           addDutchCutImposition()   Dutch Cut
//           addShuffleImposition()    Shuffle manuel
//     [E] Marks : addMarks() (crop, trim, registration, color bar,
//                 texte, graphique PDF, angle marks)
//     [F] Bleeds / Duplex / Flipping
//     [G] Interface à onglets : mainV2()
//
// ════════════════════════════════════════════════════════════════════


// ─────────────────────────────────────────────────────────────────────
//  [A] Constantes & état global v2
// ─────────────────────────────────────────────────────────────────────
var IW = {
    version: "2",
    presetFolder: Folder.userData + "/ImpositionWizard",
    presetExt: ".iwjson"
};

// Sérialiseur JSON minimal (ExtendScript n'a pas JSON natif sous CS6)
var IWJSON = (function () {
    function quote(s) {
        s = String(s);
        var out = '"';
        for (var i = 0; i < s.length; i++) {
            var c = s.charAt(i);
            if (c === '"' || c === '\\') out += '\\' + c;
            else if (c === '\n') out += '\\n';
            else if (c === '\r') out += '\\r';
            else if (c === '\t') out += '\\t';
            else out += c;
        }
        return out + '"';
    }
    function stringify(v) {
        if (v === null || v === undefined) return "null";
        var t = typeof v;
        if (t === "number") return isFinite(v) ? String(v) : "null";
        if (t === "boolean") return v ? "true" : "false";
        if (t === "string") return quote(v);
        if (v instanceof Array) {
            var a = [];
            for (var i = 0; i < v.length; i++) a.push(stringify(v[i]));
            return "[" + a.join(",") + "]";
        }
        var o = [];
        for (var k in v) {
            if (v.hasOwnProperty(k)) o.push(quote(k) + ":" + stringify(v[k]));
        }
        return "{" + o.join(",") + "}";
    }
    function parse(str) {
        // eval suffisant pour nos presets internes (ExtendScript ne supporte
        // pas toujours new Function dans les contextes restreints)
        var result;
        eval("result = (" + str + ");");
        return result;
    }
    return { stringify: stringify, parse: parse };
})();


// ─────────────────────────────────────────────────────────────────────
//  [A2] INTERNATIONALISATION (i18n) — FR / EN / IT
//  La langue est mémorisée dans un petit fichier sous IW.presetFolder.
//  t(key) renvoie la chaîne dans la langue courante (IW.lang), avec repli
//  sur le français si la clé manque.
// ─────────────────────────────────────────────────────────────────────
var IW_LANG_FILE = Folder.userData + "/ImpositionWizard/lang.txt";
var IW_FILMS_LAST_ERR = "";   // dernier message d'erreur réel de l'export des films
var IW_FILMS_PAPER_INFO = ""; // diagnostic du cadrage : taille support voulue/appliquée
var IW_FILMS_LANDED = 0;      // V20 — nb de PDF réellement créés au nom voulu
var IW_FILMS_MISSING = [];    // V20 — noms attendus mais introuvables (pilote a ignoré la destination)
var IW_FILMS_DIAG = "";       // V20 — diagnostic (dossiers cherchés + PDF vus) si le renommage échoue

function iwLoadLang() {
    try {
        var f = new File(IW_LANG_FILE);
        if (f.exists && f.open("r")) {
            var v = f.read(); f.close();
            v = String(v).replace(/^\s+|\s+$/g, "");
            if (v === "fr" || v === "en" || v === "it") return v;
        }
    } catch (e) {}
    return "fr"; // défaut
}
function iwSaveLang(lang) {
    try {
        var fold = new Folder(Folder.userData + "/ImpositionWizard");
        if (!fold.exists) fold.create();
        var f = new File(IW_LANG_FILE);
        if (f.open("w")) { f.write(lang); f.close(); }
    } catch (e) {}
}

// ── MÉMORISATION DES DERNIERS RÉGLAGES (V4) ──────────────────────────
//  À chaque lancement d'imposition, la configuration est enregistrée ;
//  à l'ouverture suivante (hors relance pour changement de langue), elle
//  est rechargée automatiquement. Réutilise IWJSON et le même dossier de
//  préférences que la langue/les presets. Toute erreur est ignorée (on
//  retombe alors sur les valeurs par défaut).
var IW_LAST_FILE = Folder.userData + "/ImpositionWizard/last-session.iwjson";
function iwSaveLastConfig(cfg) {
    try {
        var fold = new Folder(Folder.userData + "/ImpositionWizard");
        if (!fold.exists) fold.create();
        var f = new File(IW_LAST_FILE);
        if (f.open("w")) { f.write(IWJSON.stringify(cfg)); f.close(); }
    } catch (e) {}
}
function iwLoadLastConfig() {
    try {
        var f = new File(IW_LAST_FILE);
        if (f.exists && f.open("r")) {
            var txt = f.read(); f.close();
            if (txt && String(txt).replace(/^\s+|\s+$/g, "") !== "") {
                var obj = IWJSON.parse(txt);
                if (obj && typeof obj === "object") return obj;
            }
        }
    } catch (e) {}
    return null;
}

// ── PRÉFÉRENCES DE PERSONNALISATION (V4) ─────────────────────────────
//  Réglages durables (tailles de repères, pastilles couleurs, etc.) édités
//  dans la fenêtre « Réglages… » et conservés entre les sessions. Stockés
//  séparément du job (n'entrent pas dans les presets). IWJSON + fichier.
var IW_PREFS_FILE = Folder.userData + "/ImpositionWizard/prefs.iwjson";
function iwSavePrefs(prefs) {
    try {
        var fold = new Folder(Folder.userData + "/ImpositionWizard");
        if (!fold.exists) fold.create();
        var f = new File(IW_PREFS_FILE);
        if (f.open("w")) { f.write(IWJSON.stringify(prefs)); f.close(); }
    } catch (e) {}
}
function iwLoadPrefs() {
    try {
        var f = new File(IW_PREFS_FILE);
        if (f.exists && f.open("r")) {
            var txt = f.read(); f.close();
            if (txt && String(txt).replace(/^\s+|\s+$/g, "") !== "") {
                var obj = IWJSON.parse(txt);
                if (obj && typeof obj === "object") return obj;
            }
        }
    } catch (e) {}
    return {};
}

// Mire de calage personnalisée mémorisée : chemin du fichier conservé dans
// un petit fichier sous IW.presetFolder, rechargé au démarrage.
var IW_REGMARK_FILE = Folder.userData + "/ImpositionWizard/regmark.txt";
function iwLoadRegMark() {
    try {
        var f = new File(IW_REGMARK_FILE);
        if (f.exists && f.open("r")) {
            var v = f.read(); f.close();
            v = String(v).replace(/^\s+|\s+$/g, "");
            // on ne renvoie le chemin que si le fichier existe encore
            if (v && new File(v).exists) return v;
        }
    } catch (e) {}
    return "";
}
function iwSaveRegMark(path) {
    try {
        var fold = new Folder(Folder.userData + "/ImpositionWizard");
        if (!fold.exists) fold.create();
        var f = new File(IW_REGMARK_FILE);
        if (f.open("w")) { f.write(path || ""); f.close(); }
    } catch (e) {}
}

// Dictionnaire : I18N[key] = { fr, en, it }
var I18N = {
    // titres généraux / boutons principaux
    win_title:        { fr: "Blueprint V",                     en: "Blueprint V",                    it: "Blueprint V" },
    btn_cancel:       { fr: "Annuler",                        en: "Cancel",                         it: "Annulla" },
    btn_run:          { fr: "Lancer",                         en: "Run",                            it: "Avvia" },
    // fenêtre « À propos » (clic sur le logo/nom en bas à droite)
    about_title:      { fr: "À propos de Blueprint",           en: "About Blueprint",                it: "Informazioni su Blueprint" },
    about_tagline:    { fr: "Imposition + repères de coupe pour InDesign",
                        en: "Imposition + cut marks for InDesign",
                        it: "Imposizione + crocini di taglio per InDesign" },
    about_body:       { fr: "Blueprint impose automatiquement vos pièces sur la feuille (grille N-Up, Step & Repeat, Cut & Stack, Booklet, Dutch Cut, Shuffle, Riso, Sérigraphie et Patchwork), ajoute les repères de coupe, mires de calage, blanc tournant et marques couleurs, avec un aperçu en direct. Pensé pour la risographie et la sérigraphie.",
                        en: "Blueprint automatically imposes your pieces on the sheet (N-Up grid, Step & Repeat, Cut & Stack, Booklet, Dutch Cut, Shuffle, Riso, Screen print and Patchwork), adds cut marks, registration marks, inner margins and color marks, with a live preview. Built for risography and screen printing.",
                        it: "Blueprint impone automaticamente i pezzi sul foglio (griglia N-Up, Step & Repeat, Cut & Stack, Booklet, Dutch Cut, Shuffle, Riso, Serigrafia e Patchwork), aggiunge crocini di taglio, mire di registro, margini interni e tacche colore, con anteprima dal vivo. Pensato per risografia e serigrafia." },
    about_ig:         { fr: "ecnexua_",                        en: "ecnexua_",                       it: "ecnexua_" },
    about_close:      { fr: "Fermer",                           en: "Close",                          it: "Chiudi" },
    about_whatsnew_title: { fr: "Fonctionnalités",              en: "Features",                      it: "Funzionalità" },
    about_whatsnew:   { fr: "• Imposition automatique en grille (N-Up, Step & Repeat, Cut & Stack, Booklet, Dutch Cut, Shuffle, Riso, Sérigraphie, Patchwork), avec aperçu en direct.\n• Repères de coupe, mires de calage et marques couleurs générés automatiquement sur chaque copie imposée.\n• Blanc tournant et fond perdu, y compris un fond perdu adapté au visuel (bords en miroir fondu, sans dessin lisible dans la chute).\n• Verso duplex généré automatiquement à partir du recto, avec retournement court ou long.\n• Export des films de séparation, un PDF par encre, avec nommage automatique.\n• Fonctionne avec tout contenu : images, groupes, texte.",
                        en: "• Automatic grid imposition (N-Up, Step & Repeat, Cut & Stack, Booklet, Dutch Cut, Shuffle, Riso, Screen print, Patchwork), with live preview.\n• Cut marks, registration marks and color marks generated automatically on every imposed copy.\n• Inner margins and bleed, including artwork-matched bleed (mirrored, blended edges with no readable artwork in the trim waste).\n• Duplex back side generated automatically from the front, with short or long flip.\n• Separation film export, one PDF per ink, with automatic naming.\n• Works with any content: images, groups, text.",
                        it: "• Imposizione automatica a griglia (N-Up, Step & Repeat, Cut & Stack, Booklet, Dutch Cut, Shuffle, Riso, Serigrafia, Patchwork), con anteprima dal vivo.\n• Crocini di taglio, mire di registro e tacche colore generati automaticamente su ogni copia imposta.\n• Margini interni e abbondanza, inclusa l'abbondanza adattata al visual (bordi a specchio sfumati, senza disegno leggibile nello scarto).\n• Retro duplex generato automaticamente dal fronte, con ribaltamento corto o lungo.\n• Esportazione dei film di separazione, un PDF per inchiostro, con denominazione automatica.\n• Funziona con qualsiasi contenuto: immagini, gruppi, testo." },
    about_igfail:     { fr: "Impossible d'ouvrir le navigateur. Lien : https://instagram.com/ecnexua_",
                        en: "Could not open the browser. Link: https://instagram.com/ecnexua_",
                        it: "Impossibile aprire il browser. Link: https://instagram.com/ecnexua_" },
    // onglets
    tab_mode:         { fr: "Mode",                            en: "Mode",                           it: "Modalità" },
    tab_spacing:      { fr: "Espacement",                      en: "Spacing",                        it: "Spaziatura" },
    tab_marks:        { fr: "Repères",                         en: "Marks",                          it: "Crocini" },
    tab_colors:       { fr: "Blanc tournant et couleurs",     en: "Inner margin & colors",          it: "Margine interno e colori" },
    tab_duplex:       { fr: "Recto/Verso",                     en: "Duplex",                         it: "Fronte/Retro" },
    tab_presets:      { fr: "Presets",                          en: "Presets",                        it: "Preset" },
    tab_settings:     { fr: "Réglages",                        en: "Settings",                       it: "Impostazioni" },
    // onglet mode
    lbl_mode:         { fr: "Mode :",                         en: "Mode:",                          it: "Modalità:" },
    panel_dest:       { fr: "Sur quelle page imposer",        en: "Which page to impose on",        it: "Su quale pagina imporre" },
    lbl_page:         { fr: "Page cible :",                   en: "Target page:",                   it: "Pagina di destinazione:" },
    desc_page:        { fr: "Page du document où poser l'imposition (1 à %N%).",
                        en: "Document page where the imposition is placed (1 to %N%).",
                        it: "Pagina del documento dove collocare l'imposizione (da 1 a %N%)." },
    grid_calc:        { fr: "Grille calculée : —",            en: "Computed grid: —",               it: "Griglia calcolata: —" },
    grid_calc_label:  { fr: "Grille calculée : ",            en: "Computed grid: ",                it: "Griglia calcolata: " },
    grid_pieces:      { fr: " pièces)",                       en: " pieces)",                       it: " pezzi)" },
    grid_scale:       { fr: "  · échelle ",                   en: "  · scale ",                     it: "  · scala " },
    grid_booklet:     { fr: "Planche : 2 pages côte à côte",  en: "Sheet: 2 pages side by side",    it: "Foglio: 2 pagine affiancate" },
    grid_nofit:       { fr: "Grille calculée : — ne tient pas", en: "Computed grid: — doesn't fit", it: "Griglia calcolata: — non entra" },
    desc_gridread:    { fr: "Le nombre de pièces est calculé automatiquement d'après la taille de la pièce, la zone utile et l'espacement exact (onglet Repères).",
                        en: "The number of pieces is computed automatically from the piece size, the usable area and the exact spacing (Marks tab).",
                        it: "Il numero di pezzi è calcolato automaticamente in base alla dimensione del pezzo, all'area utile e alla spaziatura esatta (scheda Crocini)." },
    // bloc répétition
    panel_rep:        { fr: "Combien de copies",              en: "How many copies",                it: "Quante copie" },
    cb_auto:          { fr: "Auto",                           en: "Auto",                           it: "Auto" },
    lbl_count:        { fr: "Nombre de pièces :",             en: "Number of pieces:",              it: "Numero di pezzi:" },
    cb_fit:           { fr: "Autoriser le redimensionnement proportionnel",
                        en: "Allow proportional resizing",
                        it: "Consenti ridimensionamento proporzionale" },
    cb_flipalt:       { fr: "Retourner une ligne sur deux (180°, à partir de la 2e)",
                        en: "Flip every other row (180°, starting from the 2nd)",
                        it: "Ruota una riga sì e una no (180°, dalla 2ª)" },
    desc_rep:         { fr: "Auto = autant de pièces que la zone permet, à leur taille d'origine. Décochez Auto pour viser un TOTAL précis ; la grille la mieux proportionnée est choisie. Le redimensionnement met les pièces à l'échelle (ratio conservé) pour occuper au mieux la zone. Une ligne sur deux : les rangées paires (2, 4, …) sont tournées tête-bêche.",
                        en: "Auto = as many pieces as the area allows, at their native size. Uncheck Auto to target an exact TOTAL; the best-proportioned grid is chosen. Resizing scales the pieces (ratio kept) to best fill the area. Every other row: even rows (2, 4, …) are turned head-to-foot.",
                        it: "Auto = tutti i pezzi che l'area consente, alla dimensione originale. Deseleziona Auto per puntare a un TOTALE preciso; viene scelta la griglia meglio proporzionata. Il ridimensionamento scala i pezzi (mantiene il rapporto) per riempire al meglio l'area. Una riga sì e una no: le righe pari (2, 4, …) sono ruotate testa-piede." },
    // alignement
    panel_align:      { fr: "Où poser la grille sur la feuille", en: "Where to place the grid on the sheet", it: "Dove posare la griglia sul foglio" },
    desc_align:       { fr: "Position de la grille dans la zone utile (intérieur des marges). Le bouton central = centré. Sans effet si la grille remplit toute la zone.",
                        en: "Position of the grid within the usable area (inside the margins). The center button = centered. No effect if the grid fills the whole area.",
                        it: "Posizione della griglia nell'area utile (entro i margini). Il pulsante centrale = centrato. Nessun effetto se la griglia riempie tutta l'area." },
    lbl_rotorig:      { fr: "Tourner l'original :",           en: "Rotate the original:",           it: "Ruota l'originale:" },
    tip_rotleft:      { fr: "Tourner les copies de 90° vers la gauche (anti-horaire).", en: "Rotate copies 90° counter-clockwise.", it: "Ruota le copie di 90° in senso antiorario." },
    tip_rotright:     { fr: "Tourner les copies de 90° vers la droite (horaire).", en: "Rotate copies 90° clockwise.", it: "Ruota le copie di 90° in senso orario." },
    alert_norot:      { fr: "Aucun objet sélectionné à tourner.", en: "No object selected to rotate.", it: "Nessun oggetto selezionato da ruotare." },
    alert_rotfail:    { fr: "Rotation impossible : ",         en: "Rotation failed: ",              it: "Rotazione non riuscita: " },
    // options du mode
    panel_modeopts:   { fr: "Options du mode",                en: "Mode options",                   it: "Opzioni modalità" },
    lbl_bk_pages:     { fr: "Booklet — pages :",              en: "Booklet — pages:",               it: "Booklet — pagine:" },
    // settings
    panel_lang:       { fr: "Langue / Language / Lingua",     en: "Language / Langue / Lingua",     it: "Lingua / Language / Langue" },
    lbl_lang:         { fr: "Langue de l'interface :",        en: "Interface language:",            it: "Lingua dell'interfaccia:" },
    desc_lang:        { fr: "Le choix est mémorisé. La fenêtre se rouvre aussitôt dans la langue choisie en conservant vos réglages.",
                        en: "Your choice is saved. The window reopens immediately in the chosen language, keeping your settings.",
                        it: "La scelta viene memorizzata. La finestra si riapre subito nella lingua scelta mantenendo le impostazioni." },
    // alertes communes
    alert_nodoc:      { fr: "Aucun document ouvert.",         en: "No document open.",              it: "Nessun documento aperto." },
    alert_nosel:      { fr: "Sélectionnez au moins un objet source avant de lancer.",
                        en: "Select at least one source object before running.",
                        it: "Seleziona almeno un oggetto di origine prima di avviare." },
    // panneaux aperçu / divers onglets (titres)
    panel_preview:    { fr: "Aperçu de la feuille",           en: "Sheet preview",                  it: "Anteprima del foglio" },
    panel_summary:    { fr: "Résumé",                         en: "Summary",                        it: "Riepilogo" },
    lbl_zoom:         { fr: "Zoom :",                         en: "Zoom:",                          it: "Zoom:" },
    btn_zoomfit:      { fr: "Ajuster",                        en: "Fit",                            it: "Adatta" },
    btn_zoomreal:     { fr: "Taille réelle",                  en: "Actual size",                    it: "Dimensione reale" },
    tip_zoomreal:     { fr: "Affiche l'aperçu à l'échelle 1:1 (taille physique réelle à l'écran), selon le PPP d'écran réglé dans Réglages. Calibre le PPP avec une règle pour une précision parfaite.",
                        en: "Shows the preview at 1:1 scale (real physical size on screen), based on the screen PPI set in Settings. Calibrate the PPI with a ruler for perfect accuracy.",
                        it: "Mostra l'anteprima in scala 1:1 (dimensione fisica reale a schermo), in base ai PPI dello schermo impostati nelle Impostazioni. Calibra i PPI con un righello per una precisione perfetta." },
    lbl_screenppi:    { fr: "Affichage « Taille réelle » :",   en: "'Actual size' display:",          it: "Visualizzazione 'Dimensione reale':" },
    btn_calibrate:    { fr: "Calibrer l'écran…",               en: "Calibrate screen…",              it: "Calibra schermo…" },
    calib_title:      { fr: "Calibrage de l'écran",            en: "Screen calibration",             it: "Calibrazione schermo" },
    calib_intro:      { fr: "Place une carte bancaire (ou toute carte format standard, 85,6 mm de large) à plat contre l'écran et ajuste le curseur jusqu'à ce que le rectangle bleu ait EXACTEMENT la même largeur que la carte. L'aperçu « Taille réelle » sera alors à l'échelle 1:1 sur cet écran.",
                        en: "Hold a bank card (or any standard-size card, 85.6 mm wide) flat against the screen and adjust the slider until the blue rectangle is EXACTLY as wide as the card. The 'Actual size' preview will then be 1:1 on this screen.",
                        it: "Appoggia una carta di credito (o una carta in formato standard, 85,6 mm di larghezza) sullo schermo e regola il cursore finché il rettangolo blu ha ESATTAMENTE la stessa larghezza della carta. L'anteprima 'Dimensione reale' sarà allora in scala 1:1 su questo schermo." },
    calib_readout:    { fr: "Échelle : %M% px/mm  (≈ %P% PPP)", en: "Scale: %M% px/mm  (≈ %P% PPI)",    it: "Scala: %M% px/mm  (≈ %P% PPI)" },
    calib_widthpx:    { fr: "Largeur du rectangle (px) :",      en: "Rectangle width (px):",          it: "Larghezza rettangolo (px):" },
    tip_screenppi:    { fr: "Densité de ton écran, pour l'affichage « Taille réelle ». Pour calibrer : affiche en taille réelle, mesure une cote connue à la règle sur l'écran et ajuste cette valeur jusqu'à concordance. 96 = valeur standard ; les écrans Retina/4K sont souvent plus élevés.",
                        en: "Your screen density, for the 'Actual size' display. To calibrate: show actual size, measure a known dimension on screen with a ruler and adjust this value until it matches. 96 = standard; Retina/4K screens are often higher.",
                        it: "Densità dello schermo, per la visualizzazione 'Dimensione reale'. Per calibrare: mostra a dimensione reale, misura con un righello una quota nota sullo schermo e regola questo valore fino a farle coincidere. 96 = standard; gli schermi Retina/4K sono spesso più alti." },
    piece_rotated:    { fr: " (tourné ",                      en: " (rotated ",                     it: " (ruotato " },
    piece_src:        { fr: "Pièce source : ",                en: "Source piece: ",                 it: "Pezzo di origine: " },
    piece_none:       { fr: "Aucune sélection — aperçu de test (100 × 150 mm)",
                        en: "No selection — test preview (100 × 150 mm)",
                        it: "Nessuna selezione — anteprima di prova (100 × 150 mm)" },
    panel_spacing:    { fr: "Espacement entre pièces",        en: "Spacing between pieces",         it: "Spaziatura tra i pezzi" },
    panel_bleed:      { fr: "Fond perdu",                     en: "Bleed",                          it: "Abbondanza" },
    panel_piecemarks: { fr: "Sur chaque copie posée",         en: "On every placed copy",           it: "Su ogni copia posata" },
    panel_pagemarks:  { fr: "Une fois sur la feuille",        en: "Once on the sheet",              it: "Una volta sul foglio" },
    panel_markstyle:  { fr: "Épaisseur et longueur des traits", en: "Stroke weight and length",     it: "Spessore e lunghezza dei tratti" },
    panel_customtxt2: { fr: "Ajouter un texte ou un logo",    en: "Add a text or a logo",           it: "Aggiungi un testo o un logo" },
    panel_colormarks: { fr: "Pastilles des encres utilisées", en: "Swatches of the inks used",      it: "Tacche degli inchiostri usati" },
    lbl_wm_color:     { fr: "Couleur du fond :",              en: "Fill color:",                    it: "Colore di sfondo:" },
    wm_color_none:    { fr: "Aucune (blanc)",                 en: "None (white)",                   it: "Nessuno (bianco)" },
    tip_wm_color:     { fr: "Remplit le blanc tournant avec une nuance du document (passe-partout coloré). « Aucune » = blanc du papier.",
                        en: "Fills the inner margin with a document swatch (colored mat). 'None' = paper white.",
                        it: "Riempie il margine interno con una tinta del documento (passe-partout colorato). 'Nessuno' = bianco carta." },
    panel_modeopts2:  { fr: "Options du mode",                en: "Mode options",                   it: "Opzioni modalità" },
    lbl_creep:        { fr: "creep (mm) :",                   en: "creep (mm):",                    it: "scorrimento (mm):" },
    lbl_customtxt:    { fr: "Texte perso :",                  en: "Custom text:",                   it: "Testo personalizzato:" },
    lbl_graphic:      { fr: "Graphique (PDF) :",              en: "Graphic (PDF):",                 it: "Grafica (PDF):" },
    lbl_duplexflip:   { fr: "Retournement :",                 en: "Flip:",                          it: "Ribaltamento:" },
    lbl_duppage:      { fr: "Dupliquer page / ×N :",          en: "Duplicate page / ×N:",           it: "Duplica pagina / ×N:" },
    btn_load:         { fr: "Charger",                        en: "Load",                           it: "Carica" },
    btn_update:       { fr: "Mettre à jour",                  en: "Update",                         it: "Aggiorna" },
    tip_update:       { fr: "Remplace le preset sélectionné par les réglages actuels (la couleur et le dossier sont conservés).",
                        en: "Overwrites the selected preset with the current settings (color and folder are kept).",
                        it: "Sovrascrive il preset selezionato con le impostazioni attuali (colore e cartella sono mantenuti)." },
    preset_updated:   { fr: "Preset mis à jour.",             en: "Preset updated.",                it: "Preset aggiornato." },
    confirm_delpreset: { fr: "Supprimer le preset « %N% » ? Cette action est définitive.",
                        en: "Delete preset \"%N%\"? This cannot be undone.",
                        it: "Eliminare il preset \"%N%\"? L'azione è definitiva." },
    confirm_update:   { fr: "Mettre à jour le preset « %N% » avec les réglages actuels ? L'ancien contenu sera remplacé.",
                        en: "Update preset \"%N%\" with the current settings? The previous content will be replaced.",
                        it: "Aggiornare il preset \"%N%\" con le impostazioni attuali? Il contenuto precedente sarà sostituito." },
    btn_color:        { fr: "Couleur…",                       en: "Color…",                         it: "Colore…" },
    btn_newfolder:    { fr: "Nouveau dossier…",               en: "New folder…",                    it: "Nuova cartella…" },
    btn_movefolder:   { fr: "Ranger dans…",                   en: "Move to…",                       it: "Sposta in…" },
    tip_color:        { fr: "Donne une couleur au PRESET ou au DOSSIER sélectionné (toute la ligne est colorée) via une roue chromatique. « Aucune » retire la couleur.",
                        en: "Gives a color to the selected PRESET or FOLDER (the whole row is tinted) via a color wheel. 'None' removes the color.",
                        it: "Assegna un colore al PRESET o alla CARTELLA selezionata (tutta la riga è colorata) tramite una ruota dei colori. 'Nessuno' rimuove il colore." },
    tip_newfolder:    { fr: "Crée un dossier pour ranger des presets. Les dossiers regroupent les presets dans le tableau.",
                        en: "Create a folder to organize presets. Folders group presets in the list.",
                        it: "Crea una cartella per organizzare i preset. Le cartelle raggruppano i preset nell'elenco." },
    tip_movefolder:   { fr: "Range le preset sélectionné dans un dossier (ou le sort à la racine).",
                        en: "Move the selected preset into a folder (or back to the root).",
                        it: "Sposta il preset selezionato in una cartella (o di nuovo alla radice)." },
    color_dlg_title:  { fr: "Couleur du preset",              en: "Preset color",                   it: "Colore del preset" },
    color_dlg_intro:  { fr: "Choisis une couleur pour ce preset :", en: "Pick a color for this preset:", it: "Scegli un colore per questo preset:" },
    color_none:       { fr: "Aucune",                         en: "None",                           it: "Nessuno" },
    folder_dlg_title: { fr: "Nouveau dossier",                en: "New folder",                     it: "Nuova cartella" },
    folder_dlg_intro: { fr: "Nom du dossier :",               en: "Folder name:",                   it: "Nome della cartella:" },
    move_dlg_title:   { fr: "Ranger le preset",               en: "Move preset",                    it: "Sposta preset" },
    move_dlg_intro:   { fr: "Dossier de destination :",       en: "Destination folder:",            it: "Cartella di destinazione:" },
    move_root:        { fr: "(Racine — aucun dossier)",       en: "(Root — no folder)",             it: "(Radice — nessuna cartella)" },
    folder_open:      { fr: "\u25BE ",                          en: "\u25BE ",                          it: "\u25BE " },
    folder_prefix:    { fr: "\u25B8 ",                          en: "\u25B8 ",                          it: "\u25B8 " },
    preset_indent:    { fr: "      ",                          en: "      ",                         it: "      " },
    alert_selpreset:  { fr: "Sélectionne d'abord un preset.",  en: "Select a preset first.",         it: "Seleziona prima un preset." },
    alert_selpreset_or_folder: { fr: "Sélectionne d'abord un preset ou un dossier.", en: "Select a preset or a folder first.", it: "Seleziona prima un preset o una cartella." },
    confirm_delfolder: { fr: "Supprimer le dossier « %F% » ? Les presets qu'il contient seront déplacés à la racine (ils ne sont pas supprimés).",
                        en: "Delete folder \"%F%\"? The presets it contains will be moved to the root (they are not deleted).",
                        it: "Eliminare la cartella \"%F%\"? I preset che contiene saranno spostati nella radice (non vengono eliminati)." },
    btn_star:         { fr: "\u2605 Par défaut",                en: "\u2605 Default",                  it: "\u2605 Predefinito" },
    tip_star:         { fr: "Marque ce preset comme PAR DÉFAUT : il sera chargé à l'ouverture du script. Un seul à la fois — étoiler un autre remplace le précédent. Re-cliquer retire l'étoile.",
                        en: "Mark this preset as DEFAULT: loaded when the script opens. Only one at a time — starring another replaces the previous. Click again to unstar.",
                        it: "Segna questo preset come PREDEFINITO: caricato all'apertura dello script. Uno solo alla volta — segnarne un altro sostituisce il precedente. Clicca di nuovo per togliere." },
    hint_star:        { fr: "\u2605 = chargé à l'ouverture. Dossier : cliquer la flèche pour replier, le nom pour le sélectionner.",
                        en: "\u2605 = loaded on open. Folder: click the arrow to collapse, the name to select it.",
                        it: "\u2605 = caricato all'apertura. Cartella: clicca la freccia per richiudere, il nome per selezionarla." },
    btn_delete:       { fr: "Supprimer",                      en: "Delete",                         it: "Elimina" },
    tip_delete:       { fr: "Supprime le preset sélectionné. Si un dossier est sélectionné, supprime le dossier (ses presets repassent à la racine, sans être effacés).",
                        en: "Deletes the selected preset. If a folder is selected, deletes the folder (its presets move back to the root, not deleted).",
                        it: "Elimina il preset selezionato. Se è selezionata una cartella, elimina la cartella (i suoi preset tornano alla radice, senza essere eliminati)." },
    btn_save:         { fr: "Enregistrer",                    en: "Save",                           it: "Salva" },
    lbl_name:         { fr: "Nom :",                          en: "Name:",                          it: "Nome:" },
    preset_default:   { fr: "Mon preset",                     en: "My preset",                      it: "Il mio preset" },
    preset_saved:     { fr: "Preset enregistré.",             en: "Preset saved.",                  it: "Preset salvato." },
    // ── V7.2 : messages rapatriés dans le système i18n ──
    alert_writefail:  { fr: "Impossible d'écrire le preset.",  en: "Unable to write the preset.",     it: "Impossibile salvare il preset." },
    dlg_pickgraphic:  { fr: "Choisir un PDF/image de repère",  en: "Choose a mark PDF/image",         it: "Scegli un PDF/immagine di crocino" },
    dlg_pickreg:      { fr: "Choisir un fichier de mire (PDF / EPS / PNG)", en: "Choose a registration mark file (PDF / EPS / PNG)", it: "Scegli un file di mira (PDF / EPS / PNG)" },
    alert_badpage:    { fr: "Page cible invalide.",            en: "Invalid target page.",            it: "Pagina di destinazione non valida." },
    alert_nosrc:      { fr: "Sélectionnez au moins un objet source.", en: "Select at least one source object.", it: "Seleziona almeno un oggetto di origine." },
    alert_imposerr:   { fr: "Erreur imposition :\n",           en: "Imposition error:\n",             it: "Errore di imposizione:\n" },
    alert_markserr:   { fr: "Erreur repères :\n",              en: "Marks error:\n",                  it: "Errore crocini:\n" },
    alert_badbackpage:{ fr: "Recto/verso activé mais page verso invalide — verso ignoré.",
                        en: "Duplex enabled but back page invalid — back side skipped.",
                        it: "Fronte/retro attivo ma pagina retro non valida — retro ignorato." },
    alert_nocolor_detect: { fr: "Marques couleurs : aucune couleur détectée sur le contenu ni dans les images.\n(Images embarquées non lisibles, ou format non PNG.) J'affiche le Nuancier — retirez-en les nuances en trop.",
                        en: "Color marks: no color detected in the content or images.\n(Embedded images unreadable, or non-PNG format.) Showing the Swatches panel — remove any extra swatches from it.",
                        it: "Tacche colore: nessun colore rilevato nel contenuto né nelle immagini.\n(Immagini incorporate non leggibili, o formato non PNG.) Mostro il pannello Campioni — rimuovi le tinte in eccesso." },
    alert_nocolor_swatch: { fr: "Marques couleurs : le nuancier ne contient aucune couleur utilisable.",
                        en: "Color marks: the Swatches panel contains no usable color.",
                        it: "Tacche colore: il pannello Campioni non contiene colori utilizzabili." },
    tip_pagectr:      { fr: "Mires de centre, de bord et de COIN sur la feuille, + croix centrale. Indépendant de la grille : repère la page, pas les pièces.",
                        en: "Center, edge and CORNER marks on the sheet, + center cross. Independent of the grid: marks the page, not the pieces.",
                        it: "Mire di centro, bordo e ANGOLO sul foglio, + croce centrale. Indipendente dalla griglia: segna la pagina, non i pezzi." },
    tip_customtxt2b:  { fr: "Texte sous la ligne de coupe.\nJetons auto : {date} {page} {mode} {w} {h} {n}\nex. : « Job ABC · {date} · {w}\u00D7{h} »",
                        en: "Text below the cut line.\nAuto tokens: {date} {page} {mode} {w} {h} {n}\ne.g. « Job ABC · {date} · {w}\u00D7{h} »",
                        it: "Testo sotto la linea di taglio.\nToken auto: {date} {page} {mode} {w} {h} {n}\nes. « Job ABC · {date} · {w}\u00D7{h} »" },
    // ── V7.2 : messages de calcul / résumé / confirmation ──
    lay_zerosize:     { fr: "Pièce de taille nulle.",          en: "Piece has zero size.",            it: "Pezzo di dimensione nulla." },
    lay_toobig:       { fr: "Pièce trop grande pour la zone.\nPièce %SW%\u00D7%SH% mm, zone %ZW%\u00D7%ZH% mm.",
                        en: "Piece too large for the area.\nPiece %SW%\u00D7%SH% mm, area %ZW%\u00D7%ZH% mm.",
                        it: "Pezzo troppo grande per l'area.\nPezzo %SW%\u00D7%SH% mm, area %ZW%\u00D7%ZH% mm." },
    lay_overflow:     { fr: "Débordement : emprise %UW% \u00D7 %UH% mm > zone %ZW% \u00D7 %ZH% mm.",
                        en: "Overflow: footprint %UW% \u00D7 %UH% mm > area %ZW% \u00D7 %ZH% mm.",
                        it: "Sforamento: ingombro %UW% \u00D7 %UH% mm > area %ZW% \u00D7 %ZH% mm." },
    sum_copies:       { fr: "%N% copie(s), grille %C%\u00D7%R%",   en: "%N% copy(ies), grid %C%\u00D7%R%",   it: "%N% copia/e, griglia %C%\u00D7%R%" },
    sum_spacing:      { fr: ", espac. %H%/%V% mm",             en: ", spacing %H%/%V% mm",            it: ", spaz. %H%/%V% mm" },
    sum_footprint:    { fr: "  |  emprise %UW%\u00D7%UH% mm",      en: "  |  footprint %UW%\u00D7%UH% mm",   it: "  |  ingombro %UW%\u00D7%UH% mm" },
    sum_bleed:        { fr: ", f.perdu %B% mm",                en: ", bleed %B% mm",                  it: ", abbond. %B% mm" },
    sum_booklet:      { fr: "%N% pages, %S% feuille(s), %F% faces", en: "%N% pages, %S% sheet(s), %F% sides", it: "%N% pagine, %S% foglio/i, %F% facciate" },
    sum_creep:        { fr: ", creep %C% mm",                  en: ", creep %C% mm",                  it: ", creep %C% mm" },
    confirm_run:      { fr: "%MSG%\n\nLancer quand même ?",     en: "%MSG%\n\nRun anyway?",            it: "%MSG%\n\nAvviare comunque?" },
    tab_pages:        { fr: "Pages",                           en: "Pages",                          it: "Pagine" },

    // ── v2-8 : nouveaux modes Riso / Sérigraphie ──
    mode_nup:         { fr: "N-Up",            en: "N-Up",            it: "N-Up" },
    mode_steprep:     { fr: "Step & Repeat",   en: "Step & Repeat",   it: "Step & Repeat" },
    mode_cutstack:    { fr: "Cut & Stack",     en: "Cut & Stack",     it: "Cut & Stack" },
    mode_booklet:     { fr: "Booklet",         en: "Booklet",         it: "Booklet" },
    mode_dutchcut:    { fr: "Dutch Cut",       en: "Dutch Cut",       it: "Dutch Cut" },
    mode_shuffle:     { fr: "Shuffle",         en: "Shuffle",         it: "Shuffle" },
    mode_riso:        { fr: "Riso",            en: "Riso",            it: "Riso" },
    mode_seri:        { fr: "Sérigraphie",     en: "Screen print",    it: "Serigrafia" },
    mode_patch:       { fr: "Patchwork",       en: "Patchwork",       it: "Patchwork" },
    desc_mode_riso:   { fr: "Riso : grille N-Up calée EN BAS et centrée horizontalement, repères FINS — préréglage pour le calage risographie.",
                        en: "Riso: N-Up grid anchored at the BOTTOM, horizontally centered, THIN marks — preset for risograph registration.",
                        it: "Riso: griglia N-Up ancorata in BASSO, centrata orizzontalmente, crocini SOTTILI — preset per la registrazione risografica." },
    desc_mode_seri:   { fr: "Sérigraphie : grille N-Up centrée, repères PLUS LARGES (trait épais) — plus lisibles sur film et écran sérigraphique.",
                        en: "Screen print: centered N-Up grid, WIDER marks (thick stroke) — more visible on film and screen.",
                        it: "Serigrafia: griglia N-Up centrata, crocini PIÙ LARGHI (tratto spesso) — più visibili su pellicola e telaio." },
    desc_mode_patch:  { fr: "Patchwork : EMPILE les objets SÉLECTIONNÉS (même taille) au même endroit, puis ROGNE chacun sur une cellule de la grille — le 1er garde le coin haut-gauche, le 2e la cellule suivante (ligne par ligne). À l'écran ils se recombinent en une seule image, chaque cellule venant d'un document différent. Cellules JOINTIVES (espacement 0), grille centrée EN BAS de la page. Idéal pour tester des associations de couleurs riso/sérigraphie.",
                        en: "Patchwork: STACKS the SELECTED objects (same size) at the same spot, then CROPS each to one grid cell — the 1st keeps the top-left corner, the 2nd the next cell (row by row). On screen they recombine into a single image, each cell from a different document. Cells are FLUSH (zero spacing), grid centered at the BOTTOM of the page. Ideal for testing riso/screen-print color combinations.",
                        it: "Patchwork: SOVRAPPONE gli oggetti SELEZIONATI (stessa dimensione) nello stesso punto, poi RITAGLIA ciascuno su una cella della griglia — il 1° tiene l'angolo alto-sinistra, il 2° la cella successiva (riga per riga). A schermo si ricombinano in un'unica immagine, ogni cella da un documento diverso. Celle UNITE (spaziatura 0), griglia centrata in BASSO nella pagina. Ideale per testare abbinamenti di colore riso/serigrafia." },
    desc_mode_nup:    { fr: "N-Up : répète une grille de pièces. Si plusieurs objets sont sélectionnés, ils alternent dans les emplacements.",
                        en: "N-Up: repeats a grid of pieces. If multiple objects are selected, they alternate in the slots.",
                        it: "N-Up: ripete una griglia di pezzi. Se sono selezionati più oggetti, si alternano nelle posizioni." },
    desc_mode_steprep:{ fr: "Step & Repeat : répète une SEULE pièce (le 1er objet) sur toute la grille — idéal étiquettes/cartes identiques.",
                        en: "Step & Repeat: repeats a SINGLE piece (the 1st object) on the whole grid — ideal for identical labels/cards.",
                        it: "Step & Repeat: ripete un SOLO pezzo (il 1° oggetto) su tutta la griglia — ideale per etichette/biglietti identici." },
    desc_mode_cutstack:{ fr: "Cut & Stack : ordonne les pièces colonne par colonne pour qu'après coupe et empilage les paquets soient séquencés.",
                         en: "Cut & Stack: orders pieces column by column so that after cutting and stacking the bundles are sequenced.",
                         it: "Cut & Stack: ordina i pezzi colonna per colonna così che dopo taglio e impilamento i pacchi siano in sequenza." },
    desc_mode_booklet:{ fr: "Booklet : impose 2 pages par face en piqûre à cheval, avec creep optionnel. Colonnes/rangées ignorées.",
                        en: "Booklet: imposes 2 pages per side in saddle-stitch, with optional creep. Columns/rows are ignored.",
                        it: "Booklet: impone 2 pagine per lato in brossura a sella, con creep opzionale. Colonne/righe ignorate." },
    desc_mode_dutchcut:{ fr: "Dutch Cut : grille N-Up + une bande de pièces tournées à 90° dans l'espace résiduel, pour optimiser la matière.",
                         en: "Dutch Cut: N-Up grid + a strip of pieces rotated 90° in the remaining space, to optimize material.",
                         it: "Dutch Cut: griglia N-Up + una fascia di pezzi ruotati a 90° nello spazio residuo, per ottimizzare il materiale." },
    desc_mode_shuffle:{ fr: "Shuffle : vous fixez l'ordre des emplacements via le champ « Index personnalisé ».",
                        en: "Shuffle: you set the slot order via the « Custom index » field.",
                        it: "Shuffle: stabilisci l'ordine delle posizioni tramite il campo « Indice personalizzato »." },

    // ── v2-8 : repère perso (croix + cercle importés) ──
    lbl_regfile:      { fr: "Mire perso (fichier) :",         en: "Custom target (file):",          it: "Mira pers. (file):" },
    desc_regfile:     { fr: "Importez un PDF/EPS/PNG pour REMPLACER la croix+cercle dessinée. Placé à l'emplacement de la mire, à la taille « Longueur trait ». Laissez vide pour la mire vectorielle par défaut.",
                        en: "Import a PDF/EPS/PNG to REPLACE the drawn cross+circle. Placed at the target position, sized to the « mark length ». Leave empty for the default vector target.",
                        it: "Importa un PDF/EPS/PNG per SOSTITUIRE croce+cerchio disegnati. Posizionato al posto della mira, alla dimensione « lunghezza tratto ». Vuoto = mira vettoriale predefinita." },
    btn_browse:       { fr: "Parcourir…",                     en: "Browse…",                        it: "Sfoglia…" },
    btn_clear:        { fr: "Effacer",                        en: "Clear",                          it: "Cancella" },
    cb_regremember:   { fr: "Mémoriser cette mire (rouverte au prochain lancement)",
                        en: "Remember this target (reloaded next launch)",
                        it: "Memorizza questa mira (ricaricata al prossimo avvio)" },

    // ── v2-8 : onglet Réglages séparé / outils ──
    tab_settings2:    { fr: "Réglages",                        en: "Settings",                       it: "Impostazioni" },
    panel_regcustom:  { fr: "Repère de calage personnalisé",  en: "Custom registration mark",       it: "Crocino di registro personalizzato" },
    // ── Export des films / séparations (sélection d'encres) ──
    panel_films:      { fr: "Export des films (séparations)",
                        en: "Film export (separations)",
                        it: "Esportazione pellicole (separazioni)" },
    btn_films:        { fr: "Exporter",                          en: "Export",                         it: "Esporta" },
    tip_films:        { fr: "Génère 1 PDF par encre cochée, en NOIR sur BLANC (film d'insolation). Vous choisissez les encres à exporter (quadri et tons directs), comme dans le menu Sortie d'InDesign. Chaque film contient les pièces de cette encre + tous les repères en [Repérage]. Sans toucher au document.",
                        en: "Generates 1 PDF per checked ink, BLACK on WHITE (imaging film). You pick the inks to export (process and spot), like InDesign's Output menu. Each film contains that ink's pieces + all [Registration] marks. Without altering the document.",
                        it: "Genera 1 PDF per ogni inchiostro selezionato, NERO su BIANCO (pellicola). Scegli gli inchiostri da esportare (quadricromia e tinte piatte), come nel menu Output di InDesign. Ogni pellicola contiene i pezzi di quell'inchiostro + tutti i crocini in [Registro]. Senza toccare il documento." },
    films_pick_title: { fr: "Exporter les films — choix des encres",
                        en: "Export films — choose inks",
                        it: "Esporta pellicole — scegli gli inchiostri" },
    films_pick_hint:  { fr: "Cochez les encres à exporter (1 PDF par encre, noir sur blanc). [Repérage] apparaît sur chaque film.\n\nATTENTION : ne fonctionne qu'avec des objets InDesign en tons directs (aplats/vecteurs, ou un .indd importé). Les images RVB/CMJN placées ne peuvent pas être séparées par InDesign.",
                        en: "Check the inks to export (1 PDF per ink, black on white). [Registration] appears on every film.\n\nWARNING: only works with native InDesign objects in spot colors (fills/vectors, or an imported .indd). Placed RGB/CMYK images cannot be separated by InDesign.",
                        it: "Seleziona gli inchiostri da esportare (1 PDF per inchiostro, nero su bianco). [Registro] appare su ogni pellicola.\n\nATTENZIONE: funziona solo con oggetti InDesign nativi in tinte piatte (campiture/vettori, o un .indd importato). Le immagini RGB/CMYK inserite non possono essere separate da InDesign." },
    films_all:        { fr: "Tout",                              en: "All",                            it: "Tutti" },
    films_none_btn:   { fr: "Aucun",                             en: "None",                           it: "Nessuno" },
    films_export_btn: { fr: "Exporter",                          en: "Export",                         it: "Esporta" },
    films_basename:   { fr: "Nom des fichiers :",                en: "File name:",                     it: "Nome dei file:" },
    films_basename_tip:{ fr: "Nom de base des PDF. Chaque film sera nommé « <ce nom>-<NomDeLaCouleur>.pdf ». Pré-rempli avec le nom du document.",
                        en: "Base name for the PDFs. Each film will be named \"<this name>-<ColorName>.pdf\". Pre-filled with the document name.",
                        it: "Nome di base dei PDF. Ogni pellicola sarà nominata \"<questo nome>-<NomeColore>.pdf\". Precompilato con il nome del documento." },
    films_choosedir:  { fr: "Choisir le dossier de destination des films",
                        en: "Choose the destination folder for the films",
                        it: "Scegli la cartella di destinazione delle pellicole" },
    films_none:       { fr: "Aucune encre trouvée dans le document.",
                        en: "No ink found in the document.",
                        it: "Nessun inchiostro trovato nel documento." },
    films_nosel:      { fr: "Aucune encre cochée. Sélectionnez au moins une encre.",
                        en: "No ink checked. Select at least one ink.",
                        it: "Nessun inchiostro selezionato. Seleziona almeno un inchiostro." },
    films_done:       { fr: "Films exportés : %N% PDF dans le dossier choisi.",
                        en: "Films exported: %N% PDF in the chosen folder.",
                        it: "Pellicole esportate: %N% PDF nella cartella scelta." },
    films_fail:       { fr: "Échec de l'export des films : ",   en: "Film export failed: ",            it: "Esportazione pellicole non riuscita: " },
    films_nopreset:   { fr: "Aucun preset PDF disponible pour l'export.",
                        en: "No PDF preset available for export.",
                        it: "Nessun preset PDF disponibile per l'esportazione." },
    films_printer:    { fr: "Imprimante :", en: "Printer:", it: "Stampante:" },
    films_printer_warn: { fr: "⚠ L'imprimante active n'est pas « Print to PDF ». Avant d'exporter, va dans Fichier > Imprimer, choisis « Print to PDF » comme imprimante, clique Imprimer (ou Annuler), puis relance l'export. Sinon utilise « PostScript File » ci-dessus.",
                          en: "⚠ The active printer is not « Print to PDF ». Before exporting, go to File > Print, pick « Print to PDF » as the printer, click Print (or Cancel), then relaunch the export. Otherwise use « PostScript File » above.",
                          it: "⚠ La stampante attiva non è « Print to PDF ». Prima di esportare, vai in File > Stampa, scegli « Print to PDF » come stampante, clicca Stampa (o Annulla), poi rilancia l'esportazione. Altrimenti usa « PostScript File » qui sopra." },

    // ── v5.0 : traduction complète ──
    // onglet Repères
    cb_crop:          { fr: "Traits de coupe (crop marks)",    en: "Crop marks",                     it: "Crocini di taglio (crop marks)" },
    cb_trim:          { fr: "Cadre de coupe (trim frame)",     en: "Trim frame",                     it: "Cornice di taglio (trim frame)" },
    cb_reg:           { fr: "Mire de repérage (Registration)", en: "Registration mark",              it: "Crocino di registro (Registration)" },
    cb_bar:           { fr: "Bande de contrôle couleur",       en: "Color control bar",              it: "Barra di controllo colore" },
    cb_ang:           { fr: "Repères d'angle (rotation)",      en: "Angle marks (rotation)",         it: "Crocini angolari (rotazione)" },
    cb_pagecross:     { fr: "Croix de centre de page",         en: "Page center cross",              it: "Croce di centro pagina" },
    cb_pageframe:     { fr: "Cadre de coupe (par les mires de coin)", en: "Cut frame (through corner marks)", it: "Cornice di taglio (per le mire d'angolo)" },
    tip_pageframe:    { fr: "Trace un cadre de coupe au niveau de la feuille, passant exactement par les CENTRES des mires de coin. Couper le long du cadre fait passer la coupe au centre de chaque mire. Nécessite « Croix de centre de page ».",
                        en: "Draws a sheet-level cut frame passing exactly through the CENTERS of the corner marks. Cutting along the frame goes through the center of each mark. Requires « Page center cross ».",
                        it: "Traccia una cornice di taglio a livello foglio che passa esattamente per i CENTRI delle mire d'angolo. Tagliando lungo la cornice il taglio passa per il centro di ogni mira. Richiede « Croce di centro pagina »." },
    cb_sidecross:     { fr: "Croix de bord supplémentaires (intervalle régulier)",
                        en: "Extra side crosses (regular interval)",
                        it: "Croci laterali aggiuntive (intervallo regolare)" },
    lbl_sidestep:     { fr: "    ↳ Intervalle (mm) :",         en: "    ↳ Interval (mm):",           it: "    ↳ Intervallo (mm):" },
    cb_colormarks:    { fr: "Marques couleurs de page (couleurs de la sélection)",
                        en: "Page color marks (colors from selection)",
                        it: "Segni colore pagina (colori dalla selezione)" },
    lbl_customtxt2:   { fr: "Texte perso :",                   en: "Custom text:",                   it: "Testo pers.:" },
    lbl_graphic2:     { fr: "Graphique (PDF) :",               en: "Graphic (PDF):",                 it: "Grafica (PDF):" },
    lbl_mklen:        { fr: "Longueur trait (mm) :",           en: "Mark length (mm):",              it: "Lunghezza tratto (mm):" },
    lbl_mkgap:        { fr: "Écart (mm) :",                    en: "Gap (mm):",                      it: "Distanza (mm):" },
    lbl_mkstroke:     { fr: "Épaisseur (pt) :",                en: "Stroke weight (pt):",            it: "Spessore (pt):" },
    // tooltips repères
    tip_crop:         { fr: "Traits de coupe aux 4 coins de chaque pièce, positionnés sur la ligne de coupe.",
                        en: "Crop marks at the 4 corners of each piece, positioned on the cut line.",
                        it: "Crocini di taglio ai 4 angoli di ogni pezzo, posizionati sulla linea di taglio." },
    tip_trim:         { fr: "Rectangle pointillé sur la ligne de coupe finale. Repère visuel, à retirer avant impression réelle.",
                        en: "Dashed rectangle on the final cut line. Visual reference, to be removed before actual printing.",
                        it: "Rettangolo tratteggiato sulla linea di taglio finale. Riferimento visivo, da rimuovere prima della stampa reale." },
    tip_reg:          { fr: "Mire de repérage (croix dans un cercle) en couleur Registration, pour le calage multicouleur.",
                        en: "Registration mark (cross in a circle) in Registration color, for multicolor alignment.",
                        it: "Crocino di registro (croce in un cerchio) in colore Registration, per la registrazione multicolore." },
    tip_bar:          { fr: "Bande de contrôle couleur (C, M, J, N + 50% N) sous chaque pièce.",
                        en: "Color control bar (C, M, Y, K + 50% K) below each piece.",
                        it: "Barra di controllo colore (C, M, G, N + 50% N) sotto ogni pezzo." },
    tip_ang:          { fr: "Repères diagonaux aux coins, utiles pour le calage rotatif.",
                        en: "Diagonal corner marks, useful for rotary registration.",
                        it: "Crocini diagonali agli angoli, utili per la registrazione rotativa." },
    tip_pagecross:    { fr: "Ajoute la croix au centre exact de la feuille. Décochez pour ne garder que les 4 marques de bord.",
                        en: "Adds a cross at the exact center of the sheet. Uncheck to keep only the 4 edge marks.",
                        it: "Aggiunge una croce al centro esatto del foglio. Deseleziona per tenere solo i 4 segni di bordo." },
    tip_sidecross:    { fr: "Ajoute des croix le long des 4 bords, espacées régulièrement. Les croix de CENTRE ne sont jamais retirées.",
                        en: "Adds crosses along all 4 edges, evenly spaced. CENTER crosses are never removed.",
                        it: "Aggiunge croci lungo i 4 bordi, spaziate regolarmente. Le croci di CENTRO non vengono mai rimosse." },
    tip_colormarks:   { fr: "Sur un CALQUE dédié, pastilles couleurs issues de la sélection. Sérigraphie : rectangle + carré par couleur. Riso : noms.",
                        en: "On a DEDICATED LAYER, color patches from the selection. Screen print: rectangle + square per color. Riso: names only.",
                        it: "Su un LIVELLO dedicato, tacche colore dalla selezione. Serigrafia: rettangolo + quadrato per colore. Riso: solo nomi." },
    lbl_coloredge:    { fr: "Pastilles sur le bord :",        en: "Patches on edge:",               it: "Tacche sul bordo:" },
    edge_short:       { fr: "Bord court",                     en: "Short edge",                     it: "Lato corto" },
    edge_long:        { fr: "Bord long",                      en: "Long edge",                      it: "Lato lungo" },
    tip_coloredge:    { fr: "Place les pastilles couleurs le long du bord court (haut/bas en portrait) ou du bord long (gauche/droite en portrait). Déduit du format de la feuille.",
                        en: "Places color patches along the short edge (top/bottom in portrait) or the long edge (left/right in portrait). Derived from sheet orientation.",
                        it: "Colloca le tacche colore lungo il lato corto (alto/basso in verticale) o il lato lungo (sinistra/destra in verticale). Dedotto dall'orientamento del foglio." },
    lbl_colornameside:{ fr: "Bas du nom :",                   en: "Name bottom:",                   it: "Base del nome:" },
    cns_auto:         { fr: "Auto",                           en: "Auto",                           it: "Auto" },
    cns_bas:          { fr: "Bas",                            en: "Bottom",                         it: "Basso" },
    cns_haut:         { fr: "Haut",                           en: "Top",                            it: "Alto" },
    cns_gauche:       { fr: "Gauche",                         en: "Left",                           it: "Sinistra" },
    cns_droite:       { fr: "Droite",                         en: "Right",                          it: "Destra" },
    tip_colornameside:{ fr: "Choisit de quel côté est le BAS du texte sur les rectangles de couleur. Auto = horizontal en bord court, tourné à 90° en bord long.",
                        en: "Chooses which side is the BOTTOM of the text on the color rectangles. Auto = horizontal on short edge, rotated 90° on long edge.",
                        it: "Sceglie da quale lato è la BASE del testo sui rettangoli colore. Auto = orizzontale su lato corto, ruotato 90° su lato lungo." },
    panel_whitemargin:{ fr: "Blanc tournant — marge autour du visuel", en: "Inner margin — border around the artwork", it: "Margine interno — bordo attorno alla grafica" },
    lbl_wm_top:       { fr: "Haut :",                         en: "Top:",                           it: "Alto:" },
    lbl_wm_bottom:    { fr: "Bas :",                          en: "Bottom:",                        it: "Basso:" },
    lbl_wm_left:      { fr: "Gauche :",                       en: "Left:",                          it: "Sinistra:" },
    lbl_wm_right:     { fr: "Droite :",                       en: "Right:",                         it: "Destra:" },
    cb_wm_link:       { fr: "Synchroniser les 4 côtés",        en: "Sync all 4 sides",               it: "Sincronizza i 4 lati" },
    cb_wm_enable:     { fr: "Activer le blanc tournant",        en: "Enable inner white margin",      it: "Attiva margine bianco interno" },
    tip_wm_enable:    { fr: "Le blanc tournant (passe-partout) est DÉSACTIVÉ par défaut. Cochez pour appliquer une marge interne à chaque pièce.",
                        en: "The inner white margin (passe-partout) is OFF by default. Tick to apply an inner margin to each piece.",
                        it: "Il margine bianco interno (passe-partout) è DISATTIVATO per impostazione predefinita. Spunta per applicare un margine interno a ogni pezzo." },
    tip_whitemargin:  { fr: "Marge blanche (mm) à l'intérieur de chaque pièce : l'image est redimensionnée pour tenir dedans, centrée. Synchro = même valeur partout ; décochez pour régler chaque côté.",
                        en: "White margin (mm) inside each piece: the image is resized to fit, centered. Sync = same value on all sides; uncheck to set each side.",
                        it: "Margine bianco (mm) dentro ogni pezzo: l'immagine viene ridimensionata per rientrare, centrata. Sincro = stesso valore ovunque; deseleziona per regolare ogni lato." },
    tip_customtxt:    { fr: "Texte sous la ligne de coupe.\nJetons auto : {date} {page} {mode} {w} {h} {n}",
                        en: "Text below the cut line.\nAuto tokens: {date} {page} {mode} {w} {h} {n}",
                        it: "Testo sotto la linea di taglio.\nToken auto: {date} {page} {mode} {w} {h} {n}" },
    // onglet Duplex
    cb_duplex:        { fr: "Créer la face verso (recto/verso)",
                        en: "Create the back side (duplex)",
                        it: "Crea il retro (fronte/retro)" },
    tip_duplex:       { fr: "Crée la face arrière en miroir sur une autre page, pour l'impression recto/verso.",
                        en: "Creates the mirrored back face on another page, for duplex printing.",
                        it: "Crea il retro speculare su un'altra pagina, per la stampa fronte/retro." },
    lbl_duplexflip2:  { fr: "Retournement :",                  en: "Flip:",                          it: "Ribaltamento:" },
    tip_duplexflip:   { fr: "Bord long = rotation axe vertical. Bord court = axe horizontal.",
                        en: "Long edge = vertical axis flip. Short edge = horizontal axis flip.",
                        it: "Lato lungo = rotazione asse verticale. Lato corto = asse orizzontale." },
    lbl_backpg:       { fr: "Page verso :",                    en: "Back page:",                     it: "Pagina retro:" },
    tip_backpg:       { fr: "Numéro de la page du document qui recevra la face verso.",
                        en: "Document page number that will receive the back side.",
                        it: "Numero della pagina del documento che riceverà il retro." },
    // onglet Pré-traitement
    panel_preprocess: { fr: "Pré-traitement des pages",        en: "Page preprocessing",             it: "Pre-elaborazione delle pagine" },
    tip_preprocess:   { fr: "Manipule l'ordre/le nombre de pages source AVANT l'imposition.",
                        en: "Manipulates the order/number of source pages BEFORE imposition.",
                        it: "Manipola l'ordine/numero di pagine sorgente PRIMA dell'imposizione." },
    lbl_pporder:      { fr: "Ordre des pages :",               en: "Page order:",                    it: "Ordine pagine:" },
    tip_pporder:      { fr: "Nouvel ordre par index. Ex : 3,1,2 place la page 3 en premier.",
                        en: "New order by index. E.g. 3,1,2 puts page 3 first.",
                        it: "Nuovo ordine per indice. Es.: 3,1,2 mette la pagina 3 per prima." },
    lbl_pprepeat:     { fr: "Répéter ×N :",                    en: "Repeat ×N:",                     it: "Ripeti ×N:" },
    tip_pprepeat:     { fr: "Répète l'ensemble du plan N fois.",
                        en: "Repeats the whole plan N times.",
                        it: "Ripete l'intero piano N volte." },
    lbl_ppskip:       { fr: "Retirer page :",                  en: "Remove page:",                   it: "Rimuovi pagina:" },
    tip_ppskip:       { fr: "Retire une page du plan (n'efface rien dans le document).",
                        en: "Removes a page from the plan (does not delete anything in the document).",
                        it: "Rimuove una pagina dal piano (non cancella nulla nel documento)." },
    lbl_ppduppage:    { fr: "Dupliquer page / ×N :",           en: "Duplicate page / ×N:",           it: "Duplica pagina / ×N:" },
    // onglet Espacement
    lbl_gapH:         { fr: "Espace horizontal exact (mm) :",  en: "Exact horizontal gap (mm):",     it: "Spazio orizzontale esatto (mm):" },
    tip_gapH:         { fr: "Espace EXACT entre colonnes. La valeur est respectée ; l'espace en trop reste à droite. Une valeur NÉGATIVE fait se chevaucher les colonnes.",
                        en: "EXACT gap between columns. The value is respected; extra space remains on the right. A NEGATIVE value makes columns overlap.",
                        it: "Spazio ESATTO tra le colonne. Il valore è rispettato; lo spazio in eccesso resta a destra. Un valore NEGATIVO fa sovrapporre le colonne." },
    lbl_gapV:         { fr: "Espace vertical exact (mm) :",    en: "Exact vertical gap (mm):",       it: "Spazio verticale esatto (mm):" },
    tip_gapV:         { fr: "Espace EXACT entre rangées. Même principe : valeur respectée, espace en trop en bas. Une valeur NÉGATIVE fait se chevaucher les rangées.",
                        en: "EXACT gap between rows. Same principle: value respected, extra space at the bottom. A NEGATIVE value makes rows overlap.",
                        it: "Spazio ESATTO tra le righe. Stesso principio: valore rispettato, spazio in eccesso in basso. Un valore NEGATIVO fa sovrapporre le righe." },
    lbl_bleed:        { fr: "Fond perdu (mm) :",               en: "Bleed (mm):",                    it: "Abbondanza (mm):" },
    tip_bleed:        { fr: "La pièce INCLUT déjà le fond perdu. La coupe est tracée à l'intérieur, à cette distance du bord.",
                        en: "The piece ALREADY INCLUDES the bleed. The cut line is drawn inside, at this distance from the edge.",
                        it: "Il pezzo INCLUDE GIÀ l'abbondanza. Il taglio è tracciato all'interno, a questa distanza dal bordo." },
    // V20 — bascule Intérieur / Extérieur (fond perdu ET blanc tournant)
    lbl_inout:        { fr: "Position :",                      en: "Position:",                      it: "Posizione:" },
    io_inside:        { fr: "Intérieur",                       en: "Inside",                         it: "Interno" },
    io_outside:       { fr: "Extérieur",                       en: "Outside",                        it: "Esterno" },
    tip_bleed_inout:  { fr: "Intérieur : la pièce inclut le fond perdu, la coupe est tracée à l'intérieur (la pièce ne change pas de taille). Extérieur : le fond perdu est AJOUTÉ autour de la pièce (le slot grandit), la pièce garde sa taille et la coupe reste à son bord.",
                        en: "Inside: the piece includes the bleed, the cut is drawn inside (piece size unchanged). Outside: the bleed is ADDED around the piece (slot grows), the piece keeps its size and the cut stays at its edge.",
                        it: "Interno: il pezzo include l'abbondanza, il taglio è tracciato all'interno (dimensione invariata). Esterno: l'abbondanza è AGGIUNTA attorno al pezzo (lo slot cresce), il pezzo mantiene la dimensione e il taglio resta al suo bordo." },
    tip_wm_inout:     { fr: "Intérieur : la marge est prise DANS le slot, la pièce est réduite pour l'y loger. Extérieur : la marge est AJOUTÉE autour de la pièce (le slot grandit), la pièce garde sa taille pleine.",
                        en: "Inside: the margin is taken WITHIN the slot, the piece is scaled down to fit. Outside: the margin is ADDED around the piece (slot grows), the piece keeps its full size.",
                        it: "Interno: il margine è preso NELLO slot, il pezzo è ridotto per contenerlo. Esterno: il margine è AGGIUNTO attorno al pezzo (lo slot cresce), il pezzo mantiene la dimensione piena." },
    // V20 — génération du fond perdu (rectangles colorés) en mode extérieur
    lbl_bleed_color:  { fr: "Couleur du fond perdu :",         en: "Bleed color:",                   it: "Colore abbondanza:" },
    // V1 — fond perdu adaptatif : bords de la pièce réfléchis en miroir.
    bleed_color_stretch: { fr: "Auto (adapté au visuel)",       en: "Auto (matches artwork)",         it: "Auto (adattato alla grafica)" },
    bleed_color_auto: { fr: "Auto (couleur de la pièce)",      en: "Auto (piece color)",             it: "Auto (colore del pezzo)" },
    bleed_color_none: { fr: "Aucune",                          en: "None",                           it: "Nessuno" },
    tip_bleed_color:  { fr: "En mode EXTÉRIEUR : crée RÉELLEMENT le fond perdu autour de la pièce, la coupe ne laisse pas de liseré blanc. « Auto (adapté au visuel) » : chaque bord est prolongé par une très fine tranche du bord, réfléchie en miroir puis ÉTIRÉE sur toute la largeur du fond perdu — les couleurs se FONDENT en traînées (aucun dessin lisible dans la chute) et le raccord au trait de coupe est exact. « Auto (couleur de la pièce) » : rectangle plat de la couleur de fond de la pièce. Nuance au choix : rectangle plat de cette couleur. « Aucune » = rien (respiration vide).",
                        en: "In OUTSIDE mode: the bleed is REALLY created around the piece, so cutting leaves no white sliver. \"Auto (matches artwork)\": each edge is extended with a very thin edge sliver, mirrored then STRETCHED across the full bleed width — colors BLEND into smears (no readable artwork in the trim waste) and the join at the cut line is exact. \"Auto (piece color)\": flat rectangle in the piece's fill color. Chosen swatch: flat rectangle in that color. \"None\" = nothing (empty breathing room).",
                        it: "In modalità ESTERNO: l'abbondanza viene REALMENTE creata attorno al pezzo, il taglio non lascia filetti bianchi. \"Auto (adattato alla grafica)\": ogni bordo è prolungato con una sottilissima striscia del bordo, specchiata poi ESTESA su tutta la larghezza dell'abbondanza — i colori si FONDONO in scie (nessuna grafica leggibile nello sfrido) e il raccordo sulla linea di taglio è esatto. \"Auto (colore del pezzo)\": rettangolo piatto nel colore di riempimento del pezzo. Campione a scelta: rettangolo piatto in quel colore. \"Nessuno\" = niente." },
    // onglet Presets
    panel_presets:    { fr: "Préréglages",                     en: "Presets",                        it: "Preset" },
    tip_presets:      { fr: "Sauvegarde et recharge des configurations complètes.",
                        en: "Save and reload complete configurations.",
                        it: "Salva e ricarica configurazioni complete." },
    // booklet
    lbl_creep2:       { fr: "creep (mm) :",                    en: "creep (mm):",                    it: "scorrimento (mm):" },
    tip_booklet:      { fr: "Nombre total de pages (arrondi au multiple de 4) et creep — décalage compensant l'épaisseur du papier plié.",
                        en: "Total number of pages (rounded to multiple of 4) and creep — offset compensating for folded paper thickness.",
                        it: "Numero totale di pagine (arrotondato al multiplo di 4) e creep — compensazione per lo spessore della carta piegata." },
    // shuffle
    lbl_shuffle:      { fr: "Index personnalisé :",            en: "Custom index:",                  it: "Indice personalizzato:" },
    tip_shuffle:      { fr: "Index d'items séparés par virgules, lus emplacement par emplacement. Ex : 0,2,1,3.",
                        en: "Comma-separated item indices, read position by position. E.g. 0,2,1,3.",
                        it: "Indici di elementi separati da virgola, letti posizione per posizione. Es.: 0,2,1,3." },
    // patchwork — raboutage bord à bord de N pièces de même taille en mosaïque
    panel_assembly:   { fr: "Patchwork",                       en: "Patchwork",                      it: "Patchwork" },
    cb_assembly:      { fr: "Activer le patchwork (objets sélectionnés, bord à bord)",
                        en: "Enable patchwork (selected objects, edge to edge)",
                        it: "Attiva il patchwork (oggetti selezionati, bordo a bordo)" },
    tip_assembly:     { fr: "Empile les objets SÉLECTIONNÉS (même taille) au même point, puis rogne chacun sur une cellule de la grille (1er = haut-gauche, puis ligne par ligne). Les cadres se recombinent en une seule image. Cellules jointives, grille centrée en bas de la page.",
                        en: "Stacks the SELECTED objects (same size) at the same spot, then crops each to one grid cell (1st = top-left, then row by row). The frames recombine into one image. Flush cells, grid centered at the bottom of the page.",
                        it: "Sovrappone gli oggetti SELEZIONATI (stessa dimensione) nello stesso punto, poi ritaglia ciascuno su una cella della griglia (1° = alto-sinistra, poi riga per riga). I riquadri si ricombinano in un'unica immagine. Celle unite, griglia centrata in basso nella pagina." },
    lbl_assemblycols: { fr: "Colonnes du patchwork :",          en: "Patchwork columns:",             it: "Colonne del patchwork:" },
    tip_assemblycols: { fr: "Nombre de colonnes de la mosaïque. Les pièces remplissent ligne par ligne. Ex. 4 pièces en 2 colonnes = grille 2×2.",
                        en: "Number of columns in the mosaic. Pieces fill row by row. E.g. 4 pieces in 2 columns = a 2×2 grid.",
                        it: "Numero di colonne del mosaico. I pezzi riempiono riga per riga. Es. 4 pezzi in 2 colonne = griglia 2×2." },
    alert_assembly_nosel: { fr: "Patchwork : sélectionnez au moins 2 objets avant de lancer.",
                        en: "Patchwork: select at least 2 objects before running.",
                        it: "Patchwork: seleziona almeno 2 oggetti prima di avviare." },
    // fenêtre Réglages
    panel_ui:         { fr: "Personnalisation de l'interface", en: "Interface customization",        it: "Personalizzazione dell'interfaccia" },
    cb_prevtransp:    { fr: "Fond de l'aperçu transparent",    en: "Transparent preview background", it: "Sfondo anteprima trasparente" },
    tip_prevtransp:   { fr: "Retire le fond foncé de l'aperçu.",
                        en: "Removes the dark preview background.",
                        it: "Rimuove lo sfondo scuro dell'anteprima." },
    cb_showdims:      { fr: "Afficher les cotes dans l'aperçu",
                        en: "Show dimensions in preview",
                        it: "Mostra le quote nell'anteprima" },
    tip_showdims:     { fr: "Trace les dimensions (l × h) et les lignes de cote dans l'aperçu.",
                        en: "Draws dimensions (w × h) and dimension lines in the preview.",
                        it: "Disegna le quote (l × a) e le linee di quota nell'anteprima." },
    panel_advanced:   { fr: "Taille des mires et des pastilles", en: "Size of marks and swatches",   it: "Dimensione di mire e tacche" },
    // V2 — le multiplicateur devient un DIAMÈTRE EN MM, borné à 4.
    lbl_regdiam:      { fr: "Diamètre des mires (mm, max 4) :",
                        en: "Registration mark diameter (mm, max 4):",
                        it: "Diametro delle mire (mm, max 4):" },
    tip_regdiam:      { fr: "Diamètre des mires de calage, en millimètres. Plafonné à 4 mm : au-delà, une mire cesse d'être un point de visée et devient un objet graphique qui déborde des marges. Remplace l'ancien multiplicateur « × longueur de repère », devenu sans effet une fois le plafond appliqué.",
                        en: "Diameter of registration marks, in millimetres. Capped at 4 mm: beyond that a mark stops being an aiming point and becomes a graphic object that overflows the margins. Replaces the former \"× mark length\" multiplier, which had no effect once the cap applied.",
                        it: "Diametro delle mire di registro, in millimetri. Limitato a 4 mm: oltre, una mira smette di essere un punto di mira e diventa un oggetto grafico che deborda dai margini. Sostituisce il precedente moltiplicatore « × lunghezza crocino », divenuto ininfluente una volta applicato il limite." },
    tip_centermult:   { fr: "Taille des mires de centre et de bord (× longueur). Défaut 2.4.",
                        en: "Size of center and edge marks (× length). Default 2.4.",
                        it: "Dimensione mire centro e bordo (× lunghezza). Default 2.4." },
    lbl_crossgap:     { fr: "Marge d'angle (mm) :",            en: "Corner clearance (mm):",         it: "Margine angolare (mm):" },
    tip_crossgap:     { fr: "Distance libre près des coins pour les croix de bord. Défaut 6 mm.",
                        en: "Free distance near corners for side crosses. Default 6 mm.",
                        it: "Distanza libera vicino agli angoli per le croci laterali. Default 6 mm." },
    lbl_colsq:        { fr: "Carré couleur (mm) :",            en: "Color square (mm):",             it: "Quadrato colore (mm):" },
    lbl_colbarw:      { fr: "Rectangle couleur — larg. (mm) :",en: "Color rect. — width (mm):",     it: "Rettangolo colore — larg. (mm):" },
    lbl_colbarh:      { fr: "Rectangle couleur — haut. (mm) :",en: "Color rect. — height (mm):",    it: "Rettangolo colore — alt. (mm):" },
    // labels supplémentaires V5
    cb_pagecross2:    { fr: "    ↳ Croix centrale",             en: "    ↳ Center cross",              it: "    ↳ Croce centrale" },
    lbl_gapH2:        { fr: "Horizontal (mm) :",               en: "Horizontal (mm):",                it: "Orizzontale (mm):" },
    // V2 — en mode Livret, ce MÊME champ sert de gouttière centrale : le
    //   moteur (addBookletImposition) lit gapH comme l'écart entre les deux
    //   pages du couple, pas comme un espacement de grille.
    lbl_gutter:       { fr: "Gouttière centrale (mm) :",       en: "Center gutter (mm):",             it: "Margine interno centrale (mm):" },
    tip_gutter:       { fr: "Écart entre les deux pages du couple, à l'endroit du pli. C'est le même champ que l'espacement horizontal, mais en imposition de livret le moteur s'en sert comme gouttière.",
                        en: "Gap between the two pages of the pair, at the fold. It is the same field as horizontal spacing, but in booklet imposition the engine uses it as the gutter.",
                        it: "Distanza tra le due pagine della coppia, in corrispondenza della piega. È lo stesso campo della spaziatura orizzontale, ma nell'imposizione a libretto il motore lo usa come margine interno." },
    lbl_gapV2:        { fr: "Vertical (mm) :",                 en: "Vertical (mm):",                  it: "Verticale (mm):" },
    btn_gap_auto:     { fr: "Auto (remplir la page)",          en: "Auto (fill the page)",            it: "Auto (riempi la pagina)" },
    tip_gap_auto:     { fr: "Place le MAXIMUM de pièces dans la zone utile, avec une marge de 3 mm tout autour pour que les pièces ne touchent pas les bords. L'espacement entre pièces est réparti uniformément.",
                        en: "Fits the MAXIMUM number of pieces in the usable area, keeping a 3 mm margin all around so pieces don't touch the edges. Spacing between pieces is spread evenly.",
                        it: "Inserisce il MASSIMO numero di pezzi nell'area utile, con un margine di 3 mm tutt'intorno affinché i pezzi non tocchino i bordi. La spaziatura tra i pezzi è distribuita uniformemente." },
    alert_gap_auto_nofit: { fr: "Impossible de calculer l'espacement automatique (grille non calculable).",
                        en: "Cannot compute automatic spacing (grid not computable).",
                        it: "Impossibile calcolare la spaziatura automatica (griglia non calcolabile)." },
    lbl_ppreorder:    { fr: "Réordonner :",                    en: "Reorder:",                        it: "Riordinare:" },
    lbl_ppclone:      { fr: "Cloner tout ×N :",                en: "Clone all ×N:",                   it: "Clona tutto ×N:" },
    lbl_ppdel:        { fr: "Supprimer page n° :",             en: "Delete page #:",                  it: "Elimina pagina n°:" },
    cb_duplex2:       { fr: "Générer le verso",                en: "Generate the back side",          it: "Genera il retro" },

    // ── V2 — ergonomie ────────────────────────────────────────────────
    // Onglets regroupés par tâche
    tab_geom:         { fr: "Marges",                         en: "Margins",                         it: "Margini" },
    tab_marks2:       { fr: "Repères",                        en: "Marks",                           it: "Crocini" },
    tab_compose:      { fr: "Composition",                    en: "Composition",                     it: "Composizione" },
    tab_duplex2:      { fr: "Recto/verso",                    en: "Front/back",                      it: "Fronte/retro" },
    // Bord de la pièce : exclusion fond perdu / blanc tournant rendue explicite
    panel_edge:       { fr: "Bord de la pièce",               en: "Piece edge",                      it: "Bordo del pezzo" },
    edge_none:        { fr: "Aucun (coupe au bord de la pièce)",
                        en: "None (cut at the piece edge)",
                        it: "Nessuno (taglio al bordo del pezzo)" },
    edge_bleed:       { fr: "Fond perdu (le visuel déborde la coupe)",
                        en: "Bleed (artwork runs past the cut)",
                        it: "Abbondanza (la grafica supera il taglio)" },
    edge_wm:          { fr: "Blanc tournant (marge autour du visuel)",
                        en: "Inner margin (border around the artwork)",
                        it: "Margine interno (bordo attorno alla grafica)" },
    tip_edge:         { fr: "Fond perdu et blanc tournant sont exclusifs : soit le visuel déborde le trait de coupe, soit une marge l'entoure. Choisir ici évite qu'un réglage en annule un autre sans prévenir.",
                        en: "Bleed and inner margin are mutually exclusive: either the artwork runs past the cut line, or a margin surrounds it. Choosing here avoids one setting silently cancelling the other.",
                        it: "Abbondanza e margine interno si escludono: o la grafica supera la linea di taglio, o un margine la circonda. Sceglierlo qui evita che un'impostazione ne annulli un'altra senza avviso." },
    // Barre d'état
    status_ready:     { fr: "Prêt — %N% pièces (%C% × %R%)",   en: "Ready — %N% pieces (%C% × %R%)",  it: "Pronto — %N% pezzi (%C% × %R%)" },
    status_nosel:     { fr: "Aucune sélection : sélectionnez la ou les pièces à imposer dans le document.",
                        en: "No selection: select the piece(s) to impose in the document.",
                        it: "Nessuna selezione: seleziona il pezzo o i pezzi da imporre nel documento." },
    status_nofit:     { fr: "La grille ne rentre pas dans la zone utile — réduisez l'espacement, le fond perdu ou la taille de la pièce.",
                        en: "The grid does not fit the usable area — reduce spacing, bleed or piece size.",
                        it: "La griglia non entra nell'area utile — riduci spaziatura, abbondanza o dimensione del pezzo." },
    status_modeadj:   { fr: "Mode %M% : %W% ajusté(s) automatiquement.",
                        en: "%M% mode: %W% adjusted automatically.",
                        it: "Modalità %M%: %W% regolati automaticamente." },
    adj_align:        { fr: "alignement",                     en: "alignment",                       it: "allineamento" },
    adj_stroke:       { fr: "épaisseur de trait",             en: "stroke weight",                   it: "spessore linea" },
    adj_gap:          { fr: "espacement",                     en: "spacing",                         it: "spaziatura" },
    adj_marks:        { fr: "repères de coupe",               en: "cut marks",                       it: "crocini di taglio" },
    // Aperçu
    btn_recenter:     { fr: "Recentrer",                      en: "Recenter",                        it: "Ricentra" },
    tip_recenter:     { fr: "Remet la vue au centre sans changer le zoom.",
                        en: "Puts the view back to center without changing the zoom.",
                        it: "Riporta la vista al centro senza cambiare lo zoom." },
    tip_previewpan:   { fr: "Glisser pour déplacer la vue, molette pour zoomer.",
                        en: "Drag to move the view, scroll to zoom.",
                        it: "Trascina per spostare la vista, rotella per zoomare." },
    // Presets
    lbl_presetsearch: { fr: "Rechercher :",                   en: "Search:",                         it: "Cerca:" },
    tip_presetsearch: { fr: "Filtre la liste au fil de la frappe. Un dossier reste visible si l'un de ses presets correspond.",
                        en: "Filters the list as you type. A folder stays visible if one of its presets matches.",
                        it: "Filtra l'elenco mentre digiti. Una cartella resta visibile se uno dei suoi preset corrisponde." },
    preset_nomatch:   { fr: "Aucun preset ne correspond.",    en: "No preset matches.",              it: "Nessun preset corrisponde." },
    // Pré-traitement : avertissement
    // V2 — CORRECTION D'UN AVERTISSEMENT FAUX. Il annonçait que ces réglages
    //   modifient le document. Vérification faite dans iwExecute : le plan de
    //   pages est bien calculé à partir d'eux (ppReorder / ppClone /
    //   ppDeletePage / ppDuplicatePage), puis la variable `plan` n'est JAMAIS
    //   relue — baseCfg ne la référence pas. Ces champs ne produisent donc
    //   rien du tout. Mieux vaut le dire que laisser croire à une suppression
    //   de pages qui n'a pas lieu.
    warn_preprocess:  { fr: "⚠ Ces réglages ne sont pas encore raccordés au moteur : le plan de pages est calculé puis ignoré. Ils n'ont aucun effet sur la planche produite.",
                        en: "⚠ These settings are not wired to the engine yet: the page plan is computed then discarded. They have no effect on the produced sheet.",
                        it: "⚠ Queste impostazioni non sono ancora collegate al motore: il piano pagine viene calcolato e poi ignorato. Non hanno alcun effetto sul foglio prodotto." },
    // Export des films — messages jusqu'ici en dur en français
    films_err_title:  { fr: "Export — erreur (%N%)",          en: "Export — error (%N%)",            it: "Esportazione — errore (%N%)" },
    films_err_intro:  { fr: "Message (copiez-le pour le signaler) :",
                        en: "Message (copy it to report the problem):",
                        it: "Messaggio (copialo per segnalare il problema):" },
    films_err_none:   { fr: "(aucun message capturé)",        en: "(no message captured)",           it: "(nessun messaggio catturato)" },
    btn_close:        { fr: "Fermer",                         en: "Close",                           it: "Chiudi" },
    films_crop_title: { fr: "Films exportés — croix peut-être coupées",
                        en: "Films exported — marks may be cut off",
                        it: "Pellicole esportate — crocini forse tagliati" },
    // ── V2 — TYPE DE DOCUMENT ─────────────────────────────────────────
    //  Le réglage de tête : il décide du mode d'imposition, des valeurs de
    //  départ et de ce qui reste affiché. Les modes techniques (N-Up,
    //  Cut & Stack, Dutch Cut…) ne sont plus demandés à l'utilisateur, sauf
    //  dans le type « Personnalisé ».
    lbl_doctype:      { fr: "Type de document",               en: "Document type",                   it: "Tipo di documento" },
    tip_doctype:      { fr: "Choisit l'imposition adaptée et n'affiche que les réglages qui concernent ce type de document. « Personnalisé » rend tous les modes et tous les panneaux accessibles.",
                        en: "Picks the right imposition and shows only the settings that concern this document type. \"Custom\" makes every mode and every panel available.",
                        it: "Sceglie l'imposizione adatta e mostra solo le impostazioni che riguardano questo tipo di documento. « Personalizzato » rende disponibili tutte le modalità e tutti i pannelli." },
    dt_card:          { fr: "Carte de visite",                en: "Business card",                   it: "Biglietto da visita" },
    dt_flyer:         { fr: "Flyer / carton",                 en: "Flyer / card",                    it: "Volantino / cartoncino" },
    dt_poster:        { fr: "Affiche",                        en: "Poster",                          it: "Manifesto" },
    dt_sticker:       { fr: "Sticker / étiquette",            en: "Sticker / label",                 it: "Adesivo / etichetta" },
    dt_zine:          { fr: "Fanzine / livret",               en: "Zine / booklet",                  it: "Fanzine / libretto" },
    dt_custom:        { fr: "Personnalisé",                   en: "Custom",                          it: "Personalizzato" },
    desc_dt_card:     { fr: "Grille de cartes identiques sur la feuille, fond perdu de 3 mm et repères de coupe sur chaque pose. Recto/verso disponible.",
                        en: "Grid of identical cards on the sheet, 3 mm bleed and cut marks on every placement. Front/back available.",
                        it: "Griglia di biglietti identici sul foglio, abbondanza di 3 mm e crocini di taglio su ogni posa. Fronte/retro disponibile." },
    desc_dt_flyer:    { fr: "Comme la carte de visite, à plus grand format : grille, fond perdu et repères de coupe, recto/verso possible.",
                        en: "Like the business card, at a larger size: grid, bleed and cut marks, front/back possible.",
                        it: "Come il biglietto da visita, in formato maggiore: griglia, abbondanza e crocini di taglio, fronte/retro possibile." },
    desc_dt_poster:   { fr: "Une seule pose centrée sur la feuille, avec fond perdu, mires de calage et marques couleurs — la répétition et le recto/verso ne s'appliquent pas.",
                        en: "A single placement centered on the sheet, with bleed, registration marks and color marks — repetition and front/back do not apply.",
                        it: "Una sola posa centrata sul foglio, con abbondanza, mire di registro e tacche colore — ripetizione e fronte/retro non si applicano." },
    desc_dt_sticker:  { fr: "Répétition régulière et serrée sur toute la feuille (Step & Repeat), avec un espacement de découpe entre les poses.",
                        en: "Tight, regular repetition across the whole sheet (Step & Repeat), with a cutting gap between placements.",
                        it: "Ripetizione regolare e fitta su tutto il foglio (Step & Repeat), con una spaziatura di taglio tra le pose." },
    desc_dt_zine:     { fr: "Imposition de livret : les pages sont appariées pour le pliage, avec décalage (creep) et verso en bord long.",
                        en: "Booklet imposition: pages are paired for folding, with creep and long-edge back side.",
                        it: "Imposizione a libretto: le pagine sono accoppiate per la piegatura, con creep e retro sul lato lungo." },
    desc_dt_custom:   { fr: "Tous les modes d'imposition et tous les panneaux sont accessibles, sans filtrage.",
                        en: "Every imposition mode and every panel is available, with no filtering.",
                        it: "Tutte le modalità di imposizione e tutti i pannelli sono disponibili, senza filtro." },
    dt_na:            { fr: "Sans objet pour ce type de document.",
                        en: "Not applicable to this document type.",
                        it: "Non pertinente per questo tipo di documento." },
    dt_reset:         { fr: "Valeurs du type",                en: "Type defaults",                   it: "Valori del tipo" },
    status_dtapplied: { fr: "Valeurs de départ « %T% » appliquées.",
                        en: "\"%T%\" starting values applied.",
                        it: "Valori iniziali « %T% » applicati." },
    tip_dt_reset:     { fr: "Rétablit les valeurs de départ de ce type de document (imposition, fond perdu, repères). Vos presets ne sont pas touchés.",
                        en: "Restores this document type's starting values (imposition, bleed, marks). Your presets are untouched.",
                        it: "Ripristina i valori iniziali di questo tipo di documento (imposizione, abbondanza, crocini). I tuoi preset non vengono toccati." },

    films_crop_body:  { fr: "L'imprimante PDF a IGNORÉ le format sur-mesure : le PDF est sorti à un format standard plus petit que la planche, donc les croix de coin sont coupées.\n\nÀ FAIRE (une seule fois) dans le pilote « Print to PDF » :\n  • réglez le format papier sur « Personnalisé / Sans bordure »,\n  • OU passez par « Export PDF natif (sans imprimante) ».\n\nDiagnostic : %D%",
                        en: "The PDF printer IGNORED the custom paper size: the PDF came out at a standard size smaller than the sheet, so the corner marks are cut off.\n\nTO DO (once) in the \"Print to PDF\" driver:\n  • set the paper size to \"Custom / Borderless\",\n  • OR use \"Native PDF export (no printer)\".\n\nDiagnostic: %D%",
                        it: "La stampante PDF ha IGNORATO il formato su misura: il PDF è uscito in un formato standard più piccolo del foglio, quindi i crocini d'angolo sono tagliati.\n\nDA FARE (una sola volta) nel driver « Print to PDF »:\n  • imposta il formato carta su « Personalizzato / Senza bordi »,\n  • OPPURE usa « Esportazione PDF nativa (senza stampante) ».\n\nDiagnostica: %D%" }
};

// langue courante (chargée au démarrage)
IW.lang = iwLoadLang();

// t(key, replacements?) : chaîne traduite. replacements = {N: 12} -> %N%
function tr(key, repl) {
    var entry = I18N[key];
    var s;
    if (!entry) s = key; // clé inconnue : on renvoie la clé brute (debug)
    else s = entry[IW.lang] || entry.fr || key;
    if (repl) {
        for (var k in repl) {
            if (repl.hasOwnProperty(k)) {
                s = s.replace(new RegExp("%" + k + "%", "g"), String(repl[k]));
            }
        }
    }
    return s;
}


// ─────────────────────────────────────────────────────────────────────
//  [B] PRESETS  — sauvegarde / chargement des configurations complètes
// ─────────────────────────────────────────────────────────────────────

// createPreset(name, configObj) : écrit un fichier JSON dans presetFolder
function createPreset(name, configObj) {
    var fold = new Folder(IW.presetFolder);
    if (!fold.exists) fold.create();
    var f = new File(IW.presetFolder + "/" + sanitizeName(name) + IW.presetExt);
    f.encoding = "UTF-8";
    if (!f.open("w")) { Window.alert(tr("alert_writefail")); return false; }
    f.write(IWJSON.stringify(configObj));
    f.close();
    return true;
}

// loadPreset(name) : renvoie l'objet config ou null
function loadPreset(name) {
    var f = new File(IW.presetFolder + "/" + sanitizeName(name) + IW.presetExt);
    if (!f.exists) return null;
    f.encoding = "UTF-8";
    if (!f.open("r")) return null;
    var txt = f.read();
    f.close();
    try { return IWJSON.parse(txt); } catch (e) { return null; }
}

// listPresets() : tableau des noms disponibles (hors fichiers système)
function listPresets() {
    var fold = new Folder(IW.presetFolder);
    if (!fold.exists) return [];
    var files = fold.getFiles("*" + IW.presetExt);
    // fichiers internes à NE PAS afficher comme presets
    var SYSTEM = { "last-session": true, "prefs": true, "_meta": true, "_starred": true };
    var names = [];
    for (var i = 0; i < files.length; i++) {
        var n = decodeURI(files[i].name).replace(IW.presetExt, "");
        // exclut les fichiers système et tout nom commençant par "_"
        if (SYSTEM[n]) continue;
        if (n.charAt(0) === "_") continue;
        names.push(n);
    }
    return names;
}

function deletePreset(name) {
    var f = new File(IW.presetFolder + "/" + sanitizeName(name) + IW.presetExt);
    var ok = false;
    if (f.exists) ok = f.remove();
    try { iwRemovePresetMeta(name); } catch (eRM) {}   // V10 — purge les métadonnées
    return ok;
}

function sanitizeName(n) {
    return String(n).replace(/[\/\\:*?"<>|]/g, "_");
}

// ── PRESET PAR DÉFAUT (étoile) ───────────────────────────────────────
//   Un seul preset peut être marqué par défaut : son nom est mémorisé dans
//   un petit fichier. Étoiler un autre preset remplace le précédent.
function iwStarFile() { return new File(IW.presetFolder + "/_starred.txt"); }
function iwLoadStarPreset() {
    try {
        var f = iwStarFile();
        if (!f.exists) return "";
        f.encoding = "UTF-8";
        if (!f.open("r")) return "";
        var txt = f.read(); f.close();
        return (txt || "").replace(/^\s+|\s+$/g, "");
    } catch (e) { return ""; }
}
function iwSaveStarPreset(name) {
    try {
        var fold = new Folder(IW.presetFolder);
        if (!fold.exists) fold.create();
        var f = iwStarFile();
        f.encoding = "UTF-8";
        if (f.open("w")) { f.write(name || ""); f.close(); }
        return true;
    } catch (e) { return false; }
}
// Étoile/désétoile : si le nom est déjà l'étoilé, on retire ; sinon on
// remplace (désactive automatiquement le précédent).
function iwToggleStarPreset(name) {
    var cur = iwLoadStarPreset();
    if (cur === name) { iwSaveStarPreset(""); return ""; }
    iwSaveStarPreset(name); return name;
}

// ── MÉTADONNÉES DES PRESETS (V10) ────────────────────────────────────
//   Couleur + dossier de chaque preset, stockés dans UN SEUL fichier
//   d'index (_meta.iwjson) pour ne PAS toucher aux fichiers de preset
//   eux-mêmes. Structure : { presets: { "Nom": { color: "#RRGGBB"|"",
//   folder: "NomDossier"|"" } }, folders: [ "Dossier1", ... ] }.
//   `folders` mémorise aussi les dossiers VIDES (sinon ils disparaîtraient).
function iwMetaFile() { return new File(IW.presetFolder + "/_meta.iwjson"); }
function iwLoadPresetMeta() {
    var def = { presets: {}, folders: [], folderColors: {} };
    try {
        var f = iwMetaFile();
        if (!f.exists) return def;
        f.encoding = "UTF-8";
        if (!f.open("r")) return def;
        var txt = f.read(); f.close();
        var o = IWJSON.parse(txt);
        if (!o) return def;
        if (!o.presets) o.presets = {};
        if (!o.folders) o.folders = [];
        if (!o.folderColors) o.folderColors = {};
        return o;
    } catch (e) { return def; }
}
function iwSavePresetMeta(meta) {
    try {
        var fold = new Folder(IW.presetFolder);
        if (!fold.exists) fold.create();
        var f = iwMetaFile();
        f.encoding = "UTF-8";
        if (f.open("w")) { f.write(IWJSON.stringify(meta)); f.close(); }
        return true;
    } catch (e) { return false; }
}
// Renvoie {color, folder} pour un preset (valeurs par défaut si absent).
function iwGetPresetMeta(name) {
    var m = iwLoadPresetMeta();
    var e = m.presets[name];
    return { color: (e && e.color) ? e.color : "", folder: (e && e.folder) ? e.folder : "" };
}
function iwSetPresetColor(name, color) {
    var m = iwLoadPresetMeta();
    if (!m.presets[name]) m.presets[name] = { color: "", folder: "" };
    m.presets[name].color = color || "";
    iwSavePresetMeta(m);
}
function iwSetPresetFolder(name, folder) {
    var m = iwLoadPresetMeta();
    if (!m.presets[name]) m.presets[name] = { color: "", folder: "" };
    m.presets[name].folder = folder || "";
    // s'assure que le dossier figure dans la liste connue
    if (folder) {
        var has = false;
        for (var i = 0; i < m.folders.length; i++) if (m.folders[i] === folder) has = true;
        if (!has) m.folders.push(folder);
    }
    iwSavePresetMeta(m);
}
function iwListFolders() {
    var m = iwLoadPresetMeta();
    // dossiers déclarés + dossiers réellement référencés par un preset
    var seen = {}, out = [];
    for (var i = 0; i < m.folders.length; i++) { if (m.folders[i] && !seen[m.folders[i]]) { seen[m.folders[i]] = true; out.push(m.folders[i]); } }
    for (var k in m.presets) { if (m.presets.hasOwnProperty(k)) { var fo = m.presets[k].folder; if (fo && !seen[fo]) { seen[fo] = true; out.push(fo); } } }
    out.sort();
    return out;
}
function iwAddFolder(folder) {
    if (!folder) return;
    var m = iwLoadPresetMeta();
    var has = false;
    for (var i = 0; i < m.folders.length; i++) if (m.folders[i] === folder) has = true;
    if (!has) { m.folders.push(folder); iwSavePresetMeta(m); }
}
// nettoie les métadonnées d'un preset supprimé
function iwRemovePresetMeta(name) {
    var m = iwLoadPresetMeta();
    if (m.presets[name]) { delete m.presets[name]; iwSavePresetMeta(m); }
}

// ── COULEUR DE DOSSIER (V11) ─────────────────────────────────────────
//   Stockée dans un sous-objet meta.folderColors = { "Dossier": "#RRGGBB" }.
//   Indépendant de la liste meta.folders (qui reste le registre des noms).
function iwGetFolderColor(folder) {
    if (!folder) return "";
    var m = iwLoadPresetMeta();
    if (m.folderColors && m.folderColors[folder]) return m.folderColors[folder];
    return "";
}
function iwSetFolderColor(folder, color) {
    if (!folder) return;
    var m = iwLoadPresetMeta();
    if (!m.folderColors) m.folderColors = {};
    m.folderColors[folder] = color || "";
    // garantit que le dossier figure dans le registre des noms
    var has = false;
    for (var i = 0; i < m.folders.length; i++) if (m.folders[i] === folder) has = true;
    if (!has) m.folders.push(folder);
    iwSavePresetMeta(m);
}
// Supprime un DOSSIER (V12). Les presets qu'il contenait ne sont PAS effacés :
// ils sont remis à la RACINE (leur champ folder repasse à ""). Le nom du
// dossier et sa couleur sont retirés des métadonnées.
function iwRemoveFolder(folder) {
    if (!folder) return;
    var m = iwLoadPresetMeta();
    // sort les presets de ce dossier vers la racine
    for (var k in m.presets) {
        if (m.presets.hasOwnProperty(k) && m.presets[k].folder === folder) {
            m.presets[k].folder = "";
        }
    }
    // retire le nom du registre
    var nf = [];
    for (var i = 0; i < m.folders.length; i++) if (m.folders[i] !== folder) nf.push(m.folders[i]);
    m.folders = nf;
    // retire sa couleur
    if (m.folderColors && m.folderColors[folder]) delete m.folderColors[folder];
    iwSavePresetMeta(m);
}
// ── HELPERS DE DESSIN — cercles (ScriptUI n'a pas de primitive ronde) ──
//   On approxime un cercle par un polygone régulier (24 segments). Utilisé
//   par les boutons ronds de rotation (V10).
function iwCirclePoints(cx, cy, r, n) {
    var pts = [];
    var step = (Math.PI * 2) / n;
    for (var i = 0; i < n; i++) {
        var a = i * step;
        pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    return pts;
}
function iwFillCircle(g, cx, cy, r, rgba) {
    var pts = iwCirclePoints(cx, cy, r, 24);
    g.newPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.closePath();
    g.fillPath(g.newBrush(g.BrushType.SOLID_COLOR, rgba));
}
function iwStrokeCircle(g, cx, cy, r, rgba, w) {
    var pts = iwCirclePoints(cx, cy, r, 24);
    g.newPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.closePath();
    g.strokePath(g.newPen(g.PenType.SOLID_COLOR, rgba, w || 1));
}

// ─────────────────────────────────────────────────────────────────────
//  V2 — RECTANGLES À COINS ARRONDIS.
//  La bibliothèque graphique de ScriptUI se limite à moveTo / lineTo /
//  rectPath / ellipsePath : ni arc, ni courbe de Bézier, et aucun rayon de
//  bordure. Un coin arrondi doit donc être POLYGONALISÉ — quelques segments
//  par quart de cercle, comme le fait déjà iwCirclePoints pour les mires.
//  À 4 segments par coin le rendu est déjà lisse aux rayons employés ici.
//
//  À noter : cela n'arrondit que ce que NOUS dessinons. Les contrôles natifs
//  (boutons, listes déroulantes, cases à cocher, listbox) sont rendus par le
//  système et gardent leurs angles — ScriptUI n'expose aucun moyen de les
//  redessiner.
// ─────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────
//  V2 — DIAMÈTRE MAXIMAL D'UNE MIRE DE REPÉRAGE : 4 mm.
//  La taille était le produit « longueur de repère × multiplicateur », soit
//  7 × 2,4 = 16,8 mm par défaut — une mire plus large qu'un repère de coupe
//  n'est plus une mire, elle devient un objet graphique qui écrase la
//  planche et déborde des marges. En calage riso/sérigraphie, une mire se
//  vise au centre : au-delà de quelques millimètres elle perd en précision
//  au lieu d'en gagner.
//  Le plafond s'applique au MOTEUR et à l'APERÇU par la même fonction, pour
//  que ce qui est dessiné soit ce qui sera posé.
// ─────────────────────────────────────────────────────────────────────
var IW_REG_MAX_MM = 4;   // diamètre maximal d'une mire, en millimètres

function iwRegDiam(mm) {
    var d = parseFloat(mm);
    if (!isFinite(d) || d <= 0) d = IW_REG_MAX_MM;
    if (d > IW_REG_MAX_MM) d = IW_REG_MAX_MM;
    if (d < 1) d = 1;
    return d;
}

var IW_ROUND_SEG = 4;   // segments par quart de cercle

function iwRoundRectPts(x, y, w, h, r) {
    // rayon borné à la demi-plus-petite-dimension, sinon les coins se croisent
    var mx = Math.min(w, h) / 2;
    if (!(r > 0)) r = 0;
    if (r > mx) r = mx;
    if (r <= 0.5) return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];

    var pts = [], i, a;
    var half = Math.PI / 2, step = half / IW_ROUND_SEG;
    // centres des quatre arcs, dans l'ordre : HG, HD, BD, BG
    var arcs = [
        { cx: x + r,     cy: y + r,     a0: Math.PI },
        { cx: x + w - r, cy: y + r,     a0: -half   },
        { cx: x + w - r, cy: y + h - r, a0: 0       },
        { cx: x + r,     cy: y + h - r, a0: half    }
    ];
    for (var k = 0; k < 4; k++) {
        for (i = 0; i <= IW_ROUND_SEG; i++) {
            a = arcs[k].a0 + i * step;
            pts.push([arcs[k].cx + Math.cos(a) * r, arcs[k].cy + Math.sin(a) * r]);
        }
    }
    return pts;
}
function iwRoundPath(g, x, y, w, h, r) {
    var pts = iwRoundRectPts(x, y, w, h, r);
    g.newPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.closePath();
    return pts.length;
}
function iwFillRound(g, x, y, w, h, r, rgba) {
    iwRoundPath(g, x, y, w, h, r);
    g.fillPath(g.newBrush(g.BrushType.SOLID_COLOR, rgba));
}
function iwStrokeRound(g, x, y, w, h, r, rgba, lw) {
    iwRoundPath(g, x, y, w, h, r);
    g.strokePath(g.newPen(g.PenType.SOLID_COLOR, rgba, lw || 1));
}

// convertit "#RRGGBB" -> [r,g,b] (0..1) pour ScriptUI ; null si invalide
function iwHexToRGB01(hex) {
    if (!hex) return null;
    var s = String(hex).replace(/^#/, "");
    if (s.length !== 6) return null;
    var r = parseInt(s.substring(0, 2), 16);
    var g = parseInt(s.substring(2, 4), 16);
    var b = parseInt(s.substring(4, 6), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return [r / 255, g / 255, b / 255];
}
// convertit "#RRGGBB" -> [r,g,b] (0..255) ; null si invalide
function iwHexToRGB255(hex) {
    var c = iwHexToRGB01(hex);
    if (!c) return null;
    return [Math.round(c[0] * 255), Math.round(c[1] * 255), Math.round(c[2] * 255)];
}

// ── MINI-ENCODEUR PNG (V10) ──────────────────────────────────────────
//   Sert à fabriquer de petites PASTILLES de couleur (icônes) placées
//   devant le nom dans la liste des presets. ScriptUI ne sait pas colorer
//   le texte d'un listbox ; en revanche il sait afficher une IMAGE par
//   item. On génère donc un PNG uni par couleur (mis en cache disque).
//   PNG : 8 bits, RGBA, une seule image IDAT en bloc "stored" (zlib non
//   compressé) — suffisant pour 16×16 px et parfaitement standard.
var IW_CRC_TABLE = (function () {
    var c, table = [];
    for (var n = 0; n < 256; n++) { c = n; for (var k = 0; k < 8; k++) { c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); } table[n] = c >>> 0; }
    return table;
})();
function iwCRC32(bytes) {
    var c = 0xFFFFFFFF;
    for (var i = 0; i < bytes.length; i++) c = IW_CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
}
function iwAdler32(bytes) {
    var a = 1, b = 0;
    for (var i = 0; i < bytes.length; i++) { a = (a + bytes[i]) % 65521; b = (b + a) % 65521; }
    return ((b << 16) | a) >>> 0;
}
function iwU32(n) { return [(n >>> 24) & 0xFF, (n >>> 16) & 0xFF, (n >>> 8) & 0xFF, n & 0xFF]; }
function iwPngChunk(type, data) {
    var len = iwU32(data.length);
    var tb = [type.charCodeAt(0), type.charCodeAt(1), type.charCodeAt(2), type.charCodeAt(3)];
    var crc = iwU32(iwCRC32(tb.concat(data)));
    return len.concat(tb).concat(data).concat(crc);
}
function iwZlibStore(raw) {
    var out = [0x78, 0x01, 0x01];   // CMF, FLG, (BFINAL=1,BTYPE=00)
    var len = raw.length;
    out.push(len & 0xFF, (len >> 8) & 0xFF, (~len) & 0xFF, ((~len) >> 8) & 0xFF);
    for (var i = 0; i < raw.length; i++) out.push(raw[i]);
    return out.concat(iwU32(iwAdler32(raw)));
}
// renvoie un tableau d'octets PNG : carré plein RGBA, avec un léger bord foncé
function iwPngSolidDot(size, r, g, b) {
    var raw = [];
    var edge = 1; // épaisseur du bord
    for (var y = 0; y < size; y++) {
        raw.push(0); // filtre 0 (None)
        for (var x = 0; x < size; x++) {
            var isEdge = (x < edge || y < edge || x >= size - edge || y >= size - edge);
            // coins transparents -> aspect arrondi/pastille
            var dxe = (x < size / 2) ? x : (size - 1 - x);
            var dye = (y < size / 2) ? y : (size - 1 - y);
            var corner = (dxe + dye) < 1;  // retire juste les 4 pixels de coin
            if (corner) { raw.push(0, 0, 0, 0); }
            else if (isEdge) { raw.push(Math.round(r * 0.55), Math.round(g * 0.55), Math.round(b * 0.55), 255); }
            else { raw.push(r, g, b, 255); }
        }
    }
    var sig = [137, 80, 78, 71, 13, 10, 26, 10];
    var ihdr = iwU32(size).concat(iwU32(size)).concat([8, 6, 0, 0, 0]); // 8-bit RGBA
    return sig
        .concat(iwPngChunk("IHDR", ihdr))
        .concat(iwPngChunk("IDAT", iwZlibStore(raw)))
        .concat(iwPngChunk("IEND", []));
}
// écrit (si nécessaire) le PNG de pastille pour une couleur hex et renvoie
// le File correspondant, ou null. Fichiers mis en cache sous le dossier presets.
function iwColorDotFile(hex) {
    var rgb = iwHexToRGB255(hex);
    if (!rgb) return null;
    try {
        var fold = new Folder(IW.presetFolder + "/_dots");
        if (!fold.exists) fold.create();
        var safe = String(hex).replace(/[^0-9A-Fa-f]/g, "");
        var f = new File(fold.fsName + "/dot_" + safe + ".png");
        if (!f.exists) {
            var bytes = iwPngSolidDot(14, rgb[0], rgb[1], rgb[2]);
            f.encoding = "BINARY";
            if (!f.open("w")) return null;
            var s = "";
            for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i] & 0xFF);
            f.write(s);
            f.close();
        }
        return f;
    } catch (e) { return null; }
}


// ─────────────────────────────────────────────────────────────────────
//  [C] PREPROCESSORS — manipulent l'ordre des pages AVANT imposition
//  On travaille sur un "plan" : tableau d'index de pages source (1-based).
//  Ces fonctions renvoient un nouveau plan, sans toucher au document tant
//  que applyPagePlan() n'est pas appelé (pour les opérations destructives).
// ─────────────────────────────────────────────────────────────────────

// buildDefaultPlan(doc) : [1,2,3,...,n]
function buildDefaultPlan(doc) {
    var p = [];
    for (var i = 1; i <= doc.pages.length; i++) p.push(i);
    return p;
}

// ppReorder(plan, newOrderArray) : réordonne selon une liste d'index
function ppReorder(plan, newOrderArray) {
    var out = [];
    for (var i = 0; i < newOrderArray.length; i++) {
        var idx = newOrderArray[i] - 1;
        if (idx >= 0 && idx < plan.length) out.push(plan[idx]);
    }
    return out;
}

// ppClone(plan, times) : répète tout le plan N fois (clonage global)
function ppClone(plan, times) {
    var out = [];
    for (var t = 0; t < times; t++)
        for (var i = 0; i < plan.length; i++) out.push(plan[i]);
    return out;
}

// ppDuplicatePage(plan, pageNum, times) : duplique une page précise
function ppDuplicatePage(plan, pageNum, times) {
    var out = [];
    for (var i = 0; i < plan.length; i++) {
        out.push(plan[i]);
        if (plan[i] === pageNum)
            for (var t = 0; t < times; t++) out.push(pageNum);
    }
    return out;
}

// ppDeletePage(plan, pageNum) : retire toutes les occurrences d'une page
function ppDeletePage(plan, pageNum) {
    var out = [];
    for (var i = 0; i < plan.length; i++)
        if (plan[i] !== pageNum) out.push(plan[i]);
    return out;
}

// ppInsertBlank(plan, atPos) : insère un blanc (index 0 = page vide)
function ppInsertBlank(plan, atPos) {
    var out = plan.slice(0);
    out.splice(atPos, 0, 0); // 0 = blanc
    return out;
}


// ─────────────────────────────────────────────────────────────────────
//  [D] MODES D'IMPOSITION
//
//  Convention commune à tous les modes :
//    cfg = {
//       page:        page InDesign cible (objet),
//       slotW, slotH:  taille d'un emplacement en mm (= taille pièce, logique v1),
//       rows, cols:   grille,
//       gapH, gapV:   espacements mm,
//       originTop, originLeft: coin haut-gauche de la zone en mm,
//       layer:        calque destination,
//       items:        tableau d'objets sources à placer (1+),
//       bleed:        fond perdu mm
//    }
//
//  Chaque fonction renvoie un tableau {obj, slotBounds:[t,l,b,r], pageIndex}
//  pour que addMarks() puisse poser les repères ensuite.
// ─────────────────────────────────────────────────────────────────────

// Place une copie d'un objet source dans un slot donné. Helper commun.
//  Logique v1 : le slot = la pièce nue, donc la pièce est posée pile sur
//  le coin haut-gauche du slot (aucun décalage de fond perdu).
//  rotate (optionnel) : angle en degrés ; après rotation l'objet est
//  repositionné pour recaler sa boîte dans le slot (le pivot InDesign par
//  défaut est le centre, ce qui décalerait sinon l'objet).
function iwPlaceCopy(src, targetPage, slotTop, slotLeft, layer, inset, rotate, fitW, fitH, wm) {
    inset = inset || 0; // conservé pour compat, vaut 0 en logique v1
    // — BLANC TOURNANT (marge blanche interne, par pièce) —
    //   wm = { top, bottom, left, right } en mm. Si une marge est présente,
    //   l'image est mise à l'échelle dans le rectangle RÉDUIT (slot - marges,
    //   fitW/fitH déjà réduits par l'appelant) puis CENTRÉE dedans -> liseré
    //   blanc régulier. Sans wm : comportement v1 (calage coin haut-gauche).
    var hasWM = !!(wm && (((wm.top||0)>0)||((wm.bottom||0)>0)||((wm.left||0)>0)||((wm.right||0)>0)));
    var wmT = hasWM ? (wm.top||0)    : 0;
    var wmB = hasWM ? (wm.bottom||0) : 0;
    var wmL = hasWM ? (wm.left||0)   : 0;
    var wmR = hasWM ? (wm.right||0)  : 0;

    // V20 — le FOND coloré du blanc tournant est désormais créé APRÈS le
    //   placement de l'image (voir plus bas), pour épouser EXACTEMENT l'image
    //   mise à l'échelle + la marge demandée. Avant, il remplissait tout le
    //   SLOT : quand l'image (ratio conservé) ne remplissait pas le rectangle
    //   réduit, un liseré blanc/coloré INÉGAL subsistait sur deux côtés
    //   (« blanc tournant toujours présent »). On mémorise juste la nuance ici.

    var copy = src.duplicate(targetPage);
    copy.itemLayer = layer;

    // — Redimensionnement proportionnel optionnel —
    //   Si fitW/fitH sont fournis, on met la copie à l'échelle (ratio
    //   conservé) pour qu'elle remplisse au mieux la taille de slot visée,
    //   puis on la recale sur le coin haut-gauche du slot.
    if (fitW && fitH) {
        // Quand la pièce sera tournée d'un quart de tour (90/270), sa largeur
        // et sa hauteur sont ÉCHANGÉES après rotation. Le slot visé (fitW×fitH)
        // correspond déjà à la pièce TOURNÉE ; or on met à l'échelle la copie
        // NON encore tournée. Il faut donc comparer fitW à la hauteur courante
        // et fitH à la largeur courante, sinon une pièce non carrée est réduite
        // à tort (ex. 10:1 -> facteur 0,1 = image 10× trop petite).
        var _rq = ((rotate || 0) % 360 + 360) % 360;
        var _swapWH = (_rq === 90 || _rq === 270);
        try {
            var cb0 = copy.geometricBounds;
            var curW = cb0[3] - cb0[1], curH = cb0[2] - cb0[0];
            if (curW > 0 && curH > 0) {
                var f = _swapWH ? Math.min(fitW / curH, fitH / curW)
                                : Math.min(fitW / curW, fitH / curH);
                if (isFinite(f) && f > 0 && Math.abs(f - 1) > 0.0001) {
                    // transform() avec une matrice de mise à l'échelle :
                    // applique le scale à la géométrie réelle, donc au cadre
                    // ET à son contenu (image/texte), contrairement à resize()
                    // en INNER_COORDINATES qui peut laisser le contenu intact.
                    var m = app.transformationMatrices.add({
                        horizontalScaleFactor: f,
                        verticalScaleFactor: f
                    });
                    copy.transform(
                        CoordinateSpaces.PASTEBOARD_COORDINATES,
                        AnchorPoint.TOP_LEFT_ANCHOR,
                        m
                    );
                }
            }
        } catch (eR) {
            // repli : ancienne méthode resize si transform indisponible
            try {
                var cb1 = copy.geometricBounds;
                var cw = cb1[3] - cb1[1], ch = cb1[2] - cb1[0];
                var f2 = _swapWH ? Math.min(fitW / ch, fitH / cw)
                                 : Math.min(fitW / cw, fitH / ch);
                if (isFinite(f2) && f2 > 0 && Math.abs(f2 - 1) > 0.0001) {
                    copy.resize(
                        CoordinateSpaces.INNER_COORDINATES,
                        AnchorPoint.TOP_LEFT_ANCHOR,
                        ResizeMethods.MULTIPLYING_CURRENT_DIMENSIONS_BY,
                        [f2, f2]
                    );
                }
            } catch (eR2) {}
        }
    }

    // — Repositionnement —
    //   placeAt() : recale la pièce (déjà mise à l'échelle) dans son slot.
    //   Avec blanc tournant : centrée dans le rectangle réduit (fitW × fitH)
    //   ancré à (slotLeft+wmL, slotTop+wmT). Sans : coin haut-gauche (v1).
    function placeAt() {
        var bb = copy.geometricBounds;
        var imgW = bb[3] - bb[1], imgH = bb[2] - bb[0];
        var tgtLeft, tgtTop;
        if (hasWM) {
            var innerLeft = slotLeft + wmL, innerTop = slotTop + wmT;
            var innerW = (fitW && fitW > 0) ? fitW : imgW;
            var innerH = (fitH && fitH > 0) ? fitH : imgH;
            tgtLeft = innerLeft + (innerW - imgW) / 2;
            tgtTop  = innerTop  + (innerH - imgH) / 2;
        } else {
            tgtLeft = slotLeft + inset;
            tgtTop  = slotTop + inset;
        }
        copy.move(undefined, [tgtLeft - bb[1], tgtTop - bb[0]]);
    }
    placeAt();

    if (rotate) {
        // Rotation via matrice de transformation autour du CENTRE de la
        // pièce : retourne réellement le cadre ET son contenu (image/texte),
        // contrairement à `rotationAngle` qui dépend du point de référence
        // et peut ne rien retourner visuellement sur certains objets.
        var applied = false;
        try {
            var bb = copy.geometricBounds;
            var ccx = (bb[1] + bb[3]) / 2; // centre X (left+right)/2
            var ccy = (bb[0] + bb[2]) / 2; // centre Y (top+bottom)/2
            var rm = app.transformationMatrices.add({
                counterclockwiseRotationAngle: rotate
            });
            copy.transform(
                CoordinateSpaces.PASTEBOARD_COORDINATES,
                [ccx, ccy],                    // pivot = centre de la pièce
                rm
            );
            applied = true;
        } catch (e) {}
        // repli : ancienne méthode si transform indisponible
        if (!applied) {
            try {
                copy.rotationAngle = rotate;
            } catch (e2) {}
        }
        // recalage après rotation (la bbox garde la même taille à 180°,
        // et placeAt() recentre proprement dans le rectangle réduit).
        try {
            placeAt();
        } catch (e3) {}
    }

    // V20 — FOND DU BLANC TOURNANT : créé MAINTENANT (après mise à l'échelle,
    //   placement et rotation), dimensionné pour épouser EXACTEMENT l'image
    //   finale + la marge demandée. La marge visible vaut donc précisément
    //   wmT/wmB/wmL/wmR sur chaque côté, sans liseré inégal résiduel. Placé
    //   DERRIÈRE l'image pour rester dessous.
    if (hasWM && wm && wm.colorName) {
        try {
            var _doc2 = app.activeDocument;
            var _sw2 = _doc2.swatches.itemByName(wm.colorName);
            if (_sw2 && _sw2.isValid) {
                var fb = copy.geometricBounds;   // image finale
                var bg = targetPage.rectangles.add(layer);
                bg.geometricBounds = [fb[0] - wmT, fb[1] - wmL, fb[2] + wmB, fb[3] + wmR];
                bg.fillColor = _sw2;
                bg.strokeColor = _doc2.swatches.itemByName("None");
                try { bg.sendToBack(); } catch (eSB) {}
                try { copy.bringToFront(); } catch (eBF) {}
            }
        } catch (eBg2) {}
    }
    return copy;
}

// V20 — PLACEMENT EN MODE EXTÉRIEUR. La pièce garde sa TAILLE PLEINE et est
//   posée à (posTop, posLeft) (= coin du slot + marges extérieures haut/gauche).
//   La marge (fond perdu ou blanc tournant) est l'espace AUTOUR, dans le slot
//   agrandi ; la coupe reste au bord de la pièce. Si `wm` (blanc tournant
//   extérieur avec couleur) est fourni, on peint un fond coloré occupant tout
//   le SLOT (pièce + marges), derrière la pièce.
//   extL/extT/extR/extB = marges extérieures (mm) ; slotW/slotH = slot agrandi.
// V1 — MIROIR PASTEBOARD : réfléchit l'item autour de son CENTRE, en
//   coordonnées pasteboard (bounds inchangés, contenu inversé). Ancre par
//   ÉNUMÉRATION (CENTER_ANCHOR) : aucune coordonnée absolue, donc aucun
//   souci d'espace de coordonnées. Repli : flipItem (comme le duplex).
function iwMirrorPB(item, horiz) {
    try {
        var m = app.transformationMatrices.add(horiz
            ? { horizontalScaleFactor: -1 }
            : { verticalScaleFactor: -1 });
        item.transform(CoordinateSpaces.PASTEBOARD_COORDINATES, AnchorPoint.CENTER_ANCHOR, m);
        return true;
    } catch (eMi) {}
    try {
        item.flipItem(horiz ? Flip.HORIZONTAL_FLIP : Flip.VERTICAL_FLIP);
        return true;
    } catch (eMi2) {}
    return false;
}

// V1 — ROGNAGE d'une copie à une bande de fond perdu.
//   • Cadres (Rectangle/Oval/Polygon/TextFrame) : geometricBounds — le cadre
//     est réduit à la bande, le CONTENU ne bouge pas (même principe éprouvé
//     que le rognage par cellule du mode Patchwork).
//   • Groupes : geometricBounds les METTRAIT À L'ÉCHELLE (faux) -> rognage
//     par « Coller dedans » : un rectangle hôte de la taille de la bande est
//     créé, le groupe y est collé (cut + pasteInto, position conservée).
//     NB : cette voie utilise le presse-papiers.
//   Renvoie l'item rogné (l'hôte pour un groupe), ou null si échec (la
//   copie est alors supprimée : pas de bande plutôt qu'une bande fausse).
function iwCropToBand(item, band, targetPage, layer) {
    var isGroup = false;
    try { isGroup = (item.constructor.name === "Group"); } catch (eCg) {}
    if (!isGroup) {
        try { item.geometricBounds = band; return item; } catch (eCb) {}
    }
    // groupes (ou échec bounds) : Coller dedans
    try {
        var _doc2 = app.activeDocument;
        var host = targetPage.rectangles.add(layer);
        host.geometricBounds = band;
        try { host.fillColor = _doc2.swatches.itemByName("None"); } catch (eCf) {}
        try { host.strokeColor = _doc2.swatches.itemByName("None"); } catch (eCs) {}
        app.select(item); app.cut();
        app.select(host); app.pasteInto();
        return host;
    } catch (eCp) {
        try { if (item && item.isValid) item.remove(); } catch (eCr) {}
        return null;
    }
}

function iwPlaceCopyExt(src, targetPage, posTop, posLeft, layer, rotate, wm, extL, extT, extR, extB, slotW, slotH, bleedColorMode) {
    var _doc = app.activeDocument;
    var slotTop  = posTop  - (extT || 0);
    var slotLeft = posLeft - (extL || 0);
    // fond coloré du blanc tournant extérieur : tout le slot, sous la pièce.
    if (wm && wm.colorName) {
        try {
            var _sw = _doc.swatches.itemByName(wm.colorName);
            if (_sw && _sw.isValid) {
                var bg = targetPage.rectangles.add(layer);
                bg.geometricBounds = [slotTop, slotLeft, slotTop + slotH, slotLeft + slotW];
                bg.fillColor = _sw;
                bg.strokeColor = _doc.swatches.itemByName("None");
            }
        } catch (eBgE) {}
    }
    // V20 — FOND PERDU GÉNÉRÉ (mode fond perdu extérieur, hors blanc tournant) :
    //   Blueprint CRÉE le rectangle qui constitue le fond perdu — taille du
    //   slot entier (pièce + fond perdu), sous la pièce, dans la couleur
    //   choisie. Ainsi la coupe au bord de la pièce ne laisse aucun liseré.
    //   bleedColorMode : "mirror" (bords en miroir, traité APRÈS la pose de
    //   la copie, plus bas) | "auto" (couleur de fond de la pièce) | "none" |
    //   nom d'une nuance du document.
    if (!wm && bleedColorMode && bleedColorMode !== "none" && bleedColorMode !== "mirror") {
        var _bsw = null;
        if (bleedColorMode === "auto") {
            // couleur de fond de la pièce ; repli : fond du 1er enfant (groupe)
            try { var fc = src.fillColor; if (fc && fc.isValid && fc.name && fc.name !== "None") _bsw = fc; } catch (eA1) {}
            if (!_bsw) { try { var fc2 = src.pageItems[0].fillColor; if (fc2 && fc2.isValid && fc2.name && fc2.name !== "None") _bsw = fc2; } catch (eA2) {} }
        } else {
            try { var _nm = _doc.swatches.itemByName(bleedColorMode); if (_nm && _nm.isValid) _bsw = _nm; } catch (eA3) {}
        }
        if (_bsw) {
            try {
                var bbg = targetPage.rectangles.add(layer);
                bbg.geometricBounds = [slotTop, slotLeft, slotTop + slotH, slotLeft + slotW];
                bbg.fillColor = _bsw;
                bbg.strokeColor = _doc.swatches.itemByName("None");
            } catch (eBBg) {}
        }
    }
    // copie de la pièce à TAILLE PLEINE (aucune mise à l'échelle).
    var copy = src.duplicate(targetPage);
    copy.itemLayer = layer;
    // repositionne le coin haut-gauche de la pièce à (posLeft, posTop).
    try {
        var bb = copy.geometricBounds;
        copy.move(undefined, [posLeft - bb[1], posTop - bb[0]]);
    } catch (eMv) {}
    // rotation autour du centre (comme iwPlaceCopy), sans changer la taille.
    if (rotate) {
        var applied = false;
        try {
            var bb2 = copy.geometricBounds;
            var ccx = (bb2[1] + bb2[3]) / 2, ccy = (bb2[0] + bb2[2]) / 2;
            var rm = app.transformationMatrices.add({ counterclockwiseRotationAngle: rotate });
            copy.transform(CoordinateSpaces.PASTEBOARD_COORDINATES, [ccx, ccy], rm);
            applied = true;
        } catch (eRot) {}
        if (!applied) { try { copy.rotationAngle = rotate; } catch (eRot2) {} }
    }
    // V1 — FOND PERDU « ADAPTÉ AU VISUEL » (bords en MIROIR, rognés) :
    //   pour chaque bord de la pièce POSÉE (bounds finaux, donc corrects
    //   même après rotation 90/180), une copie est réfléchie autour de ce
    //   bord puis ROGNÉE à la seule bande de fond perdu ; idem pour les 4
    //   coins (double miroir). Au trait de coupe, le miroir coïncide
    //   EXACTEMENT avec le bord de la pièce : aucun décalage. Chaque bande
    //   est confinée à SON slot (aucun chevauchement entre poses) et rien
    //   n'existe sous la pièce (aucun doublage par transparence).
    if (!wm && bleedColorMode === "mirror") {
        try {
            var cbM = copy.geometricBounds;           // [T, L, B, R] pièce posée
            var pW = cbM[3] - cbM[1], pH = cbM[2] - cbM[0];
            // marges effectives = distance bounds pièce -> bounds slot
            var mT = cbM[0] - slotTop,                mL = cbM[1] - slotLeft;
            var mB = (slotTop + slotH)  - cbM[2],     mR = (slotLeft + slotW) - cbM[3];
            var EPS = 0.01;
            // V1-3 — FONDU (« smear ») : seule une TRÈS FINE tranche du bord
            //   (IW_BLEED_SMEAR_SRC_PT, en points) est étirée sur toute la
            //   largeur du fond perdu. Chaque point du bord devient une
            //   traînée de SA couleur : les couleurs se fondent, aucun dessin
            //   lisible dans la chute, et le raccord au trait de coupe reste
            //   exact (le miroir garantit la continuité quel que soit
            //   l'étirement). 0.5 pt ≈ 0,18 mm -> facteur ~48x pour 3 mm.
            //   Augmenter la constante = plus de dessin visible ; la
            //   diminuer = traînées encore plus pures.
            var IW_BLEED_SMEAR_SRC_PT = 0.5;
            // fabrique UNE bande : duplique la pièce, miroir(s), translation,
            // ÉTIREMENT ancré sur le bord partagé, rognage à `band`.
            //   hPin/vPin : quel bord du duplicata est ÉPINGLÉ sur le bord
            //   intérieur de la bande pendant l'étirement.
            //   +1 = bord DROIT du dup sur band[3] (resp. BAS sur band[2]) ;
            //   -1 = bord GAUCHE sur band[1] (resp. HAUT sur band[0]) ;
            //    0 = pas d'étirement sur cet axe (alignement déjà garanti).
            // Tout échec est silencieux (au pire : miroir non fondu, ou
            // bande absente — jamais une bande fausse).
            // (expression de fonction : déclaration dans un bloc = fragile en ES3)
            var _mkBand = function (fH, fV, dx, dy, band, hPin, vPin) {
                var d = null;
                try {
                    d = copy.duplicate();
                    d.itemLayer = layer;
                    if (fH) iwMirrorPB(d, true);
                    if (fV) iwMirrorPB(d, false);
                    d.move(undefined, [dx, dy]);
                    // fondu : étirement autour du CENTRE puis ré-épinglage du
                    // bord partagé (aucune coordonnée absolue dans transform).
                    try {
                        var sH = 1, sV = 1;
                        var bw = band[3] - band[1], bh = band[2] - band[0];
                        if (hPin) sH = Math.max(1, bw / IW_BLEED_SMEAR_SRC_PT);
                        if (vPin) sV = Math.max(1, bh / IW_BLEED_SMEAR_SRC_PT);
                        if (sH > 1 || sV > 1) {
                            var smm = app.transformationMatrices.add({
                                horizontalScaleFactor: sH,
                                verticalScaleFactor:   sV
                            });
                            d.transform(CoordinateSpaces.PASTEBOARD_COORDINATES, AnchorPoint.CENTER_ANCHOR, smm);
                            var db = d.geometricBounds;
                            var ddx = 0, ddy = 0;
                            if (hPin ===  1) ddx = band[3] - db[3];
                            if (hPin === -1) ddx = band[1] - db[1];
                            if (vPin ===  1) ddy = band[2] - db[2];
                            if (vPin === -1) ddy = band[0] - db[0];
                            if (ddx || ddy) d.move(undefined, [ddx, ddy]);
                        }
                    } catch (eSm) {}
                    return iwCropToBand(d, band, targetPage, layer);
                } catch (eBd) {
                    try { if (d && d.isValid) d.remove(); } catch (eBd2) {}
                    return null;
                }
            };
            // 4 bords (étirement perpendiculaire au bord uniquement)
            if (mL > EPS) _mkBand(true,  false, -pW, 0,
                [cbM[0], cbM[1] - mL, cbM[2], cbM[1]],  1, 0);
            if (mR > EPS) _mkBand(true,  false,  pW, 0,
                [cbM[0], cbM[3], cbM[2], cbM[3] + mR], -1, 0);
            if (mT > EPS) _mkBand(false, true,  0, -pH,
                [cbM[0] - mT, cbM[1], cbM[0], cbM[3]],  0, 1);
            if (mB > EPS) _mkBand(false, true,  0,  pH,
                [cbM[2], cbM[1], cbM[2] + mB, cbM[3]],  0, -1);
            // 4 coins (double miroir, étirement sur les deux axes : le point
            // de coin devient un aplat fondu)
            if (mT > EPS && mL > EPS) _mkBand(true, true, -pW, -pH,
                [cbM[0] - mT, cbM[1] - mL, cbM[0], cbM[1]],  1,  1);
            if (mT > EPS && mR > EPS) _mkBand(true, true,  pW, -pH,
                [cbM[0] - mT, cbM[3], cbM[0], cbM[3] + mR], -1,  1);
            if (mB > EPS && mL > EPS) _mkBand(true, true, -pW,  pH,
                [cbM[2], cbM[1] - mL, cbM[2] + mB, cbM[1]],  1, -1);
            if (mB > EPS && mR > EPS) _mkBand(true, true,  pW,  pH,
                [cbM[2], cbM[3], cbM[2] + mB, cbM[3] + mR], -1, -1);
        } catch (eMir) {}
    }
    try { copy.bringToFront(); } catch (eBF) {}
    return copy;
}

// ── D.1  N-Up : répétition d'une grille, ordre lecture gauche->droite ──
// Renvoie true si la rangée d'index 0-based `r` doit être retournée.
//  flipAlt = true -> une rangée sur deux à partir de la 2e (index impair :
//  r=1,3,5… soit les rangées 2,4,6 en 1-based).
function iwRowIsFlipped(flipAlt, r) {
    if (!flipAlt) return false;
    return (r % 2) === 1;
}

// Dimensions de "fit" à passer à iwPlaceCopy en tenant compte du blanc
// tournant. Si une marge interne est demandée, l'image est mise à l'échelle
// dans le rectangle RÉDUIT (slot - marges) même si le mode "fit" global est
// désactivé (le blanc tournant impose toujours un redimensionnement).
function iwFitDims(doFit, wm, slotW, slotH) {
    var hasWM = !!(wm && (((wm.top||0)>0)||((wm.bottom||0)>0)||((wm.left||0)>0)||((wm.right||0)>0)));
    if (!doFit && !hasWM) return [0, 0];
    var fw = slotW - (hasWM ? ((wm.left||0)+(wm.right||0)) : 0);
    var fh = slotH - (hasWM ? ((wm.top||0)+(wm.bottom||0)) : 0);
    if (fw < 1) fw = 1;
    if (fh < 1) fh = 1;
    return [fw, fh];
}

function addNUpImposition(cfg) {
    var placed = [];
    var n = 0;
    var maxN = (cfg.maxCount && cfg.maxCount > 0) ? cfg.maxCount : (cfg.rows * cfg.cols);
    for (var r = 0; r < cfg.rows; r++) {
        var baseRot = cfg.origRotation || 0;
        var rot = (baseRot + (iwRowIsFlipped(cfg.flipAlt, r) ? 180 : 0)) % 360;
        for (var c = 0; c < cfg.cols; c++) {
            if (n >= maxN) break;
            var slotTop  = cfg.originTop  + r * (cfg.slotH + cfg.gapV);
            var slotLeft = cfg.originLeft + c * (cfg.slotW + cfg.gapH);
            // N-Up cycle sur la liste d'items (utile pour multi-pages)
            var src = cfg.items[n % cfg.items.length];
            // V20 — MODE EXTÉRIEUR : pièce à TAILLE PLEINE, inset des marges
            //   extérieures dans le slot agrandi (pas de réduction blanc tournant).
            var obj;
            var _slotB;
            if (cfg.extOn) {
                obj = iwPlaceCopyExt(src, cfg.page, slotTop + cfg.extTop, slotLeft + cfg.extLeft,
                                     cfg.layer, rot, cfg.wmOutside ? cfg.whiteMargin : null,
                                     cfg.extLeft, cfg.extTop, cfg.extRight, cfg.extBottom, cfg.slotW, cfg.slotH,
                                     cfg.bleedColorMode);
                // V20 — position des repères de coupe selon le type de marge :
                //   • BLANC TOURNANT extérieur = passe-partout gardé dans le fini
                //     -> coupe au bord EXTÉRIEUR du cadre = le SLOT ENTIER.
                //   • FOND PERDU extérieur = marge de chute -> coupe au bord de
                //     la PIÈCE (marges extérieures retirées).
                if (cfg.wmOutside) {
                    _slotB = [slotTop, slotLeft, slotTop + cfg.slotH, slotLeft + cfg.slotW];
                } else {
                    _slotB = [slotTop + cfg.extTop, slotLeft + cfg.extLeft,
                              slotTop + cfg.slotH - cfg.extBottom, slotLeft + cfg.slotW - cfg.extRight];
                }
            } else {
                var _fd = iwFitDims(cfg.fit, cfg.whiteMargin, cfg.slotW, cfg.slotH);
                obj = iwPlaceCopy(src, cfg.page, slotTop, slotLeft, cfg.layer, 0, rot,
                                  _fd[0], _fd[1], cfg.whiteMargin);
                _slotB = [slotTop, slotLeft, slotTop + cfg.slotH, slotLeft + cfg.slotW];
            }
            placed.push({
                obj: obj,
                slotBounds: _slotB
            });
            n++;
        }
        if (n >= maxN) break;
    }
    return placed;
}

// ── D.1bis  PATCHWORK : empilage + rognage par quadrant ──────────────
//  Les objets SÉLECTIONNÉS (supposés de MÊME TAILLE) sont d'abord EMPILÉS
//  par le script au MÊME POINT (même coin haut-gauche = `anchor`), puis
//  CHACUN est ROGNÉ pour ne montrer qu'une CELLULE de la grille : le 1er
//  objet → cellule haut-gauche, le 2e → cellule suivante (ligne par ligne),
//  etc. Le CONTENU de chaque objet ne bouge pas (il reste calé sur l'image
//  pleine) ; seul le CADRE est réduit à sa cellule -> à l'écran les cadres
//  se recombinent en une seule image, chaque cellule venant d'un document
//  différent. C'est le test d'associations de couleurs riso/sérigraphie.
//
//  Grille : `cfg.asmCols` colonnes × autant de rangées que nécessaire.
//  Taille d'une cellule = (image pleine) / (cols, rows), décalée par le gap :
//  un gap NÉGATIF fait se CHEVAUCHER les zones rognées (les cadres se
//  recouvrent), un gap positif laisse une gouttière (bande non couverte).
function addAssemblyImposition(cfg) {
    var placed = [];
    var items = cfg.items || [];
    var nItems = items.length;
    if (nItems === 0) return placed;

    var cols = parseInt(cfg.asmCols, 10);
    if (isNaN(cols) || cols < 1) cols = 1;
    if (cols > nItems) cols = nItems;
    var rows = Math.ceil(nItems / cols);

    // Taille de l'IMAGE PLEINE = celle utilisée par le LAYOUT (cfg.slotW/H),
    // pour coïncider avec l'aperçu. Repli : taille native de la 1re pièce.
    var fullW = (cfg.slotW != null) ? cfg.slotW : (items[0].geometricBounds[3] - items[0].geometricBounds[1]);
    var fullH = (cfg.slotH != null) ? cfg.slotH : (items[0].geometricBounds[2] - items[0].geometricBounds[0]);

    // Point d'ancrage commun = origine du bloc calculée par le layout
    // (déjà centrée/alignée dans la zone utile). TOUTES les pièces y sont
    // empilées : leur image pleine occupe [anchor .. anchor+full].
    var anchorTop  = cfg.originTop;
    var anchorLeft = cfg.originLeft;

    // Demi-gap : on rabote chaque cellule de gapH/2 (resp. gapV/2) de chaque
    // côté intérieur, de sorte que le PAS entre cellules = cellPas, et que la
    // somme couvre l'image pleine quand gap = 0. gap<0 -> cellules plus
    // grandes qui se chevauchent ; gap>0 -> cellules plus petites (gouttière).
    var cellW = fullW / cols;
    var cellH = fullH / rows;
    // ESPACEMENT FORCÉ À 0 : cellules jointives (raccord parfait).
    var gh = 0;
    var gv = 0;

    var n = 0;
    for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
            if (n >= nItems) break;
            var src = items[n];

            // 1) EMPILAGE : on duplique la pièce et on la cale sur l'ancre
            //    commune, à TAILLE PLEINE (fullW×fullH), sans rotation.
            //    iwPlaceCopy(..., fitW=fullW, fitH=fullH) met à l'échelle pour
            //    remplir l'image pleine et la pose au coin (anchorLeft,anchorTop).
            var obj = iwPlaceCopy(src, cfg.page, anchorTop, anchorLeft, cfg.layer,
                                  0, 0, fullW, fullH, null);

            // 2) ROGNAGE : on réduit le CADRE de l'objet à sa cellule. Le
            //    contenu reste calé sur l'image pleine -> le cadre ne montre
            //    que le quadrant voulu. Bornes de la cellule (avec gap) :
            var cellLeft = anchorLeft + c * cellW + gh / 2;
            var cellTop  = anchorTop  + r * cellH + gv / 2;
            var cellRight  = anchorLeft + (c + 1) * cellW - gh / 2;
            var cellBottom = anchorTop  + (r + 1) * cellH - gv / 2;
            // sécurité : cellule non dégénérée
            if (cellRight  <= cellLeft) cellRight  = cellLeft + 0.1;
            if (cellBottom <= cellTop)  cellBottom = cellTop  + 0.1;
            try {
                obj.geometricBounds = [cellTop, cellLeft, cellBottom, cellRight];
            } catch (eCrop) {}

            placed.push({
                obj: obj,
                slotBounds: [cellTop, cellLeft, cellBottom, cellRight]
            });
            n++;
        }
        if (n >= nItems) break;
    }
    return placed;
}



function addStepRepeatImposition(cfg) {
    var single = { items: [cfg.items[0]], rows: cfg.rows, cols: cfg.cols,
                   slotW: cfg.slotW, slotH: cfg.slotH, gapH: cfg.gapH, gapV: cfg.gapV,
                   originTop: cfg.originTop, originLeft: cfg.originLeft,
                   page: cfg.page, layer: cfg.layer, bleed: cfg.bleed,
                   fit: cfg.fit, maxCount: cfg.maxCount, flipAlt: cfg.flipAlt,
                   origRotation: cfg.origRotation, whiteMargin: cfg.whiteMargin,
                   // V20 — transmet le mode extérieur au N-Up sous-jacent
                   extTop: cfg.extTop, extBottom: cfg.extBottom,
                   extLeft: cfg.extLeft, extRight: cfg.extRight, extOn: cfg.extOn,
                   wmOutside: cfg.wmOutside, bleedOutside: cfg.bleedOutside,
                   bleedColorMode: cfg.bleedColorMode };
    return addNUpImposition(single);
}

// ── D.3  Cut & Stack : ordre vertical par colonnes pour massicot ──────
//  Les pages sont ordonnées pour qu'après coupe et empilage les paquets
//  soient déjà séquencés. On remplit colonne par colonne, page par page.
function addCutStackImposition(cfg) {
    var placed = [];
    var perSheet = cfg.rows * cfg.cols;
    var maxN = (cfg.maxCount && cfg.maxCount > 0) ? cfg.maxCount : perSheet;
    var n = 0;
    // ordre : pour chaque slot, page = base + slotIndex * sheets
    for (var c = 0; c < cfg.cols; c++) {
        for (var r = 0; r < cfg.rows; r++) {
            if (n >= maxN) break;
            var slotTop  = cfg.originTop  + r * (cfg.slotH + cfg.gapV);
            var slotLeft = cfg.originLeft + c * (cfg.slotW + cfg.gapH);
            var srcIndex = n % cfg.items.length;
            var src = cfg.items[srcIndex];
            var rot = ((cfg.origRotation || 0) + (iwRowIsFlipped(cfg.flipAlt, r) ? 180 : 0)) % 360;
            // V20 — mode extérieur : pièce pleine inset des marges (comme N-Up)
            var obj, _slotB;
            if (cfg.extOn) {
                obj = iwPlaceCopyExt(src, cfg.page, slotTop + cfg.extTop, slotLeft + cfg.extLeft,
                                     cfg.layer, rot, cfg.wmOutside ? cfg.whiteMargin : null,
                                     cfg.extLeft, cfg.extTop, cfg.extRight, cfg.extBottom, cfg.slotW, cfg.slotH,
                                     cfg.bleedColorMode);
                _slotB = cfg.wmOutside
                    ? [slotTop, slotLeft, slotTop + cfg.slotH, slotLeft + cfg.slotW]
                    : [slotTop + cfg.extTop, slotLeft + cfg.extLeft,
                       slotTop + cfg.slotH - cfg.extBottom, slotLeft + cfg.slotW - cfg.extRight];
            } else {
                var _fd = iwFitDims(cfg.fit, cfg.whiteMargin, cfg.slotW, cfg.slotH);
                obj = iwPlaceCopy(src, cfg.page, slotTop, slotLeft, cfg.layer, 0, rot,
                                  _fd[0], _fd[1], cfg.whiteMargin);
                _slotB = [slotTop, slotLeft, slotTop + cfg.slotH, slotLeft + cfg.slotW];
            }
            placed.push({
                obj: obj,
                slotBounds: _slotB
            });
            n++;
        }
        if (n >= maxN) break;
    }
    return placed;
}

// ── D.4  Booklet : cahier en sheetwise, avec creep (chasse) ───────────
//  Pour N pages (arrondi au multiple de 4), calcule les paires de pages
//  placées côte à côte sur chaque FACE de feuille (saddle-stitch / piqûre).
//  Pour 8 pages on obtient, dans l'ordre des faces :
//    Face 1 (verso feuille ext.) : [8, 1]
//    Face 2 (recto feuille ext.) : [2, 7]
//    Face 3 (verso feuille int.) : [6, 3]
//    Face 4 (recto feuille int.) : [4, 5]
//  Chaque entrée = { left:pageGauche, right:pageDroite, sheet:indexFeuille }.
function bookletPairs(nPages) {
    var total = Math.ceil(nPages / 4) * 4;   // arrondi au multiple de 4
    var pairs = [];
    var lo = 1, hi = total;
    var faceIsVerso = true; // on commence par le verso de la feuille extérieure
    var sheet = 0;
    while (lo < hi) {
        if (faceIsVerso) {
            // verso : page haute à gauche, page basse à droite
            pairs.push({ left: hi, right: lo, sheet: sheet });
            lo++; hi--;
        } else {
            // recto : page basse à gauche, page haute à droite
            pairs.push({ left: lo, right: hi, sheet: sheet });
            lo++; hi--;
            sheet++; // une feuille complète (2 faces) terminée
        }
        faceIsVerso = !faceIsVerso;
    }
    var sheetCount = Math.ceil(total / 4);
    return { total: total, pairs: pairs, sheetCount: sheetCount };
}

// creep : décalage appliqué selon la profondeur de la feuille dans le cahier.
//  Feuille extérieure (sheet 0) = 0, feuille la plus intérieure = creepMax.
//  Le décalage pousse les pages vers l'EXTÉRIEUR du dos (vers la tranche)
//  pour compenser l'épaisseur du papier plié.
function bookletCreep(sheetIndex, sheetCount, creepMax) {
    if (sheetCount <= 1) return 0;
    return creepMax * (sheetIndex / (sheetCount - 1));
}

//  addBookletImposition : pose 2 pages (gauche/droite) par face de feuille.
//  cfg.creep = creep total mm ; cfg.getItemForPage(n) = item de la page n.
//  Chaque face est placée sur une page InDesign distincte (cfg.pages[]) si
//  fournie, sinon tout sur cfg.page (les faces se superposent — prévenir).
function addBookletImposition(cfg) {
    var placed = [];
    var info = bookletPairs(cfg.nPages);
    var slotW = cfg.slotW, slotH = cfg.slotH;
    var midGap = cfg.gapH; // gouttière centrale entre les 2 pages

    for (var f = 0; f < info.pairs.length; f++) {
        var pair = info.pairs[f];
        var creep = bookletCreep(pair.sheet, info.sheetCount, cfg.creep || 0);

        // page InDesign cible pour cette face (une par face si dispo)
        var facePage = (cfg.pages && cfg.pages[f]) ? cfg.pages[f] : cfg.page;

        // le creep rapproche les deux pages du centre sur les feuilles internes
        var leftSlotLeft  = cfg.originLeft + creep;
        var rightSlotLeft = cfg.originLeft + slotW + midGap - creep;
        var top = cfg.originTop;

        var srcL = cfg.getItemForPage(pair.left);
        var srcR = cfg.getItemForPage(pair.right);
        // V20 — mode extérieur : pièce pleine inset des marges (comme N-Up)
        function _bkPlace(srcX, leftX, labelX) {
            var objX, _sbX;
            if (cfg.extOn) {
                objX = iwPlaceCopyExt(srcX, facePage, top + cfg.extTop, leftX + cfg.extLeft,
                                      cfg.layer, 0, cfg.wmOutside ? cfg.whiteMargin : null,
                                      cfg.extLeft, cfg.extTop, cfg.extRight, cfg.extBottom, slotW, slotH,
                                      cfg.bleedColorMode);
                _sbX = cfg.wmOutside
                    ? [top, leftX, top + slotH, leftX + slotW]
                    : [top + cfg.extTop, leftX + cfg.extLeft,
                       top + slotH - cfg.extBottom, leftX + slotW - cfg.extRight];
            } else {
                var _fdX = iwFitDims(cfg.fit, cfg.whiteMargin, slotW, slotH);
                objX = iwPlaceCopy(srcX, facePage, top, leftX, cfg.layer, 0, 0, _fdX[0], _fdX[1], cfg.whiteMargin);
                _sbX = [top, leftX, top + slotH, leftX + slotW];
            }
            placed.push({ obj: objX, slotBounds: _sbX, label: labelX });
        }
        if (srcL) _bkPlace(srcL, leftSlotLeft,  "p." + pair.left);
        if (srcR) _bkPlace(srcR, rightSlotLeft, "p." + pair.right);
    }
    return placed;
}

// ── D.5  Dutch Cut : grille décalée maximisant le rendement matière ───
//  Variante de N-Up où l'on autorise une rangée supplémentaire décalée
//  (rotation 90° des pièces) si la place restante le permet.
function addDutchCutImposition(cfg) {
    var placed = addNUpImposition(cfg); // base
    // tentative d'ajout d'une bande tournée à 90° dans l'espace résiduel
    var usedW = cfg.cols * cfg.slotW + (cfg.cols - 1) * cfg.gapH;
    var residualW = cfg.zoneW - usedW;
    var rotW = cfg.slotH, rotH = cfg.slotW; // pièce tournée
    if (residualW >= rotW) {
        var nRot = Math.floor((cfg.zoneH + cfg.gapV) / (rotH + cfg.gapV));
        var baseLeft = cfg.originLeft + usedW + cfg.gapH;
        var n = placed.length;
        for (var k = 0; k < nRot; k++) {
            var slotTop  = cfg.originTop + k * (rotH + cfg.gapV);
            var src = cfg.items[n % cfg.items.length];
            // V20 — mode extérieur sur la bande tournée : pièce pleine à 90°.
            //   Les marges suivent la rotation (haut/bas <-> gauche/droite) ;
            //   avec des marges uniformes (cas courant) c'est invisible.
            var copy, _slotBD;
            if (cfg.extOn) {
                copy = iwPlaceCopyExt(src, cfg.page, slotTop + cfg.extLeft, baseLeft + cfg.extTop,
                                      cfg.layer, 90, cfg.wmOutside ? cfg.whiteMargin : null,
                                      cfg.extTop, cfg.extLeft, cfg.extBottom, cfg.extRight, rotW, rotH,
                                      cfg.bleedColorMode);
                _slotBD = cfg.wmOutside
                    ? [slotTop, baseLeft, slotTop + rotH, baseLeft + rotW]
                    : [slotTop + cfg.extLeft, baseLeft + cfg.extTop,
                       slotTop + rotH - cfg.extRight, baseLeft + rotW - cfg.extBottom];
            } else {
                var _fdD = iwFitDims(cfg.fit, cfg.whiteMargin, rotW, rotH);
                copy = iwPlaceCopy(src, cfg.page, slotTop, baseLeft, cfg.layer, 0, 90, _fdD[0], _fdD[1], cfg.whiteMargin);
                _slotBD = [slotTop, baseLeft, slotTop + rotH, baseLeft + rotW];
            }
            placed.push({
                obj: copy,
                slotBounds: _slotBD
            });
            n++;
        }
    }
    return placed;
}

// ── D.6  Shuffle manuel : l'utilisateur fournit l'ordre des slots ─────
//  cfg.order = tableau d'index d'items, lu ligne par ligne dans la grille.
function addShuffleImposition(cfg) {
    var placed = [];
    var n = 0;
    for (var r = 0; r < cfg.rows; r++) {
        for (var c = 0; c < cfg.cols; c++) {
            var slotTop  = cfg.originTop  + r * (cfg.slotH + cfg.gapV);
            var slotLeft = cfg.originLeft + c * (cfg.slotW + cfg.gapH);
            var itemIdx = (cfg.order && n < cfg.order.length) ? cfg.order[n] : (n % cfg.items.length);
            var src = cfg.items[itemIdx % cfg.items.length];
            // V20 — mode extérieur : pièce pleine inset des marges (comme N-Up)
            var obj, _slotBS;
            if (cfg.extOn) {
                obj = iwPlaceCopyExt(src, cfg.page, slotTop + cfg.extTop, slotLeft + cfg.extLeft,
                                     cfg.layer, 0, cfg.wmOutside ? cfg.whiteMargin : null,
                                     cfg.extLeft, cfg.extTop, cfg.extRight, cfg.extBottom, cfg.slotW, cfg.slotH,
                                     cfg.bleedColorMode);
                _slotBS = cfg.wmOutside
                    ? [slotTop, slotLeft, slotTop + cfg.slotH, slotLeft + cfg.slotW]
                    : [slotTop + cfg.extTop, slotLeft + cfg.extLeft,
                       slotTop + cfg.slotH - cfg.extBottom, slotLeft + cfg.slotW - cfg.extRight];
            } else {
                var _fdS = iwFitDims(cfg.fit, cfg.whiteMargin, cfg.slotW, cfg.slotH);
                obj = iwPlaceCopy(src, cfg.page, slotTop, slotLeft, cfg.layer, 0, 0, _fdS[0], _fdS[1], cfg.whiteMargin);
                _slotBS = [slotTop, slotLeft, slotTop + cfg.slotH, slotLeft + cfg.slotW];
            }
            placed.push({
                obj: obj,
                slotBounds: _slotBS
            });
            n++;
        }
    }
    return placed;
}


// ─────────────────────────────────────────────────────────────────────
//  [E] MARKS — repères avancés
//  addMarks(page, layer, slotBounds, opts)
//  opts = {
//    crop:bool, trim:bool, registration:bool,
//    colorBar:bool, customText:string|null, customGraphicFile:File|null,
//    angleMarks:bool, bleed:mm, length:mm, gap:mm, weight:pt
//  }
//  Réutilise addLine() (v1) et getRegistrationColor() (v1) — non modifiés.
// ─────────────────────────────────────────────────────────────────────
function addMarks(page, layer, slotBounds, opts) {
    var doc   = app.activeDocument;
    var color = getRegistrationColor(doc);
    // slotBounds = bords EXTÉRIEURS de la pièce (fond perdu inclus).
    // La ligne de COUPE est à l'intérieur, à `bleed` du bord. Les repères
    // marquent cette ligne intérieure — c'est la logique v1 d'origine.
    var t = slotBounds[0], l = slotBounds[1], b = slotBounds[2], r = slotBounds[3];
    var bleed = opts.bleed || 0;
    var len   = (opts.length != null) ? opts.length : 7;
    var gap   = (opts.gap    != null) ? opts.gap    : 2;
    var w     = (opts.weight != null) ? opts.weight : 0.25;

    // coordonnées de la LIGNE DE COUPE (intérieure)
    var ct = t + bleed, cl = l + bleed, cb = b - bleed, cr = r - bleed;

    // E.1 Crop marks (coins) — on passe les bords EXTÉRIEURS + bleed à la
    //     fonction v1, qui place les traits à `bord + bleed` = ligne de coupe.
    if (opts.crop) {
        drawMarksForBounds(page, layer, color, w,
            t, l, b, r, bleed, len, gap, true, false);
    }

    // E.2 Trim lines : rectangle sur la ligne de coupe intérieure
    if (opts.trim) {
        var rect = page.rectangles.add(layer);
        rect.geometricBounds = [ct, cl, cb, cr];
        rect.fillColor = doc.swatches.itemByName("None");
        rect.strokeColor = color;
        rect.strokeWeight = w;
        try { rect.strokeType = doc.strokeStyles.itemByName("Dashed"); } catch (e) {}
    }

    // E.3 Registration target : croix dans un cercle, au-dessus de la coupe.
    //     V11 — la mire PERSO ne s'applique PLUS par carte : elle sert
    //     uniquement aux croix de CENTRE et aux croix SUPPLÉMENTAIRES de page
    //     (voir addPageCenterMarks / addPageSideCrosses). Ici, si la case
    //     « Registration target » est cochée, on dessine seulement la mire
    //     VECTORIELLE classique (croix + cercle), une par pièce.
    if (opts.registration) {
        var cx = (cl + cr) / 2, cy = ct - gap - len;
        var rad = len / 2;
        addLine(page, layer, color, w, cx - rad, cy, cx + rad, cy);
        addLine(page, layer, color, w, cx, cy - rad, cx, cy + rad);
        var circ = page.ovals.add(layer);
        circ.geometricBounds = [cy - rad, cx - rad, cy + rad, cx + rad];
        circ.fillColor = doc.swatches.itemByName("None");
        circ.strokeColor = color;
        circ.strokeWeight = w;
    }

    // E.4 Color bar : bande CMJN sous la ligne de coupe
    if (opts.colorBar) {
        var cmyk = iwEnsureColorBarSwatches(doc);
        var cellW = (cr - cl) / cmyk.length;
        var barTop = cb + gap;
        var barH = Math.min(4, len / 2);
        for (var i = 0; i < cmyk.length; i++) {
            var cell = page.rectangles.add(layer);
            cell.geometricBounds = [barTop, cl + i * cellW, barTop + barH, cl + (i + 1) * cellW];
            cell.fillColor = cmyk[i];
            cell.strokeColor = doc.swatches.itemByName("None");
        }
    }

    // E.5 Custom text (nom job, date…) sous la ligne de coupe
    if (opts.customText) {
        var tf = page.textFrames.add(layer);
        tf.geometricBounds = [cb + gap, cl, cb + gap + 4, cr];
        tf.contents = opts.customText;
        try {
            tf.texts[0].pointSize = 5;
            tf.texts[0].fillColor = color;
        } catch (e) {}
    }

    // E.6 Custom graphic (PDF / image) — coin haut-gauche, au-dessus de la coupe
    if (opts.customGraphicFile && opts.customGraphicFile.exists) {
        try {
            var gframe = page.rectangles.add(layer);
            var gs = 10; // 10mm
            gframe.geometricBounds = [ct - gap - gs, cl, ct - gap, cl + gs];
            gframe.place(opts.customGraphicFile);
            gframe.fit(FitOptions.PROPORTIONALLY);
        } catch (e) {}
    }

    // E.7 Angle marks : diagonales à 45° aux coins de la ligne de coupe
    if (opts.angleMarks) {
        var d = len * 0.7071;
        addLine(page, layer, color, w, cl - gap, ct - gap, cl - gap - d, ct - gap - d);
        addLine(page, layer, color, w, cr + gap, ct - gap, cr + gap + d, ct - gap - d);
        addLine(page, layer, color, w, cl - gap, cb + gap, cl - gap - d, cb + gap + d);
        addLine(page, layer, color, w, cr + gap, cb + gap, cr + gap + d, cb + gap + d);
    }
}

// ─────────────────────────────────────────────────────────────────────
//  Repères de CENTRE DE PAGE (indépendants de la grille).
//  Trace une croix au centre exact de la feuille + 4 marques sur les
//  bords (haut/bas/gauche/droite) pointant vers le centre.
//  pageBounds = [top,left,bottom,right] de la PAGE entière (mm).
//  opts.len   = longueur des traits ; opts.weight = épaisseur.
// ─────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────
//  iwPlaceRegMark (V10) — pose UNE mire de repérage centrée en (x,y), de
//  taille `len`. Si une mire PERSO valide est fournie (opts.regFile), elle
//  est PLACÉE (image importée, recadrée) à la place de la croix+cercle
//  vectoriels. Sinon (ou si le placement échoue), on dessine la croix
//  dans un cercle classique. Utilisé pour la mire de registration par
//  pièce, mais AUSSI pour les croix de centre de page et les croix de bord.
// ─────────────────────────────────────────────────────────────────────
function iwPlaceRegMark(page, layer, x, y, len, opts, color, w) {
    var doc = app.activeDocument;
    var none = doc.swatches.itemByName("None");
    var half = len / 2;
    var regFileValid = false;
    try { regFileValid = !!(opts && opts.regFile && opts.regFile.exists); } catch (eRFV) { regFileValid = false; }
    if (regFileValid) {
        try {
            var rframe = page.rectangles.add(layer);
            rframe.geometricBounds = [y - half, x - half, y + half, x + half];
            rframe.fillColor   = none;
            rframe.strokeColor = none;
            var placedItems = rframe.place(opts.regFile);
            try { rframe.fit(FitOptions.FRAME_TO_CONTENT); } catch (eF0) {}
            try { rframe.fit(FitOptions.PROPORTIONALLY); } catch (eF1) {}
            try { rframe.fit(FitOptions.CENTER_CONTENT); } catch (eF2) {}
            try { rframe.geometricBounds = [y - half, x - half, y + half, x + half]; } catch (eGB) {}
            try { rframe.fit(FitOptions.PROPORTIONALLY); } catch (eF3) {}
            var ok = (rframe.graphics && rframe.graphics.length > 0) ||
                     (placedItems && placedItems.length > 0);
            if (ok) return;            // mire perso posée avec succès
            try { rframe.remove(); } catch (eR) {}
        } catch (eRF) {}
    }
    // repli (ou pas de mire perso) : croix dans un cercle
    addLine(page, layer, color, w, x - half, y, x + half, y);
    addLine(page, layer, color, w, x, y - half, x, y + half);
    var circ = page.ovals.add(layer);
    circ.geometricBounds = [y - half, x - half, y + half, x + half];
    circ.fillColor = none;
    circ.strokeColor = color;
    circ.strokeWeight = w;
}

function addPageCenterMarks(page, layer, pageBounds, opts) {
    var doc   = app.activeDocument;
    var color = getRegistrationColor(doc);
    var none  = doc.swatches.itemByName("None");
    var t = pageBounds[0], l = pageBounds[1], b = pageBounds[2], r = pageBounds[3];
    var cx = (l + r) / 2, cy = (t + b) / 2;
    var w   = (opts && opts.weight != null) ? opts.weight : 0.25;
    // croix centrale exacte optionnelle (par défaut activée pour compat)
    var doCross = !(opts && opts.cross === false);

    // marges (pour centrer les mires dans l'épaisseur de marge, comme les
    // croix supplémentaires)
    var m = (opts && opts.margins) ? opts.margins : { top: 0, left: 0, bottom: 0, right: 0 };
    var axisTop    = t + (m.top    || 0) / 2;
    var axisBottom = b - (m.bottom || 0) / 2;
    var axisLeft   = l + (m.left   || 0) / 2;
    var axisRight  = r - (m.right  || 0) / 2;

    // taille : comme les croix de bord mais PLUS GROSSE (×2.4),
    // bornée à l'épaisseur de marge pour ne pas mordre la zone utile.
    var baseLen = (opts && opts.length != null) ? opts.length : 7;
    var wantLen = iwRegDiam(opts && opts.regDiam);
    function clampToMargin(mt) {
        var maxByMargin = (mt > 0) ? mt * 0.9 : wantLen;
        var L = Math.min(wantLen, maxByMargin);
        if (L < 3) L = 3;
        return L;
    }

    // mire (croix DANS un cercle, OU mire perso si fournie), centrée en (x,y)
    function regCross(x, y, len) {
        iwPlaceRegMark(page, layer, x, y, len, opts, color, w);
    }

    // croix centrale exacte (référence du centre de page) — simple croix
    if (doCross) {
        var lc = wantLen;
        addLine(page, layer, color, w, cx - lc, cy, cx + lc, cy);
        addLine(page, layer, color, w, cx, cy - lc, cx, cy + lc);
    }

    // 4 mires sur les bords (haut/bas/gauche/droite), CENTRÉES dans la marge
    regCross(cx, axisTop,    clampToMargin(m.top));     // bord haut
    regCross(cx, axisBottom, clampToMargin(m.bottom));  // bord bas
    regCross(axisLeft,  cy,  clampToMargin(m.left));    // bord gauche
    regCross(axisRight, cy,  clampToMargin(m.right));   // bord droit

    // 4 mires de COIN, centrées sur l'intersection des axes de marge.
    //   Taille bornée à la PLUS PETITE des deux marges du coin pour rester
    //   dans la zone de marge sans mordre la zone utile.
    function cornerLen(a, bb) {
        var aa = (a > 0) ? a : 99999, b2 = (bb > 0) ? bb : 99999;
        return clampToMargin(Math.min(aa, b2));
    }
    regCross(axisLeft,  axisTop,    cornerLen(m.left,  m.top));      // coin haut-gauche
    regCross(axisRight, axisTop,    cornerLen(m.right, m.top));      // coin haut-droit
    regCross(axisLeft,  axisBottom, cornerLen(m.left,  m.bottom));   // coin bas-gauche
    regCross(axisRight, axisBottom, cornerLen(m.right, m.bottom));   // coin bas-droit

    // CADRE DE COUPE (page) : rectangle passant EXACTEMENT par les CENTRES
    //   des 4 mires de coin (axisLeft/axisRight × axisTop/axisBottom). Couper
    //   le long de ce cadre fait passer la coupe pile au centre de chaque mire.
    //   Optionnel (opts.cutFrame).
    if (opts && opts.cutFrame) {
        var cutFrame = page.rectangles.add(layer);
        cutFrame.geometricBounds = [axisTop, axisLeft, axisBottom, axisRight];
        cutFrame.fillColor = none;
        cutFrame.strokeColor = color;
        cutFrame.strokeWeight = w;
    }
}

// ─────────────────────────────────────────────────────────────────────
//  CROIX DE BORD SUPPLÉMENTAIRES — à intervalle régulier sur les 4 bords.
//  Trace des croix le long des bords (haut, bas, gauche, droite), espacées
//  de `opts.sideStep` mm. Les marques de CENTRE ne sont JAMAIS supprimées
//  (elles sont posées par addPageCenterMarks). En SÉRIGRAPHIE, on évite la
//  zone réservée aux couleurs : coin HAUT-GAUCHE et coin BAS-GAUCHE.
//  pageBounds = [t,l,b,r] page entière (mm).
//  opts.sideStep    = intervalle entre croix (mm), défaut 40.
//  opts.colorStyle  = "seri" => réserve les coins gauches.
//  opts.colorReserve = marge réservée (mm) le long du bord gauche (haut/bas).
// ─────────────────────────────────────────────────────────────────────
function addPageSideCrosses(page, layer, pageBounds, opts) {
    var doc   = app.activeDocument;
    var color = getRegistrationColor(doc);
    var none  = doc.swatches.itemByName("None");
    var t = pageBounds[0], l = pageBounds[1], b = pageBounds[2], r = pageBounds[3];
    var cx = (l + r) / 2, cy = (t + b) / 2;
    var w    = (opts && opts.weight != null) ? opts.weight : 0.25;
    var step = (opts && opts.sideStep != null && opts.sideStep > 0) ? opts.sideStep : 40;
    var isSeri = (opts && opts.colorStyle === "seri");
    var reserve = (opts && opts.colorReserve != null) ? opts.colorReserve : 70;

    // marges de la page (pour centrer les croix dans l'épaisseur de marge)
    var m = (opts && opts.margins) ? opts.margins : { top: 0, left: 0, bottom: 0, right: 0 };
    // axes : milieu de l'épaisseur de chaque marge
    var axisTop    = t + (m.top    || 0) / 2;
    var axisBottom = b - (m.bottom || 0) / 2;
    var axisLeft   = l + (m.left   || 0) / 2;
    var axisRight  = r - (m.right  || 0) / 2;

    // V2 — taille de la croix+cercle : MÊME diamètre que toutes les autres
    // mires. Ce site multipliait la longueur de repère par 1,6 (soit 11,2 mm
    // par défaut) et échappait au plafond : d'où des mires de bord bien plus
    // grosses que celles des coins, sur la même planche.
    var wantLen = iwRegDiam(opts && opts.regDiam);
    function clampToMargin(marginThickness) {
        // diamètre du cercle <= ~90% de l'épaisseur de marge
        var maxByMargin = (marginThickness > 0) ? marginThickness * 0.9 : wantLen;
        var L = Math.min(wantLen, maxByMargin);
        if (L < 1) L = 1;                   // visibilité minimale
        return L;
    }

    // croix DANS un cercle (OU mire perso si fournie), centrée en (x,y)
    function regCross(x, y, len) {
        iwPlaceRegMark(page, layer, x, y, len, opts, color, w);
    }

    var lenH = clampToMargin(m.top);        // sur bords haut/bas
    var lenHb = clampToMargin(m.bottom);
    var lenV = clampToMargin(m.left);       // sur bords gauche/droite
    var lenVr = clampToMargin(m.right);

    // distance à garder LIBRE près de chaque coin : on s'arrête avant les
    // angles pour ne pas empiéter sur les mires de coin ni encombrer les coins.
    var ccg = (opts && opts.crossCornerGap != null) ? opts.crossCornerGap : 6;
    // marge LIBRE près des coins : on double la taille de croix + le gap, pour
    // garantir qu'AUCUNE croix ne tombe dans (ni près d') un coin. Réglable via
    // « marge d'angle » dans Réglages (ccg).
    function cornerClear(len) { return len * 2 + ccg; }
    var clrX = cornerClear(Math.max(lenH, lenHb));
    var clrY = cornerClear(Math.max(lenV, lenVr));

    // ZONE RÉSERVÉE AUX COULEURS, le long des bords HAUT et BAS, calculée par
    // iwExecute d'après le NOMBRE RÉEL de pastilles (les rectangles du bas
    // peuvent dépasser le centre). Toute croix qui y tombe est supprimée.
    var cz = (opts && opts.colorZone) ? opts.colorZone : null;
    function inColorZone(x, edge) {
        if (!cz || cz.vertical) return false;   // zone horizontale (haut/bas) uniquement
        var lo, hi;
        if (edge === "bottom") { lo = cz.botLo; hi = cz.botHi; }
        else                   { lo = cz.topLo; hi = cz.topHi; }
        if (lo == null || hi == null || hi <= lo) return false;
        return (x >= lo - 4 && x <= hi + 4);
    }
    function inColorZoneY(y, edge) {
        if (!cz || !cz.vertical) return false;  // zone verticale (gauche/droite) uniquement
        var lo, hi;
        if (edge === "right") { lo = cz.rightLo; hi = cz.rightHi; }
        else                  { lo = cz.leftLo;  hi = cz.leftHi; }
        if (lo == null || hi == null || hi <= lo) return false;
        return (y >= lo - 4 && y <= hi + 4);
    }

    // — bords HAUT et BAS : balayage en X depuis le centre, arrêt avant les
    //   coins, en sautant la zone des couleurs —
    for (var dx = step; cx + dx <= r - clrX; dx += step) {
        var xr = cx + dx;
        if (!inColorZone(xr, "top"))    regCross(xr, axisTop, lenH);
        if (!inColorZone(xr, "bottom")) regCross(xr, axisBottom, lenHb);
        var xl = cx - dx;
        if (xl >= l + clrX) {
            if (!inColorZone(xl, "top"))    regCross(xl, axisTop, lenH);
            if (!inColorZone(xl, "bottom")) regCross(xl, axisBottom, lenHb);
        }
    }

    // — bords GAUCHE et DROIT : balayage en Y depuis le centre, arrêt avant
    //   les coins (les pastilles couleurs sont sur haut/bas, pas ici) —
    for (var dy = step; cy + dy <= b - clrY; dy += step) {
        var yb = cy + dy, yt = cy - dy;
        if (!inColorZoneY(yb, "right")) regCross(axisRight, yb, lenVr);
        if (!inColorZoneY(yt, "right")) regCross(axisRight, yt, lenVr);
        if (yt >= t + clrY && !inColorZoneY(yt, "left")) regCross(axisLeft, yt, lenV);
        if (yb <= b - clrY && !inColorZoneY(yb, "left")) regCross(axisLeft, yb, lenV);
    }
}

// Crée si besoin les nuances de la color bar et renvoie le tableau
function iwEnsureColorBarSwatches(doc) {
    function mk(name, c, m, y, k) {
        var sw;
        try { sw = doc.colors.itemByName(name); if (sw.isValid) return sw; } catch (e) {}
        sw = doc.colors.add();
        sw.name = name;
        sw.model = ColorModel.PROCESS;
        sw.space = ColorSpace.CMYK;
        sw.colorValue = [c, m, y, k];
        return sw;
    }
    return [
        mk("IW_C", 100, 0, 0, 0),
        mk("IW_M", 0, 100, 0, 0),
        mk("IW_Y", 0, 0, 100, 0),
        mk("IW_K", 0, 0, 0, 100),
        mk("IW_50K", 0, 0, 0, 50)
    ];
}

// ─────────────────────────────────────────────────────────────────────
//  COULEURS UTILISÉES — collecte des nuances appliquées sur la sélection
//  Parcourt les objets sélectionnés (et leur contenu : groupes, textes)
//  et renvoie la liste DÉDUPLIQUÉE des swatches réellement employés en
//  fond ou contour. Ignore [None], [Paper] et la couleur [Registration].
//  Renvoie un tableau d'objets { swatch, name } dans l'ordre de découverte.
// ─────────────────────────────────────────────────────────────────────
function iwCollectUsedColors(items) {
    var doc = app.activeDocument;
    var seen = {};      // nom -> true (déduplication)
    var out  = [];      // { swatch, name }
    var skip = { "None": true, "Paper": true, "Registration": true,
                 "[None]": true, "[Paper]": true, "[Registration]": true };

    function consider(sw) {
        if (!sw) return;
        // résout une TEINTE (Tint) vers sa couleur de base : un objet rempli
        // d'une teinte d'un ton direct expose un swatch « Tint » dont le nom
        // diffère du nom de base dans le Nuancier -> on remonte à la base.
        try {
            if (sw.constructor && String(sw.constructor.name) === "Tint" && sw.baseColor) {
                sw = sw.baseColor;
            }
        } catch (eTint) {}
        var nm;
        try { nm = sw.name; } catch (e) { return; }
        if (nm == null || nm === "") return;
        if (skip[nm]) return;
        if (seen[nm]) return;
        // ne garder que des nuances valides du document
        try { if (!sw.isValid) return; } catch (e2) {}
        seen[nm] = true;
        out.push({ swatch: sw, name: nm });
    }

    function fromItem(it) {
        if (!it) return;
        // fond / contour de l'objet
        try { consider(it.fillColor); }   catch (e) {}
        try { consider(it.strokeColor); } catch (e) {}
        // textes : couleurs des caractères
        try {
            if (it.texts && it.texts.length > 0) {
                var chars = it.parentStory ? it.parentStory.characters : null;
                if (chars) {
                    // échantillonnage : on lit les nuances par "runs" si dispo,
                    // sinon chaque caractère (borné pour rester rapide).
                    var lim = Math.min(chars.length, 5000);
                    for (var ci = 0; ci < lim; ci++) {
                        try { consider(chars[ci].fillColor); } catch (e3) {}
                    }
                }
            }
        } catch (e4) {}
        // GRAPHIQUES PLACÉS (image/PDF/AI/EPS dans le cadre) : on lit les
        // nuances/séparations qu'ils utilisent. Pour un PDF/AI/EPS avec tons
        // directs, ces nuances sont présentes dans le document après import.
        try {
            if (it.graphics && it.graphics.length > 0) {
                for (var gi = 0; gi < it.graphics.length; gi++) {
                    var gr = it.graphics[gi];
                    // COLORISATION d'une image matricielle (PNG/TIFF en niveaux
                    // de gris ou 1 bit teintée avec une nuance) : la couleur
                    // appliquée vit sur le graphique lui-même -> on la lit ici.
                    // C'est LE cas riso/sérigraphie qui était manqué avant.
                    try { consider(gr.fillColor); }   catch (egf) {}
                    try { consider(gr.strokeColor); } catch (egs) {}
                    // swatches utilisées par le graphique (selon le type)
                    try {
                        if (gr.swatches && gr.swatches.length) {
                            for (var s1 = 0; s1 < gr.swatches.length; s1++) consider(gr.swatches[s1]);
                        }
                    } catch (eg1) {}
                    // certaines versions exposent les séparations d'un EPS/PDF
                    try {
                        if (gr.separations && gr.separations.length) {
                            for (var s2 = 0; s2 < gr.separations.length; s2++) {
                                var sep = gr.separations[s2];
                                // une séparation peut pointer une nuance via .name
                                try { consider(doc.swatches.itemByName(sep.name)); } catch (eSep) {}
                            }
                        }
                    } catch (eg2) {}
                }
            }
        } catch (eGfx) {}
        // groupes : récursion sur les enfants
        try {
            if (it.allPageItems && it.allPageItems.length) {
                for (var k = 0; k < it.allPageItems.length; k++) fromItem(it.allPageItems[k]);
            } else if (it.pageItems && it.pageItems.length) {
                for (var k2 = 0; k2 < it.pageItems.length; k2++) fromItem(it.pageItems[k2]);
            }
        } catch (e5) {}
    }

    if (items) for (var i = 0; i < items.length; i++) fromItem(items[i]);
    return out;
}

// ─────────────────────────────────────────────────────────────────────
//  COULEURS DEPUIS LE NUANCIER — lit DIRECTEMENT les nuances du panneau
//  Nuancier du document (doc.swatches), sans dépendre de ce qui est
//  sélectionné ni de la détection sur les objets. C'est ce que l'on veut
//  pour les pastilles couleurs de page : le script « prend les couleurs
//  dans le nuancier ».
//  Renvoie un tableau { swatch, name } (même format que iwCollectUsedColors),
//  directement utilisable par addPageColorMarks().
//  On écarte uniquement les entrées SYSTÈME ([Sans]/[Papier]/[Repérage]) et
//  les GROUPES d'encres mélangées (non applicables comme couleur de fond).
//  Les couleurs unies, tons (tints), dégradés et encres mélongées simples
//  sont conservés. Black/Cyan/Magenta/Yellow par défaut sont inclus s'ils
//  sont dans le nuancier (ce sont des nuances du nuancier).
// ─────────────────────────────────────────────────────────────────────
function iwCollectNuancierColors(doc) {
    var out  = [];
    var seen = {};
    var skip = { "None": true, "Paper": true, "Registration": true,
                 "[None]": true, "[Paper]": true, "[Registration]": true };
    var swl;
    try { swl = doc.swatches; } catch (eS) { return out; }
    for (var i = 0; i < swl.length; i++) {
        var s = swl[i], nm;
        try { nm = s.name; } catch (eN) { continue; }
        if (nm == null || nm === "") continue;
        if (skip[nm]) continue;
        if (seen[nm]) continue;
        try { if (!s.isValid) continue; } catch (eV) {}
        // écarter les GROUPES d'encres mélangées (conteneurs, pas une couleur)
        try { if (s.constructor && String(s.constructor.name) === "MixedInkGroup") continue; } catch (eG) {}
        seen[nm] = true;
        out.push({ swatch: s, name: nm });
    }
    return out;
}

// ═════════════════════════════════════════════════════════════════════
//  LISTE DES ENCRES À SÉPARER — comme le menu Sortie d'InDesign.
//  NOTE : l'Ink Manager d'InDesign est sur app.inkManager (pas doc.inkManager).
//  SOURCE FIABLE : les NUANCES du document (doc.swatches), qui correspondent
//  aux encres séparables. On prend toutes les nuances de couleur (quadri ET
//  tons directs), on exclut les entrées système ([Sans]/[Papier]/[Repérage])
//  et les groupes d'encres mélangées.
//  Renvoie un tableau d'objets { name } (le nom suffit : à l'export on
//  retrouve l'encre par son nom dans l'Ink Manager).
// ═════════════════════════════════════════════════════════════════════
function iwListInks(doc) {
    var out = [], seen = {};
    var skip = { "none": true, "paper": true, "registration": true,
                 "[none]": true, "[paper]": true, "[registration]": true };

    function add(nm, rgb) {
        if (nm == null || nm === "") return;
        var low = String(nm).toLowerCase();
        if (skip[low]) return;
        if (seen[low]) return;
        seen[low] = true;
        out.push({ name: String(nm), rgb: rgb || null });
    }

    // convertit un swatch en RGB 0..255 approximatif pour la pastille d'aperçu.
    function swatchRGB(s) {
        try {
            var v = s.colorValue;       // [C,M,Y,K] ou [R,G,B] ou [L,a,b]
            var model = null; try { model = s.space; } catch (eSp) {}
            if (v && v.length === 4) {   // CMJN -> RGB
                var c = v[0] / 100, m = v[1] / 100, y = v[2] / 100, k = v[3] / 100;
                var r = Math.round(255 * (1 - c) * (1 - k));
                var g = Math.round(255 * (1 - m) * (1 - k));
                var b = Math.round(255 * (1 - y) * (1 - k));
                return [r, g, b];
            }
            if (v && v.length === 3) {
                // si l'espace est RGB, on prend tel quel ; sinon (Lab) approx grossière
                try {
                    if (model === ColorSpace.RGB) return [Math.round(v[0]), Math.round(v[1]), Math.round(v[2])];
                } catch (eM2) {}
                // Lab -> approximation très simple via L (clarté) en gris
                var L = v[0]; var gg = Math.round(255 * (L / 100));
                return [gg, gg, gg];
            }
        } catch (eCV) {}
        return null;
    }

    // (1) SOURCE PRINCIPALE : les nuances du document.
    try {
        var swl = doc.swatches;
        for (var i = 0; i < swl.length; i++) {
            var s = swl[i], nm, rgb;
            try { nm = s.name; } catch (eN) { continue; }
            try { if (!s.isValid) continue; } catch (eV) {}
            // écarte les GROUPES d'encres mélangées (conteneurs)
            try { if (s.constructor && String(s.constructor.name) === "MixedInkGroup") continue; } catch (eG) {}
            rgb = swatchRGB(s);
            // ne garde que les NUANCES de couleur (Color), pas les dégradés/tints
            // purs sans encre propre. On reste permissif : tout swatch nommé
            // non-système est une encre potentielle.
            add(nm, rgb);
        }
    } catch (eSw) {}

    // (2) COMPLÉMENT : encres du document. Dans InDesign, les encres sont sur
    //     doc.inks (collection Inks du DOCUMENT) — pas inkManager (inexistant
    //     dans cette version), pas app.inks (seulement les 4 process globales).
    try {
        var coll = doc.inks;
        var len = 0; try { len = coll.length; } catch (eL) { len = 0; }
        for (var k = 0; k < len; k++) {
            try { add(coll[k].name, null); } catch (eK) {}
        }
        if (len === 0) {
            try {
                var ev = coll.everyItem().getElements();
                for (var ej = 0; ej < ev.length; ej++) { try { add(ev[ej].name, null); } catch (eEj) {} }
            } catch (eEvery) {}
        }
    } catch (eIM) {}

    return out;
}

// ═════════════════════════════════════════════════════════════════════
//  EXPORT DES FILMS — un PDF par encre SÉLECTIONNÉE, NOIR sur BLANC.
//  `selNames` = tableau de NOMS d'encres (ceux cochés par l'utilisateur).
//  Méthode NON DESTRUCTIVE via l'Ink Manager : pour isoler une encre, on met
//  printInk=true pour CETTE encre + [Repérage] (les repères de coupe/mires
//  sont en Repérage, donc présents sur chaque film) et printInk=false pour
//  toutes les autres. Export en NIVEAUX DE GRIS -> l'encre ressort en noir.
//  On restaure tous les printInk d'origine à la fin.
//  Codes retour : nombre de films (>=0), -1 aucune encre, -2 aucun preset PDF.
// ═════════════════════════════════════════════════════════════════════
// ═════════════════════════════════════════════════════════════════════
//  EXPORT DES FILMS — un PDF par encre SÉLECTIONNÉE, NOIR sur BLANC.
//  `selNames` = tableau de NOMS d'encres (cochés par l'utilisateur).
//  Méthode NON DESTRUCTIVE : pour isoler une encre, on bascule printInk via
//  l'Ink Manager EN RETROUVANT chaque encre PAR SON NOM (itemByName), ce qui
//  fonctionne même quand l'itération de la collection échoue. On garde
//  [Repérage] imprimante (repères présents sur chaque film). Export en
//  NIVEAUX DE GRIS -> l'encre ressort en noir. Restauration à la fin.
//  Codes retour : nombre de films (>=0), -2 aucun preset PDF, -3 erreur.
// ═════════════════════════════════════════════════════════════════════
//  PAGE ACTIVE VIDE ? — vrai si la page active ne contient aucun objet
//  (hors éléments de gabarit). Sert à décider si « Exporter » doit d'abord
//  créer l'imposition.
// ═════════════════════════════════════════════════════════════════════
function iwActivePageIsEmpty(doc) {
    try {
        var pg = doc.layoutWindows[0].activePage;
        if (!pg) pg = doc.pages[0];
        var n = 0;
        try { n = pg.pageItems.length; } catch (e) { n = 0; }
        return (n === 0);
    } catch (eP) {
        // en cas de doute, on considère NON vide (on n'impose pas par erreur)
        return false;
    }
}

// ─────────────────────────────────────────────────────────────────────
//  V20 — CAPTURE + RENOMMAGE DU PDF FRAÎCHEMENT CRÉÉ
//  Beaucoup d'imprimantes PDF virtuelles IGNORENT le nom/destination qu'on
//  leur donne (printFile) : elles écrivent le PDF où elles veulent, sous
//  LEUR nom. Plutôt que de lutter, on RETROUVE le fichier qui vient
//  d'apparaître puis on le déplace/renomme vers le nom voulu.
//
//  Méthode : avant d'imprimer, on note l'ensemble des PDF déjà présents dans
//  les dossiers CANDIDATS (destination + emplacements par défaut fréquents
//  des imprimantes PDF). Après impression, on cherche le PDF qui n'était pas
//  là (ou dont la date de modification est postérieure au début du job) et on
//  le renomme. iwSnapshotPdfs renvoie une table {chemin: mtime}.
// ─────────────────────────────────────────────────────────────────────
function iwPdfSearchFolders(destFolder, doc) {
    // dossiers où chercher le PDF créé, dans l'ordre de préférence.
    var list = [];
    function push(f) {
        if (!f) return;
        try { if (f.exists) { for (var i = 0; i < list.length; i++) if (list[i].fsName === f.fsName) return; list.push(f); } } catch (e) {}
    }
    push(destFolder);                                   // 1) le dossier choisi
    // 2) dossier PARENT du document InDesign (le pilote y écrit souvent)
    try { if (doc && doc.saved && doc.fullName && doc.fullName.parent) push(doc.fullName.parent); } catch (eDP) {}
    try { push(Folder.desktop); } catch (e1) {}         // 3) Bureau
    try { push(Folder(Folder.myDocuments)); } catch (e2) {} // 4) Documents
    try { push(Folder("~")); } catch (e3) {}            // 5) dossier utilisateur
    try { push(Folder("~/Downloads")); } catch (e4) {}  // 6) Téléchargements
    try { if (Folder.temp) push(Folder.temp); } catch (e5) {} // 7) dossier temp
    return list;
}
function iwSnapshotPdfs(folders) {
    var snap = {};
    for (var i = 0; i < folders.length; i++) {
        var files;
        try { files = folders[i].getFiles("*.pdf"); } catch (eGF) { files = null; }
        if (!files) { try { files = folders[i].getFiles(function (f) { return (f instanceof File) && /\.pdf$/i.test(f.name); }); } catch (eGF2) { files = null; } }
        if (files) for (var j = 0; j < files.length; j++) {
            var f = files[j];
            if (!(f instanceof File)) continue;
            var mt = 0; try { mt = f.modified ? f.modified.getTime() : 0; } catch (eMt) {}
            snap[f.fsName] = mt;
        }
    }
    return snap;
}
// Trouve le PDF apparu/modifié APRÈS `sinceMs` et absent du `beforeSnap`,
// le plus récent d'abord. Renvoie un File ou null.
function iwFindNewPdf(folders, beforeSnap, sinceMs) {
    var best = null, bestMt = -1;
    for (var i = 0; i < folders.length; i++) {
        var files;
        try { files = folders[i].getFiles("*.pdf"); } catch (eGF) { files = null; }
        if (!files) { try { files = folders[i].getFiles(function (f) { return (f instanceof File) && /\.pdf$/i.test(f.name); }); } catch (eGF2) { files = null; } }
        if (files) for (var j = 0; j < files.length; j++) {
            var f = files[j];
            if (!(f instanceof File)) continue;
            var mt = 0; try { mt = f.modified ? f.modified.getTime() : 0; } catch (eMt) {}
            var known = beforeSnap.hasOwnProperty(f.fsName);
            var knownMt = known ? beforeSnap[f.fsName] : -1;
            // candidat = nouveau fichier OU fichier ré-écrit depuis le début du job
            var isNew = (!known) || (mt > knownMt);
            var afterStart = (mt >= (sinceMs - 1500)); // tolérance horloge/FS
            if (isNew && afterStart && mt > bestMt) { best = f; bestMt = mt; }
        }
    }
    return best;
}
// V20 — retourne TOUS les PDF apparus/modifiés depuis `sinceMs` (absents du
//   beforeSnap OU ré-écrits), triés par date de modification CROISSANTE (le
//   plus ancien d'abord = 1re encre imprimée). Sert à apparier l'ordre
//   d'impression avec les fichiers réellement produits.
function iwFindNewPdfsSorted(folders, beforeSnap, sinceMs) {
    var hits = [];
    var seenPath = {};
    for (var i = 0; i < folders.length; i++) {
        var files;
        try { files = folders[i].getFiles("*.pdf"); } catch (eGF) { files = null; }
        if (!files) { try { files = folders[i].getFiles(function (f) { return (f instanceof File) && /\.pdf$/i.test(f.name); }); } catch (eGF2) { files = null; } }
        if (files) for (var j = 0; j < files.length; j++) {
            var f = files[j];
            if (!(f instanceof File)) continue;
            if (seenPath[f.fsName]) continue;   // évite les doublons entre dossiers
            var mt = 0; try { mt = f.modified ? f.modified.getTime() : 0; } catch (eMt) {}
            var known = beforeSnap.hasOwnProperty(f.fsName);
            var knownMt = known ? beforeSnap[f.fsName] : -1;
            var isNew = (!known) || (mt > knownMt);
            var afterStart = (mt >= (sinceMs - 2000)); // tolérance horloge/FS
            if (isNew && afterStart) { seenPath[f.fsName] = true; hits.push({ f: f, mt: mt }); }
        }
    }
    hits.sort(function (a, b) { return a.mt - b.mt; });   // ancien -> récent
    var out = [];
    for (var h = 0; h < hits.length; h++) out.push(hits[h].f);
    return out;
}
function iwRenamePdfTo(srcFile, destFolder, finalName) {
    if (!srcFile) return null;
    var target = new File(destFolder.fsName + "/" + finalName + ".pdf");
    try { if (target.exists && target.fsName !== srcFile.fsName) target.remove(); } catch (eRm) {}
    if (srcFile.fsName === target.fsName) return target;   // déjà au bon endroit/nom
    var ok = false;
    // 1) tentative de déplacement direct (rapide, même volume)
    try { ok = srcFile.rename ? false : false; } catch (eR0) {}
    // File.rename ne change QUE le nom (même dossier). Si la source est déjà
    // dans le dossier de destination, on renomme ; sinon on copie puis on
    // supprime la source.
    try {
        var sameFolder = false;
        try { sameFolder = (srcFile.parent && destFolder && srcFile.parent.fsName === destFolder.fsName); } catch (eSF) {}
        if (sameFolder) {
            ok = srcFile.rename(finalName + ".pdf");
            if (ok) return new File(destFolder.fsName + "/" + finalName + ".pdf");
        }
    } catch (eRen) {}
    // 2) copie binaire puis suppression de la source
    try {
        ok = srcFile.copy(target);
        if (ok) { try { srcFile.remove(); } catch (eRm2) {} return target; }
    } catch (eCp) {}
    return ok ? target : null;
}

// ═════════════════════════════════════════════════════════════════════
//  EXPORT DES FILMS — IMPRESSION EN SÉPARATIONS (1 fichier par encre, noir).
//  L'export PDF ne fait PAS de séparations (toujours composite). On passe
//  donc par l'IMPRESSION : printPreferences.colorOutput = SEPARATIONS (vérifié
//  fonctionnel sur cette version), et pour chaque encre on n'imprime QUE cette
//  encre (printInk), vers l'imprimante virtuelle choisie (ex. « Imprimer au
//  PDF »). Marche AUSSI avec des .indd placés (séparation au niveau RIP).
//  `printerName` = nom de l'imprimante virtuelle (chaîne) ou null (défaut doc).
//  Codes retour : nombre de films (>=0), -2 pas d'imprimante, -3 erreur.
// ═════════════════════════════════════════════════════════════════════
// ─────────────────────────────────────────────────────────────────────
//  MARGE D'EXPORT AUTO — mesure de combien les objets DÉBORDENT du cadre
//  de page (croix de coin, crop marks…), sur TOUTES les pages, et renvoie
//  le pire débordement en POINTS. Le support sera alors « page + 2×ce
//  débordement » -> aucune croix coupée, et marge minimale.
//  IMPORTANT : à l'appel, l'unité de mesure est forcée en POINTS, donc
//  geometricBounds/visibleBounds sont déjà en points.
// ─────────────────────────────────────────────────────────────────────
function iwComputeMarkOverflowPt(doc, capPt) {
    // capPt (optionnel) : débordement MAX retenu (pt). Un objet traîné loin
    // hors page (note, élément oublié) ne doit PAS faire gonfler le support :
    // l'auto-marge ne sert qu'à contenir les croix/crop marks (quelques mm).
    // Au-delà du plafond, on ignore l'objet (il sera coupé, c'est voulu).
    var hasCap = (typeof capPt === "number" && capPt > 0);
    var worst = 0;   // plus grand débordement (pt) sur n'importe quel côté/page
    function bump(v) {
        if (v <= worst) return;
        if (hasCap && v > capPt) return;   // débord aberrant -> ignoré
        worst = v;
    }
    function consider(b, pgB) {
        // b = [t,l,b,r] de l'objet ; pgB = [t,l,b,r] de la page. Débordement
        // = combien l'objet sort de CHAQUE côté (0 si à l'intérieur).
        bump(pgB[0] - b[0]);   // au-dessus du bord haut
        bump(pgB[1] - b[1]);   // à gauche du bord gauche
        bump(b[2] - pgB[2]);   // sous le bord bas
        bump(b[3] - pgB[3]);   // à droite du bord droit
    }
    function scan(it, pgB) {
        var b = null;
        try { b = it.visibleBounds; } catch (e1) { b = null; }
        if (!b) { try { b = it.geometricBounds; } catch (e2) { b = null; } }
        if (b && b.length === 4) consider(b, pgB);
        try {
            if (it.allPageItems && it.allPageItems.length) {
                for (var k = 0; k < it.allPageItems.length; k++) scan(it.allPageItems[k], pgB);
            }
        } catch (e3) {}
    }
    try {
        for (var p = 0; p < doc.pages.length; p++) {
            var pg = doc.pages[p];
            var pgB = pg.bounds;   // [t,l,b,r] en POINTS
            var items = pg.pageItems;
            for (var i = 0; i < items.length; i++) scan(items[i], pgB);
        }
    } catch (eAll) {}
    if (worst < 0) worst = 0;
    return worst;
}

function iwExportInkFilms(doc, destFolder, selNames, printerName, baseName) {
    if (!selNames || selNames.length === 0) { IW_FILMS_LAST_ERR = "selNames vide (code -10)"; return -3; }

    var inksColl;
    try { inksColl = doc.inks; } catch (eM) { IW_FILMS_LAST_ERR = "doc.inks a levé : " + (eM.message || eM) + " (code -11)"; return -3; }
    if (!inksColl) { IW_FILMS_LAST_ERR = "doc.inks est nul (code -12)"; return -3; }

    function inkByName(nm) {
        var ink = null;
        try { ink = inksColl.itemByName(nm); } catch (e1) {}
        try { if (ink && ink.isValid) return ink; } catch (e2) {}
        return null;
    }

    // liste des NOMS d'encres à manipuler (sélectionnées + toutes + [Repérage])
    var allNames = [], seenN = {};
    function pushName(nm) {
        if (!nm) return; var low = String(nm).toLowerCase();
        if (seenN[low]) return; seenN[low] = true; allNames.push(String(nm));
    }
    var listed = iwListInks(doc);
    for (var li = 0; li < listed.length; li++) pushName(listed[li].name);
    for (var si = 0; si < selNames.length; si++) pushName(selNames[si]);
    var regName = null;
    try { var rTest = inksColl.itemByName("[Registration]"); if (rTest && rTest.isValid) regName = "[Registration]"; } catch (eR1) {}
    if (!regName) { try { var rT2 = inksColl.itemByName("Registration"); if (rT2 && rT2.isValid) regName = "Registration"; } catch (eR2) {} }

    // sauvegarde printInk (pour restaurer)
    var savedNames = [], savedVals = [];
    function saveInk(nm) {
        var ink = inkByName(nm); if (!ink) return;
        var v = true; try { v = ink.printInk; } catch (eS) {}
        savedNames.push(nm); savedVals.push(v);
    }
    for (var an = 0; an < allNames.length; an++) saveInk(allNames[an]);
    if (regName) saveInk(regName);

    // ── PRÉPARATION DE L'IMPRESSION ─────────────────────────────────────
    var pp = doc.printPreferences;
    // sauvegarde de l'état d'impression (pour restaurer)
    var savedPrintProps = null;
    try { savedPrintProps = pp.properties; } catch (eSPr) {}

    // 1) imprimante : on cible l'imprimante virtuelle demandée (par son nom).
    try { if (printerName) pp.printer = printerName; } catch (ePrinter) {
        IW_FILMS_LAST_ERR = "imprimante « " + printerName + " » refusée : " + (ePrinter.message || ePrinter) + " (code -15)";
        return -2;
    }

    // 2) mode SÉPARATIONS (vérifié OK sur cette version)
    try { pp.colorOutput = ColorOutputModes.SEPARATIONS; }
    catch (eCO) { IW_FILMS_LAST_ERR = "colorOutput=SEPARATIONS refusé : " + (eCO.message || eCO) + " (code -16)"; return -3; }

    // 2b) V20 — On NE force PAS printToFile. Explication : `printToFile=true`
    //   redirige la sortie vers un fichier PostScript sur certains pilotes, ce
    //   qui casserait un pilote PDF normal. On laisse donc l'imprimante PDF
    //   fonctionner NORMALEMENT ; le nom voulu est appliqué de DEUX façons
    //   complémentaires : (1) on passe quand même `printFile` (les pilotes
    //   coopératifs l'honorent) ; (2) sinon, on RETROUVE le PDF fraîchement
    //   écrit et on le RENOMME (voir la boucle d'impression). Robuste quel que
    //   soit le pilote.
    try { pp.printToFile = false; } catch (ePTF) {}

    // 3) réglages d'impression sûrs (enveloppés : on n'insiste pas si absents)
    try { pp.pageRange = PageRange.ALL_PAGES; } catch (e) {}
    try { pp.printSpreads = false; } catch (e) {}
    // pas de fonds perdus ni ligne-bloc (sinon déborde de la page)
    try { pp.useDocumentBleedToPrint = false; } catch (e) {}
    try { pp.bleedTop = 0; pp.bleedBottom = 0; pp.bleedInside = 0; pp.bleedOutside = 0; } catch (e) {}
    try { pp.includeSlugToPrint = false; } catch (e) {}
    try { pp.bleedMarks = false; } catch (e) {}

    // ── TAILLE DE SUPPORT = PAGE + MARGE ANTI-ROGNAGE DES CROIX ─────────
    //  Le support par défaut est un format PRÉDÉFINI (« A3 sans bordure ») qui
    //  VERROUILLE paperWidth/paperHeight. Il faut d'abord paperSize = CUSTOM,
    //  PUIS fixer les dimensions.
    //  PIÈGE D'UNITÉS : documentPreferences.pageWidth est dans l'UNITÉ du doc
    //  (souvent les MM) tandis que paperWidth/paperHeight attendent des POINTS.
    //  On force donc la lecture en POINTS via scriptPreferences.
    //  MARGE : les mires de coin de Blueprint sont posées au bord de la page et
    //  leurs bras peuvent DÉPASSER -> si le support fait pile la taille de la
    //  page, le bout extérieur des croix est COUPÉ. On mesure donc le débordement
    //  RÉEL des objets et on ajoute exactement ce qu'il faut (marge AUTO,
    //  identique partout, page centrée). Aucune croix coupée, marge minimale.
    var savedMU = null;
    try { savedMU = app.scriptPreferences.measurementUnit; } catch (eMU) {}
    try { app.scriptPreferences.measurementUnit = MeasurementUnits.POINTS; } catch (eSU) {}

    // échelle 100 % (aucune réduction) et page CENTRÉE sur le support (un peu plus
    // grand) -> marge égale tout autour, les croix de coin tiennent en entier.
    // IMPORTANT : on pose l'échelle/centrage AVANT le paperSize. Sur certaines
    // versions, changer scaleMode re-verrouille paperWidth/paperHeight ; en le
    // faisant d'abord, le CUSTOM posé ensuite n'est plus écrasé.
    try { pp.scaleMode = ScaleModes.SCALE_WIDTH_HEIGHT; } catch (e) {}
    try { pp.scaleProportional = true; } catch (e) {}
    try { pp.scaleWidth = 100; pp.scaleHeight = 100; } catch (e) {}
    try { pp.pagePosition = PagePositions.CENTERED; } catch (e) {}

    try {
        var dp = doc.documentPreferences;
        var pwPt = dp.pageWidth, phPt = dp.pageHeight;   // en POINTS
        // MARGE AUTO : on mesure de combien les objets (croix de coin, crop
        // marks…) dépassent réellement du cadre de page, et on ajoute juste ce
        // qu'il faut de chaque côté pour ne RIEN couper. Page centrée -> on
        // ajoute 2× le débordement au support. Coussin = épaisseur de trait +
        // arrondi de l'imprimante (certaines imprimantes PDF arrondissent le
        // format au point/mm le plus proche). Si rien ne déborde, le PDF fait
        // pile la taille de la page (+ coussin minimal).
        // Plafond anti-aberration : l'auto-marge ne contient QUE les croix /
        // crop marks (au plus ~3 cm de bras). On borne à 90 mm (≈255 pt) pour
        // qu'un objet traîné loin hors page ne fasse pas exploser le support.
        var overPt = iwComputeMarkOverflowPt(doc, 255);
        var SAFE = (overPt > 0) ? 4 : 1;            // coussin (pt) : large = sûr
        var EDGE = Math.ceil((overPt + SAFE) * 2);  // total des deux côtés (pt)
        var wantW = pwPt + EDGE, wantH = phPt + EDGE;

        try { pp.paperSize = PaperSizes.CUSTOM; } catch (ePS) {}
        try { pp.paperHeight = wantH; } catch (eH) {}
        try { pp.paperWidth  = wantW; } catch (eW) {}

        // VÉRIFICATION : beaucoup d'imprimantes virtuelles PDF (p.ex. Flyingbee
        // « Print to PDF ») IGNORENT un format custom et retombent sur un format
        // standard plus petit -> les croix de coin sont coupées sans erreur. On
        // relit donc la taille réellement appliquée ; si elle est trop petite
        // (custom refusé), on bascule l'imposition vers le CENTRE d'une feuille
        // standard via pagePosition (déjà CENTERED) et on TENTE d'imposer la
        // taille via paperSize CUSTOM une 2e fois après avoir neutralisé l'offset.
        var okW = false, okH = false;
        try { okW = (pp.paperWidth  >= wantW - 1); } catch (eRW) {}
        try { okH = (pp.paperHeight >= wantH - 1); } catch (eRH) {}
        if (!okW || !okH) {
            // 2e tentative : repose CUSTOM puis dimensions (l'ordre PPD peut
            // exiger un re-set après lecture).
            try { pp.paperSize = PaperSizes.CUSTOM; } catch (e2a) {}
            try { pp.paperHeight = wantH; } catch (e2b) {}
            try { pp.paperWidth  = wantW; } catch (e2c) {}
            try { okW = (pp.paperWidth  >= wantW - 1); } catch (e2d) {}
            try { okH = (pp.paperHeight >= wantH - 1); } catch (e2e) {}
        }
        // mémo pour le diagnostic (visible si l'utilisateur ouvre IW_FILMS_LAST_ERR)
        IW_FILMS_PAPER_INFO = "want " + Math.round(wantW) + "x" + Math.round(wantH) +
            "pt, applied " + (function(){ try { return Math.round(pp.paperWidth) + "x" + Math.round(pp.paperHeight); } catch(eP){ return "?"; } })() +
            "pt, overflow " + (Math.round(overPt*10)/10) + "pt" +
            ((!okW || !okH) ? "  ⚠ CUSTOM REFUSÉ PAR L'IMPRIMANTE" : "");
    } catch (ePg) {}
    try { if (savedMU !== null) app.scriptPreferences.measurementUnit = savedMU; } catch (eRMU) {}
    // pas de repères imprimante ajoutés (les nôtres sont sur la planche)
    try { pp.cropMarks = false; pp.bleedMarks = false; pp.colorBars = false;
          pp.pageInformationMarks = false; pp.registrationMarks = false; } catch (e) {}

    var count = 0;
    var landed = 0;          // V20 — fichiers RÉELLEMENT créés au bon nom
    var missing = [];        // noms attendus mais introuvables après impression
    var firstErr = "";
    var sanitize = function (nm) {
        var s = String(nm);
        s = s.replace(/^\[/, "").replace(/\]$/, "");
        s = s.replace(/[\/\\:\*\?"<>\|]/g, "-");
        s = s.replace(/\s+/g, "_");
        return s;
    };
    // V20 — PRÉFIXE = NOM DE BASE choisi dans la fenêtre d'export (champ
    //   éditable), pré-rempli avec le nom du document. Chaque film est nommé
    //   « <NomDeBase>-<NomDeLaCouleur>.pdf ». Repli sur le nom du document
    //   puis « Document » si le paramètre est vide.
    var docBase = "";
    if (baseName != null) { try { docBase = String(baseName); } catch (eBN) { docBase = ""; } }
    if (!docBase || !docBase.length) {
        try {
            var dn = String(doc.name);                 // ex. « MonAffiche.indd »
            dn = dn.replace(/\.[Ii][Nn][Dd][DdTt]$/, ""); // retire .indd / .indt
            if (dn && dn.length) docBase = dn;
        } catch (eDN) {}
    }
    if (!docBase || !docBase.length) docBase = "Document";
    docBase = sanitize(docBase);

    // dossiers candidats où l'imprimante PDF est susceptible d'écrire. On y
    // ajoute le dossier PARENT du document (fréquent) et le dossier temporaire.
    var searchFolders = iwPdfSearchFolders(destFolder, doc);

    // ── PHASE 1 : IMPRIMER TOUTES LES ENCRES ────────────────────────────
    //   Le pilote PDF macOS ouvre sa PROPRE boîte « choisir le dossier » au
    //   1er print, puis réutilise ce dossier pour tout l'export. On ne peut
    //   donc PAS retrouver le fichier entre deux prints (la boîte bloque et le
    //   fichier n'existe pas encore). On imprime donc TOUT d'abord, en notant
    //   l'ordre des encres et l'instant de départ, PUIS on renomme (phase 2).
    var beforeSnap = iwSnapshotPdfs(searchFolders);   // état AVANT tout print
    var jobStart = (new Date()).getTime();
    var wantOrder = [];   // noms finaux voulus, dans l'ordre d'impression

    for (var k = 0; k < selNames.length; k++) {
        var targetName = selNames[k];
        var finalName = docBase + "-" + sanitize(targetName);   // sans extension

        // isole l'encre : seule CETTE encre (+ [Repérage]) imprime
        for (var a = 0; a < allNames.length; a++) {
            var ink = inkByName(allNames[a]);
            if (ink) { try { ink.printInk = false; } catch (eOff) {} }
        }
        var tInk = inkByName(targetName);
        if (tInk) { try { tInk.printInk = true; } catch (eOn) {} }
        if (regName) { var rInk = inkByName(regName); if (rInk) { try { rInk.printInk = true; } catch (eROn) {} } }

        try {
            // on donne quand même la cible au pilote (imprimantes coopératives).
            var outFile = new File(destFolder.fsName + "/" + finalName + ".pdf");
            try { pp.printFile = outFile; } catch (ePF) {}
            doc.print(false);   // le pilote demande le dossier au 1er appel
            count++;
            wantOrder.push(finalName);
        } catch (eEx) {
            if (firstErr === "") { try { firstErr = String(eEx.message || eEx); } catch (eMsg2) { firstErr = "?"; } }
            wantOrder.push(null);   // ce print a échoué : pas de fichier attendu
        }
    }

    // ── PHASE 2 : RETROUVER LES PDF CRÉÉS ET LES RENOMMER ───────────────
    //   Le pilote écrit de façon asynchrone : on laisse le temps au système,
    //   puis on cherche TOUS les PDF apparus depuis jobStart, triés par date
    //   (le plus ANCIEN = 1re encre imprimée). On les renomme dans l'ordre.
    try { $.sleep(1200); } catch (eS0) {}
    var found = iwFindNewPdfsSorted(searchFolders, beforeSnap, jobStart);
    // 2e chance si le pilote est lent : on ré-attend et on re-scanne.
    if (found.length < count) { try { $.sleep(2000); } catch (eS1) {} found = iwFindNewPdfsSorted(searchFolders, beforeSnap, jobStart); }
    if (found.length < count) { try { $.sleep(3000); } catch (eS2) {} found = iwFindNewPdfsSorted(searchFolders, beforeSnap, jobStart); }

    // Appariement ordre d'impression <-> fichiers trouvés (par date croissante).
    var fi = 0;
    for (var wi = 0; wi < wantOrder.length; wi++) {
        var wantName = wantOrder[wi];
        if (wantName == null) continue;   // print raté, rien à renommer
        if (fi >= found.length) { missing.push(wantName); continue; }
        var srcPdf = found[fi++];
        // si le pilote a DÉJÀ écrit au bon nom, rien à faire.
        var already = false;
        try { already = (srcPdf.parent && srcPdf.parent.fsName === destFolder.fsName &&
                         decodeURI(srcPdf.name).replace(/\.pdf$/i, "") === wantName); } catch (eAl) {}
        if (already) { landed++; continue; }
        var moved = iwRenamePdfTo(srcPdf, destFolder, wantName);
        if (moved) landed++; else missing.push(wantName);
    }

    // mémo pour la fin d'export
    IW_FILMS_LANDED = landed;
    IW_FILMS_MISSING = missing;

    // V20 — DIAGNOSTIC (utile seulement si le renommage a échoué) : liste des
    //   dossiers cherchés et des PDF détectés comme « nouveaux ».
    try {
        var diag = "Nom voulu : " + docBase + "-<couleur>.pdf\n";
        diag += "Films imprimés : " + count + "  |  renommés OK : " + landed + "\n\n";
        diag += "Dossiers cherchés :\n";
        for (var df = 0; df < searchFolders.length; df++) {
            var fn = "?"; try { fn = searchFolders[df].fsName; } catch (eFn) {}
            diag += "  • " + fn + "\n";
        }
        diag += "\nPDF détectés (nouveaux depuis le début de l'export) : " + found.length + "\n";
        for (var ff = 0; ff < found.length; ff++) {
            var nm = "?", pr = "?";
            try { nm = decodeURI(found[ff].name); } catch (eNm) {}
            try { pr = found[ff].parent ? found[ff].parent.fsName : "?"; } catch (ePr) {}
            diag += "  • " + nm + "   (dans " + pr + ")\n";
        }
        if (found.length === 0) {
            diag += "  (AUCUN PDF trouvé — le pilote écrit ailleurs, ou trop lentement.)\n";
        }
        IW_FILMS_DIAG = diag;
    } catch (eDiag) { IW_FILMS_DIAG = ""; }

    // RESTAURE (encres + préférences d'impression)
    for (var r2 = 0; r2 < savedNames.length; r2++) {
        var rk = inkByName(savedNames[r2]);
        if (rk) { try { rk.printInk = savedVals[r2]; } catch (eRest) {} }
    }
    try { if (savedPrintProps) pp.properties = savedPrintProps; } catch (eRP) {}

    if (count === 0 && firstErr !== "") { IW_FILMS_LAST_ERR = firstErr; return -3; }
    if (count === 0) {
        IW_FILMS_LAST_ERR = "boucle exécutée, 0 impression, 0 exception. " +
            "selNames=" + selNames.length + ", encres=" + allNames.length + " (code -14)";
        return -3;
    }
    IW_FILMS_LAST_ERR = "";
    return count;
}

// ═════════════════════════════════════════════════════════════════════
//  FENÊTRE DE SÉLECTION DES ENCRES + EXPORT
//  Liste toutes les encres (cases à cocher, tout coché par défaut), demande
//  le dossier, puis exporte. Affiche un récap. Gère les messages d'erreur.
// ═════════════════════════════════════════════════════════════════════
function iwRunInkExport() {
    if (app.documents.length === 0) { Window.alert(tr("alert_nodoc")); return; }
    var doc = app.activeDocument;
    var inks = iwListInks(doc);
    if (!inks || inks.length === 0) { Window.alert(tr("films_none")); return; }

    // fenêtre de sélection
    var w = new Window("dialog", tr("films_pick_title"));
    w.orientation = "column"; w.alignChildren = "fill"; w.margins = 16; w.spacing = 10;
    var hint = w.add("statictext", undefined, tr("films_pick_hint"), { multiline: true });
    hint.preferredSize = [440, 96];

    // V2 — la liste des encres DÉFILE. Elle était posée à plat dans la fenêtre :
    //  au-delà d'une dizaine d'encres (courant en séparation), la fenêtre
    //  dépassait de l'écran et les boutons du bas devenaient inatteignables.
    //  Un groupe « scrolling » plafonné à 240 px règle le cas sans rien changer
    //  au reste du dialogue.
    var listPanel;
    try {
        listPanel = w.add("group", undefined, { scrolling: true });
        listPanel.orientation = "column";
        listPanel.alignChildren = "left"; listPanel.margins = 10; listPanel.spacing = 4;
        listPanel.maximumSize = [460, 240];
        listPanel.preferredSize = [460, Math.min(240, 10 + inks.length * 22)];
    } catch (eLp) {
        listPanel = w.add("panel"); listPanel.orientation = "column";
        listPanel.alignChildren = "left"; listPanel.margins = 10; listPanel.spacing = 4;
    }
    var checks = [];
    for (var i = 0; i < inks.length; i++) {
        // une RANGÉE = pastille couleur + case à cocher (nom)
        var row = listPanel.add("group"); row.orientation = "row";
        row.alignChildren = "center"; row.spacing = 6;
        // pastille : panel dessiné dans la couleur d'aperçu de l'encre
        var sw = row.add("panel"); sw.preferredSize = [16, 16]; sw.maximumSize = [16, 16];
        sw.inkRGB = inks[i].rgb;   // mémorise la couleur sur l'objet
        sw.onDraw = (function (rgbVal) {
            return function () {
                var g = this.graphics;
                var W = this.size[0], H = this.size[1];
                // cadre gris
                var frame = g.newPen(g.PenType.SOLID_COLOR, [0.5, 0.5, 0.5, 1], 1);
                // remplissage : couleur de l'encre, ou damier gris si inconnue
                var rr = rgbVal ? rgbVal[0] / 255 : 0.8;
                var gg = rgbVal ? rgbVal[1] / 255 : 0.8;
                var bb = rgbVal ? rgbVal[2] / 255 : 0.8;
                try { iwFillRound(g, 0.5, 0.5, W - 1, H - 1, 3, [rr, gg, bb, 1]); } catch (eF) {}
                try { iwRoundPath(g, 0.5, 0.5, W - 1, H - 1, 3); g.strokePath(frame); } catch (eS2) {}
            };
        })(inks[i].rgb);
        var cb = row.add("checkbox", undefined, inks[i].name);
        cb.value = false;   // V20 — AUCUNE encre cochée par défaut
        checks.push(cb);
    }

    // boutons « Tout / Aucun »
    var selRow = w.add("group"); selRow.orientation = "row"; selRow.alignment = "left"; selRow.spacing = 6;
    var allBtn = selRow.add("button", undefined, tr("films_all")); allBtn.preferredSize = [80, 22];
    var noneBtn = selRow.add("button", undefined, tr("films_none_btn")); noneBtn.preferredSize = [80, 22];
    allBtn.onClick = function () { for (var x = 0; x < checks.length; x++) checks[x].value = true; };
    noneBtn.onClick = function () { for (var y = 0; y < checks.length; y++) checks[y].value = false; };

    // ── NOM DES FICHIERS ────────────────────────────────────────────────
    //  Champ éditable pré-rempli avec le nom du document (sans extension).
    //  Chaque film sortira sous « <ce nom>-<NomDeLaCouleur>.pdf ».
    var defBase = "Document";
    try {
        var _dn = String(doc.name);                       // ex. « MonAffiche.indd »
        _dn = _dn.replace(/\.[Ii][Nn][Dd][DdTt]$/, "");   // retire .indd / .indt
        if (_dn && _dn.length) defBase = _dn;
    } catch (eDefN) {}
    var nameRow = w.add("group"); nameRow.orientation = "row"; nameRow.alignment = "left"; nameRow.spacing = 6;
    nameRow.add("statictext", undefined, tr("films_basename")).preferredSize.width = 120;
    var baseNameIn = nameRow.add("edittext", undefined, defBase);
    baseNameIn.preferredSize = [260, 22];
    try { baseNameIn.helpTip = tr("films_basename_tip"); } catch (eBNT) {}
    var nameHintRow = w.add("group"); nameHintRow.orientation = "row"; nameHintRow.alignment = "left";
    var nameHint = nameHintRow.add("statictext", undefined, "");
    nameHint.preferredSize = [440, 18];
    try { nameHint.graphics.foregroundColor = nameHint.graphics.newPen(nameHint.graphics.PenType.SOLID_COLOR, [0.45, 0.45, 0.5, 1], 1); } catch (eNH) {}
    // aperçu vivant du nom de fichier : « MonAffiche-<Couleur>.pdf »
    function updNameHint() {
        var b = baseNameIn.text;
        if (!b || !b.length) b = "Document";
        nameHint.text = "\u2192 " + b + "-<Couleur>.pdf";
    }
    updNameHint();
    baseNameIn.onChanging = updNameHint;
    baseNameIn.onChange   = updNameHint;

    // ── CHOIX DE L'IMPRIMANTE VIRTUELLE ─────────────────────────────────
    //  Séparations = via IMPRESSION. On laisse choisir l'imprimante. Par
    //  défaut : l'imprimante courante du document (souvent « Imprimer au PDF »).
    var curPrinter = null;
    try { curPrinter = String(doc.printPreferences.printer); } catch (eCP) {}
    var prRow = w.add("group"); prRow.orientation = "row"; prRow.alignment = "left"; prRow.spacing = 6;
    prRow.add("statictext", undefined, tr("films_printer"));
    // L'imprimante COURANTE du document est le seul nom GARANTI valide par
    //  l'API (ExtendScript ne permet pas de lister les imprimantes système).
    //  On la met en premier. Si elle n'est PAS déjà « Print to PDF », on
    //  affiche un rappel pour la régler dans Fichier > Imprimer.
    var printerList = [];
    if (curPrinter && curPrinter !== "") printerList.push(curPrinter);
    // alternative toujours dispo : fichier PostScript
    printerList.push("PostScript File");
    var prDrop = prRow.add("dropdownlist", undefined, printerList);
    prDrop.selection = 0;   // imprimante courante (nom valide) par défaut

    // Rappel visuel si l'imprimante courante n'est pas « Print to PDF ».
    var isPdfPrinter = false;
    try {
        var cl = String(curPrinter).toLowerCase();
        isPdfPrinter = (cl.indexOf("pdf") >= 0);   // « Print to PDF », « Imprimer au format PDF »…
    } catch (ePc) {}
    if (!isPdfPrinter) {
        var warnTxt = w.add("statictext", undefined, tr("films_printer_warn"), { multiline: true });
        warnTxt.preferredSize = [440, 44];
        try {
            warnTxt.graphics.foregroundColor = warnTxt.graphics.newPen(
                warnTxt.graphics.PenType.SOLID_COLOR, [0.85, 0.45, 0.1, 1], 1);
        } catch (eWc2) {}
    }

    var btns = w.add("group"); btns.alignment = "right"; btns.spacing = 8;
    var cBtn = btns.add("button", undefined, tr("btn_cancel"), { name: "cancel" });
    cBtn.preferredSize = [90, 26];
    var okBtn = btns.add("button", undefined, tr("films_export_btn"), { name: "ok" });
    okBtn.preferredSize = [110, 26];

    var pickRc = w.show();
    var chosenPrinter = null;
    try { chosenPrinter = prDrop.selection ? String(prDrop.selection.text) : null; } catch (ePD) {}
    // V20 — nom de base saisi par l'utilisateur (repli sur le nom du document).
    var chosenBase = defBase;
    try { if (baseNameIn.text && baseNameIn.text.length) chosenBase = String(baseNameIn.text); } catch (eCB) {}
    try { w.close(); } catch (eWc) {}   // ferme explicitement (pas de modal actif)
    if (pickRc !== 1) return;            // annulé

    // Détermine l'argument imprimante à passer au moteur :
    //  - « PostScript File » -> constante Printer.POSTSCRIPT_FILE.
    //  - imprimante COURANTE du document -> null : le moteur ne tente pas de
    //    la réassigner (elle est déjà active et valide) -> évite un refus -15.
    //  - tout autre nom -> on le passe tel quel.
    var printerArg = chosenPrinter;
    if (chosenPrinter === "PostScript File") {
        try { printerArg = Printer.POSTSCRIPT_FILE; } catch (ePSF) { printerArg = "PostScript File"; }
    } else if (curPrinter && chosenPrinter === curPrinter) {
        printerArg = null;   // imprimante courante déjà active : ne pas réassigner
    }

    // encres cochées -> NOMS
    var selNames = [];
    for (var s = 0; s < checks.length; s++) if (checks[s].value) selNames.push(inks[s].name);
    if (selNames.length === 0) { Window.alert(tr("films_nosel")); return; }

    // dossier de destination
    var dir = Folder.selectDialog(tr("films_choosedir"));
    if (!dir) return;

    var n = -99;
    try { n = iwExportInkFilms(doc, dir, selNames, printerArg, chosenBase); } catch (eXF) { IW_FILMS_LAST_ERR = String(eXF.message || eXF) + " (exception remontée)"; n = -3; }
    if (n < 0) {
        // fenêtre d'erreur COPIABLE : le message réel est essentiel pour corriger.
        //  V2 — ces textes étaient EN DUR EN FRANÇAIS dans un script traduit en
        //  trois langues : un utilisateur anglophone ou italophone tombait sur
        //  du français au pire moment, celui de l'erreur.
        var ew = new Window("dialog", tr("films_err_title", { N: n }));
        ew.orientation = "column"; ew.alignChildren = "fill"; ew.margins = 12; ew.spacing = 8;
        ew.add("statictext", undefined, tr("films_err_intro"));
        var emsg = (IW_FILMS_LAST_ERR && IW_FILMS_LAST_ERR !== "") ? IW_FILMS_LAST_ERR : tr("films_err_none");
        var eet = ew.add("edittext", undefined, "code " + n + "\n" + emsg, { multiline: true, scrolling: true });
        eet.preferredSize = [460, 120];
        var eb = ew.add("group"); eb.alignment = "right";
        eb.add("button", undefined, tr("btn_close"), { name: "ok" });
        ew.show();
        return;
    }
    if (n === 0) { Window.alert(tr("films_nosel")); return; }

    // CADRAGE : si l'imprimante virtuelle a refusé le format custom, les croix
    // de coin sont coupées. On le signale CLAIREMENT avec la marche à suivre,
    // au lieu d'un simple « Films exportés ».
    if (IW_FILMS_PAPER_INFO && IW_FILMS_PAPER_INFO.indexOf("REFUSÉ") >= 0) {
        // V2 — texte traduit (il était en dur en français, cf. ci-dessus).
        var cropW = new Window("dialog", tr("films_crop_title"));
        cropW.orientation = "column"; cropW.alignChildren = "fill"; cropW.margins = 12; cropW.spacing = 8;
        cropW.add("statictext", undefined, tr("films_done", { N: n }));
        var cropTxt = tr("films_crop_body", { D: IW_FILMS_PAPER_INFO });
        var cropEt = cropW.add("edittext", undefined, cropTxt, { multiline: true, scrolling: true });
        cropEt.preferredSize = [480, 180];
        var cropBtns = cropW.add("group"); cropBtns.alignment = "right";
        cropBtns.add("button", undefined, "OK", { name: "ok" });
        cropW.show();
        return;
    }
    // V20 — plus de pop-up de SUCCÈS d'export : l'export réussi se termine
    //   silencieusement (les erreurs et l'avertissement « croix coupées »
    //   ci-dessus restent, eux, affichés). L'ancien Window.alert(films_done)
    //   est supprimé sur demande.
}




// ═════════════════════════════════════════════════════════════════════
//  ANALYSE DES PIXELS D'IMAGE (PNG) — décodeur PNG + INFLATE maison.
//  InDesign n'expose pas les pixels d'une image placée : on ouvre donc le
//  FICHIER PNG lié et on le décode nous-mêmes pour en extraire les couleurs
//  réellement présentes. Code validé hors InDesign (RGB/RGBA/Gris/Palette).
//  Performance : on plafonne le nombre de lignes décodées (échantillon) pour
//  ne pas figer ExtendScript sur de grandes images.
// ═════════════════════════════════════════════════════════════════════
function iwReadFileBytes(file) {
    file.encoding = "BINARY";
    file.open("r");
    var s = file.read();
    file.close();
    var n = s.length, bytes = [];
    for (var i = 0; i < n; i++) bytes.push(s.charCodeAt(i) & 0xFF);
    return bytes;
}

function iwInflateRaw(bytes, pos, maxOut) {
    var out = [], bitBuf = 0, bitCnt = 0;
    function getbit(){ if(bitCnt===0){bitBuf=bytes[pos++];bitCnt=8;} var b=bitBuf&1; bitBuf>>=1; bitCnt--; return b; }
    function getbits(n){ var v=0,i; for(i=0;i<n;i++) v|=getbit()<<i; return v; }
    function buildHuff(lengths,n){
        var MAX=15,count=[],i; for(i=0;i<=MAX;i++)count[i]=0;
        for(i=0;i<n;i++)count[lengths[i]]++; count[0]=0;
        var firstCode=[],firstSym=[],code=0,sorted=[],symOffset=[],run=0;
        for(i=1;i<=MAX;i++){symOffset[i]=run; run+=count[i];}
        var tmpOff=symOffset.slice(0);
        for(i=0;i<n;i++){var L=lengths[i]; if(L){sorted[tmpOff[L]++]=i;}}
        for(i=1;i<=MAX;i++){firstCode[i]=code; firstSym[i]=symOffset[i]; code=(code+count[i])<<1;}
        return {count:count,firstCode:firstCode,firstSym:firstSym,sorted:sorted,max:MAX};
    }
    function decodeSym(h){ var code=0; for(var len=1;len<=h.max;len++){ code=(code<<1)|getbit(); var cnt=h.count[len]; if(cnt>0){ var diff=code-h.firstCode[len]; if(diff>=0&&diff<cnt) return h.sorted[h.firstSym[len]+diff]; } } return -1; }
    var LB=[3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258];
    var LE=[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0];
    var DB=[1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577];
    var DE=[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13];
    function block(litH,distH){ while(true){ if(maxOut&&out.length>=maxOut) return true; var sym=decodeSym(litH); if(sym<0) throw "bad lit"; if(sym===256) return false; if(sym<256){out.push(sym); continue;} sym-=257; var length=LB[sym]+getbits(LE[sym]); var dsym=decodeSym(distH); if(dsym<0) throw "bad dist"; var dist=DB[dsym]+getbits(DE[dsym]); var start=out.length-dist; for(var k=0;k<length;k++){out.push(out[start+k]); if(maxOut&&out.length>=maxOut) return true;} } }
    var fixedLit=null,fixedDist=null;
    function fixedTrees(){ if(fixedLit) return; var ll=[],i; for(i=0;i<144;i++)ll[i]=8; for(i=144;i<256;i++)ll[i]=9; for(i=256;i<280;i++)ll[i]=7; for(i=280;i<288;i++)ll[i]=8; fixedLit=buildHuff(ll,288); var dl=[]; for(i=0;i<30;i++)dl[i]=5; fixedDist=buildHuff(dl,30); }
    var ORDER=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];
    var capped=false,bfinal;
    do{ bfinal=getbit(); var type=getbits(2);
        if(type===0){ bitCnt=0; var len=bytes[pos]|(bytes[pos+1]<<8); pos+=4; for(var b=0;b<len;b++){ out.push(bytes[pos++]); if(maxOut&&out.length>=maxOut){capped=true;break;} } }
        else if(type===1){ fixedTrees(); capped=block(fixedLit,fixedDist); }
        else if(type===2){ var hlit=getbits(5)+257,hdist=getbits(5)+1,hclen=getbits(4)+4,clens=[],i; for(i=0;i<19;i++)clens[i]=0; for(i=0;i<hclen;i++)clens[ORDER[i]]=getbits(3); var clH=buildHuff(clens,19),lens=[],nn=0; while(nn<hlit+hdist){ var s=decodeSym(clH); if(s<16){lens[nn++]=s;} else if(s===16){var r=getbits(2)+3,prev=lens[nn-1]; while(r--)lens[nn++]=prev;} else if(s===17){var r2=getbits(3)+3; while(r2--)lens[nn++]=0;} else {var r3=getbits(7)+11; while(r3--)lens[nn++]=0;} } var litH=buildHuff(lens.slice(0,hlit),hlit),distH=buildHuff(lens.slice(hlit,hlit+hdist),hdist); capped=block(litH,distH); }
        else throw "bad block";
        if(capped) break;
    } while(!bfinal);
    return out;
}
function iwPngRd32(b,p){ return (b[p]*16777216)+(b[p+1]<<16)+(b[p+2]<<8)+b[p+3]; }
function iwDecodePNG(bytes, maxRows) {
    var p=8,W=0,H=0,depth=0,ctype=0,interlace=0,idat=[],palette=null,trns=null;
    while(p<bytes.length){
        var len=iwPngRd32(bytes,p); p+=4;
        var type=String.fromCharCode(bytes[p],bytes[p+1],bytes[p+2],bytes[p+3]); p+=4;
        if(type==="IHDR"){W=iwPngRd32(bytes,p);H=iwPngRd32(bytes,p+4);depth=bytes[p+8];ctype=bytes[p+9];interlace=bytes[p+12];}
        else if(type==="PLTE"){palette=[]; for(var i=0;i<len;i+=3) palette.push([bytes[p+i],bytes[p+i+1],bytes[p+i+2]]);}
        else if(type==="tRNS"){trns=[]; for(var t=0;t<len;t++) trns.push(bytes[p+t]);}
        else if(type==="IDAT"){for(var j=0;j<len;j++) idat.push(bytes[p+j]);}
        else if(type==="IEND") break;
        p+=len+4;
    }
    if(interlace!==0) throw "PNG entrelacé non supporté";
    var channels=(ctype===2)?3:(ctype===6)?4:(ctype===0)?1:(ctype===4)?2:(ctype===3)?1:0;
    if(!channels) throw "PNG type "+ctype+" non supporté";
    var rowBytes=Math.ceil(channels*depth*W/8);
    var rows=(maxRows&&maxRows<H)?maxRows:H;
    var raw=iwInflateRaw(idat,2,(rowBytes+1)*rows+8);  // +2 : saute l'en-tête zlib
    var bpp=Math.max(1,Math.ceil(channels*depth/8));
    var prev=[]; for(var z=0;z<rowBytes;z++) prev[z]=0;
    var pixels=[],op=0;
    function pal(idx){ return palette?palette[idx]:[idx,idx,idx]; }
    function transp(idx){ return (trns&&ctype===3&&idx<trns.length)?trns[idx]<16:false; }
    for(var y=0;y<rows;y++){
        if(op>=raw.length) break;
        var ft=raw[op++],cur=[];
        for(var x=0;x<rowBytes;x++){
            var rawb=raw[op++]||0, a=(x>=bpp)?cur[x-bpp]:0, bb=prev[x], c=(x>=bpp)?prev[x-bpp]:0, val;
            if(ft===0)val=rawb; else if(ft===1)val=rawb+a; else if(ft===2)val=rawb+bb;
            else if(ft===3)val=rawb+Math.floor((a+bb)/2);
            else if(ft===4){var pp=a+bb-c,pa=Math.abs(pp-a),pb=Math.abs(pp-bb),pc=Math.abs(pp-c),pr=(pa<=pb&&pa<=pc)?a:(pb<=pc?bb:c); val=rawb+pr;}
            else val=rawb;
            cur[x]=val&0xFF;
        }
        prev=cur;
        if(ctype===3){
            if(depth===8){ for(var xi=0;xi<W;xi++){ var ix=cur[xi]; if(!transp(ix)) pixels.push(pal(ix)); } }
            else { var per=8/depth,mask=(1<<depth)-1; for(var xi2=0;xi2<W;xi2++){ var byteI=Math.floor(xi2/per),shift=8-depth-(xi2%per)*depth,idx=(cur[byteI]>>shift)&mask; if(!transp(idx)) pixels.push(pal(idx)); } }
        } else if(depth===8){
            for(var xp=0;xp<W;xp++){ var base=xp*channels;
                if(channels===4){ if(cur[base+3]>=16) pixels.push([cur[base],cur[base+1],cur[base+2]]); }
                else if(channels===3) pixels.push([cur[base],cur[base+1],cur[base+2]]);
                else if(channels===2){ if(cur[base+1]>=16) pixels.push([cur[base],cur[base],cur[base]]); }
                else pixels.push([cur[base],cur[base],cur[base]]); }
        } else if(depth===16){
            for(var xq=0;xq<W;xq++){ var b16=xq*channels*2; if(channels>=3) pixels.push([cur[b16],cur[b16+2],cur[b16+4]]); else pixels.push([cur[b16],cur[b16],cur[b16]]); }
        }
    }
    return {width:W,height:H,ctype:ctype,depth:depth,pixels:pixels};
}
function iwDominantColors(pixels, maxColors, opts) {
    opts=opts||{};
    var Q=opts.quant||30, minFrac=opts.minFrac||0.04;
    var skipWhite=opts.skipWhite!==false, skipBlack=opts.skipBlack===true;
    var buckets={},total=0;
    for(var i=0;i<pixels.length;i++){
        var r=pixels[i][0],g=pixels[i][1],b=pixels[i][2];
        if(skipWhite&&r>240&&g>240&&b>240) continue;
        if(skipBlack&&r<12&&g<12&&b<12) continue;
        var key=Math.round(r/Q)+"_"+Math.round(g/Q)+"_"+Math.round(b/Q);
        if(!buckets[key]) buckets[key]={n:0,r:0,g:0,b:0};
        var bk=buckets[key]; bk.n++; bk.r+=r; bk.g+=g; bk.b+=b; total++;
    }
    var arr=[]; for(var k in buckets){ if(buckets.hasOwnProperty(k)){ var v=buckets[k]; arr.push({n:v.n,r:Math.round(v.r/v.n),g:Math.round(v.g/v.n),b:Math.round(v.b/v.n)}); } }
    arr.sort(function(a,b2){return b2.n-a.n;});
    var res=[];
    for(var j=0;j<arr.length&&res.length<maxColors;j++){ if(total>0&&arr[j].n/total<minFrac) break; res.push([arr[j].r,arr[j].g,arr[j].b]); }
    return res;
}

// Hex "#RRGGBB" pour nommer une couleur issue des pixels.
function iwRGBHex(rgb){ function h(n){ var s=Math.round(n).toString(16); return s.length<2?"0"+s:s; } return "#"+h(rgb[0])+h(rgb[1])+h(rgb[2]); }

// Liste les noms de nuances utilisables du document (pour le sélecteur de
// couleur du blanc tournant). Exclut [None].
function iwSwatchNames(doc) {
    var out = [];
    try {
        for (var i = 0; i < doc.swatches.length; i++) {
            var nm;
            try { nm = doc.swatches[i].name; } catch (eN) { continue; }
            if (!nm) continue;
            if (nm === "[None]" || nm === "None") continue;
            out.push(nm);
        }
    } catch (e) {}
    return out;
}

// Renvoie [r,g,b] 0..1 (approx) d'une nuance, pour l'APERÇU uniquement.
function iwSwatchRGB(doc, name) {
    if (!name) return null;
    try {
        if (name === "Paper" || name === "[Paper]") return [1, 1, 1];
        var s = doc.swatches.itemByName(name);
        if (!s || !s.isValid) return null;
        var sp = null, cv = null;
        try { sp = s.space; } catch (e1) {}
        try { cv = s.colorValue; } catch (e2) {}
        if (!cv) return null;
        if (sp === ColorSpace.CMYK) {
            var c = cv[0] / 100, m = cv[1] / 100, y = cv[2] / 100, k = cv[3] / 100;
            return [(1 - c) * (1 - k), (1 - m) * (1 - k), (1 - y) * (1 - k)];
        } else if (sp === ColorSpace.RGB) {
            return [cv[0] / 255, cv[1] / 255, cv[2] / 255];
        } else if (sp === ColorSpace.LAB) {
            var Lp = cv[0] / 100; return [Lp, Lp, Lp];
        }
    } catch (e) {}
    return null;
}

// Trouve (ou crée) une nuance RGB exacte dans le document.
function iwFindOrCreateRGBSwatch(doc, rgb, name){
    try {
        for(var i=0;i<doc.colors.length;i++){
            var c=doc.colors[i];
            try { if(c.space===ColorSpace.RGB){ var v=c.colorValue; if(v.length>=3 && Math.round(v[0])==rgb[0] && Math.round(v[1])==rgb[1] && Math.round(v[2])==rgb[2]) return c; } } catch(e){}
        }
    } catch(e2){}
    var nm=name, base=name, k=1;
    while(true){ var exists=false; try{ exists=doc.swatches.itemByName(nm).isValid; }catch(eN){ exists=false; } if(!exists) break; nm=base+" ("+(++k)+")"; }
    var col=doc.colors.add();
    try { col.space=ColorSpace.RGB; col.colorValue=[rgb[0],rgb[1],rgb[2]]; col.name=nm; } catch(eC){}
    return col;
}

// Analyse les IMAGES PNG d'une liste d'objets et renvoie leurs couleurs
// dominantes sous forme { swatch, name }. Ignore les images COLORISÉES par
// une nuance (leur couleur est déjà captée par iwCollectUsedColors) et les
// fichiers trop gros (pour rester rapide).
function iwCollectImageColors(items, opts){
    opts=opts||{};
    var maxPer=opts.maxColors||4, maxRows=opts.maxRows||200, maxFileMB=opts.maxFileMB||8;
    var doc=app.activeDocument;
    var out=[], seenFile={}, seenName={};
    function fromItem(it){
        if(!it) return;
        try {
            if(it.graphics && it.graphics.length){
                for(var gi=0;gi<it.graphics.length;gi++){
                    var gr=it.graphics[gi];
                    // image colorisée par une nuance ? -> couleur déjà connue, on saute
                    var fc=null,fcName=""; try{ fc=gr.fillColor; fcName=fc?String(fc.name):""; }catch(eFC){}
                    if(fcName && fcName!=="None" && fcName!=="[None]" && fcName!=="Paper" && fcName!=="[Paper]") continue;
                    var f=null; try{ if(gr.itemLink && gr.itemLink.filePath) f=new File(gr.itemLink.filePath); }catch(eL){}
                    if(!f) continue;
                    var path=String(f.fsName || f.fullName);
                    if(seenFile[path]) continue; seenFile[path]=true;
                    var low=path.toLowerCase();
                    if(low.substr(low.length-4)!==".png") continue;   // décodeur = PNG
                    if(!f.exists) continue;
                    try { if(f.length>maxFileMB*1024*1024) continue; } catch(eSz){}
                    try {
                        var bytes=iwReadFileBytes(f);
                        var img=iwDecodePNG(bytes, maxRows);
                        var cols=iwDominantColors(img.pixels, maxPer, {quant:30, minFrac:0.04, skipWhite:true});
                        for(var ci=0;ci<cols.length;ci++){
                            var rgb=cols[ci], hex=iwRGBHex(rgb);
                            if(seenName[hex]) continue; seenName[hex]=true;
                            out.push({ swatch:iwFindOrCreateRGBSwatch(doc, rgb, hex), name:hex });
                        }
                    } catch(eDec){}
                }
            }
        } catch(eG){}
        try { if(it.allPageItems && it.allPageItems.length){ for(var k=0;k<it.allPageItems.length;k++) fromItem(it.allPageItems[k]); } } catch(e5){}
    }
    if(items) for(var i=0;i<items.length;i++) fromItem(items[i]);
    return out;
}

//  Technique : on relève les noms de swatches existants, on place le fichier
//  dans un cadre TEMPORAIRE sur la table de montage, on relève les nouveaux
//  swatches apparus, puis on supprime le cadre temporaire. Les nuances
//  nouvellement créées sont CONSERVÉES dans le document (utiles pour les
//  rectangles couleurs). Les images PNG/JPG/TIFF n'apportent pas de nuance
//  nommée -> renvoie une liste vide (on le signale à l'appelant).
//  Renvoie un tableau { swatch, name } (mêmes objets que iwCollectUsedColors).
// ─────────────────────────────────────────────────────────────────────
function iwColorsFromFile(file) {
    var out = [];
    if (!file || !file.exists) return out;
    var doc = app.activeDocument;
    var skip = { "None": true, "Paper": true, "Registration": true,
                 "Black": true, "Cyan": true, "Magenta": true, "Yellow": true,
                 "[None]": true, "[Paper]": true, "[Registration]": true,
                 "[Black]": true };

    // 1) noms de nuances déjà présents
    var before = {};
    try {
        for (var i = 0; i < doc.swatches.length; i++) {
            try { before[doc.swatches[i].name] = true; } catch (eN) {}
        }
    } catch (eB) {}

    // 2) place le fichier dans un cadre temporaire HORS PAGE (table de montage)
    var tmp = null;
    try {
        // position franchement hors de la page (table de montage à gauche)
        var pgB = doc.pages[0].bounds; // [t,l,b,r]
        var tX = pgB[1] - 300, tY = pgB[0];
        tmp = doc.pages[0].rectangles.add();
        tmp.geometricBounds = [tY, tX, tY + 50, tX + 50];
        tmp.fillColor = doc.swatches.itemByName("None");
        tmp.strokeColor = doc.swatches.itemByName("None");
        tmp.place(file);
    } catch (eP) {
        if (tmp) { try { tmp.remove(); } catch (eR0) {} }
        return out; // import impossible
    }

    // 3) diff : nouvelles nuances apparues après l'import
    try {
        for (var j = 0; j < doc.swatches.length; j++) {
            var sw = doc.swatches[j];
            var nm;
            try { nm = sw.name; } catch (eNm) { continue; }
            if (nm == null || nm === "") continue;
            if (before[nm]) continue;     // déjà présent avant l'import
            if (skip[nm]) continue;
            try { if (!sw.isValid) continue; } catch (eV) {}
            out.push({ swatch: sw, name: nm });
        }
    } catch (eD) {}

    // 4) retire le cadre temporaire (les NUANCES restent dans le document)
    if (tmp) { try { tmp.remove(); } catch (eR) {} }
    return out;
}

// Fusionne deux listes { swatch, name } en dédupliquant par nom.
function iwMergeColorLists(a, b) {
    var seen = {}, out = [];
    function push(list) {
        if (!list) return;
        for (var i = 0; i < list.length; i++) {
            var nm = list[i].name;
            if (nm == null || seen[nm]) continue;
            seen[nm] = true; out.push(list[i]);
        }
    }
    push(a); push(b);
    return out;
}

// ─────────────────────────────────────────────────────────────────────
//  MARQUES COULEURS DE PAGE — sur un calque DÉDIÉ, à l'échelle de la page.
//  Pour chaque couleur utilisée :
//    • SÉRIGRAPHIE : un rectangle rempli de la couleur EN BAS À GAUCHE
//      (nom de la couleur en DÉFONCE — texte [Paper] — à l'intérieur), et
//      un CARRÉ rempli de la couleur EN HAUT À GAUCHE. Empilés, sans
//      chevauchement (vers le haut depuis le bas / vers le bas depuis le haut).
//    • RISO : AUCUN rectangle ni carré, seulement le NOM de la couleur,
//      empilé en bas à gauche.
//  pageBounds = [t,l,b,r] de la page entière (mm).
//  opts.colorStyle = "seri" | "riso".
// ─────────────────────────────────────────────────────────────────────
function addPageColorMarks(page, layer, pageBounds, usedColors, opts) {
    if (!usedColors || usedColors.length === 0) return;
    var doc   = app.activeDocument;
    var paper = doc.swatches.itemByName("Paper");
    var nameBoxEx = 2 * 25.4 / 72;   // 2 pt en mm (≈ 0.706) : agrandit la boîte de nom de 2 pt par côté
    var none  = doc.swatches.itemByName("None");
    var t = pageBounds[0], l = pageBounds[1], b = pageBounds[2], r = pageBounds[3];
    var style = (opts && opts.colorStyle) ? opts.colorStyle : "seri";

    // dimensions des pastilles (réglables via opts, un peu plus grandes)
    var pad   = (opts && opts.colorPad   != null) ? opts.colorPad   : 4;
    var swSize = (opts && opts.colorSwatchSize != null) ? opts.colorSwatchSize : 12;  // côté carré (haut)
    var barH   = (opts && opts.colorBarH != null) ? opts.colorBarH : 11;              // hauteur rectangle (bas)
    var barW   = (opts && opts.colorBarW != null) ? opts.colorBarW : 46;              // largeur rectangle (bas)
    var gapBetween = 0;  // pastilles JOINTIVES (elles se touchent)

    // marges de la page : on centre les pastilles dans l'ÉPAISSEUR de marge,
    // exactement comme les croix de bord.
    var m = (opts && opts.margins) ? opts.margins : { top: 0, left: 0, bottom: 0, right: 0 };
    var topAxis = t + (m.top    || 0) / 2;   // centre de la marge haute
    var botAxis = b - (m.bottom || 0) / 2;   // centre de la marge basse
    // DÉPART HORIZONTAL : sur la MARGE DE GAUCHE (pas dans le coin de page).
    var startX  = l + (m.left || 0);

    // — Ne pas MASQUER les mires de centre de page (si elles sont posées) —
    //   Mire centre-bas en (cx, botAxis), centre-haut en (cx, topAxis). On
    //   calcule leur demi-largeur (comme addPageCenterMarks) et on DÉCALE toute
    //   pastille qui chevaucherait la zone : elle reprend APRÈS la mire (un
    //   "trou" laisse la croix visible).
    var rsvOn = !!(opts && opts.pageCenterOn);
    var cxC = (l + r) / 2;
    var centerLen = iwRegDiam(opts && opts.regDiam);
    function mireHalf(mt) { var mx = (mt > 0) ? mt * 0.9 : centerLen; return Math.min(centerLen, mx) / 2 + 2; } // +2 mm
    var rsvBotHalf = mireHalf(m.bottom), rsvTopHalf = mireHalf(m.top);
    function skipCenter(x, w, half) {
        if (!rsvOn) return x;
        var lo = cxC - half, hi = cxC + half;
        if (x < hi && (x + w) > lo) return hi;   // chevauche la mire -> on saute après
        return x;
    }

    // Positions CENTRÉES : répartit n éléments de longueur itemLen DE PART ET
    // D'AUTRE du centre `center`, en laissant un trou central de demi-largeur
    // `gapHalf` (pour la croix centrale). Les couleurs gardent l'ordre de
    // lecture (gauche->droite, ou haut->bas) à travers le trou central.
    // Renvoie { pos:[débuts de chaque élément], lo, hi } (étendue occupée).
    function centeredPositions(n, itemLen, center, gapHalf) {
        var leftN = Math.floor(n / 2);
        var rightN = n - leftN;
        var pos = [];
        var leftStart = center - gapHalf - leftN * itemLen;
        for (var i = 0; i < leftN; i++) pos[i] = leftStart + i * itemLen;
        for (var j = 0; j < rightN; j++) pos[leftN + j] = center + gapHalf + j * itemLen;
        var lo = (leftN > 0) ? leftStart : (center + gapHalf);
        var hi = (rightN > 0) ? (center + gapHalf + rightN * itemLen) : (center - gapHalf);
        return { pos: pos, lo: lo, hi: hi };
    }

    // Calcule une taille de police (pt) qui tient dans une hauteur de boîte
    // donnée (mm). 1 mm ≈ 2.8346 pt ; on garde ~80% de la hauteur, borné.
    function fitPt(boxHmm) {
        var pt = boxHmm * 2.8346 * 0.62;     // ~62% de la hauteur => marge visuelle
        if (pt < 4) pt = 4;
        if (pt > 24) pt = 24;
        return pt;
    }

    // ── DÉGAGEMENT DES COINS ─────────────────────────────────────────────
    //   Les pastilles ne doivent pas approcher les coins, pour ne PAS masquer
    //   les mires de coin (et garder les coins lisibles). On calcule, pour
    //   chaque bord, la plage utile [lo,hi] en retirant, à chaque extrémité,
    //   le rayon de la mire de coin + un petit jeu (crossCornerGap).
    var cmLen = iwRegDiam(opts && opts.regDiam);
    function clampMargC(mt) { var mx = (mt > 0) ? mt * 0.9 : cmLen; var Lz = Math.min(cmLen, mx); return (Lz < 3) ? 3 : Lz; }
    function cMireLen(a, bb) { var aa = (a > 0) ? a : 99999, b2 = (bb > 0) ? bb : 99999; return clampMargC(Math.min(aa, b2)); }
    var cornerGapC = (opts && opts.crossCornerGap != null) ? opts.crossCornerGap : 6;
    var axTopY = t + (m.top || 0) / 2, axBotY = b - (m.bottom || 0) / 2;
    var axLeftX = l + (m.left || 0) / 2, axRightX = r - (m.right || 0) / 2;
    // bords HORIZONTAUX (haut = carrés, bas = bandes)
    var topXlo = axLeftX  + cMireLen(m.left,  m.top) / 2 + cornerGapC;
    var topXhi = axRightX - cMireLen(m.right, m.top) / 2 - cornerGapC;
    var botXlo = axLeftX  + cMireLen(m.left,  m.bottom) / 2 + cornerGapC;
    var botXhi = axRightX - cMireLen(m.right, m.bottom) / 2 - cornerGapC;
    // bords VERTICAUX (gauche = carrés, droite = bandes)
    var leftYlo  = axTopY + cMireLen(m.left,  m.top) / 2 + cornerGapC;
    var leftYhi  = axBotY - cMireLen(m.left,  m.bottom) / 2 - cornerGapC;
    var rightYlo = axTopY + cMireLen(m.right, m.top) / 2 + cornerGapC;
    var rightYhi = axBotY - cMireLen(m.right, m.bottom) / 2 - cornerGapC;

    // ── TAILLE ADAPTATIVE ────────────────────────────────────────────────
    //   Réduit la longueur d'un élément (carré/bande) le long du bord pour que
    //   TOUTES les couleurs tiennent dans la marge utile, de part et d'autre du
    //   centre. On borne à la taille par défaut (pas d'agrandissement) et on
    //   garde une longueur minimale. center/lo/hi en mm, gapHalf = demi-trou
    //   central, n = nombre de couleurs.
    function fitItemLen(defaultLen, center, lo, hi, gapHalf, n) {
        if (n < 1) return defaultLen;
        var halfSpan = Math.min(center - lo, hi - center);   // demi-largeur utile
        var perSide = Math.ceil(n / 2);                       // côté le plus chargé
        var avail = (halfSpan - gapHalf) / perSide;
        if (avail < 0.5) avail = 0.5;                         // garde-fou (marge minuscule)
        return Math.min(defaultLen, avail);
    }

    // ── SENS DU NOM (rectangles de couleur) ──────────────────────────────
    //   colorNameSide = "auto" (défaut) | "bas" | "haut" | "gauche" | "droite".
    //   Détermine de quel côté est le BAS du texte : on tourne le cadre du nom.
    //   "auto" = horizontal:0°, vertical:90° (comportement par défaut).
    var cnSide = (opts && opts.colorNameSide) ? opts.colorNameSide : "auto";
    function nameAngle(isVertical) {
        if (cnSide === "bas")    return 0;
        if (cnSide === "haut")   return 180;
        if (cnSide === "gauche") return 270;
        if (cnSide === "droite") return 90;
        return isVertical ? 90 : 0;   // auto
    }
    // tourne un cadre de `deg` degrés autour de son propre centre
    function rotFrame(tf, deg) {
        if (!deg) return;
        try {
            var bb = tf.geometricBounds;
            var rcx = (bb[1] + bb[3]) / 2, rcy = (bb[0] + bb[2]) / 2;
            var rm = app.transformationMatrices.add({ counterclockwiseRotationAngle: deg });
            tf.transform(CoordinateSpaces.PASTEBOARD_COORDINATES, [rcx, rcy], rm);
        } catch (eRf) { try { tf.rotationAngle = deg; } catch (eRf2) {} }
    }

    // ── ORIENTATION : bord LONG ou bord COURT de la feuille ──────────────
    //   colorEdge = "short" (défaut, = comportement historique) | "long".
    //   On déduit l'axe physique selon le format de la page :
    //     - portrait  : bords courts = haut/bas (horizontal),
    //                    bords longs  = gauche/droite (vertical)
    //     - paysage   : l'inverse.
    var pageW = r - l, pageH = b - t;
    var isPortrait = pageH >= pageW;
    var colorEdge = (opts && opts.colorEdge) ? opts.colorEdge : "short";
    var wantHorizontal = (colorEdge === "long") ? !isPortrait : isPortrait;

    if (!wantHorizontal) {
        // ════════════════════ DISPOSITION VERTICALE ════════════════════
        //   Carrés sur la marge GAUCHE, bandes-noms sur la marge DROITE,
        //   empilés du HAUT vers le BAS. Les noms sont tournés à 90°.
        var leftAxis  = l + (m.left  || 0) / 2;   // centre de la marge gauche
        var rightAxis = r - (m.right || 0) / 2;   // centre de la marge droite
        var startY    = t + (m.top   || 0);

        var cyC = (t + b) / 2;
        var rsvLeftHalf  = mireHalf(m.left);
        var rsvRightHalf = mireHalf(m.right);
        function skipCenterY(y, h, half) {
            if (!rsvOn) return y;
            var lo = cyC - half, hi = cyC + half;
            if (y < hi && (y + h) > lo) return hi;   // chevauche la mire -> saute après
            return y;
        }
        // ajoute un cadre de nom centré en (cx,cy), boîte W×H (avant rotation),
        // puis tourné de `deg` degrés autour de son centre.
        function addRotName(cx, cy, W, H, s, deg) {
            var tf = page.textFrames.add(layer);
            tf.geometricBounds = [cy - H/2 - nameBoxEx, cx - W/2 - nameBoxEx,
                                  cy + H/2 + nameBoxEx, cx + W/2 + nameBoxEx];
            tf.contents = s;
            try {
                tf.texts[0].pointSize = 8;
                tf.texts[0].fillColor = paper;                 // blanc (défonce)
                tf.texts[0].justification = Justification.CENTER_ALIGN;
            } catch (eRn) {}
            try {
                tf.textFramePreferences.verticalJustification = VerticalJustification.CENTER_ALIGN;
                tf.textFramePreferences.insetSpacing = [0, 0, 0, 0];
            } catch (eRv) {}
            if (deg) {
                try {
                    var rm = app.transformationMatrices.add({ counterclockwiseRotationAngle: deg });
                    tf.transform(CoordinateSpaces.PASTEBOARD_COORDINATES, [cx, cy], rm);
                } catch (eRr) { try { tf.rotationAngle = deg; } catch (eRr2) {} }
            }
            // recentrage SYSTÉMATIQUE sur (cx,cy) : garantit que le nom reste
            // TOUJOURS posé sur le rectangle de couleur, quelle que soit la
            // méthode de rotation utilisée (matrice ou repli rotationAngle).
            try {
                var nb = tf.geometricBounds;
                var ncx = (nb[1] + nb[3]) / 2, ncy = (nb[0] + nb[2]) / 2;
                tf.move(undefined, [cx - ncx, cy - ncy]);
            } catch (eRc) {}
            return tf;
        }

        if (style === "riso") {
            // RISO vertical : noms seuls, répartis DE PART ET D'AUTRE de la
            // croix centrale, sur la marge GAUCHE, tournés à 90°.
            var lineW = Math.max(barH, (m.left || 0) ? (m.left * 0.8) : barH);
            var nameLen = fitItemLen(30, cyC, leftYlo, leftYhi, (rsvOn ? rsvLeftHalf : 0), usedColors.length);
            var gapLeftR = rsvOn ? rsvLeftHalf : 0;
            var cpRisoV = centeredPositions(usedColors.length, nameLen, cyC, gapLeftR);
            for (var iv = 0; iv < usedColors.length; iv++) {
                var yNameR = cpRisoV.pos[iv];
                if (yNameR < leftYlo - 0.5 || yNameR + nameLen > leftYhi + 0.5) continue;
                addRotName(leftAxis, yNameR + nameLen / 2, nameLen, lineW, usedColors[iv].name, nameAngle(true));
            }
            return { vertical: true, leftLo: cpRisoV.lo, leftHi: cpRisoV.hi, rightLo: null, rightHi: null };
        }

        // SÉRIGRAPHIE vertical
        var gapLeftV  = rsvOn ? rsvLeftHalf  : 0;
        var gapRightV = rsvOn ? rsvRightHalf : 0;
        var nCv = usedColors.length;
        var effSwV  = fitItemLen(swSize, cyC, leftYlo,  leftYhi,  gapLeftV,  nCv);
        var effBarV = fitItemLen(barW,   cyC, rightYlo, rightYhi, gapRightV, nCv);
        var halfSqV  = effSwV / 2;
        var halfBarV = barH / 2;                    // épaisseur de la bande (le long de X)

        // (A) carrés sur la marge GAUCHE, répartis de part et d'autre du centre
        var cpSqV = centeredPositions(nCv, effSwV, cyC, gapLeftV);
        for (var av = 0; av < nCv; av++) {
            var ySq = cpSqV.pos[av];
            if (ySq < leftYlo - 0.5 || ySq + effSwV > leftYhi + 0.5) continue;
            var sqv = page.rectangles.add(layer);
            sqv.geometricBounds = [ySq, leftAxis - halfSqV, ySq + effSwV, leftAxis + halfSqV];
            sqv.fillColor = usedColors[av].swatch;
            sqv.strokeColor = none;
        }

        // (B) bandes nominatives sur la marge DROITE (hautes de effBarV), nom tourné
        var cpBarV = centeredPositions(nCv, effBarV, cyC, gapRightV);
        for (var cv = 0; cv < nCv; cv++) {
            var yB = cpBarV.pos[cv];
            if (yB < rightYlo - 0.5 || yB + effBarV > rightYhi + 0.5) continue;
            var barB = yB + effBarV;
            var rcv = page.rectangles.add(layer);
            rcv.geometricBounds = [yB, rightAxis - halfBarV, barB, rightAxis + halfBarV];
            rcv.fillColor = usedColors[cv].swatch;
            rcv.strokeColor = none;
            addRotName(rightAxis, yB + effBarV / 2, effBarV - 2, barH, usedColors[cv].name, nameAngle(true));
        }
        return { vertical: true, leftLo: cpSqV.lo, leftHi: cpSqV.hi, rightLo: cpBarV.lo, rightHi: cpBarV.hi };
    }

    if (style === "riso") {
        // ── RISO : noms seuls, répartis DE PART ET D'AUTRE de la croix
        //    centrale, dans l'épaisseur de la marge basse. ──
        var lineH = Math.max(barH, (m.bottom || 0) ? (m.bottom * 0.8) : barH);
        var halfL = lineH / 2;
        var nameW = fitItemLen(30, cxC, botXlo, botXhi, (rsvOn ? rsvBotHalf : 0), usedColors.length);
        var gapBotR = rsvOn ? rsvBotHalf : 0;
        var cpRiso = centeredPositions(usedColors.length, nameW, cxC, gapBotR);
        for (var i = 0; i < usedColors.length; i++) {
            var xName = cpRiso.pos[i];
            var xR = xName + nameW;
            if (xName < botXlo - 0.5 || xR > botXhi + 0.5) continue;
            var tf = page.textFrames.add(layer);
            tf.geometricBounds = [botAxis - halfL - nameBoxEx, xName - nameBoxEx, botAxis + halfL + nameBoxEx, xR + nameBoxEx];
            tf.contents = usedColors[i].name;
            try {
                tf.texts[0].pointSize = 8;              // 8 pt
                tf.texts[0].fillColor = paper;          // nom en BLANC (défonce)
            } catch (eT) {}
            try {
                tf.textFramePreferences.verticalJustification = VerticalJustification.CENTER_ALIGN;
                tf.textFramePreferences.insetSpacing = [0, 0, 0, 0];
            } catch (eV) {}
            rotFrame(tf, nameAngle(false));
        }
        return { vertical: false, topLo: null, topHi: null, botLo: cpRiso.lo, botHi: cpRiso.hi };
    }

    // ── SÉRIGRAPHIE (horizontal) ──
    //  Pastilles réparties DE PART ET D'AUTRE de la croix centrale, centrées
    //  dans l'épaisseur de marge (haute = carrés, basse = rectangles nominatifs).
    //  Taille ADAPTÉE pour que TOUTES les couleurs tiennent dans la marge.
    var gapTop = rsvOn ? rsvTopHalf : 0;
    var gapBot = rsvOn ? rsvBotHalf : 0;
    var nCh = usedColors.length;
    var effSw  = fitItemLen(swSize, cxC, topXlo, topXhi, gapTop, nCh);
    var effBar = fitItemLen(barW,   cxC, botXlo, botXhi, gapBot, nCh);
    var halfSq  = effSw / 2;
    var halfBar = barH / 2;

    // (A) carrés sur la marge HAUTE
    var cpSq = centeredPositions(nCh, effSw, cxC, gapTop);
    for (var a = 0; a < nCh; a++) {
        var xSq = cpSq.pos[a];
        if (xSq < topXlo - 0.5 || xSq + effSw > topXhi + 0.5) continue;   // garde-fou
        var sq = page.rectangles.add(layer);
        sq.geometricBounds = [topAxis - halfSq, xSq, topAxis + halfSq, xSq + effSw];
        sq.fillColor = usedColors[a].swatch;
        sq.strokeColor = none;
    }

    // (B) rectangles nominatifs sur la marge BASSE (nom en défonce, 8 pt)
    var cpBar = centeredPositions(nCh, effBar, cxC, gapBot);
    for (var c = 0; c < nCh; c++) {
        var xB = cpBar.pos[c];
        if (xB < botXlo - 0.5 || xB + effBar > botXhi + 0.5) continue;
        var rectR = xB + effBar;
        var rc = page.rectangles.add(layer);
        rc.geometricBounds = [botAxis - halfBar, xB, botAxis + halfBar, rectR];
        rc.fillColor = usedColors[c].swatch;
        rc.strokeColor = none;
        var tfc = page.textFrames.add(layer);
        tfc.geometricBounds = [botAxis - halfBar - nameBoxEx, (xB + 1) - nameBoxEx, botAxis + halfBar + nameBoxEx, (rectR - 1) + nameBoxEx];
        tfc.contents = usedColors[c].name;
        try {
            tfc.texts[0].pointSize = 8;
            tfc.texts[0].fillColor = paper;
            tfc.texts[0].justification = Justification.CENTER_ALIGN;
        } catch (eTc) {}
        try {
            tfc.textFramePreferences.verticalJustification = VerticalJustification.CENTER_ALIGN;
            tfc.textFramePreferences.insetSpacing = [0, 0, 0, 0];
        } catch (eVc) {}
        rotFrame(tfc, nameAngle(false));
    }
    return { vertical: false, topLo: cpSq.lo, topHi: cpSq.hi, botLo: cpBar.lo, botHi: cpBar.hi };
}


// ─────────────────────────────────────────────────────────────────────
//  [F] BLEEDS / DUPLEX / FLIPPING
// ─────────────────────────────────────────────────────────────────────

// Calcule la taille de slot incluant le fond perdu sur les 4 côtés.
// [Déprécié en logique v1] Ancienne taille de slot incluant le fond perdu.
// Conservé pour compat ; non utilisé : en logique v1 le slot = la pièce nue.
function iwSlotSize(pieceW, pieceH, bleed) {
    return { slotW: pieceW + bleed * 2, slotH: pieceH + bleed * 2 };
}

// Pour le duplex : génère le plan du verso selon la règle de retournement.
//   flip = "long"  -> retournement bord long (tête-bêche horizontal)
//   flip = "short" -> retournement bord court (vertical)
// On renvoie l'ordre miroir des colonnes (work-and-turn / work-and-tumble).
function iwBackPlan(cols, rows, flip) {
    var plan = [];
    for (var r = 0; r < rows; r++) {
        var rr = (flip === "short") ? (rows - 1 - r) : r;
        for (var c = 0; c < cols; c++) {
            var cc = (flip === "long") ? (cols - 1 - c) : c;
            plan.push(rr * cols + cc);
        }
    }
    return plan; // index de slot recto correspondant à chaque slot verso
}

// Applique le retournement physique à un objet placé (verso).
function iwFlipObject(obj, flip) {
    try {
        if (flip === "long")  obj.flipItem(Flip.HORIZONTAL_FLIP);
        if (flip === "short") obj.flipItem(Flip.VERTICAL_FLIP);
    } catch (e) {}
}


// ─────────────────────────────────────────────────────────────────────
//  [G0] MOTEUR DE LAYOUT PARTAGÉ
//  iwComputeLayout() est une fonction PURE (aucun objet créé dans le doc).
//  Elle est utilisée par l'aperçu live ET par l'exécution réelle : ainsi
//  ce que l'aperçu montre correspond exactement à ce qui sera produit.
//
//  Entrée :
//    c        = config UI (cf. gatherConfig)
//    piece    = { w, h } taille de la pièce en mm
//    zone     = { top, left, w, h } zone utile (intérieur marges) en mm
//  Sortie : objet layout {
//    ok, message,             état + texte d'erreur éventuel
//    mode, cols, rows,        grille effective
//    slotW, slotH,            taille d'un emplacement (= pièce nue, logique v1)
//    gapH, gapV, bleed,
//    originTop, originLeft,   coin de départ (après centrage éventuel)
//    usedW, usedH,            encombrement total
//    count,                   nombre de pièces placées
//    overflow,                true si ça déborde de la zone
//    slots                    [{t,l,b,r,label}] positions pour l'aperçu
//  }
// ─────────────────────────────────────────────────────────────────────
function iwComputeLayout(c, piece, zone) {
    var mode  = parseInt(c.mode, 10) || 0;
    var gapH  = parseFloat(c.gapH) || 0;   // espacement EXACT et fixe
    var gapV  = parseFloat(c.gapV) || 0;
    var bleed = parseFloat(c.bleed) || 0;
    // alignement de la grille dans la zone utile : "TL","TC","TR","CL",
    // "CC","CR","BL","BC","BR" (par défaut centre).
    var align = c.align || "CC";
    // Mode RISO (6) : la grille est calée EN BAS et centrée horizontalement,
    // quel que soit l'alignement choisi par l'utilisateur (présélection métier).
    if (mode === 6) align = "BC";
    // Mode PATCHWORK (8) : grille centrée EN BAS de la page (comme Riso),
    // quel que soit l'alignement choisi par l'utilisateur.
    if (mode === 8) align = "BC";

    // SÉMANTIQUE : la PIÈCE sélectionnée inclut déjà le fond perdu.
    // Le slot = la pièce entière (bleed compris). La ligne de COUPE est
    // à l'intérieur, à `bleed` du bord. Les repères marquent cette ligne.
    var slotW = piece.w;
    var slotH = piece.h;

    // V20 — MODE EXTÉRIEUR : le fond perdu ou le blanc tournant est AJOUTÉ
    //   AUTOUR de la pièce -> le SLOT GRANDIT, la pièce garde sa taille pleine.
    //   (En mode Intérieur, le slot reste = pièce ; la pièce est réduite / la
    //   coupe est rentrée, comportement historique.)
    //   Ces marges extérieures sont mémorisées pour l'aperçu et le placement.
    var wm = c.whiteMargin || null;
    var wmOn = !!(wm && (((wm.top||0)>0)||((wm.bottom||0)>0)||((wm.left||0)>0)||((wm.right||0)>0)));
    var extT = 0, extB = 0, extL = 0, extR = 0;   // marges extérieures (mm)
    // PATCHWORK (mode 8) : raccord bord à bord des cellules -> une marge
    // extérieure casserait l'assemblage. Le mode extérieur y est donc ignoré.
    if (mode !== 8) {
        if (bleed > 0 && c.bleedOutside === true) {
            extT = bleed; extB = bleed; extL = bleed; extR = bleed;
        } else if (wmOn && c.wmOutside === true) {
            extT = (wm.top||0); extB = (wm.bottom||0); extL = (wm.left||0); extR = (wm.right||0);
        }
    }
    var hasExt = (extT + extB + extL + extR) > 0;
    if (hasExt) {
        slotW = piece.w + extL + extR;
        slotH = piece.h + extT + extB;
    }

    var L = {
        ok: true, message: "", mode: mode, cols: 1, rows: 1,
        slotW: slotW, slotH: slotH, gapH: gapH, gapV: gapV, bleed: bleed,
        originTop: zone.top, originLeft: zone.left,
        usedW: 0, usedH: 0, count: 0, overflow: false, slots: [],
        // V20 — marges extérieures (mm) : 0 en mode intérieur. Servent à
        // l'aperçu (dessiner la marge autour) et au moteur (placer la pièce).
        extTop: extT, extBottom: extB, extLeft: extL, extRight: extR,
        extOn: hasExt
    };

    if (piece.w <= 0 || piece.h <= 0) {
        L.ok = false; L.message = tr("lay_zerosize"); return L;
    }
    if (zone.w <= 0 || zone.h <= 0) {
        L.ok = false; L.message = "Zone utile illisible (marges manquantes ?)."; return L;
    }

    // ── PATCHWORK (mode 8) : empilage + rognage par cellule ──────────────
    //   Les N pièces sont EMPILÉES au même point (image pleine slotW×slotH) et
    //   CHACUNE rognée à une CELLULE. L'encombrement total = UNE image pleine
    //   (pas N côte à côte). L'aperçu montre donc l'image pleine subdivisée en
    //   cols×rows cellules ; chaque cellule = une pièce (ordre de sélection).
    //   gap<0 -> cellules qui se chevauchent ; gap>0 -> gouttière. Retour
    //   anticipé : pas de comptage auto/manuel ni de géométrie des autres modes.
    if (mode === 8) {
        var asmN = parseInt(c.asmCount, 10);
        if (isNaN(asmN) || asmN < 1) asmN = 1;
        var asmCols = parseInt(c.asmCols, 10);
        if (isNaN(asmCols) || asmCols < 1) asmCols = 1;
        if (asmCols > asmN) asmCols = asmN;
        var asmRows = Math.ceil(asmN / asmCols);

        // ESPACEMENT FORCÉ À 0 : les cellules sont jointives (raccord parfait
        // de l'image recomposée). On ignore gapH/gapV pour ce mode.
        L.gapH = 0; L.gapV = 0;

        // taille d'une cellule = image pleine / (cols, rows)
        var cellW = slotW / asmCols;
        var cellH = slotH / asmRows;

        L.cols = asmCols; L.rows = asmRows;
        // encombrement = UNE image pleine (toutes les pièces y sont empilées)
        L.usedW = slotW;
        L.usedH = slotH;
        L.originTop = zone.top; L.originLeft = zone.left;

        var an = 1;
        for (var ar = 0; ar < asmRows; ar++) {
            for (var ac = 0; ac < asmCols; ac++) {
                if (an > asmN) break;
                var cl = zone.left + ac * cellW;
                var ct = zone.top  + ar * cellH;
                var cr = zone.left + (ac + 1) * cellW;
                var cb = zone.top  + (ar + 1) * cellH;
                L.slots.push({ t: ct, l: cl, b: cb, r: cr, label: String(an++) });
            }
            if (an > asmN) break;
        }
        L.count = L.slots.length;

        // alignement partagé (bas-centre) appliqué plus bas sur origin + slots.
        return iwApplyAlignAndFinish(L, c, zone, align);
    }



    // ── Combien de pièces tiennent avec un espacement FIXE ──────────────
    //   n pièces + (n-1) gaps <= zone   =>   n = floor((zone + gap)/(slot + gap))
    function fitCount(zoneLen, slot, gap) {
        var n = Math.floor((zoneLen + gap) / (slot + gap));
        return (n < 1) ? 0 : n;
    }
    var autoCols = fitCount(zone.w, slotW, gapH);
    var autoRows = fitCount(zone.h, slotH, gapV);

    if (autoCols < 1 || autoRows < 1) {
        // en mode auto pur c'est bloquant ; en mode redimensionnement on
        // pourra réduire la pièce, donc on ne sort pas tout de suite.
        if (!(c.fit && !c.auto)) {
            L.ok = false;
            L.message = tr("lay_toobig", { SW: r2(slotW), SH: r2(slotH), ZW: r2(zone.w), ZH: r2(zone.h) });
            return L;
        }
        if (autoCols < 1) autoCols = 1;
        if (autoRows < 1) autoRows = 1;
    }

    // ── COMPTAGE MANUEL + REDIMENSIONNEMENT PROPORTIONNEL ───────────────
    //   c.auto = true  -> auto-fit historique (remplit la zone, taille native)
    //   c.auto = false -> on vise un TOTAL de pièces (c.count). On choisit la
    //                     grille cols×rows dont le ratio colle le mieux à la
    //                     zone, puis (si c.fit) on met les pièces à l'échelle
    //                     pour occuper au mieux la zone sans déborder.
    var fitScale = 1;
    var useManual = (c.auto === false);
    if (useManual && mode !== 3) {
        var want = parseInt(c.count, 10);
        if (isNaN(want) || want < 1) want = autoCols * autoRows;

        // meilleure factorisation cols×rows >= want, ratio proche de la zone
        var zoneRatio = zone.w / zone.h;
        var best = null;
        for (var cc = 1; cc <= want; cc++) {
            var rr = Math.ceil(want / cc);
            // ratio de la grille si les pièces gardaient leur proportion native
            var gridRatio = (cc * slotW) / (rr * slotH);
            var score = Math.abs(Math.log(gridRatio / zoneRatio)); // 0 = parfait
            // pénalise les slots gaspillés (cc*rr au-delà de want)
            var waste = cc * rr - want;
            score += waste * 0.05;
            if (best === null || score < best.score) {
                best = { cols: cc, rows: rr, score: score };
            }
        }
        var nCols2 = best.cols, nRows2 = best.rows;

        if (c.fit) {
            // échelle pour que la grille remplisse au mieux la zone (ratio gardé)
            var availW = zone.w - (nCols2 - 1) * gapH;
            var availH = zone.h - (nRows2 - 1) * gapV;
            if (availW > 0 && availH > 0) {
                fitScale = Math.min(availW / (nCols2 * slotW),
                                    availH / (nRows2 * slotH));
                if (!isFinite(fitScale) || fitScale <= 0) fitScale = 1;
            }
            slotW = slotW * fitScale;
            slotH = slotH * fitScale;
            L.slotW = slotW; L.slotH = slotH;
        }
        // on force la grille calculée
        autoCols = nCols2;
        autoRows = nRows2;
    }
    L.fitScale = fitScale;

    // ── Géométrie selon le mode (espacement TOUJOURS exact = gapH/gapV) ──
    if (mode === 3) {
        // BOOKLET : 2 pages côte à côte, gouttière = gapH (exact).
        L.cols = 2; L.rows = 1;
        L.usedW = slotW * 2 + gapH;
        L.usedH = slotH;
        L.count = 2;
        // départ coin haut-gauche ; l'alignement générique gère le placement
        var bt = zone.top, bl = zone.left;
        L.originTop = bt; L.originLeft = bl;
        L.slots.push({ t: bt, l: bl, b: bt + slotH, r: bl + slotW, label: "G" });
        L.slots.push({ t: bt, l: bl + slotW + gapH, b: bt + slotH, r: bl + 2 * slotW + gapH, label: "D" });
    } else if (mode === 4) {
        // DUTCH CUT : grille principale (gap fixe) + bande tournée 90°.
        var dCols = autoCols, dRows = autoRows;
        L.cols = dCols; L.rows = dRows;
        L.usedW = dCols * slotW + (dCols - 1) * gapH;
        L.usedH = dRows * slotH + (dRows - 1) * gapV;
        L.originTop = zone.top; L.originLeft = zone.left;
        var idx = 1;
        for (var r4 = 0; r4 < dRows; r4++) {
            for (var c4 = 0; c4 < dCols; c4++) {
                var st = zone.top  + r4 * (slotH + gapV);
                var sl = zone.left + c4 * (slotW + gapH);
                L.slots.push({ t: st, l: sl, b: st + slotH, r: sl + slotW, label: String(idx++) });
            }
        }
        // bande tournée à 90° dans l'espace résiduel à droite
        var residualW = zone.w - L.usedW;
        var rotW = slotH, rotH = slotW; // pièce tournée
        if (residualW >= rotW + gapH) {
            var nRot = fitCount(zone.h, rotH, gapV);
            var baseLeft = zone.left + L.usedW + gapH;
            for (var k4 = 0; k4 < nRot; k4++) {
                var rt = zone.top + k4 * (rotH + gapV);
                L.slots.push({ t: rt, l: baseLeft, b: rt + rotH, r: baseLeft + rotW,
                               label: String(idx++), rot: true });
            }
            L.usedW += gapH + rotW;
        }
        L.count = L.slots.length;
    } else {
        // N-UP / STEP&REPEAT / CUT&STACK / SHUFFLE : grille à gap fixe.
        var nCols = autoCols, nRows = autoRows;
        L.cols = nCols; L.rows = nRows;
        L.usedW = nCols * slotW + (nCols - 1) * gapH;
        L.usedH = nRows * slotH + (nRows - 1) * gapV;
        // départ au coin haut-gauche de la zone utile (espacement exact ;
        // l'espace en trop reste à droite/en bas comme demandé).
        L.originTop = zone.top; L.originLeft = zone.left;
        // en mode manuel, on peut vouloir MOINS de pièces que cols×rows
        // (ex : 7 demandées dans une grille 3×3) -> on coupe au total voulu.
        var maxN = nCols * nRows;
        if (c.auto === false) {
            var wantN = parseInt(c.count, 10);
            if (!isNaN(wantN) && wantN >= 1 && wantN < maxN) maxN = wantN;
        }
        var n = 1;
        // retournement : une rangée sur deux (paires) si flipAlt actif
        var flipAlt = (c.flipAlt === true);
        for (var r0 = 0; r0 < nRows; r0++) {
            var rf = flipAlt && ((r0 % 2) === 1);
            for (var c0 = 0; c0 < nCols; c0++) {
                if (n > maxN) break;
                var t0 = zone.top  + r0 * (slotH + gapV);
                var l0 = zone.left + c0 * (slotW + gapH);
                L.slots.push({ t: t0, l: l0, b: t0 + slotH, r: l0 + slotW,
                               label: String(n++), flip: rf });
            }
            if (n > maxN) break;
        }
        L.count = L.slots.length;
    }

    // ── ALIGNEMENT : place toute la grille dans la zone utile ───────────
    //   La géométrie ci-dessus part du coin haut-gauche de la zone (marges).
    //   - ancrages L/R (gauche/droite) et T/B (haut/bas) : relatifs à la ZONE.
    //   - ancrage C (centre) : centré sur le CENTRE DE LA PAGE, pas de la
    //     zone. Ainsi, même avec des marges asymétriques, le bloc imposé
    //     tombe pile au milieu de la feuille (et coïncide avec les repères
    //     de centre de page). zone.top/zone.left sont relatifs à la page,
    //     donc le centre page en coordonnées-zone vaut pageW/2 / pageH/2.
    return iwApplyAlignAndFinish(L, c, zone, align);
}

// ── Alignement + finition partagés ───────────────────────────────────
//   Place le bloc imposé (origine + tous les slots de L) dans la zone utile
//   selon `align` (TL/TC/.../CC/.../BR). Le centre "C" vise le CENTRE DE LA
//   PAGE (pageCenterX/Y) pour coïncider avec les repères de centre, sinon le
//   centre de zone. Marque enfin le débordement éventuel. Utilisé par le
//   chemin normal ET par l'assemblage Riso (même comportement de centrage).
function iwApplyAlignAndFinish(L, c, zone, align) {
    var freeW = zone.w - L.usedW;
    var freeH = zone.h - L.usedH;
    if (freeW < 0) freeW = 0;
    if (freeH < 0) freeH = 0;
    var ax = align.charAt(1); // L / C / R  (horizontal)
    var ay = align.charAt(0); // T / C / B  (vertical)

    var pageW = parseFloat(c.pageW);
    var pageH = parseFloat(c.pageH);
    // centre cible de la PAGE, exprimé dans LE MÊME repère que `zone`.
    // Chaque appelant le fournit dans son propre repère ; à défaut on le
    // reconstruit depuis zone + marges symétriques (repli).
    var pcX = parseFloat(c.pageCenterX);
    var pcY = parseFloat(c.pageCenterY);
    var hasCX = !isNaN(pcX);
    var hasCY = !isNaN(pcY);

    // décalage horizontal depuis le coin haut-gauche de la zone
    var dx;
    if (ax === "C") {
        if (hasCX) {
            // centre du bloc (origin actuel = zone.left) aligné sur pcX
            dx = (pcX - L.usedW / 2) - zone.left;
        } else {
            dx = freeW / 2; // repli : centre de zone
        }
    } else if (ax === "R") {
        dx = freeW;
    } else {
        dx = 0;
    }

    var dy;
    if (ay === "C") {
        if (hasCY) {
            dy = (pcY - L.usedH / 2) - zone.top;
        } else {
            dy = freeH / 2;
        }
    } else if (ay === "B") {
        dy = freeH;
    } else {
        dy = 0;
    }

    if (dx !== 0 || dy !== 0) {
        L.originTop += dy; L.originLeft += dx;
        for (var sa = 0; sa < L.slots.length; sa++) {
            L.slots[sa].t += dy; L.slots[sa].b += dy;
            L.slots[sa].l += dx; L.slots[sa].r += dx;
        }
    }
    L.align = align;

    // ── Débordement (sécurité) ───────────────────────────────────────
    if (L.usedW > zone.w + 0.01 || L.usedH > zone.h + 0.01) {
        L.overflow = true;
        L.ok = false;
        L.message = tr("lay_overflow", { UW: r2(L.usedW), UH: r2(L.usedH), ZW: r2(zone.w), ZH: r2(zone.h) });
    }
    return L;
}

// Construit un résumé texte lisible à partir d'un layout.
function iwLayoutSummary(L, c) {
    if (!L.ok && L.message) return "⚠ " + L.message;
    var modeNames = [tr("mode_nup"), tr("mode_steprep"), tr("mode_cutstack"), tr("mode_booklet"), tr("mode_dutchcut"), tr("mode_shuffle"), tr("mode_riso"), tr("mode_seri"), tr("mode_patch")];
    var s = modeNames[L.mode] + " — ";
    if (L.mode === 3) {
        var nb = parseInt(c.bkPages, 10) || 0;
        var sheets = Math.ceil(nb / 4);
        s += tr("sum_booklet", { N: nb, S: sheets, F: sheets * 2 });
        if ((parseFloat(c.bkCreep) || 0) > 0) s += tr("sum_creep", { C: c.bkCreep });
    } else {
        s += tr("sum_copies", { N: L.count, C: L.cols, R: L.rows });
        s += tr("sum_spacing", { H: r2(L.gapH), V: r2(L.gapV) });
    }
    s += tr("sum_footprint", { UW: r2(L.usedW), UH: r2(L.usedH) });
    if (L.bleed > 0) s += tr("sum_bleed", { B: r2(L.bleed) });
    return s;
}

// Dessine l'aperçu dans un canvas ScriptUI : une FEUILLE BLANCHE réaliste
// avec ombre portée, marges (zone utile), pièces numérotées et lignes de
// coupe. Pur visuel — aucune création dans le document.
//  L      = layout calculé
//  zone   = {top,left,w,h} zone utile mm (relatif à la page)
//  pageWH = {w,h} page entière mm
//  marks  = drapeaux de repères actifs (pour esquisser les crop marks)
function iwDrawPreview(canvas, L, zone, pageWH, marks, zoom, pan) {
    var g = canvas.graphics;
    var sz = canvas.size || canvas.preferredSize || [262, 344];
    var W = sz[0], H = sz[1];
    if (!W || !H) return;

    // ── Helpers de dessin DISCIPLINÉS ───────────────────────────────────
    //   Chaque primitive ouvre son PROPRE chemin (g.newPath) avant de tracer.
    //   C'est la cause n°1 des artefacts dans l'ancien moteur : rectPath()
    //   réutilisait l'état de chemin précédent, laissant des segments
    //   parasites entre formes successives. Ici, fill/stroke sont toujours
    //   appelés sur un chemin frais et isolé.
    function fillRect(x, y, w, h, brush) {
        if (w <= 0 || h <= 0) return;
        g.newPath();
        g.rectPath(x, y, w, h);
        g.fillPath(brush);
    }
    function strokeRect(x, y, w, h, pen) {
        if (w <= 0 || h <= 0) return;
        g.newPath();
        g.rectPath(x, y, w, h);
        g.strokePath(pen);
    }
    function line(x1, y1, x2, y2, pen) {
        g.newPath();
        g.moveTo(x1, y1);
        g.lineTo(x2, y2);
        g.strokePath(pen);
    }

    // — fond de l'aperçu, SAUF si « transparent » est demandé (dans ce cas
    //   l'aperçu prend la couleur native de la fenêtre) —
    //   V2 : fond ASSOMBRI (0.20 -> 0.13) et coins ARRONDIS. Le gain n'est pas
    //   cosmétique : la feuille est blanche, et plus le fond est sombre, plus
    //   son contour se détache. L'ancien gris-ardoise clair la faisait fondre
    //   dans le panneau.
    var IW_PV_RADIUS = 8;
    if (!marks || !marks.previewTransparent) {
        iwFillRound(g, 0, 0, W, H, IW_PV_RADIUS, [0.13, 0.14, 0.18, 1]);
    }

    if (!pageWH || pageWH.w <= 0 || pageWH.h <= 0) return;

    // — échelle pour faire tenir la feuille (marge interne confortable) —
    //   puis multipliée par le facteur de zoom (1 = ajustée à la fenêtre).
    //   V2 : marge interne réduite de 26 à 16 px — sur un canvas désormais
    //   plus grand, 26 px de vide de chaque côté était de la place perdue.
    var pad = 16;
    var zf = (zoom && zoom > 0) ? zoom : 1;
    var sc = Math.min((W - pad * 2) / pageWH.w, (H - pad * 2) / pageWH.h) * zf;
    if (!isFinite(sc) || sc <= 0) return;
    var sheetW = pageWH.w * sc, sheetH = pageWH.h * sc;
    // centrage de base + décalage de pan (déplacement manuel à la souris)
    var panX = (pan && pan.x) ? pan.x : 0;
    var panY = (pan && pan.y) ? pan.y : 0;
    var offX = (W - sheetW) / 2 + panX, offY = (H - sheetH) / 2 + panY;
    function PX(mm) { return offX + mm * sc; }
    function PY(mm) { return offY + mm * sc; }

    // — ombre portée sous la feuille — V2 : deux passes décalées plutôt qu'une
    //   seule, ce qui donne une retombée progressive au lieu d'un liseré net,
    //   et détache franchement la feuille du fond.
    var IW_SHEET_R = 5;
    iwFillRound(g, offX + 6, offY + 7, sheetW, sheetH, IW_SHEET_R, [0, 0, 0, 0.28]);
    iwFillRound(g, offX + 3, offY + 3, sheetW, sheetH, IW_SHEET_R, [0, 0, 0, 0.34]);

    // — la FEUILLE BLANCHE —
    iwFillRound(g, offX, offY, sheetW, sheetH, IW_SHEET_R, [1, 1, 1, 1]);
    iwStrokeRound(g, offX, offY, sheetW, sheetH, IW_SHEET_R, [0.62, 0.64, 0.70, 1], 1);

    // — zone utile (marges) : rectangle tireté bleu vif —
    var marginPen = g.newPen(g.PenType.SOLID_COLOR, [0.20, 0.50, 0.95, 1], 1.4);
    iwDashRect(g, marginPen, PX(zone.left), PY(zone.top), zone.w * sc, zone.h * sc, 5);

    // — pinceaux/plumes des pièces (vives, bon contraste) —
    var okFill   = g.newBrush(g.BrushType.SOLID_COLOR, [0.62, 0.80, 1.0, 1]);  // bleu franc clair
    var badFill  = g.newBrush(g.BrushType.SOLID_COLOR, [1.0, 0.70, 0.66, 1]);  // corail
    var bleedFill = g.newBrush(g.BrushType.SOLID_COLOR, [0.72, 0.86, 1.0, 1]); // fond perdu (bleu clair)
    var cutPen   = g.newPen(g.PenType.SOLID_COLOR, [0.05, 0.05, 0.08, 1], 1.8); // coupe (noir)
    var trimPen  = g.newPen(g.PenType.SOLID_COLOR, [0.65, 0.20, 0.80, 1], 1.6); // trim (violet)
    var regPen   = g.newPen(g.PenType.SOLID_COLOR, [0.0, 0.70, 0.70, 1], 1.6);  // mire/angle (cyan = mire du document)
    var regFilePen = g.newPen(g.PenType.SOLID_COLOR, [1.0, 0.55, 0.0, 1], 1.8); // mire PERSO (orange vif = remplace le document)
    var pageCtrPen = g.newPen(g.PenType.SOLID_COLOR, [0.95, 0.15, 0.55, 1], 2.0); // centre page (magenta)
    var labelPen = g.newPen(g.PenType.SOLID_COLOR, [0.10, 0.20, 0.45, 1], 1);
    var wmBorderFill = g.newBrush(g.BrushType.SOLID_COLOR, [0.99, 0.96, 0.74, 1]); // cadre blanc tournant (jaune pâle)
    var wmEdgePen = g.newPen(g.PenType.SOLID_COLOR, [0.78, 0.68, 0.30, 1], 1.8);   // bord du cadre / image réduite
    var pieceFill = L.overflow ? badFill : okFill;
    // V10 — pièce RETOURNÉE (180°) : teinte lilas distincte (sauf overflow,
    // qui reste corail pour signaler le problème en priorité).
    var flipFill = g.newBrush(g.BrushType.SOLID_COLOR, [0.80, 0.62, 0.95, 1]); // lilas
    var flipBleedFill = g.newBrush(g.BrushType.SOLID_COLOR, [0.90, 0.80, 0.98, 1]); // fond perdu lilas pâle

    var bleed = L.bleed || 0;

    // épaisseur des traits de repère DANS L'APERÇU, reflétant le mode :
    //   Riso (6) = fin ; Sérigraphie (7) = épais. Purement visuel ici.
    var mkW = 1.7;
    if (L.mode === 6) mkW = 0.7;
    else if (L.mode === 7) mkW = 2.4;
    var cutPenMk = g.newPen(g.PenType.SOLID_COLOR, [0.05, 0.05, 0.08, 1], mkW);

    var hasRegFile = !!(marks && marks.regFile && marks.regFile.length > 0);
    // V10 — si une mire perso est active, les croix de centre/bord (qui sont
    // aussi remplacées par la mire perso à l'export) s'affichent en ORANGE
    // dans l'aperçu pour le signaler ; sinon magenta habituel.
    var centerMarkPen = hasRegFile ? regFilePen : pageCtrPen;

    for (var i = 0; i < L.slots.length; i++) {
        var s = L.slots[i];
        var x = PX(s.l), y = PY(s.t);
        var w = (s.r - s.l) * sc, h = (s.b - s.t) * sc;

        // V10 — couleur de remplissage propre à CE slot : lilas si la pièce
        // est retournée (et qu'il n'y a pas d'overflow, prioritaire en corail).
        var slotFill = pieceFill;
        var slotBleedFill = bleedFill;
        if (s.flip && !L.overflow) { slotFill = flipFill; slotBleedFill = flipBleedFill; }

        // — LIGNE DE COUPE : à l'intérieur de la pièce, à `bleed` du bord —
        var bl = bleed * sc;
        var cx0, cy0, cx1, cy1;   // ligne de coupe (assignée selon le mode ci-dessous)

        // V20 — marges EXTÉRIEURES (px) : slot = pièce + marges autour. En mode
        //   extérieur, la pièce (à taille pleine) est INSET de ces marges dans
        //   le slot ; la coupe reste au BORD DE LA PIÈCE.
        var exT = (L.extTop    || 0) * sc;
        var exB = (L.extBottom || 0) * sc;
        var exL = (L.extLeft   || 0) * sc;
        var exR = (L.extRight  || 0) * sc;
        var extOn = !!(L.extOn) && (exT + exB + exL + exR) > 0;

        // marge INTÉRIEURE du blanc tournant (px), UNIQUEMENT si mode intérieur.
        var wmInside = !!(marks && marks.wm && marks.wm.enabled && !(marks.wm.outside));
        var wmTpx = wmInside ? (marks.wm.top    || 0) * sc : 0;
        var wmBpx = wmInside ? (marks.wm.bottom || 0) * sc : 0;
        var wmLpx = wmInside ? (marks.wm.left   || 0) * sc : 0;
        var wmRpx = wmInside ? (marks.wm.right  || 0) * sc : 0;
        var wmInsideOn = (wmTpx > 0 || wmBpx > 0 || wmLpx > 0 || wmRpx > 0);

        // Rectangle de la PIÈCE (bord = ligne de coupe) dans le slot.
        var px0, py0, px1, py1;
        if (extOn) {
            // pièce inset des marges extérieures (elle garde sa taille pleine)
            px0 = x + exL; py0 = y + exT; px1 = x + w - exR; py1 = y + h - exB;
        } else {
            // pièce = slot entier (mode intérieur / sans marge extérieure)
            px0 = x; py0 = y; px1 = x + w; py1 = y + h;
        }
        var pw = px1 - px0, ph = py1 - py0;

        // ── DESSIN ──────────────────────────────────────────────────────
        if (extOn && bleed > 0 && !wmInside) {
            // FOND PERDU EXTÉRIEUR : bande de fond perdu tout autour, pièce
            //   (bleu) à sa taille pleine au centre. Coupe = bord de pièce.
            //   V20 — si une couleur de fond perdu est connue (Auto/nuance),
            //   la bande prend CETTE couleur (le rectangle sera réellement
            //   généré à l'export) ; sinon bleu clair générique.
            var bleedRingFill = slotBleedFill;
            if (marks && marks.bleedColorRGB && marks.bleedColorRGB.length === 3) {
                bleedRingFill = g.newBrush(g.BrushType.SOLID_COLOR,
                    [marks.bleedColorRGB[0], marks.bleedColorRGB[1], marks.bleedColorRGB[2], 1]);
            }
            fillRect(x, y, w, h, bleedRingFill);
            fillRect(px0, py0, pw, ph, slotFill);
            strokeRect(px0, py0, pw, ph, cutPen);
            cx0 = px0; cy0 = py0; cx1 = px1; cy1 = py1;
        } else if (extOn && wmInside) {
            // (cas théorique : jamais atteint car wm exclut le fond perdu et
            //  wmInside implique non-extérieur ; conservé par prudence)
            fillRect(px0, py0, pw, ph, slotFill);
            cx0 = px0; cy0 = py0; cx1 = px1; cy1 = py1;
        } else if (bl > 0 && !wmInsideOn) {
            // FOND PERDU INTÉRIEUR (historique) : pièce = slot, coupe rentrée.
            cx0 = x + bl; cy0 = y + bl; cx1 = x + w - bl; cy1 = y + h - bl;
            if (cx1 <= cx0) { cx0 = x + w / 2 - 0.5; cx1 = x + w / 2 + 0.5; }
            if (cy1 <= cy0) { cy0 = y + h / 2 - 0.5; cy1 = y + h / 2 + 0.5; }
            fillRect(x, y, w, h, slotBleedFill);
            fillRect(cx0, cy0, cx1 - cx0, cy1 - cy0, slotFill);
            strokeRect(cx0, cy0, cx1 - cx0, cy1 - cy0, cutPen);
        } else if (wmInsideOn) {
            // BLANC TOURNANT INTÉRIEUR : image ajustée (ratio conservé) dans le
            //   rectangle réduit ; le rectangle BLEU épouse le cadre du blanc
            //   tournant (plus de bleu qui dépasse).
            var inW = w - wmLpx - wmRpx, inH = h - wmTpx - wmBpx;
            if (inW > 0 && inH > 0) {
                var pieceRatio = (L.slotW > 0 && L.slotH > 0) ? (L.slotW / L.slotH) : (w / h);
                var boxRatio = inW / inH;
                var imgW2, imgH2;
                if (pieceRatio > boxRatio) { imgW2 = inW; imgH2 = inW / pieceRatio; }
                else                       { imgH2 = inH; imgW2 = inH * pieceRatio; }
                var imgX2 = x + wmLpx + (inW - imgW2) / 2;
                var imgY2 = y + wmTpx + (inH - imgH2) / 2;
                // cadre du blanc tournant = image + marge (uniforme)
                var frX = imgX2 - wmLpx, frY = imgY2 - wmTpx;
                var frW = imgW2 + wmLpx + wmRpx, frH = imgH2 + wmTpx + wmBpx;
                // couleur du cadre : nuance choisie sinon jaune pâle
                var wmFill = wmBorderFill;
                if (marks.wm.colorRGB && marks.wm.colorRGB.length === 3) {
                    wmFill = g.newBrush(g.BrushType.SOLID_COLOR,
                        [marks.wm.colorRGB[0], marks.wm.colorRGB[1], marks.wm.colorRGB[2], 1]);
                }
                // 1) cadre (marge) ; 2) image bleue DEDANS, bords alignés au cadre
                fillRect(frX, frY, frW, frH, wmFill);
                strokeRect(frX, frY, frW, frH, wmEdgePen);
                fillRect(imgX2, imgY2, imgW2, imgH2, slotFill);
                strokeRect(imgX2, imgY2, imgW2, imgH2, wmEdgePen);
                // la coupe (repères) suit le CADRE du blanc tournant
                cx0 = frX; cy0 = frY; cx1 = frX + frW; cy1 = frY + frH;
            } else {
                fillRect(x, y, w, h, slotFill);
                cx0 = x; cy0 = y; cx1 = x + w; cy1 = y + h;
            }
        } else if (extOn && marks && marks.wm && marks.wm.outside && marks.wm.enabled) {
            // BLANC TOURNANT EXTÉRIEUR : marge colorée AUTOUR de la pièce pleine.
            //   Le cadre coloré (passe-partout) fait partie du fini -> la COUPE
            //   tombe sur le bord EXTÉRIEUR du cadre = le slot entier.
            var wmFillE = wmBorderFill;
            if (marks.wm.colorRGB && marks.wm.colorRGB.length === 3) {
                wmFillE = g.newBrush(g.BrushType.SOLID_COLOR,
                    [marks.wm.colorRGB[0], marks.wm.colorRGB[1], marks.wm.colorRGB[2], 1]);
            }
            fillRect(x, y, w, h, wmFillE);          // marge (cadre) autour
            fillRect(px0, py0, pw, ph, slotFill);   // pièce pleine au centre
            strokeRect(px0, py0, pw, ph, wmEdgePen);// liseré interne (pièce/marge)
            // la COUPE suit le bord EXTÉRIEUR du cadre (slot entier)
            cx0 = x; cy0 = y; cx1 = x + w; cy1 = y + h;
            strokeRect(cx0, cy0, cx1 - cx0, cy1 - cy0, cutPen);
        } else {
            // sans marge : la pièce = la zone finale
            fillRect(x, y, w, h, slotFill);
            cx0 = x; cy0 = y; cx1 = x + w; cy1 = y + h;
        }

        // — REPÈRES : tracés à l'échelle réelle (mm × sc). Ils marquent la
        //   LIGNE DE COUPE INTÉRIEURE (cx0,cy0,cx1,cy1) et réagissent donc
        //   au fond perdu (plus de bleed = coupe plus rentrée = marks rentrés).
        var mkLen = (marks && marks.len ? marks.len : 7) * sc;
        var mkGap = (marks && marks.gap != null ? marks.gap : 2) * sc;

        if (marks && marks.crop) {
            // 2 traits par coin, démarrant à mkGap de la coupe, vers l'EXTÉRIEUR
            line(cx0 - mkGap, cy0, cx0 - mkGap - mkLen, cy0, cutPenMk);   // HG h
            line(cx0, cy0 - mkGap, cx0, cy0 - mkGap - mkLen, cutPenMk);   // HG v
            line(cx1 + mkGap, cy0, cx1 + mkGap + mkLen, cy0, cutPenMk);   // HD h
            line(cx1, cy0 - mkGap, cx1, cy0 - mkGap - mkLen, cutPenMk);   // HD v
            line(cx0 - mkGap, cy1, cx0 - mkGap - mkLen, cy1, cutPenMk);   // BG h
            line(cx0, cy1 + mkGap, cx0, cy1 + mkGap + mkLen, cutPenMk);   // BG v
            line(cx1 + mkGap, cy1, cx1 + mkGap + mkLen, cy1, cutPenMk);   // BD h
            line(cx1, cy1 + mkGap, cx1, cy1 + mkGap + mkLen, cutPenMk);   // BD v
        }

        if (marks && marks.trim) {
            iwDashRect(g, trimPen, cx0, cy0, (cx1 - cx0), (cy1 - cy0), 3);
        }

        if (marks && marks.ang) {
            var d = mkLen * 0.7071;
            line(cx0 - mkGap, cy0 - mkGap, cx0 - mkGap - d, cy0 - mkGap - d, regPen);
            line(cx1 + mkGap, cy0 - mkGap, cx1 + mkGap + d, cy0 - mkGap - d, regPen);
            line(cx0 - mkGap, cy1 + mkGap, cx0 - mkGap - d, cy1 + mkGap + d, regPen);
            line(cx1 + mkGap, cy1 + mkGap, cx1 + mkGap + d, cy1 + mkGap + d, regPen);
        }

        if (marks && marks.reg) {
            // V11 — mire de registration PAR PIÈCE : toujours vectorielle
            // (la mire perso ne s'applique plus par carte, seulement aux croix
            // de centre/bord de page).
            var rcx = (cx0 + cx1) / 2, rcy = cy0 - mkGap - mkLen / 2;
            var rad = Math.max(3, mkLen / 2);
            line(rcx - rad, rcy, rcx + rad, rcy, regPen);
            line(rcx, rcy - rad, rcx, rcy + rad, regPen);
            line(rcx, rcy - rad, rcx + rad, rcy, regPen);
            line(rcx + rad, rcy, rcx, rcy + rad, regPen);
            line(rcx, rcy + rad, rcx - rad, rcy, regPen);
            line(rcx - rad, rcy, rcx, rcy - rad, regPen);
        }

        if (marks && marks.bar) {
            var barCols = [[0,0.6,0.85,1],[0.85,0.2,0.5,1],[0.95,0.85,0.2,1],[0.15,0.15,0.18,1],[0.6,0.6,0.62,1]];
            var cbw = (cx1 - cx0) / barCols.length;
            var cby = cy1 + mkGap;
            var cbh = Math.max(3, mkLen / 2);
            for (var b = 0; b < barCols.length; b++) {
                fillRect(cx0 + b * cbw, cby, cbw, cbh,
                         g.newBrush(g.BrushType.SOLID_COLOR, barCols[b]));
            }
        }

        // numéro de la pièce, centré
        try {
            var lab = s.label || String(i + 1);
            var tx = x + w / 2 - (lab.length * 3), ty = y + h / 2 - 6;
            g.drawString(lab, labelPen, tx, ty);
            if (s.rot) g.drawString("\u21BB", labelPen, x + w / 2 - 3, y + h / 2 + 6);
            // pièce retournée 180° : flèche tête-bêche + barre de "haut" en bas
            if (s.flip) {
                var flipPen = g.newPen(g.PenType.SOLID_COLOR, [0.85, 0.30, 0.55, 1], 1.6);
                g.drawString("\u2191\u2193", flipPen, x + w / 2 - 6, y + h / 2 + 6);
                line(x + 4, y + h - 4, x + w - 4, y + h - 4, flipPen);
            }
        } catch (eLab) {}
    }

    // axes de marge (px) déduits de zone (relatif à la page) — partagés par
    // les repères de centre de page ET les croix de bord supplémentaires.
    var mTopPx = zone.top * sc, mLeftPx = zone.left * sc;
    var mBotPx = (pageWH.h - zone.top - zone.h) * sc;
    var mRightPx = (pageWH.w - zone.left - zone.w) * sc;
    var axTopPx = offY + mTopPx / 2;
    var axBotPx = offY + sheetH - mBotPx / 2;
    var axLeftPx = offX + mLeftPx / 2;
    var axRightPx = offX + sheetW - mRightPx / 2;
    var pcx = offX + sheetW / 2, pcy = offY + sheetH / 2;

    // Mire de calage (aperçu) centrée en (px,py), rayon rad.
    //   V2 — c'est un CERCLE, pas un carré. L'aperçu traçait un rectangle en
    //   guise de cercle (« cercle approx en aperçu », disait le commentaire) :
    //   avec la croix qui le traverse, la mire se lisait comme une grille de
    //   quatre carreaux, et ne ressemblait pas à ce que le moteur pose
    //   réellement sur la planche. Le cercle est polygonalisé, comme partout
    //   ailleurs dans ce fichier — ScriptUI n'a pas d'arc.
    //   Le PLUS s'arrête AU cercle, sans déborder : c'est exactement ce que
    //   pose iwPlaceRegMark (bras de croix = rayon du cercle). Un aperçu qui
    //   déborderait montrerait autre chose que ce qui sera imprimé.
    function pvReg(px, py, rad, pen) {
        if (!(rad > 0)) return;
        line(px - rad, py, px + rad, py, pen);
        line(px, py - rad, px, py + rad, pen);
        var pts = iwCirclePoints(px, py, rad, 24);
        g.newPath();
        g.moveTo(pts[0][0], pts[0][1]);
        for (var iC = 1; iC < pts.length; iC++) g.lineTo(pts[iC][0], pts[iC][1]);
        g.closePath();
        g.strokePath(pen);
    }
    function radClamp(wantR, marginPx) {
        var maxR = (marginPx > 0 ? marginPx * 0.9 : wantR);
        var R = Math.min(wantR, maxR) / 2;
        if (R < 2) R = 2;
        return R;
    }

    // — REPÈRES DE CENTRE DE PAGE : 4 mires (croix+cercle) CENTRÉES dans la
    //   marge, un peu plus GROSSES que les croix de bord (×1.8). + croix
    //   exacte au centre de la feuille (optionnelle).
    if (marks && marks.pageCenter) {
        var wantRc = iwRegDiam(marks.regDiam) * sc;
        if (marks.pageCross) {
            var lc2 = wantRc / 2; if (lc2 < 6) lc2 = 6;
            line(pcx - lc2, pcy, pcx + lc2, pcy, pageCtrPen);
            line(pcx, pcy - lc2, pcx, pcy + lc2, pageCtrPen);
        }
        pvReg(pcx, axTopPx,    radClamp(wantRc, mTopPx),   centerMarkPen);  // haut
        pvReg(pcx, axBotPx,    radClamp(wantRc, mBotPx),   centerMarkPen);  // bas
        pvReg(axLeftPx,  pcy,  radClamp(wantRc, mLeftPx),  centerMarkPen);  // gauche
        pvReg(axRightPx, pcy,  radClamp(wantRc, mRightPx), centerMarkPen);  // droite
        // 4 mires de COIN (intersection des axes de marge)
        var rcTL = radClamp(wantRc, Math.min(mTopPx, mLeftPx));
        var rcTR = radClamp(wantRc, Math.min(mTopPx, mRightPx));
        var rcBL = radClamp(wantRc, Math.min(mBotPx, mLeftPx));
        var rcBR = radClamp(wantRc, Math.min(mBotPx, mRightPx));
        pvReg(axLeftPx,  axTopPx, rcTL, centerMarkPen);   // coin HG
        pvReg(axRightPx, axTopPx, rcTR, centerMarkPen);   // coin HD
        pvReg(axLeftPx,  axBotPx, rcBL, centerMarkPen);   // coin BG
        pvReg(axRightPx, axBotPx, rcBR, centerMarkPen);   // coin BD
        // CADRE DE COUPE : rectangle passant par les centres des mires de coin
        if (marks.pageFrame) {
            line(axLeftPx,  axTopPx, axRightPx, axTopPx, pageCtrPen);
            line(axRightPx, axTopPx, axRightPx, axBotPx, pageCtrPen);
            line(axRightPx, axBotPx, axLeftPx,  axBotPx, pageCtrPen);
            line(axLeftPx,  axBotPx, axLeftPx,  axTopPx, pageCtrPen);
        }
    }

    // — CROIX DE BORD SUPPLÉMENTAIRES (aperçu) : croix+cercle le long des 4
    //   bords, à intervalle régulier, CENTRÉES dans l'épaisseur de marge.
    //   On laisse les COINS libres et on saute la ZONE DES COULEURS (haut/bas),
    //   pour refléter l'impression réelle.
    if (marks && marks.sideCross) {
        var sideStepPx = (marks.sideStep && marks.sideStep > 0 ? marks.sideStep : 40) * sc;
        if (sideStepPx >= 6) {
            var pcx2 = offX + sheetW / 2, pcy2 = offY + sheetH / 2;
            // V2 — même diamètre que les autres mires (voir addPageSideCrosses)
            var wantR = iwRegDiam(marks.regDiam) * sc;
            function radFor(marginPx) {
                var maxR = (marginPx > 0 ? marginPx * 0.9 : wantR);
                var R = Math.min(wantR, maxR) / 2;
                if (R < 2) R = 2;
                return R;
            }
            var rH = radFor(mTopPx), rHb = radFor(mBotPx), rV = radFor(mLeftPx), rVr = radFor(mRightPx);
            // clearance des coins (≈ diamètre + 6 mm), comme à l'impression
            var clrXpx = 4 * Math.max(rH, rHb) + (marks.crossCornerGap || 6) * sc;
            var clrYpx = 4 * Math.max(rV, rVr) + (marks.crossCornerGap || 6) * sc;
            // zone des couleurs (schématique, nFakePv pastilles) CENTRÉE de
            // part et d'autre de la croix centrale, orientation-aware.
            var nFakePv = 3;
            var czOn = !!(marks && marks.colorMarks);
            var pvIsPortraitC = (pageWH && pageWH.h >= pageWH.w);
            var pvColorEdgeC = (marks && marks.colorEdge === "long") ? "long" : "short";
            var pvWantHC = (pvColorEdgeC === "long") ? !pvIsPortraitC : pvIsPortraitC;
            var pvGapHalfPx = (marks && marks.pageCenter)
                ? (iwRegDiam(marks.regDiam) * sc / 2 + 2 * sc) : 0;
            function centeredPx(n, itemPx, center, gapHalf) {
                var leftN = Math.floor(n / 2), rightN = n - leftN;
                return { lo: center - gapHalf - leftN * itemPx, hi: center + gapHalf + rightN * itemPx };
            }
            var swPxC  = (marks.colorSwatchSize || 12) * sc;
            var barWpxC = (marks.colorBarW || 46) * sc;
            var czTopZ = centeredPx(nFakePv, swPxC,  pcx2, pvGapHalfPx);   // carrés (haut)
            var czBotZ = centeredPx(nFakePv, barWpxC, pcx2, pvGapHalfPx);  // bandes (bas)
            var czLeftZ  = centeredPx(nFakePv, swPxC,  pcy2, pvGapHalfPx); // carrés (gauche, vertical)
            var czRightZ = centeredPx(nFakePv, barWpxC, pcy2, pvGapHalfPx);// bandes (droite, vertical)
            function inCZ(px, edge) {
                if (!czOn || !pvWantHC) return false;
                var z = (edge === "bottom") ? czBotZ : czTopZ;
                return (px >= z.lo - 4 * sc && px <= z.hi + 4 * sc);
            }
            function inCZY(py, edge) {
                if (!czOn || pvWantHC) return false;
                var z = (edge === "right") ? czRightZ : czLeftZ;
                return (py >= z.lo - 4 * sc && py <= z.hi + 4 * sc);
            }
            function pvRegS(px, py, rad) { pvReg(px, py, rad, centerMarkPen); }
            // haut/bas
            for (var ddx = sideStepPx; pcx2 + ddx <= offX + sheetW - clrXpx; ddx += sideStepPx) {
                var xr3 = pcx2 + ddx;
                if (!inCZ(xr3, "top"))    pvRegS(xr3, axTopPx, rH);
                if (!inCZ(xr3, "bottom")) pvRegS(xr3, axBotPx, rHb);
                var xl2 = pcx2 - ddx;
                if (xl2 >= offX + clrXpx) {
                    if (!inCZ(xl2, "top"))    pvRegS(xl2, axTopPx, rH);
                    if (!inCZ(xl2, "bottom")) pvRegS(xl2, axBotPx, rHb);
                }
            }
            // gauche/droite
            for (var ddy = sideStepPx; pcy2 + ddy <= offY + sheetH - clrYpx; ddy += sideStepPx) {
                var yb2 = pcy2 + ddy, yt2 = pcy2 - ddy;
                if (!inCZY(yb2, "right")) pvRegS(axRightPx, yb2, rVr);
                if (!inCZY(yt2, "right")) pvRegS(axRightPx, yt2, rVr);
                if (yt2 >= offY + clrYpx && !inCZY(yt2, "left")) pvRegS(axLeftPx, yt2, rV);
                if (yb2 <= offY + sheetH - clrYpx && !inCZY(yb2, "left")) pvRegS(axLeftPx, yb2, rV);
            }
        }
    }

    // — MARQUES COULEURS (aperçu, schématique) : pastilles centrées dans
    //   l'épaisseur de marge (haut/bas), juxtaposées vers la droite.
    if (marks && marks.colorMarks) {
        var nFake = 3; // nombre indicatif de pastilles dans l'aperçu
        var padPx = 4 * sc;
        var colPen = g.newPen(g.PenType.SOLID_COLOR, [0.25, 0.25, 0.30, 1], 1);
        var colFill = g.newBrush(g.BrushType.SOLID_COLOR, [0.70, 0.72, 0.78, 1]);
        var txtPen = g.newPen(g.PenType.SOLID_COLOR, [1, 1, 1, 1], 1); // nom blanc (défonce)
        // trou pour ne pas masquer la mire de centre (cohérent avec l'impression)
        var pcCx = offX + sheetW / 2;
        var pvMireHalf = iwRegDiam(marks.regDiam) * sc / 2 + 2 * sc;
        var pvRsvOn = !!marks.pageCenter;
        function pvSkipCenter(x, w) {
            if (!pvRsvOn) return x;
            if (x < pcCx + pvMireHalf && (x + w) > pcCx - pvMireHalf) return pcCx + pvMireHalf;
            return x;
        }
        var pcCy = offY + sheetH / 2;
        function pvSkipCenterY(y, h) {
            if (!pvRsvOn) return y;
            if (y < pcCy + pvMireHalf && (y + h) > pcCy - pvMireHalf) return pcCy + pvMireHalf;
            return y;
        }
        // orientation de l'aperçu : identique au moteur (format + bord choisi)
        var pvIsPortrait = (pageWH && pageWH.h >= pageWH.w);
        var pvColorEdge = (marks.colorEdge === "long") ? "long" : "short";
        var pvWantH = (pvColorEdge === "long") ? !pvIsPortrait : pvIsPortrait;

        // dégagement des coins (px) : bornes utiles le long de chaque bord, en
        // retirant le rayon de la mire de coin + le jeu d'angle, pour ne pas
        // masquer les mires de coin.
        var wantRcC = iwRegDiam(marks.regDiam) * sc;
        function radC(mpx) { var mx = (mpx > 0 ? mpx * 0.9 : wantRcC); var R = Math.min(wantRcC, mx) / 2; return R < 2 ? 2 : R; }
        var cgPx = (marks.crossCornerGap || 6) * sc;
        var axLpx = offX + mLeftPx / 2, axRpx = offX + sheetW - mRightPx / 2;
        var axTpx = offY + mTopPx / 2,  axBpx = offY + sheetH - mBotPx / 2;
        var topLoPx = axLpx + radC(Math.min(mTopPx, mLeftPx)) + cgPx;
        var topHiPx = axRpx - radC(Math.min(mTopPx, mRightPx)) - cgPx;
        var botLoPx = axLpx + radC(Math.min(mBotPx, mLeftPx)) + cgPx;
        var botHiPx = axRpx - radC(Math.min(mBotPx, mRightPx)) - cgPx;
        var leftLoPx  = axTpx + radC(Math.min(mTopPx, mLeftPx))  + cgPx;
        var leftHiPx  = axBpx - radC(Math.min(mBotPx, mLeftPx))  - cgPx;
        var rightLoPx = axTpx + radC(Math.min(mTopPx, mRightPx)) + cgPx;
        var rightHiPx = axBpx - radC(Math.min(mBotPx, mRightPx)) - cgPx;

        var pvGap = pvRsvOn ? pvMireHalf : 0;
        function pvCentered(n, itemPx, center, gapHalf) {
            var leftN = Math.floor(n / 2), rightN = n - leftN, pos = [];
            var ls = center - gapHalf - leftN * itemPx;
            for (var i = 0; i < leftN; i++) pos[i] = ls + i * itemPx;
            for (var j = 0; j < rightN; j++) pos[leftN + j] = center + gapHalf + j * itemPx;
            return pos;
        }
        function pvFit(defPx, center, lo, hi, gapHalf, n) {
            if (n < 1) return defPx;
            var halfSpan = Math.min(center - lo, hi - center);
            var per = Math.ceil(n / 2);
            var av = (halfSpan - gapHalf) / per;
            if (av < 1) av = 1;
            return Math.min(defPx, av);
        }

        if (pvWantH) {
        if (L.mode === 6) {
            // Riso : noms répartis de part et d'autre du centre (marge basse)
            var nameWpx = pvFit(30 * sc, pcCx, botLoPx, botHiPx, pvGap, nFake);
            var pRiso = pvCentered(nFake, nameWpx, pcCx, pvGap);
            for (var ri = 0; ri < nFake; ri++) {
                var xn3 = pRiso[ri];
                if (xn3 < botLoPx || xn3 + nameWpx > botHiPx) continue;
                line(xn3, axBotPx, xn3 + nameWpx - 3 * sc, axBotPx, colPen);
            }
        } else {
            // Sérigraphie : carrés (marge haute) + rectangles (marge basse)
            var sqPx = pvFit(12 * sc, pcCx, topLoPx, topHiPx, pvGap, nFake); if (sqPx < 3) sqPx = 3;
            var halfSqPx = sqPx / 2;
            var pSq = pvCentered(nFake, sqPx, pcCx, pvGap);
            for (var ai = 0; ai < nFake; ai++) {
                var xSq3 = pSq[ai];
                if (xSq3 < topLoPx || xSq3 + sqPx > topHiPx) continue;
                fillRect(xSq3, axTopPx - halfSqPx, sqPx, sqPx, colFill);
                strokeRect(xSq3, axTopPx - halfSqPx, sqPx, sqPx, colPen);
            }
            var barHpx = (marks.colorBarH||11) * sc, barWpx = pvFit((marks.colorBarW||46) * sc, pcCx, botLoPx, botHiPx, pvGap, nFake);
            if (barHpx < 3) barHpx = 3;
            var halfBarPx = barHpx / 2;
            var pBar = pvCentered(nFake, barWpx, pcCx, pvGap);
            for (var ci2 = 0; ci2 < nFake; ci2++) {
                var xB3 = pBar[ci2];
                if (xB3 < botLoPx || xB3 + barWpx > botHiPx) continue;
                fillRect(xB3, axBotPx - halfBarPx, barWpx, barHpx, colFill);
                strokeRect(xB3, axBotPx - halfBarPx, barWpx, barHpx, colPen);
                try { g.drawString("Abc", txtPen, xB3 + barWpx / 2 - 8, axBotPx - 4); } catch (eN) {}
            }
        }
        } else {
            // ════════ DISPOSITION VERTICALE (centrée sur la croix) ════════
            if (L.mode === 6) {
                var nameHpx = pvFit(30 * sc, pcCy, leftLoPx, leftHiPx, pvGap, nFake);
                var pRisoV = pvCentered(nFake, nameHpx, pcCy, pvGap);
                for (var rvi = 0; rvi < nFake; rvi++) {
                    var yn3 = pRisoV[rvi];
                    if (yn3 < leftLoPx || yn3 + nameHpx > leftHiPx) continue;
                    line(axLeftPx, yn3, axLeftPx, yn3 + nameHpx - 3 * sc, colPen);
                }
            } else {
                var sqPxV = pvFit(12 * sc, pcCy, leftLoPx, leftHiPx, pvGap, nFake); if (sqPxV < 3) sqPxV = 3;
                var halfSqPxV = sqPxV / 2;
                var pSqV = pvCentered(nFake, sqPxV, pcCy, pvGap);
                for (var avi = 0; avi < nFake; avi++) {
                    var ySq3 = pSqV[avi];
                    if (ySq3 < leftLoPx || ySq3 + sqPxV > leftHiPx) continue;
                    fillRect(axLeftPx - halfSqPxV, ySq3, sqPxV, sqPxV, colFill);
                    strokeRect(axLeftPx - halfSqPxV, ySq3, sqPxV, sqPxV, colPen);
                }
                var barTpx = (marks.colorBarH||11) * sc, barLpx = pvFit((marks.colorBarW||46) * sc, pcCy, rightLoPx, rightHiPx, pvGap, nFake);
                if (barTpx < 3) barTpx = 3;
                var halfBarTpx = barTpx / 2;
                var pBarV = pvCentered(nFake, barLpx, pcCy, pvGap);
                for (var cvi = 0; cvi < nFake; cvi++) {
                    var yB3 = pBarV[cvi];
                    if (yB3 < rightLoPx || yB3 + barLpx > rightHiPx) continue;
                    fillRect(axRightPx - halfBarTpx, yB3, barTpx, barLpx, colFill);
                    strokeRect(axRightPx - halfBarTpx, yB3, barTpx, barLpx, colPen);
                    try { g.drawString("Abc", txtPen, axRightPx - 8, yB3 + barLpx / 2 + 3); } catch (eNv) {}
                }
            }
        }
    }

    // — V2 : le BANDEAU LÉGENDE sous la feuille est SUPPRIMÉ.
    //   Il énumérait en toutes lettres les repères actifs (« fond perdu ·
    //   coupe · centre page · croix bords · couleurs »), c'est-à-dire
    //   exactement ce que les cases à cocher de l'onglet Repères montrent
    //   déjà — et ce que le dessin lui-même montre. Il volait une ligne de
    //   hauteur sous la feuille pour redire ce qui était visible deux fois.

    // — COTES / MESURES (V4) : lignes de cote sur le bord HAUT (largeur) et
    //   le bord GAUCHE (hauteur), avec ticks d'extrémité, + une étiquette
    //   « l × h mm » centrée au-dessus. Tracées uniquement à échelle normale
    //   (sinon elles sortiraient du cadre une fois zoomé/déplacé).
    try {
        if (offY > 18 && offX > 14 && zf <= 1.6 && (marks && marks.showDims !== false)) {
            var dimPen = g.newPen(g.PenType.SOLID_COLOR, [0.85, 0.88, 0.95, 1], 1);
            var wmm = Math.round(pageWH.w * 10) / 10;
            var hmm = Math.round(pageWH.h * 10) / 10;
            var tk = 4;
            // cote LARGEUR (au-dessus de la feuille)
            var yTop = offY - 9;
            g.newPath(); g.moveTo(offX, yTop); g.lineTo(offX + sheetW, yTop); g.strokePath(dimPen);
            g.newPath(); g.moveTo(offX, yTop - tk); g.lineTo(offX, yTop + tk); g.strokePath(dimPen);
            g.newPath(); g.moveTo(offX + sheetW, yTop - tk); g.lineTo(offX + sheetW, yTop + tk); g.strokePath(dimPen);
            // cote HAUTEUR (à gauche de la feuille)
            var xLeft = offX - 9;
            g.newPath(); g.moveTo(xLeft, offY); g.lineTo(xLeft, offY + sheetH); g.strokePath(dimPen);
            g.newPath(); g.moveTo(xLeft - tk, offY); g.lineTo(xLeft + tk, offY); g.strokePath(dimPen);
            g.newPath(); g.moveTo(xLeft - tk, offY + sheetH); g.lineTo(xLeft + tk, offY + sheetH); g.strokePath(dimPen);
            // étiquette dimensions, centrée au-dessus (dim. sûre sur fond foncé)
            g.drawString(wmm + " \u00D7 " + hmm + " mm", dimPen, offX + sheetW / 2 - 36, offY - 22);
        }
    } catch (eDim) {}
}

// Rectangle en tirets (approx : segments courts sur les 4 côtés).
function iwDashRect(g, pen, x, y, w, h, dash) {
    function seg(x1, y1, x2, y2) {
        if (x1 === x2) { // vertical
            for (var yy = y1; yy < y2; yy += dash * 2) {
                g.newPath(); g.moveTo(x1, yy); g.lineTo(x1, Math.min(yy + dash, y2)); g.strokePath(pen);
            }
        } else { // horizontal
            for (var xx = x1; xx < x2; xx += dash * 2) {
                g.newPath(); g.moveTo(xx, y1); g.lineTo(Math.min(xx + dash, x2), y1); g.strokePath(pen);
            }
        }
    }
    seg(x, y, x + w, y);
    seg(x, y + h, x + w, y + h);
    seg(x, y, x, y + h);
    seg(x + w, y, x + w, y + h);
}

// Trace un segment droit (helper aperçu).
function iwSeg(g, pen, x1, y1, x2, y2) {
    g.newPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.strokePath(pen);
}

// Dessine un repère de coupe en "L" à un coin (sx,sy = sens du trait).
function iwCorner(g, pen, x, y, len, sx, sy) {
    g.newPath(); g.moveTo(x, y); g.lineTo(x + sx * len, y); g.strokePath(pen);       // bras horizontal
    g.newPath(); g.moveTo(x, y); g.lineTo(x, y + sy * len); g.strokePath(pen);       // bras vertical
}


// Applique un style italique discret à un statictext, sans jamais lever
// d'erreur (la fonte n'est pas toujours lisible avant le layout).
function iwItalic(ctrl) {
    try {
        var fn = ctrl.graphics.font;
        var name = (fn && fn.name) ? fn.name : "dialog";
        ctrl.graphics.font = ScriptUI.newFont(name, "ITALIC", 10);
    } catch (e) {}
}


// ─────────────────────────────────────────────────────────────────────
//  CALIBRAGE ÉCRAN — par carte bancaire (ISO/IEC 7810 ID-1 : 85,6 mm).
//  L'utilisateur ajuste un rectangle à la largeur d'une vraie carte posée
//  sur l'écran ; on en déduit la densité (px/mm) réelle de SON écran, sans
//  rien deviner. Renvoie les px/mm calibrés (en UNITÉS ScriptUI, cohérentes
//  avec l'aperçu), ou null si annulé.
//
//  V10 — RÉPARATION :
//    • Redraw FIABLE pendant le glissement : le simple notify("onDraw")
//      ne repeint pas toujours le panneau. On dessine donc dans un
//      groupe avec onDraw + on force le repaint via un cycle hide/show
//      du conteneur en dernier recours (même technique que l'aperçu).
//    • Plage du curseur ÉLARGIE (jusqu'à 1600) pour couvrir les écrans
//      Retina/HiDPI où une carte occupe beaucoup de points logiques.
//    • Saisie NUMÉRIQUE directe de la largeur en points : si le curseur
//      n'a pas assez de course, on tape la valeur mesurée à la main.
//    • L'échelle renvoyée est en points/mm ScriptUI : c'est EXACTEMENT
//      l'unité utilisée par iwDrawPreview (sc), donc « Taille réelle »
//      devient juste sur cet écran, Retina compris.
// ─────────────────────────────────────────────────────────────────────
function iwCalibrateScreen(curPxPerMM) {
    var CARD_W_MM = 85.6, CARD_H_MM = 53.98;
    var ppmm = (curPxPerMM && curPxPerMM > 0) ? curPxPerMM : (96 / 25.4);
    var cardPx = Math.round(ppmm * CARD_W_MM);
    var SL_MIN = 120, SL_MAX = 1600;   // V10 — plage large (Retina/4K)
    if (cardPx < SL_MIN) cardPx = SL_MIN;
    if (cardPx > SL_MAX) cardPx = SL_MAX;

    var dlg = new Window("dialog", tr("calib_title"));
    dlg.orientation = "column"; dlg.alignChildren = "fill"; dlg.margins = 16; dlg.spacing = 10;

    var info = dlg.add("statictext", undefined, tr("calib_intro"), { multiline: true });
    info.preferredSize = [840, 64];

    // conteneur autour du panneau de dessin : sert de cible au repaint forcé
    var cvWrap = dlg.add("group");
    cvWrap.orientation = "stack"; cvWrap.alignChildren = ["fill", "fill"];
    var cv = cvWrap.add("panel", undefined, undefined);
    cv.preferredSize = [860, 200];
    cv.onDraw = function () {
        var g = this.graphics;
        var W = this.size[0], H = this.size[1];
        // V10 — FOND TRANSPARENT : pas de remplissage du panneau (couleur native
        // de la fenêtre). Le rectangle « carte » est dessiné avec un contour bleu
        // épais + un remplissage bleu très léger pour rester visible sur fond clair.
        var wpx = cardPx, hpx = wpx * (CARD_H_MM / CARD_W_MM);
        var x = (W - wpx) / 2, y = (H - hpx) / 2;
        // V2 — arrondi proportionnel au vrai rayon d'une carte ISO/IEC 7810
        // (3,18 mm sur 85,6 mm de large) : le rectangle se superpose donc
        // exactement à la carte que l'on pose sur l'écran pour calibrer.
        var cardR = wpx * (3.18 / CARD_W_MM);
        iwFillRound(g, x, y, wpx, hpx, cardR, [0.20, 0.45, 0.95, 0.12]);
        iwStrokeRound(g, x, y, wpx, hpx, cardR, [0.20, 0.45, 0.95, 1], 2.5);
        // petit repère central pour aligner précisément
        g.newPath(); g.moveTo(W / 2, y); g.lineTo(W / 2, y + hpx);
        g.strokePath(g.newPen(g.PenType.SOLID_COLOR, [0.20, 0.45, 0.95, 0.5], 1));
    };
    // repaint robuste : appel direct + notify + cycle hide/show de secours
    function redraw() {
        var ok = false;
        try { cv.onDraw(); ok = true; } catch (e) {}
        try { cv.notify("onDraw"); } catch (e2) {}
        if (!ok) { try { cv.hide(); cv.show(); } catch (e3) {} }
        try { dlg.update(); } catch (e4) {}
    }

    var sl = dlg.add("slider", undefined, cardPx, SL_MIN, SL_MAX);
    sl.preferredSize = [840, 22];

    // ligne : réglage fin (±1) + saisie numérique directe de la largeur (px)
    var fineRow = dlg.add("group"); fineRow.orientation = "row"; fineRow.alignChildren = "center"; fineRow.spacing = 6;
    var bMinus = fineRow.add("button", undefined, "\u2212"); bMinus.preferredSize = [30, 22];
    var bPlus  = fineRow.add("button", undefined, "+");       bPlus.preferredSize  = [30, 22];
    fineRow.add("statictext", undefined, tr("calib_widthpx")).preferredSize.width = 180;
    var widthIn = fineRow.add("edittext", undefined, String(cardPx)); widthIn.preferredSize.width = 70;

    var readout = dlg.add("statictext", undefined, ""); readout.alignment = "center";
    function fmt() {
        var m = cardPx / CARD_W_MM;
        readout.text = tr("calib_readout", { M: (Math.round(m * 100) / 100), P: Math.round(m * 25.4) });
    }
    // applique une nouvelle valeur de largeur (depuis n'importe quelle source)
    function setCard(v, fromSlider, fromField) {
        v = Math.round(v);
        if (v < SL_MIN) v = SL_MIN;
        // pas de plafond dur sur la saisie clavier (un 5K peut dépasser SL_MAX)
        if (fromSlider && v > SL_MAX) v = SL_MAX;
        cardPx = v;
        if (!fromSlider) { try { sl.value = Math.max(SL_MIN, Math.min(cardPx, SL_MAX)); } catch (eS) {} }
        if (!fromField)  { try { widthIn.text = String(cardPx); } catch (eF) {} }
        fmt(); redraw();
    }
    sl.onChanging = function () { setCard(sl.value, true, false); };
    sl.onChange   = function () { setCard(sl.value, true, false); };
    bMinus.onClick = function () { setCard(cardPx - 1, false, false); };
    bPlus.onClick  = function () { setCard(cardPx + 1, false, false); };
    // V20 — la saisie clavier n'est appliquée QU'À la validation (onChange :
    // Entrée/perte de focus), pas à chaque frappe. onChanging clampait la
    // valeur partielle (« 1 » puis « 12 »…) à SL_MIN et empêchait de taper un
    // nombre à plusieurs chiffres. On laisse donc l'utilisateur taper librement.
    widthIn.onChange   = function () { var v = parseFloat(widthIn.text); if (isFinite(v) && v > 0) setCard(v, false, true); };
    fmt();

    var btns = dlg.add("group"); btns.alignment = "right";
    btns.add("button", undefined, tr("btn_cancel"), { name: "cancel" });
    btns.add("button", undefined, "OK", { name: "ok" });

    // premier rendu (après que la fenêtre connaisse ses tailles)
    dlg.onShow = function () { redraw(); };

    if (dlg.show() !== 1) return null;
    return cardPx / CARD_W_MM;   // points/mm ScriptUI calibrés
}

// ─────────────────────────────────────────────────────────────────────
//  DIALOGUES AUXILIAIRES PRESETS (V10)
// ─────────────────────────────────────────────────────────────────────

// Palette de couleurs proposées pour les presets (codes hex courants, lisibles
// sur fond sombre). Renvoie "#RRGGBB", "" (aucune), ou false (annulé).
// HSV (h:0-360, s:0-1, v:0-1) -> RGB 0-255
function iwHSVtoRGB(h, s, v) {
    h = ((h % 360) + 360) % 360;
    var c = v * s;
    var x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    var m = v - c;
    var r, g, b;
    if (h < 60)      { r = c; g = x; b = 0; }
    else if (h < 120){ r = x; g = c; b = 0; }
    else if (h < 180){ r = 0; g = c; b = x; }
    else if (h < 240){ r = 0; g = x; b = c; }
    else if (h < 300){ r = x; g = 0; b = c; }
    else             { r = c; g = 0; b = x; }
    return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}
// RGB 0-255 -> HSV [h:0-360, s:0-1, v:0-1]
function iwRGBtoHSV(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    var h = 0;
    if (d !== 0) {
        if (mx === r) h = 60 * (((g - b) / d) % 6);
        else if (mx === g) h = 60 * (((b - r) / d) + 2);
        else h = 60 * (((r - g) / d) + 4);
    }
    if (h < 0) h += 360;
    var s = (mx === 0) ? 0 : d / mx;
    return [h, s, mx];
}

// Sélecteur de couleur à ROUE CHROMATIQUE (V10).
//   • Roue teinte/saturation dessinée (anneaux + secteurs), avec un curseur
//     de luminosité (Valeur) en dessous.
//   • Cliquer/glisser sur la roue choisit teinte + saturation. Les
//     coordonnées du clic sont lues de façon DÉFENSIVE (plusieurs propriétés
//     possibles selon les versions d'InDesign) -> pas de plantage.
//   • Curseurs T/S/L natifs en secours (toujours fiables) + champ hex.
//   Renvoie "#RRGGBB", "" (aucune), ou false (annulé).
function iwPickPresetColor(currentHex) {
    // état HSV courant (par défaut : rouge moyen, ou la couleur actuelle)
    var startRGB = iwHexToRGB255(currentHex) || [224, 65, 59];
    var hsv = iwRGBtoHSV(startRGB[0], startRGB[1], startRGB[2]);
    var H = hsv[0], S = hsv[1], V = hsv[2];

    var dlg = new Window("dialog", tr("color_dlg_title"));
    dlg.orientation = "column"; dlg.alignChildren = "fill"; dlg.margins = 16; dlg.spacing = 10;
    dlg.add("statictext", undefined, tr("color_dlg_intro"));

    var bodyRow = dlg.add("group"); bodyRow.orientation = "row"; bodyRow.alignChildren = "top"; bodyRow.spacing = 16;

    // — ROUE CHROMATIQUE (panneau dessiné) —
    var WHEEL = 220, WPAD = 6;
    var wheelPanel = bodyRow.add("panel", undefined, undefined);
    wheelPanel.preferredSize = [WHEEL + WPAD * 2, WHEEL + WPAD * 2];
    function wheelGeom() {
        var W = (wheelPanel.size ? wheelPanel.size[0] : WHEEL + WPAD * 2);
        var Hh = (wheelPanel.size ? wheelPanel.size[1] : WHEEL + WPAD * 2);
        var cx = W / 2, cy = Hh / 2;
        var R = Math.min(W, Hh) / 2 - WPAD;
        return { cx: cx, cy: cy, R: R };
    }
    wheelPanel.onDraw = function () {
        var g = this.graphics;
        var W = this.size[0], Hh = this.size[1];
        iwFillRound(g, 0, 0, W, Hh, 6, [0.16, 0.17, 0.21, 1]);
        var geom = wheelGeom();
        var cx = geom.cx, cy = geom.cy, R = geom.R;
        // roue : on remplit par anneaux (saturation) et secteurs (teinte).
        // La luminosité V module l'aspect (la roue s'assombrit avec V faible).
        var RINGS = 14, SECT = 48;
        for (var ri = 0; ri < RINGS; ri++) {
            var r0 = R * (ri / RINGS), r1 = R * ((ri + 1) / RINGS);
            var sat = (ri + 0.5) / RINGS;
            for (var si = 0; si < SECT; si++) {
                var a0 = (si / SECT) * Math.PI * 2;
                var a1 = ((si + 1) / SECT) * Math.PI * 2;
                var hue = (si + 0.5) / SECT * 360;
                var rgb = iwHSVtoRGB(hue, sat, V);
                // quadrilatère de l'anneau-secteur (4 points)
                var p0 = [cx + Math.cos(a0) * r0, cy + Math.sin(a0) * r0];
                var p1 = [cx + Math.cos(a0) * r1, cy + Math.sin(a0) * r1];
                var p2 = [cx + Math.cos(a1) * r1, cy + Math.sin(a1) * r1];
                var p3 = [cx + Math.cos(a1) * r0, cy + Math.sin(a1) * r0];
                g.newPath();
                g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]);
                g.lineTo(p2[0], p2[1]); g.lineTo(p3[0], p3[1]); g.closePath();
                g.fillPath(g.newBrush(g.BrushType.SOLID_COLOR, [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255, 1]));
            }
        }
        // indicateur de la sélection courante (petit cercle blanc cerclé noir)
        var ia = (H * Math.PI / 180), ir = S * R;
        var ix = cx + Math.cos(ia) * ir, iy = cy + Math.sin(ia) * ir;
        iwStrokeCircle(g, ix, iy, 6, [0, 0, 0, 1], 3);
        iwStrokeCircle(g, ix, iy, 6, [1, 1, 1, 1], 1.5);
    };
    function redrawWheel() {
        var ok = false;
        try { wheelPanel.onDraw(); ok = true; } catch (e) {}
        try { wheelPanel.notify("onDraw"); } catch (e2) {}
        if (!ok) { try { wheelPanel.hide(); wheelPanel.show(); } catch (e3) {} }
    }

    // lecture DÉFENSIVE des coordonnées d'un événement souris, relatives au
    // panneau. Selon les versions : offsetX/Y, ou clientX/Y, ou localX/Y.
    function evXY(ev) {
        var x = null, y = null;
        try { if (ev.offsetX != null && ev.offsetY != null) { x = ev.offsetX; y = ev.offsetY; } } catch (e1) {}
        if (x == null) { try { if (ev.localX != null && ev.localY != null) { x = ev.localX; y = ev.localY; } } catch (e2) {} }
        if (x == null) { try { if (ev.clientX != null && ev.clientY != null) { x = ev.clientX; y = ev.clientY; } } catch (e3) {} }
        return (x == null) ? null : { x: x, y: y };
    }
    function pickFromXY(x, y) {
        var geom = wheelGeom();
        var dx = x - geom.cx, dy = y - geom.cy;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > geom.R) dist = geom.R;       // clamp au bord
        var ang = Math.atan2(dy, dx) * 180 / Math.PI;
        H = (ang + 360) % 360;
        S = (geom.R > 0) ? (dist / geom.R) : 0;
        syncFromHSV(true);
    }
    var wheelDrag = false;
    try {
        wheelPanel.addEventListener("mousedown", function (ev) {
            wheelDrag = true;
            var p = evXY(ev); if (p) pickFromXY(p.x, p.y);
        });
        wheelPanel.addEventListener("mousemove", function (ev) {
            if (!wheelDrag) return;
            var p = evXY(ev); if (p) pickFromXY(p.x, p.y);
        });
        wheelPanel.addEventListener("mouseup", function () { wheelDrag = false; });
        wheelPanel.addEventListener("mouseout", function () { wheelDrag = false; });
    } catch (eWev) {}

    // — Colonne droite : aperçu, hex, curseurs T/S/L (secours fiable) —
    var ctrlCol = bodyRow.add("group"); ctrlCol.orientation = "column"; ctrlCol.alignChildren = "fill"; ctrlCol.spacing = 8;
    ctrlCol.preferredSize.width = 200;

    // aperçu de la couleur (panneau dessiné) + valeur hex
    var swatchPanel = ctrlCol.add("panel", undefined, undefined);
    swatchPanel.preferredSize = [200, 56];
    swatchPanel.onDraw = function () {
        var g = this.graphics; var W = this.size[0], Hh = this.size[1];
        var rgb = iwHSVtoRGB(H, S, V);
        iwFillRound(g, 0, 0, W, Hh, 6, [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255, 1]);
        iwStrokeRound(g, 0.5, 0.5, W - 1, Hh - 1, 6, [0.45, 0.45, 0.5, 1], 1);
    };
    function redrawSwatch() {
        var ok = false;
        try { swatchPanel.onDraw(); ok = true; } catch (e) {}
        try { swatchPanel.notify("onDraw"); } catch (e2) {}
        if (!ok) { try { swatchPanel.hide(); swatchPanel.show(); } catch (e3) {} }
    }

    var hexRow = ctrlCol.add("group"); hexRow.orientation = "row"; hexRow.alignChildren = "center";
    hexRow.add("statictext", undefined, "Hex :").preferredSize.width = 36;
    var hexIn = hexRow.add("edittext", undefined, iwRGBHex(iwHSVtoRGB(H, S, V)));
    hexIn.preferredSize.width = 110;

    // curseurs T / S / L
    function sliderRow(label, val, maxv) {
        var row = ctrlCol.add("group"); row.orientation = "row"; row.alignChildren = "center"; row.spacing = 6;
        row.add("statictext", undefined, label).preferredSize.width = 20;
        var sl = row.add("slider", undefined, val, 0, maxv); sl.preferredSize = [120, 18];
        var ro = row.add("statictext", undefined, ""); ro.preferredSize.width = 40;
        return { sl: sl, ro: ro };
    }
    var hRow = sliderRow("T", H, 360);
    var sRow = sliderRow("S", S * 100, 100);
    var vRow = sliderRow("L", V * 100, 100);

    // synchro : met à jour aperçu, hex, curseurs et roue depuis l'état HSV.
    var syncing = false;
    function syncFromHSV(redrawWheelToo) {
        if (syncing) return; syncing = true;
        var rgb = iwHSVtoRGB(H, S, V);
        try { hexIn.text = iwRGBHex(rgb); } catch (e1) {}
        try { hRow.sl.value = H; hRow.ro.text = Math.round(H) + "\u00B0"; } catch (e2) {}
        try { sRow.sl.value = S * 100; sRow.ro.text = Math.round(S * 100) + "%"; } catch (e3) {}
        try { vRow.sl.value = V * 100; vRow.ro.text = Math.round(V * 100) + "%"; } catch (e4) {}
        redrawSwatch();
        if (redrawWheelToo) redrawWheel();
        syncing = false;
    }
    hRow.sl.onChanging = function () { H = hRow.sl.value; syncFromHSV(true); };
    hRow.sl.onChange   = hRow.sl.onChanging;
    sRow.sl.onChanging = function () { S = sRow.sl.value / 100; syncFromHSV(true); };
    sRow.sl.onChange   = sRow.sl.onChanging;
    vRow.sl.onChanging = function () { V = vRow.sl.value / 100; syncFromHSV(true); };
    vRow.sl.onChange   = vRow.sl.onChanging;
    hexIn.onChange = function () {
        var rgb = iwHexToRGB255(hexIn.text);
        if (rgb) { var h2 = iwRGBtoHSV(rgb[0], rgb[1], rgb[2]); H = h2[0]; S = h2[1]; V = h2[2]; syncFromHSV(true); }
    };

    // — boutons : Aucune (efface) · Annuler · OK —
    var btns = dlg.add("group"); btns.alignment = "fill"; btns.alignChildren = "center";
    var noneBtn = btns.add("button", undefined, tr("color_none"));
    var spacer = btns.add("statictext", undefined, ""); spacer.alignment = ["fill", "center"];
    btns.add("button", undefined, tr("btn_cancel"), { name: "cancel" });
    btns.add("button", undefined, "OK", { name: "ok" });
    var pickedNone = false;
    noneBtn.onClick = function () { pickedNone = true; dlg.close(1); };

    dlg.onShow = function () { redrawWheel(); redrawSwatch(); syncFromHSV(false); };
    if (dlg.show() !== 1) return false;
    if (pickedNone) return "";
    return iwRGBHex(iwHSVtoRGB(H, S, V));
}

// Petite boîte de saisie de texte. Renvoie la chaîne, ou null si annulé.
function iwPromptText(title, label, defValue) {
    var dlg = new Window("dialog", title);
    dlg.orientation = "column"; dlg.alignChildren = "fill"; dlg.margins = 16; dlg.spacing = 10;
    dlg.add("statictext", undefined, label);
    var inp = dlg.add("edittext", undefined, defValue || "");
    inp.preferredSize.width = 300;
    inp.active = true;
    var btns = dlg.add("group"); btns.alignment = "right";
    btns.add("button", undefined, tr("btn_cancel"), { name: "cancel" });
    btns.add("button", undefined, "OK", { name: "ok" });
    if (dlg.show() !== 1) return null;
    return inp.text;
}

// Choix d'un dossier de destination parmi ceux existants (+ « racine »).
// Renvoie le nom du dossier, "" (racine), ou false si annulé.
function iwPickFolder(currentFolder) {
    var folders = iwListFolders();
    var dlg = new Window("dialog", tr("move_dlg_title"));
    dlg.orientation = "column"; dlg.alignChildren = "fill"; dlg.margins = 16; dlg.spacing = 10;
    dlg.add("statictext", undefined, tr("move_dlg_intro"));
    var items = [tr("move_root")].concat(folders);
    var dd = dlg.add("dropdownlist", undefined, items);
    dd.preferredSize.width = 300;
    // présélection sur le dossier courant
    var selIdx = 0;
    for (var i = 0; i < folders.length; i++) if (folders[i] === currentFolder) selIdx = i + 1;
    dd.selection = selIdx;
    var btns = dlg.add("group"); btns.alignment = "right";
    btns.add("button", undefined, tr("btn_cancel"), { name: "cancel" });
    btns.add("button", undefined, "OK", { name: "ok" });
    if (dlg.show() !== 1) return false;
    var idx = dd.selection ? dd.selection.index : 0;
    if (idx <= 0) return "";              // racine
    return folders[idx - 1];
}


// ─────────────────────────────────────────────────────────────────────
//  LOGO « Blueprint » — DESSIN VECTORIEL ScriptUI
//  ScriptUI ne sait pas afficher de SVG ni de PNG de façon fiable selon
//  les versions d'InDesign. On embarque donc le tracé du logo sous forme
//  de POLYGONES (contours aplatis du SVG, coordonnées normalisées 0..1)
//  et on les dessine avec graphics.fillPath dans l'en-tête de la fenêtre.
//  Deux contours : (1) le « drapeau » / la queue, (2) le grand « B ».
//  Chaque contour est un sous-tracé plein (pas de trou even-odd à gérer).
// ─────────────────────────────────────────────────────────────────────
var IW_LOGO = {
    // bornes du viewBox d'origine (pour le ratio d'aspect)
    vbW: 153, vbH: 151.2,
    contours: [
        [[0.1307,0.3598],[0.4013,0.36],[0.2549,1.0],[0.0012,0.9296],[0.1307,0.3598]],
        [[1.0,0.6799],[0.9921,0.7556],[0.9821,0.7894],[0.9487,0.851],[0.9006,0.904],[0.8718,0.9258],[0.8099,0.9594],[0.7759,0.9723],[0.7045,0.9903],[0.6335,0.9986],[0.5654,0.9976],[0.491,0.9866],[0.4552,0.9774],[0.3889,0.9486],[0.3583,0.9295],[0.3048,0.8837],[0.2815,0.8565],[0.2614,0.8268],[0.2301,0.761],[0.2583,0.7553],[0.6181,0.7545],[0.6528,0.7472],[0.6829,0.7285],[0.7029,0.6987],[0.7107,0.6642],[0.7086,0.6256],[0.6936,0.5947],[0.6658,0.574],[0.6317,0.5636],[0.5946,0.5608],[0.415,0.5608],[0.4007,0.539],[0.4007,0.3936],[0.4038,0.3604],[0.5825,0.3603],[0.6189,0.3556],[0.6525,0.3431],[0.6795,0.3196],[0.6923,0.2869],[0.6899,0.249],[0.6707,0.2255],[0.0601,0.2255],[0.0588,0.0088],[0.086,0.0],[0.8402,0.0],[0.8706,0.0181],[0.9207,0.0695],[0.9545,0.1311],[0.9643,0.165],[0.9705,0.2407],[0.9673,0.2776],[0.9589,0.312],[0.9454,0.3459],[0.9276,0.377],[0.9047,0.405],[0.8775,0.4284],[0.8465,0.4464],[0.8504,0.4592],[0.8845,0.474],[0.9144,0.4929],[0.9403,0.516],[0.9617,0.5428],[0.9779,0.5724],[0.9896,0.6056],[1.0,0.6799]]
    ]
};

// Dessine le logo plein dans la boîte (bx, by, bw, bh) du graphics `g`,
// en respectant le ratio d'aspect et avec la couleur RVBA `rgba`.
function iwDrawLogo(g, bx, by, bw, bh, rgba) {
    var ar = IW_LOGO.vbW / IW_LOGO.vbH;        // ratio largeur/hauteur
    var w = bw, h = w / ar;
    if (h > bh) { h = bh; w = h * ar; }
    var ox = bx + (bw - w) / 2;                 // centrage horizontal
    var oy = by + (bh - h) / 2;                 // centrage vertical
    var brush = g.newBrush(g.BrushType.SOLID_COLOR, rgba);
    for (var c = 0; c < IW_LOGO.contours.length; c++) {
        var pts = IW_LOGO.contours[c];
        if (!pts || pts.length < 2) continue;
        g.newPath();
        g.moveTo(ox + pts[0][0] * w, oy + pts[0][1] * h);
        for (var i = 1; i < pts.length; i++) {
            g.lineTo(ox + pts[i][0] * w, oy + pts[i][1] * h);
        }
        g.closePath();
        try { g.fillPath(brush); } catch (e) {}
    }
}

// ─────────────────────────────────────────────────────────────────────
//  LOGO INSTAGRAM — dessin vectoriel ScriptUI (en TRAITS, fond transparent)
//  ScriptUI ne gère pas les trous even-odd : on dessine donc les anneaux
//  (cadre + objectif) en TRAÇANT des contours (strokePath), et le point du
//  flash en disque plein. Couleur RVBA `rgba`. Boîte (bx,by,bw,bh) carrée.
// ─────────────────────────────────────────────────────────────────────
function iwDrawInstagram(g, bx, by, bw, bh, rgba) {
    var s = Math.min(bw, bh);                 // côté carré
    var ox = bx + (bw - s) / 2;
    var oy = by + (bh - s) / 2;
    function X(u) { return ox + u * s; }
    function Y(v) { return oy + v * s; }
    var lw = Math.max(1, s * 0.085);          // épaisseur des traits
    var pen = g.newPen(g.PenType.SOLID_COLOR, rgba, lw);

    // — Cadre carré arrondi (tracé) —
    var r = 0.24;                              // rayon des coins (fraction)
    var x0 = 0.10, y0 = 0.10, x1 = 0.90, y1 = 0.90;
    function arc(cx, cy, a0, a1, seg) {
        for (var i = 0; i <= seg; i++) {
            var a = a0 + (a1 - a0) * i / seg;
            g.lineTo(X(cx + r * Math.cos(a)), Y(cy + r * Math.sin(a)));
        }
    }
    g.newPath();
    // démarre au coin haut-gauche (début de l'arc TL)
    g.moveTo(X(x0 + r), Y(y0));
    // côté haut -> coin TR
    g.lineTo(X(x1 - r), Y(y0));
    arc(x1 - r, y0 + r, -Math.PI / 2, 0, 5);          // TR
    // côté droit -> coin BR
    g.lineTo(X(x1), Y(y1 - r));
    arc(x1 - r, y1 - r, 0, Math.PI / 2, 5);           // BR
    // côté bas -> coin BL
    g.lineTo(X(x0 + r), Y(y1));
    arc(x0 + r, y1 - r, Math.PI / 2, Math.PI, 5);     // BL
    // côté gauche -> coin TL
    g.lineTo(X(x0), Y(y0 + r));
    arc(x0 + r, y0 + r, Math.PI, 1.5 * Math.PI, 5);   // TL
    g.closePath();
    try { g.strokePath(pen); } catch (e1) {}

    // — Cercle de l'objectif (tracé) —
    var ccx = 0.5, ccy = 0.5, rad = 0.205, seg = 28;
    g.newPath();
    g.moveTo(X(ccx + rad), Y(ccy));
    for (var k = 1; k <= seg; k++) {
        var t = 2 * Math.PI * k / seg;
        g.lineTo(X(ccx + rad * Math.cos(t)), Y(ccy + rad * Math.sin(t)));
    }
    g.closePath();
    try { g.strokePath(pen); } catch (e2) {}

    // — Point du flash (disque plein) —
    var fx = 0.72, fy = 0.28, fr = 0.052, fseg = 16;
    var brush = g.newBrush(g.BrushType.SOLID_COLOR, rgba);
    g.newPath();
    g.moveTo(X(fx + fr), Y(fy));
    for (var m = 1; m <= fseg; m++) {
        var u = 2 * Math.PI * m / fseg;
        g.lineTo(X(fx + fr * Math.cos(u)), Y(fy + fr * Math.sin(u)));
    }
    g.closePath();
    try { g.fillPath(brush); } catch (e3) {}
}


//   - Windows : File.execute() accepte directement l'URL.
//   - macOS   : on écrit un mini-script shell temporaire qui fait `open <url>`
//               puis on l'exécute (File.execute lance le navigateur par défaut).
//  Renvoie true si une tentative a pu être lancée, false sinon.
// ─────────────────────────────────────────────────────────────────────
function iwOpenURL(url) {
    var ok = false;
    var isMac = false;
    try { isMac = ($.os && $.os.toString().toLowerCase().indexOf("mac") !== -1); } catch (eOS) {}
    if (isMac) {
        // mini-script shell temporaire : open "<url>"
        try {
            var sh = new File(Folder.temp + "/blueprint_open_" + (new Date().getTime()) + ".command");
            sh.encoding = "UTF-8";
            if (sh.open("w")) {
                sh.writeln("#!/bin/sh");
                sh.writeln('open "' + url + '"');
                sh.close();
                try { sh.execute(); ok = true; } catch (eEx) {}
            }
        } catch (eMac) {}
        // repli : tentative directe (certaines versions l'acceptent)
        if (!ok) { try { ok = new File(url).execute(); } catch (eD) {} }
    } else {
        // Windows (et autres) : exécution directe de l'URL
        try { ok = new File(url).execute(); } catch (eWin) {}
        // repli : fichier .url temporaire
        if (!ok) {
            try {
                var u = new File(Folder.temp + "/blueprint_open_" + (new Date().getTime()) + ".url");
                if (u.open("w")) {
                    u.writeln("[InternetShortcut]");
                    u.writeln("URL=" + url);
                    u.close();
                    try { ok = u.execute(); } catch (eUe) {}
                }
            } catch (eUrl) {}
        }
    }
    return ok;
}

// ─────────────────────────────────────────────────────────────────────
//  FENÊTRE « À PROPOS » — descriptif du script + bouton Instagram.
//  Ouverte au clic sur le logo + nom (coin bas-droit de la fenêtre).
//  `version` = numéro de version courant (chaîne).
// ─────────────────────────────────────────────────────────────────────
function iwShowAbout(version) {
    var BLUE  = [0.13, 0.40, 0.85, 1];
    var WHITE = [1, 1, 1, 1];

    var w = new Window("dialog", tr("about_title"));
    w.orientation = "column";
    w.alignChildren = "fill";
    w.margins = 18; w.spacing = 12;

    // En-tête : logo Blueprint BLANC sur fond TRANSPARENT + nom + tagline
    var head = w.add("group");
    head.orientation = "row"; head.alignChildren = "center"; head.spacing = 12;
    var lg = head.add("panel", undefined, undefined);
    lg.preferredSize = [54, 54]; lg.maximumSize = [54, 54];
    lg.onDraw = function () {
        var g = this.graphics;
        // fond transparent ; logo Blueprint en BLANC.
        iwDrawLogo(g, 0, 0, this.size[0], this.size[1], WHITE);
    };
    var headTxt = head.add("group");
    headTxt.orientation = "column"; headTxt.alignChildren = "left"; headTxt.spacing = 1;
    var nm = headTxt.add("statictext", undefined, "Blueprint V" + version);
    try {
        nm.graphics.font = ScriptUI.newFont(nm.graphics.font.name, "BOLD", 20);
        nm.graphics.foregroundColor = nm.graphics.newPen(nm.graphics.PenType.SOLID_COLOR, BLUE, 1);
    } catch (eNm) {}
    var tg = headTxt.add("statictext", undefined, tr("about_tagline"));
    try { tg.graphics.font = ScriptUI.newFont(tg.graphics.font.name, "ITALIC", 12); } catch (eTg) {}

    // séparateur
    var sep = w.add("panel"); sep.alignment = "fill"; sep.preferredSize.height = 1;

    // descriptif
    var body = w.add("statictext", undefined, tr("about_body"), { multiline: true });
    body.preferredSize = [460, 90];

    // — séparateur DISCRET (fin trait gris, dessiné) avant « Nouveautés » —
    function iwAboutSep(win) {
        var sp = win.add("panel"); sp.alignment = "fill"; sp.preferredSize.height = 1;
        sp.maximumSize.height = 1;
        sp.onDraw = function () {
            var gg = this.graphics; var W = this.size[0];
            gg.newPath(); gg.moveTo(0, 0); gg.lineTo(W, 0);
            try { gg.strokePath(gg.newPen(gg.PenType.SOLID_COLOR, [0.5, 0.5, 0.55, 0.35], 1)); } catch (eSp) {}
        };
        return sp;
    }
    iwAboutSep(w);

    // — NOUVEAUTÉS DE LA VERSION —
    var nwTitle = w.add("statictext", undefined, tr("about_whatsnew_title"));
    try {
        nwTitle.graphics.font = ScriptUI.newFont(nwTitle.graphics.font.name, "BOLD", 13);
        nwTitle.graphics.foregroundColor = nwTitle.graphics.newPen(nwTitle.graphics.PenType.SOLID_COLOR, BLUE, 1);
    } catch (eNwT) {}
    var nwBody = w.add("statictext", undefined, tr("about_whatsnew"), { multiline: true });
    nwBody.preferredSize = [460, 150];

    // — séparateur DISCRET avant le pied —
    iwAboutSep(w);

    // — Pied : logo Instagram (BLANC) + « ecnexua_ » à GAUCHE, bouton Fermer à
    //   DROITE, sur la MÊME ligne. Le bloc Instagram est PUREMENT DÉCORATIF
    //   (non cliquable) : simple logo + texte aligné avec le bouton.
    var footRow = w.add("group");
    footRow.orientation = "row"; footRow.alignment = "fill"; footRow.alignChildren = "center"; footRow.spacing = 8;
    var igLogo = footRow.add("panel", undefined, undefined);
    igLogo.preferredSize = [22, 22]; igLogo.maximumSize = [22, 22];
    igLogo.onDraw = function () {
        var g = this.graphics;
        // fond transparent ; logo Instagram en BLANC.
        iwDrawInstagram(g, 0, 0, this.size[0], this.size[1], WHITE);
    };
    var igName = footRow.add("statictext", undefined, tr("about_ig"));
    try {
        igName.graphics.font = ScriptUI.newFont(igName.graphics.font.name, "REGULAR", 13);
    } catch (eIg) {}
    // ressort : pousse le bouton Fermer tout à droite
    var foSpring = footRow.add("statictext", undefined, " ");
    foSpring.alignment = ["fill", "center"];
    var closeBtn = footRow.add("button", undefined, tr("about_close"), { name: "ok" });
    closeBtn.preferredSize = [70, 26];

    w.show();
}


// ─────────────────────────────────────────────────────────────────────
//  [G] INTERFACE À ONGLETS — mainV2()
//  Point d'entrée du moteur v2. Réunit mode + grille + bleed + marks +
//  duplex + preprocessors + presets dans un seul dialogue à onglets,
//  avec un panneau d'aperçu (schéma + résumé) qui se met à jour en direct.
// ─────────────────────────────────────────────────────────────────────
function mainV2(initialConfig) {

    if (app.documents.length === 0) { Window.alert(tr("alert_nodoc")); return; }
    var doc = app.activeDocument;

    // ── V11 — CONSTANTES D'INTERFACE (harmonisation boutons/espacements) ──
    //  Centralise les tailles et gouttières pour une apparence cohérente
    //  dans toute la fenêtre (groupes de boutons, marges de panneaux).
    var IW_UI_GAP   = 6;    // gouttière standard entre contrôles d'un groupe
    var IW_UI_MARG  = 8;    // marge intérieure standard d'un panneau
    var IW_UI_BTN_W = 96;   // largeur standard d'un bouton d'action
    var IW_UI_BTN_H = 24;   // hauteur standard d'un bouton d'action
    var IW_UI_ICON  = 27;   // côté d'un bouton-icône (alignement, rotation)
    var IW_AUTO_MARGIN = 3; // marge de sécurité (mm) du bouton « Auto » des espacements
    // V2 — LARGEUR DE LIBELLÉ UNIQUE. Les lignes label+champ étaient réparties
    //  sur huit largeurs différentes (46, 60, 90, 110, 120, 150, 170, 195) : les
    //  champs ne s'alignaient donc pas d'un panneau à l'autre, ni parfois DANS
    //  un même panneau. Une seule constante sert désormais de colonne.
    var IW_UI_LABEL_W = 190;
    var IW_UI_FIELD_W = 64;   // largeur standard d'un champ numérique

    // V2 — THÈME DE L'INTERFACE. Les textes du panneau des presets étaient
    //  écrits en BLANC EN DUR : sur une interface InDesign en thème CLAIR, les
    //  presets sans couleur devenaient invisibles. On détecte la clarté du fond
    //  natif de la fenêtre pour choisir un texte lisible dans les deux thèmes.
    //  InDesign expose la clarté de son interface (0 = sombre, 1 = clair) ;
    //  la propriété n'existe pas partout, d'où le repli.
    var IW_UI_DARK = (function () {
        try {
            var b = app.generalPreferences.uiBrightness;
            if (typeof b === "number" && isFinite(b)) return (b < 0.5);
        } catch (eTh) {}
        return true;   // InDesign est sombre par défaut depuis CS6
    })();
    var IW_TXT_DEFAULT = IW_UI_DARK ? [1, 1, 1, 1] : [0.10, 0.12, 0.16, 1];

    // ── Source : sélection courante (1+ objets) ──────────────────────
    var selItems = [];
    try { for (var si = 0; si < app.selection.length; si++) selItems.push(app.selection[si]); } catch (e) {}
    var hasSel = (selItems.length >= 1);

    // PATCHWORK : nombre de colonnes calculé AUTOMATIQUEMENT (grille la plus
    // carrée possible) à partir du nombre d'objets sélectionnés. Plus de champ
    // dans l'UI : la grille s'adapte (4 -> 2×2, 6 -> 3×2, 9 -> 3×3, etc.).
    function iwPatchworkCols() {
        var n = selItems.length;
        if (n < 1) return 1;
        var c = Math.round(Math.sqrt(n));
        if (c < 1) c = 1;
        if (c > n) c = n;
        return c;
    }

    // Taille de pièce de référence (1er objet sélectionné), sinon valeurs
    // par défaut pour pouvoir au moins tester l'aperçu.
    var piece = { w: 100, h: 150 };
    if (hasSel) {
        var gb0 = iwMeasurePieceBounds(selItems[0]);   // V20 — mesure partagée
        if (gb0 && gb0.length === 4) piece = { w: gb0[3] - gb0[1], h: gb0[2] - gb0[0] };
    }

    // ── Fenêtre, disposition 2 colonnes : contrôles | aperçu ─────────
    // V2 — le titre était VIDE : la barre de titre n'affichait rien.
    var dlg = new Window("dialog", tr("win_title") + IW.version);
    dlg.orientation = "column";
    dlg.alignChildren = "fill";
    dlg.margins = 6; dlg.spacing = 8;

    // Couleurs de marque (le logo + nom sont posés EN BAS À DROITE, plus bas).
    var IW_BRAND_BLUE  = [0.13, 0.40, 0.85, 1];   // bleu de marque (texte)
    var IW_BRAND_WHITE = [1, 1, 1, 1];            // logo en blanc


    // ── DIMENSIONNEMENT RESPONSIVE selon l'ÉCRAN ─────────────────────
    //  ScriptUI n'a pas de conteneur défilant : pour que la fenêtre reste
    //  PLUS PETITE QUE L'ÉCRAN, on calcule ses tailles à partir des
    //  dimensions de l'écran. L'aperçu remplit la hauteur disponible (donc
    //  plus grand sur grand écran, plus petit sur petit écran) et les onglets
    //  sont plafonnés pour ne jamais dépasser l'écran.
    var IW_SCR = (function () {
        try {
            var arr = $.screens;
            if (arr && arr.length) {
                for (var i = 0; i < arr.length; i++) {
                    var s = arr[i];
                    if (s.left <= 0 && s.top <= 0 && s.right > 0 && s.bottom > 0) return s; // écran principal
                }
                // sinon le plus grand
                var best = arr[0], bestA = 0;
                for (var j = 0; j < arr.length; j++) { var a = (arr[j].right - arr[j].left) * (arr[j].bottom - arr[j].top); if (a > bestA) { bestA = a; best = arr[j]; } }
                return best;
            }
        } catch (e) {}
        return null;
    })();
    var IW_SCREEN_H = IW_SCR ? (IW_SCR.bottom - IW_SCR.top) : 900;
    var IW_SCREEN_W = IW_SCR ? (IW_SCR.right - IW_SCR.left) : 1440;
    // hauteur max de la fenêtre = 88% de l'écran (laisse barre de menus, titre, dock)
    var IW_CONTENT_MAX_H = Math.round(IW_SCREEN_H * 0.88) - 84;   // 84 = titre + marges + boutons
    if (IW_CONTENT_MAX_H < 360) IW_CONTENT_MAX_H = 360;
    // ── V2 — HAUTEUR DE CORPS COMMUNE ────────────────────────────────
    //  Les trois colonnes (sections, réglages, aperçu) partagent une même
    //  hauteur, celle du corps de la fenêtre. L'APERÇU la remplit donc
    //  entièrement, au lieu d'être plafonné indépendamment comme avant.
    var IW_BODY_H = IW_CONTENT_MAX_H;
    if (IW_BODY_H < 380) IW_BODY_H = 380;
    // hauteur du canvas d'aperçu : le corps, moins ce qui l'entoure dans sa
    // colonne (ligne d'info pièce, deux rangées de zoom, résumé, marges).
    //  V2 — l'aperçu est la pièce maîtresse de la fenêtre : c'est là qu'on
    //  lit ce qui va sortir. On lui donne donc la place, et on ne laisse
    //  autour de lui que ce qui est réellement nécessaire (ligne d'info,
    //  rangées de zoom, résumé) — d'où un « chrome » resserré.
    //  V2 — ce qui entoure encore le dessin dans sa colonne se réduit à la
    //  ligne d'info pièce et à UNE ligne de zoom : le panneau « Résumé » est
    //  parti dans la barre d'état, et les deux rangées de zoom n'en font plus
    //  qu'une. Le dessin récupère toute cette hauteur.
    var IW_PREVIEW_CHROME = 74;
    var IW_CANVAS_H = IW_BODY_H - IW_PREVIEW_CHROME;
    if (IW_CANVAS_H < 300) IW_CANVAS_H = 300;
    // largeur du canvas : ~44% de la largeur écran, bornée
    var IW_CANVAS_W = Math.round(IW_SCREEN_W * 0.44);
    if (IW_CANVAS_W < 360) IW_CANVAS_W = 360;
    if (IW_CANVAS_W > 900) IW_CANVAS_W = 900;
    var IW_TABS_MAX_H = IW_BODY_H;
    var IW_NAV_W = 132;    // largeur de la colonne de sections
    // Trois colonnes côte à côte élargissent la fenêtre : sur un écran étroit,
    // la somme dépasserait la largeur disponible et la colonne de droite
    // sortirait de l'écran. On rabote donc la colonne des réglages en premier
    // — c'est elle qui supporte le mieux d'être resserrée, ses champs étant
    // alignés sur une colonne de libellés fixe.
    var IW_CONTENT_W = 560;
    var IW_CHROME_W  = 100;   // marges de la fenêtre + gouttières des colonnes
    var _availW = IW_SCREEN_W - IW_CHROME_W - IW_NAV_W - IW_CANVAS_W;
    if (_availW < IW_CONTENT_W) IW_CONTENT_W = _availW;
    if (IW_CONTENT_W < 420) {
        // La colonne des réglages ne descend pas sous 420 px : en dessous, les
        // champs passent sous leur colonne de libellés. C'est alors l'APERÇU
        // qui rend le reste — mieux vaut un aperçu plus petit que des réglages
        // illisibles ou une fenêtre plus large que l'écran.
        IW_CONTENT_W = 420;
        var _over = IW_NAV_W + IW_CONTENT_W + IW_CANVAS_W + IW_CHROME_W - IW_SCREEN_W;
        if (_over > 0) IW_CANVAS_W -= _over;
        if (IW_CANVAS_W < 300) IW_CANVAS_W = 300;
    }

    // ══ V2 — TYPE DE DOCUMENT, EN TÊTE DE FENÊTRE ══════════════════════
    //  Réglage de tête, placé hors des sections et sur TOUTE LA LARGEUR
    //  parce qu'il les gouverne toutes : il choisit l'imposition, pose les
    //  valeurs de départ, et masque les réglages qui ne concernent pas ce
    //  type de document.
    //
    //  Pourquoi : Blueprint demandait d'abord un MODE D'IMPOSITION — N-Up,
    //  Cut & Stack, Dutch Cut, Shuffle… — c'est-à-dire le vocabulaire du
    //  façonnage, pas celui du travail. On sait qu'on fait des cartes de
    //  visite ; on ne sait pas forcément que cela s'impose en N-Up. Le mode
    //  se DÉDUIT donc du type et n'est plus demandé, sauf en « Personnalisé ».
    var typePanel = dlg.add("panel", undefined, tr("lbl_doctype"));
    typePanel.orientation = "column"; typePanel.alignChildren = "left";
    typePanel.margins = 8; typePanel.spacing = 4;
    var typeRow = typePanel.add("group");
    typeRow.orientation = "row"; typeRow.alignChildren = "center"; typeRow.spacing = IW_UI_GAP;
    var docTypeDd = typeRow.add("dropdownlist", undefined,
        [tr("dt_card"), tr("dt_flyer"), tr("dt_poster"), tr("dt_sticker"), tr("dt_zine"), tr("dt_custom")]);
    docTypeDd.preferredSize.width = 240;
    docTypeDd.selection = 0;
    try { docTypeDd.helpTip = tr("tip_doctype"); } catch (eDt) {}
    var typeResetBtn = typeRow.add("button", undefined, tr("dt_reset"));
    typeResetBtn.preferredSize = [IW_UI_BTN_W + 40, IW_UI_BTN_H];
    try { typeResetBtn.helpTip = tr("tip_dt_reset"); } catch (eDtr) {}
    var typeDesc = typePanel.add("statictext", undefined, "", { multiline: true });
    typeDesc.preferredSize = [640, 30];
    iwItalic(typeDesc);

    // ══ V2 — CORPS : SECTIONS | RÉGLAGES | APERÇU ══════════════════════
    //  Reprise du motif des dialogues d'InDesign (« Imprimer le cahier »,
    //  « Imprimer », « Exporter en PDF ») : une LISTE DE SECTIONS en colonne
    //  à gauche, et le contenu de la section retenue à droite. Les onglets
    //  horizontaux d'un `tabbedpanel` ne ressemblent à rien de ce que fait
    //  l'application ; une listbox, elle, reçoit le bleu de sélection du
    //  système, exactement comme la liste Format / Aperçu / Synthèse.
    var bodyRow = dlg.add("group");
    bodyRow.orientation = "row";
    bodyRow.alignChildren = "fill";
    bodyRow.spacing = 8;

    // Colonne 1 — la liste des sections
    var navList = bodyRow.add("listbox", undefined,
        [tr("tab_compose"), tr("tab_geom"), tr("tab_marks2"), tr("tab_duplex2"), tr("tab_presets")]);
    navList.preferredSize = [IW_NAV_W, IW_BODY_H];
    navList.selection = 0;

    // Colonne 2 — les réglages de la section retenue. Les cinq sections y
    // sont empilées ; une seule est visible à la fois.
    var contentCol = bodyRow.add("group");
    contentCol.orientation = "stack";        // superposition, pas empilement
    contentCol.alignChildren = ["fill", "fill"];
    contentCol.preferredSize = [IW_CONTENT_W, IW_BODY_H];
    contentCol.maximumSize = [2000, IW_TABS_MAX_H];

    // `tabs` n'existe plus : chaque ancienne « tab » devient un groupe de
    // cette pile. On garde un tableau pour la navigation.
    var iwSections = [];
    function iwAddSection() {
        var g = contentCol.add("group");
        g.orientation = "column";
        g.alignChildren = "fill";
        g.margins = 0;
        g.spacing = IW_UI_GAP;
        iwSections.push(g);
        return g;
    }
    function showSection(i) {
        for (var s = 0; s < iwSections.length; s++) {
            try { iwSections[s].visible = (s === i); } catch (eSs) {}
        }
        try { dlg.layout.layout(true); } catch (eSl) {}
    }
    navList.onChange = function () {
        var i = navList.selection ? navList.selection.index : 0;
        showSection(i);
    };


    // helper : ligne label + champ ; la description devient une INFOBULLE
    // (survol) au lieu d'un texte sous le champ -> interface plus épurée (V4).
    function field(parent, label, def, desc, wField) {
        var g = parent.add("group");
        g.orientation = "row";
        g.alignChildren = "center";
        var lab = g.add("statictext", undefined, label);
        lab.preferredSize.width = IW_UI_LABEL_W;
        var e = g.add("edittext", undefined, def);
        e.preferredSize.width = wField || IW_UI_FIELD_W;
        if (desc) { try { e.helpTip = desc; lab.helpTip = desc; } catch (eT) {} }
        return e;
    }
    // V2 — même colonne de libellé pour une ligne « label + liste déroulante »,
    //  jusqu'ici construite à la main avec une largeur différente à chaque fois.
    function ddField(parent, label, items, desc, wDrop) {
        var g = parent.add("group");
        g.orientation = "row";
        g.alignChildren = "center";
        var lab = g.add("statictext", undefined, label);
        lab.preferredSize.width = IW_UI_LABEL_W;
        var d = g.add("dropdownlist", undefined, items);
        d.preferredSize.width = wDrop || 190;
        if (desc) { try { d.helpTip = desc; lab.helpTip = desc; } catch (eT) {} }
        return d;
    }
    function check(parent, label, val, desc) {
        var cb = parent.add("checkbox", undefined, label);
        cb.value = !!val;
        if (desc) { try { cb.helpTip = desc; } catch (eT) {} }
        return cb;
    }
    // V2 — NORMALISATION DES CHAMPS NUMÉRIQUES. `parseFloat(x) || 0` lisait
    //  silencieusement 0 pour toute saisie invalide : un « 3,5 » (virgule) ou un
    //  « abc » passait donc pour un zéro, sans que rien ne le signale. On
    //  rétablit ici la dernière valeur correcte à la validation du champ.
    function numField(ctrl, min, max) {
        if (!ctrl) return ctrl;
        ctrl.iwLastGood = ctrl.text;
        var prev = ctrl.onChange;
        ctrl.onChange = function () {
            var raw = String(this.text).replace(",", ".");
            var v = parseFloat(raw);
            if (!isFinite(v)) { this.text = this.iwLastGood; }
            else {
                if (min != null && v < min) v = min;
                if (max != null && v > max) v = max;
                this.text = String(r2(v));
                this.iwLastGood = this.text;
            }
            if (prev) { try { prev.call(this); } catch (eNF) {} }
        };
        return ctrl;
    }

    // ═══════ Onglet : COMPOSITION (ex-« Mode ») ═══════
    var tMode = iwAddSection();
    tMode.orientation = "column"; tMode.alignChildren = "fill"; tMode.margins = 8; tMode.spacing = 8;

    // — Bloc choix du mode + description —
    var modeRow = tMode.add("group");
    modeRow.add("statictext", undefined, tr("lbl_mode")).preferredSize.width = IW_UI_LABEL_W;
    var modeDd = modeRow.add("dropdownlist", undefined,
        [tr("mode_nup"), tr("mode_steprep"), tr("mode_cutstack"), tr("mode_booklet"), tr("mode_dutchcut"), tr("mode_shuffle"), tr("mode_riso"), tr("mode_seri"), tr("mode_patch")]);
    modeDd.selection = 0;
    modeDd.preferredSize.width = 200;
    var modeDesc = tMode.add("statictext", undefined, "", { multiline: true });
    modeDesc.preferredSize = [460, 44];
    iwItalic(modeDesc);

    // — Bloc destination + grille calculée (lecture seule) —
    var pDest = tMode.add("panel", undefined, tr("panel_dest"));
    pDest.orientation = "column"; pDest.alignChildren = "fill"; pDest.margins = 8; pDest.spacing = 8;
    // V2 — PAGE CIBLE en LISTE : c'était un champ libre, où l'on pouvait taper
    //   un numéro de page inexistant (silencieusement ramené à la dernière
    //   page). Le choix est borné aux pages qui existent réellement.
    var IW_PAGE_LABELS = [];
    for (var pgi = 0; pgi < doc.pages.length; pgi++) {
        var _pn = String(pgi + 1);
        try { _pn = String(doc.pages[pgi].name); } catch (ePn) {}
        IW_PAGE_LABELS.push(_pn);
    }
    var pgDd = ddField(pDest, tr("lbl_page"), IW_PAGE_LABELS,
        tr("desc_page", { N: doc.pages.length }), 120);
    pgDd.selection = doc.pages.length - 1;   // dernière page (comportement d'origine)
    // `pgIn` reste l'unique source de vérité lue par gatherConfig/currentZoneAndPage
    // (numéro de page 1..N) : la liste ne fait que l'alimenter. Cela garde la
    // compatibilité des presets enregistrés avec un champ texte.
    var pgIn = pDest.add("statictext", undefined, String(doc.pages.length));
    pgIn.visible = false;
    try { pgIn.preferredSize = [0, 0]; pgIn.maximumSize = [0, 0]; } catch (ePz) {}
    pgDd.onChange = function () {
        pgIn.text = String((pgDd.selection ? pgDd.selection.index : 0) + 1);
        refresh();
    };
    var gridRead = pDest.add("statictext", undefined, tr("grid_calc"));
    var gridReadDesc = pDest.add("statictext", undefined,
        tr("desc_gridread"),
        { multiline: true });
    gridReadDesc.preferredSize = [460, 56]; iwItalic(gridReadDesc);
    // colsIn/rowsIn conservés en interne (lecture seule) pour compat presets
    var colsIn = pDest.add("statictext", undefined, "");  // caché-ish, non éditable
    var rowsIn = pDest.add("statictext", undefined, "");
    colsIn.visible = false; rowsIn.visible = false;
    // ces champs cachés ne servent qu'à mémoriser cols/rows (compat presets) :
    // on annule leur taille pour qu'ils ne réservent aucune hauteur morte.
    try { colsIn.preferredSize = [0, 0]; colsIn.maximumSize = [0, 0]; rowsIn.preferredSize = [0, 0]; rowsIn.maximumSize = [0, 0]; } catch (eZ) {}

    // — Bloc RÉPÉTITION : nombre de pièces + auto + redimensionnement —
    var pRep = tMode.add("panel", undefined, tr("panel_rep"));
    pRep.orientation = "column"; pRep.alignChildren = "fill"; pRep.margins = 8; pRep.spacing = 8;

    var repRow = pRep.add("group"); repRow.orientation = "row"; repRow.alignChildren = "center";
    var autoCb = repRow.add("checkbox", undefined, tr("cb_auto"));
    autoCb.value = true;
    repRow.add("statictext", undefined, tr("lbl_count")).preferredSize.width = 135;
    var countIn = repRow.add("edittext", undefined, "9");
    countIn.preferredSize.width = 50;
    countIn.enabled = false; // désactivé tant que Auto est coché

    var fitCb = pRep.add("checkbox", undefined, tr("cb_fit"));
    fitCb.value = false;

    var flipAltCb = pRep.add("checkbox", undefined, tr("cb_flipalt"));
    flipAltCb.value = false;

    var repDesc = pRep.add("statictext", undefined, tr("desc_rep"), { multiline: true });
    repDesc.preferredSize = [460, 94]; iwItalic(repDesc);

    autoCb.onClick = function () {
        countIn.enabled = !autoCb.value;
        refresh();
    };
    countIn.onChanging = function () { refresh(); };
    fitCb.onClick = function () { refresh(); };
    flipAltCb.onClick = function () { refresh(); };

    // — Bloc ALIGNEMENT : grille de 9 boutons (position de la grille) —
    var pAlign = tMode.add("panel", undefined, tr("panel_align"));
    pAlign.orientation = "row"; pAlign.alignChildren = "top"; pAlign.margins = 8; pAlign.spacing = 8;

    var ALIGN_CODES = [["TL","TC","TR"],["CL","CC","CR"],["BL","BC","BR"]];
    var currentAlign = "CC";

    // V2 — GRILLE D'ALIGNEMENT DESSINÉE. Les neuf boutons natifs ne pouvaient
    //  pas montrer lequel était actif (ScriptUI ne sait pas styler un bouton) :
    //  l'état courant était signalé en encadrant le glyphe de crochets, « [↖] ».
    //  Un panneau dessiné donne un vrai état visuel — la cellule active est
    //  remplie — et il représente la FEUILLE, ce qui rend le réglage lisible
    //  d'un coup d'œil : le petit carré montre où la grille se pose.
    var IW_ALIGN_CELL = 26;                       // côté d'une cellule (px)
    var IW_ALIGN_PAD  = 4;                        // marge interne du cadre
    var alignPanel = pAlign.add("panel", undefined, undefined);
    alignPanel.preferredSize = [IW_ALIGN_CELL * 3 + IW_ALIGN_PAD * 2 + 2,
                                IW_ALIGN_CELL * 3 + IW_ALIGN_PAD * 2 + 2];
    try { alignPanel.helpTip = tr("desc_align"); } catch (eAt) {}
    var alignHoverCode = null;

    alignPanel.onDraw = function () {
        var g = this.graphics;
        var W = this.size[0], H = this.size[1];
        var cw = (W - IW_ALIGN_PAD * 2) / 3, ch = (H - IW_ALIGN_PAD * 2) / 3;
        var lineCol = IW_UI_DARK ? [0.55, 0.57, 0.62, 1] : [0.45, 0.47, 0.52, 1];
        // V2 — bleu de SÉLECTION D'INDESIGN (≈ #4A8CC7), et non le bleu de
        //   marque de Blueprint : dans un panneau, l'état actif doit parler la
        //   même langue que le reste de l'application.
        var activeCol = [0.29, 0.55, 0.78, 1];
        var hoverCol = IW_UI_DARK ? [1, 1, 1, 0.14] : [0, 0, 0, 0.08];
        for (var r = 0; r < 3; r++) {
            for (var c = 0; c < 3; c++) {
                var cd = ALIGN_CODES[r][c];
                var x = IW_ALIGN_PAD + c * cw, y = IW_ALIGN_PAD + r * ch;
                if (cd === alignHoverCode && cd !== currentAlign) {
                    iwFillRound(g, x + 1, y + 1, cw - 2, ch - 2, 3, hoverCol);
                }
                // la « pièce » : un carré posé dans le coin que décrit le code
                var pw = cw * 0.46, ph = ch * 0.46;
                var px = x + (c === 0 ? cw * 0.12 : (c === 1 ? (cw - pw) / 2 : cw - pw - cw * 0.12));
                var py = y + (r === 0 ? ch * 0.12 : (r === 1 ? (ch - ph) / 2 : ch - ph - ch * 0.12));
                // la « pièce » elle-même est arrondie (rayon 2) : à cette
                // taille, un coin franc se lit comme un défaut de tracé.
                if (cd === currentAlign) {
                    iwFillRound(g, px, py, pw, ph, 2, activeCol);
                } else {
                    iwStrokeRound(g, px, py, pw, ph, 2, lineCol, 1);
                }
            }
        }
        // quadrillage discret + cadre extérieur (la « feuille »)
        var gridPen = g.newPen(g.PenType.SOLID_COLOR,
                               IW_UI_DARK ? [1, 1, 1, 0.18] : [0, 0, 0, 0.14], 1);
        for (var k = 1; k < 3; k++) {
            g.newPath();
            g.moveTo(IW_ALIGN_PAD + k * cw, IW_ALIGN_PAD);
            g.lineTo(IW_ALIGN_PAD + k * cw, H - IW_ALIGN_PAD);
            g.strokePath(gridPen);
            g.newPath();
            g.moveTo(IW_ALIGN_PAD, IW_ALIGN_PAD + k * ch);
            g.lineTo(W - IW_ALIGN_PAD, IW_ALIGN_PAD + k * ch);
            g.strokePath(gridPen);
        }
        iwStrokeRound(g, IW_ALIGN_PAD, IW_ALIGN_PAD,
                      W - IW_ALIGN_PAD * 2, H - IW_ALIGN_PAD * 2, 4, lineCol, 1);
    };
    function refreshAlignButtons() {
        // le nom est conservé : il est appelé depuis applyConfig, le bouton
        // « Auto » des espacements et les présélections de mode.
        var ok = false;
        try { alignPanel.onDraw(); ok = true; } catch (eAd) {}
        try { alignPanel.notify("onDraw"); } catch (eAd2) {}
        if (!ok) { try { alignPanel.hide(); alignPanel.show(); } catch (eAd3) {} }
    }
    // code de la cellule sous un point du panneau (null hors grille)
    function alignCodeAtXY(x, y) {
        var W = alignPanel.size[0], H = alignPanel.size[1];
        var cw = (W - IW_ALIGN_PAD * 2) / 3, ch = (H - IW_ALIGN_PAD * 2) / 3;
        var c = Math.floor((x - IW_ALIGN_PAD) / cw);
        var r = Math.floor((y - IW_ALIGN_PAD) / ch);
        if (r < 0 || r > 2 || c < 0 || c > 2) return null;
        return ALIGN_CODES[r][c];
    }
    try {
        alignPanel.addEventListener("mousedown", function (ev) {
            var p = iwEvXY(ev); if (!p) return;
            var cd = alignCodeAtXY(p.x, p.y); if (!cd) return;
            currentAlign = cd; refreshAlignButtons(); refresh();
        });
        alignPanel.addEventListener("mousemove", function (ev) {
            var p = iwEvXY(ev);
            var cd = p ? alignCodeAtXY(p.x, p.y) : null;
            if (cd !== alignHoverCode) { alignHoverCode = cd; refreshAlignButtons(); }
        });
        alignPanel.addEventListener("mouseout", function () {
            if (alignHoverCode !== null) { alignHoverCode = null; refreshAlignButtons(); }
        });
    } catch (eAe) {}

    var alignDesc = pAlign.add("statictext", undefined, tr("desc_align"), { multiline: true });
    alignDesc.preferredSize = [330, 60];
    iwItalic(alignDesc);

    // — Boutons : tourner l'ORIGINAL (donc tous les objets sélectionnés) —
    //   V10 : exactement comme les boutons d'alignement — de vrais boutons
    //   NATIFS ScriptUI, glyphe flèche, taille 27×27.
    var rotGrp = pAlign.add("group");
    rotGrp.orientation = "column"; rotGrp.alignChildren = "left"; rotGrp.spacing = 6;
    rotGrp.add("statictext", undefined, tr("lbl_rotorig"));
    var rotBtnRow = rotGrp.add("group"); rotBtnRow.spacing = 3; rotBtnRow.alignChildren = "center";

    // Angle de rotation appliqué AUX COPIES imposées (pas à l'original).
    // 0 / 90 / 180 / 270. Les boutons font tourner cet angle ; l'aperçu et
    // l'exécution l'appliquent. La pièce source n'est jamais modifiée.
    var origRotation = 0;

    function applyOrigRotation(delta) {
        origRotation = ((origRotation + delta) % 360 + 360) % 360;
        refresh();
    }
    var rotLbtn = rotBtnRow.add("button", undefined, "\u21BA");   // ↺ anti-horaire
    rotLbtn.preferredSize = [IW_UI_ICON, IW_UI_ICON];
    var rotRbtn = rotBtnRow.add("button", undefined, "\u21BB");   // ↻ horaire
    rotRbtn.preferredSize = [IW_UI_ICON, IW_UI_ICON];
    try { rotLbtn.helpTip = tr("tip_rotleft"); rotRbtn.helpTip = tr("tip_rotright"); } catch (eRtt) {}
    rotLbtn.onClick = function () { applyOrigRotation(90); };
    rotRbtn.onClick = function () { applyOrigRotation(-90); };

    // — Bloc options spécifiques au mode (Booklet / Shuffle) —
    var pModeOpts = tMode.add("panel", undefined, tr("panel_modeopts"));
    pModeOpts.orientation = "column"; pModeOpts.alignChildren = "fill"; pModeOpts.margins = 8; pModeOpts.spacing = 8;

    // V2 — les options Booklet et l'ordre Shuffle sont désormais dans DEUX
    //  groupes distincts : le type de document masque l'un sans l'autre
    //  (un fanzine a besoin des options de livret, jamais de l'ordre manuel).
    var bkGrp = pModeOpts.add("group");
    bkGrp.orientation = "column"; bkGrp.alignChildren = "fill"; bkGrp.spacing = 4;
    var bkRow = bkGrp.add("group");
    var bkLbl = bkRow.add("statictext", undefined, tr("lbl_bk_pages"));
    bkLbl.preferredSize.width = IW_UI_LABEL_W;
    var bkPages = bkRow.add("edittext", undefined, String(Math.ceil(doc.pages.length / 4) * 4));
    bkPages.preferredSize.width = 50;
    var bkCreepLbl = bkRow.add("statictext", undefined, tr("lbl_creep2"));
    bkCreepLbl.preferredSize.width = 70;
    var bkCreep = bkRow.add("edittext", undefined, "0");
    bkCreep.preferredSize.width = 50;
    var bkDesc = bkGrp.add("statictext", undefined,
        tr("tip_booklet"),
        { multiline: true });
    bkDesc.preferredSize = [460, 50]; iwItalic(bkDesc);

    var shufGrp = pModeOpts.add("group");
    shufGrp.orientation = "column"; shufGrp.alignChildren = "fill"; shufGrp.spacing = 4;
    var shufIn = field(shufGrp, tr("lbl_shuffle"), "",
        tr("tip_shuffle"), 140);
    var shufLbl = shufIn.parent.children[0];

    // V2 — OPTIONS DE MODE GRISÉES HORS CONTEXTE. « Pages du livret », le
    //  décalage (creep) et l'ordre Shuffle restaient actifs dans les neuf modes,
    //  alors qu'ils ne sont lus que par Booklet et Shuffle : rien ne disait
    //  quels champs comptaient pour le mode choisi.
    function modeOptsState(mi) {
        var isBooklet = (mi === 3);
        var isShuffle = (mi === 5);
        var ctl = [bkLbl, bkPages, bkCreepLbl, bkCreep, bkDesc];
        for (var i = 0; i < ctl.length; i++) { try { ctl[i].enabled = isBooklet; } catch (eMo) {} }
        try { shufIn.enabled = isShuffle; } catch (eMo2) {}
        try { if (shufLbl) shufLbl.enabled = isShuffle; } catch (eMo3) {}
    }

    // ═══════════════ Onglet : MARGES (V2) ═══════════════
    //  Regroupe les trois réglages qui décident de la GÉOMÉTRIE de la planche :
    //  espacement entre pièces, fond perdu, blanc tournant. Ils vivaient dans
    //  DEUX onglets différents (« Repères » et « Couleurs ») alors que fond
    //  perdu et blanc tournant sont MUTUELLEMENT EXCLUSIFS : activer l'un
    //  remettait l'autre à zéro depuis un onglet que l'on ne regardait pas.
    var tGeom = iwAddSection();
    tGeom.orientation = "column"; tGeom.alignChildren = "fill"; tGeom.margins = 8; tGeom.spacing = 8;

    // ═══════════════ Onglet : REPÈRES ═══════════════
    var tMarks = iwAddSection();
    tMarks.orientation = "column"; tMarks.alignChildren = "fill"; tMarks.margins = 8; tMarks.spacing = 8;

    // — Espacement —
    var pGaps = tGeom.add("panel", undefined, tr("panel_spacing"));
    pGaps.orientation = "column"; pGaps.alignChildren = "fill"; pGaps.margins = 8; pGaps.spacing = 4;
    var gapHIn  = field(pGaps, tr("lbl_gapH2"), "0", tr("tip_gapH"));
    var gapVIn  = field(pGaps, tr("lbl_gapV2"), "0", tr("tip_gapV"));
    // V10 — bouton AUTO : étend la grille à toute la zone utile (page hors
    // marges) en répartissant l'espace restant uniformément entre les pièces.
    var gapAutoRow = pGaps.add("group"); gapAutoRow.orientation = "row"; gapAutoRow.alignment = "right"; gapAutoRow.spacing = IW_UI_GAP;
    var gapAutoBtn = gapAutoRow.add("button", undefined, tr("btn_gap_auto"));
    gapAutoBtn.preferredSize = [IW_UI_BTN_W + 80, IW_UI_BTN_H];
    try { gapAutoBtn.helpTip = tr("tip_gap_auto"); } catch (eGA) {}
    gapAutoBtn.onClick = function () {
        // V12 — « remplir la page » : place le MAXIMUM de pièces dans la zone
        // utile, en gardant une MARGE DE SÉCURITÉ (IW_AUTO_MARGIN mm) tout
        // autour pour que les pièces ne touchent pas les bords. L'espacement
        // est calculé pour répartir les pièces dans la zone réduite ; la grille
        // reste CENTRÉE, donc la marge restante se répartit également (la marge
        // de sécurité de chaque côté est garantie).
        var MARGE = IW_AUTO_MARGIN;                 // mm de marge contre les bords
        var ctx = currentZoneAndPage();
        var ep = effectivePiece();
        // dimensions d'une pièce (avec fond perdu éventuel, comme le moteur)
        var sW = ep.w, sH = ep.h;
        if (!(sW > 0) || !(sH > 0)) { Window.alert(tr("alert_gap_auto_nofit")); return; }
        // V20 — COHÉRENCE AVEC LE MOTEUR. Le nombre de colonnes/rangées est
        // calculé sur la zone RÉDUITE (marge de sécurité retirée), mais le
        // moteur (iwComputeLayout) recompte ensuite les colonnes sur la zone
        // ENTIÈRE via floor((zone+gap)/(slot+gap)). Si on répartit le gap sur
        // la zone réduite, le moteur retrouve alors de la place pour une
        // colonne de plus -> il en ajoute une qui déborde dans la marge et
        // l'espacement affiché ne correspond plus. On calcule donc le gap qui
        // répartit `cols` pièces sur la zone ENTIÈRE (le même repère que le
        // moteur), en VÉRIFIANT que ce gap ne fait pas rentrer une colonne
        // supplémentaire ; sinon on le réduit d'un cheveu. La marge de sécurité
        // devient le résultat de la répartition, garantie >= MARGE de chaque
        // côté puisque la grille est centrée.
        var availW = ctx.zone.w - 2 * MARGE;
        var availH = ctx.zone.h - 2 * MARGE;
        var cols = Math.floor(availW / sW);
        var rows = Math.floor(availH / sH);
        if (cols < 1 || rows < 1) { Window.alert(tr("alert_gap_auto_nofit")); return; }

        // gap qui étale `cols` pièces sur TOUTE la zone (repère du moteur),
        // puis on retranche 2*MARGE réparti sur les (cols-1) intervalles pour
        // conserver la marge de sécurité. Résultat identique à l'ancien calcul
        // MAIS exprimé de façon STABLE pour le moteur.
        function stableGap(zoneLen, slot, k) {
            if (k <= 1) return 0;
            // répartition idéale sur la zone réduite
            var g = (zoneLen - 2 * MARGE - k * slot) / (k - 1);
            if (g < 0) g = 0;
            // garde-fou : le moteur ne doit pas trouver k+1 pièces avec ce gap.
            // floor((zoneLen+g)/(slot+g)) doit valoir k. Si > k, on rabote g.
            var guard = 0;
            while (guard < 64 && slot + g > 0 &&
                   Math.floor((zoneLen + g) / (slot + g)) > k) {
                g -= 0.01; if (g < 0) { g = 0; break; }
                guard++;
            }
            return g;
        }
        var gH = stableGap(ctx.zone.w, sW, cols);
        var gV = stableGap(ctx.zone.h, sH, rows);
        gapHIn.text = String(r2(gH));
        gapVIn.text = String(r2(gV));
        // grille CENTRÉE : la marge de sécurité reste de chaque côté.
        currentAlign = "CC";
        refreshAlignButtons();
        refresh();
    };

    // ── BORD DE LA PIÈCE (V2) — l'exclusion devient un CHOIX ────────────
    //  Fond perdu et blanc tournant décrivent la même chose — ce qui se passe
    //  au bord de la pièce — et ne peuvent pas coexister : soit le visuel
    //  déborde le trait de coupe, soit une marge l'entoure. Jusqu'ici, deux
    //  cases séparées s'éteignaient mutuellement EN SILENCE, chacune dans son
    //  onglet : cocher le blanc tournant remettait le fond perdu à « 0 », et
    //  saisir un fond perdu décochait le blanc tournant, sans un mot. La valeur
    //  saisie était perdue. Un choix à trois états rend la règle visible et
    //  garde les valeurs des deux panneaux intactes (le panneau inactif est
    //  grisé, pas vidé).
    var pEdge = tGeom.add("panel", undefined, tr("panel_edge"));
    pEdge.orientation = "column"; pEdge.alignChildren = "left"; pEdge.margins = 8; pEdge.spacing = 2;
    var edgeNone  = pEdge.add("radiobutton", undefined, tr("edge_none"));
    var edgeBleed = pEdge.add("radiobutton", undefined, tr("edge_bleed"));
    var edgeWm    = pEdge.add("radiobutton", undefined, tr("edge_wm"));
    edgeBleed.value = true;   // fond perdu 3 mm : le réglage d'origine à l'ouverture
    try {
        pEdge.helpTip = tr("tip_edge");
        edgeNone.helpTip = tr("tip_edge");
        edgeBleed.helpTip = tr("tip_edge");
        edgeWm.helpTip = tr("tip_edge");
    } catch (eEd) {}

    // — Fond perdu —
    var pBleed = tGeom.add("panel", undefined, tr("panel_bleed"));
    pBleed.orientation = "column"; pBleed.alignChildren = "fill"; pBleed.margins = 8; pBleed.spacing = 4;
    var bleedIn = field(pBleed, tr("lbl_bleed"), "3", tr("tip_bleed"));
    // V20 — bascule Intérieur / Extérieur du fond perdu.
    var bleedIoDd = ddField(pBleed, tr("lbl_inout"), [tr("io_inside"), tr("io_outside")],
        tr("tip_bleed_inout"), 120);
    bleedIoDd.selection = 0;   // Intérieur par défaut (comportement historique)
    // V20 — COULEUR DU FOND PERDU (mode extérieur) : Blueprint peut CRÉER les
    //   rectangles colorés qui constituent le fond perdu autour de la pièce.
    //   « Auto » lit la couleur de fond de la pièce ; sinon nuance au choix.
    //   V2 — le nuancier n'est lu qu'UNE fois (iwSwatchNames était appelé deux
    //   fois de suite, ici et pour le blanc tournant, sur le même document).
    var IW_SWATCH_NAMES = iwSwatchNames(doc);
    var IW_BLEED_SWATCHES = IW_SWATCH_NAMES;
    // V1 — index 0 = « Auto (visuel étiré) » (DÉFAUT), 1 = Auto plat,
    //   2 = Aucune, 3+ = nuances du document.
    var bleedColDd = ddField(pBleed, tr("lbl_bleed_color"),
        [tr("bleed_color_stretch"), tr("bleed_color_auto"), tr("bleed_color_none")].concat(IW_BLEED_SWATCHES),
        tr("tip_bleed_color"), 190);
    bleedColDd.selection = 0;   // Visuel étiré par défaut (V1)
    bleedColDd.onChange = function () { refresh(); };
    // grisé tant que le mode est Intérieur (le fond perdu y est déjà dans la pièce)
    function bleedIoState() {
        var outside = !!(bleedIoDd.selection && bleedIoDd.selection.index === 1);
        try { bleedColDd.enabled = outside && edgeBleed.value; } catch (eBCe) {}
    }
    bleedIoDd.onChange = function () { bleedIoState(); refresh(); };
    bleedIoState();
    var autoCenterCb = pBleed.add("checkbox", undefined, "");   // interne, masqué
    autoCenterCb.value = false; autoCenterCb.visible = false;

    // — Repères de pièce (par pose) —
    var pPiece = tMarks.add("panel", undefined, tr("panel_piecemarks"));
    pPiece.orientation = "column"; pPiece.alignChildren = "fill"; pPiece.margins = 8; pPiece.spacing = 2;
    var mkCrop = check(pPiece, tr("cb_crop"), true,  tr("tip_crop"));
    var mkTrim = check(pPiece, tr("cb_trim"), false, tr("tip_trim"));
    var mkReg  = check(pPiece, tr("cb_reg"),  false, tr("tip_reg"));
    var mkBar  = check(pPiece, tr("cb_bar"),  false, tr("tip_bar"));
    var mkAng  = check(pPiece, tr("cb_ang"),  false, tr("tip_ang"));

    // — Repères de page (feuille entière) —
    var pPage = tMarks.add("panel", undefined, tr("panel_pagemarks"));
    pPage.orientation = "column"; pPage.alignChildren = "fill"; pPage.margins = 8; pPage.spacing = 2;
    var mkPageCtr = check(pPage, tr("cb_pagecross"), false, tr("tip_pagectr"));
    var mkPageFrame = check(pPage, tr("cb_pageframe"), false, tr("tip_pageframe"));
    var mkPageCross = check(pPage, tr("cb_pagecross2"), true, tr("tip_pagecross"));
    var mkSideCross = check(pPage, tr("cb_sidecross"), false, tr("tip_sidecross"));
    var sideStepRow = pPage.add("group"); sideStepRow.orientation = "row"; sideStepRow.alignChildren = "center";
    var sideStepLbl = sideStepRow.add("statictext", undefined, tr("lbl_sidestep"));
    sideStepLbl.preferredSize.width = IW_UI_LABEL_W;
    var mkSideStep = sideStepRow.add("edittext", undefined, "40"); mkSideStep.preferredSize.width = 50;
    // V2 — le pas des croix de bord restait actif alors qu'il n'est lu que si
    //  les croix de bord sont demandées.
    function sideCrossState() {
        var on = mkSideCross.value;
        try { mkSideStep.enabled = on; sideStepLbl.enabled = on; } catch (eSc) {}
    }
    sideCrossState();

    // — Texte & graphique perso —
    var pCustom2 = tMarks.add("panel", undefined, tr("panel_customtxt2"));
    pCustom2.orientation = "column"; pCustom2.alignChildren = "fill"; pCustom2.margins = 8; pCustom2.spacing = 4;
    var txtRow = pCustom2.add("group"); txtRow.orientation = "row"; txtRow.alignChildren = "center"; txtRow.spacing = IW_UI_GAP;
    txtRow.add("statictext", undefined, tr("lbl_customtxt2")).preferredSize.width = IW_UI_LABEL_W;
    var mkTxt = txtRow.add("edittext", undefined, ""); mkTxt.preferredSize.width = 230;
    try { mkTxt.helpTip = tr("tip_customtxt2b"); } catch (eHT) {}
    var grRow = pCustom2.add("group"); grRow.orientation = "row"; grRow.alignChildren = "center"; grRow.spacing = IW_UI_GAP;
    grRow.add("statictext", undefined, tr("lbl_graphic2")).preferredSize.width = IW_UI_LABEL_W;
    var mkGrPath = grRow.add("edittext", undefined, ""); mkGrPath.preferredSize.width = 190;
    var mkGrBtn = grRow.add("button", undefined, "…"); mkGrBtn.preferredSize.width = 30;
    mkGrBtn.onClick = function () {
        var f = File.openDialog(tr("dlg_pickgraphic"));
        if (f) { mkGrPath.text = f.fsName; refresh(); }
    };

    // — Style des traits —
    var pStyle = tMarks.add("panel", undefined, tr("panel_markstyle"));
    pStyle.orientation = "column"; pStyle.alignChildren = "fill"; pStyle.margins = 8; pStyle.spacing = 4;
    var mLenIn = field(pStyle, tr("lbl_mklen"), "7", null);
    var mGapIn = field(pStyle, tr("lbl_mkgap"), "2", null);
    var mWIn   = field(pStyle, tr("lbl_mkstroke"), "0.25", null);

    // — Blanc tournant (marge interne, par pièce) + couleur de fond —
    //   V2 — déplacé de l'onglet « Couleurs » vers « Marges » : c'est un
    //   réglage de géométrie, exclusif du fond perdu placé juste au-dessus.
    var pWM = tGeom.add("panel", undefined, tr("panel_whitemargin"));
    pWM.orientation = "column"; pWM.alignChildren = "fill"; pWM.margins = 8; pWM.spacing = 4;
    // V2 — l'activation du blanc tournant est portée par le sélecteur « Bord de
    //   la pièce » ci-dessus. `wmEnable` reste une case à cocher INTERNE, non
    //   affichée : gatherConfig, applyConfig et les presets la lisent toujours,
    //   la compatibilité des presets enregistrés est donc préservée.
    var wmEnable = pWM.add("checkbox", undefined, tr("cb_wm_enable"));
    wmEnable.value = false;
    wmEnable.visible = false;
    try { wmEnable.preferredSize = [0, 0]; wmEnable.maximumSize = [0, 0]; } catch (eWz) {}
    var wmLink = pWM.add("checkbox", undefined, tr("cb_wm_link"));
    wmLink.value = true;
    try { wmLink.helpTip = tr("tip_whitemargin"); } catch (eWMt) {}
    // V20 — bascule Intérieur / Extérieur du blanc tournant.
    var wmIoDd = ddField(pWM, tr("lbl_inout"), [tr("io_inside"), tr("io_outside")],
        tr("tip_wm_inout"), 120);
    wmIoDd.selection = 0;   // Intérieur par défaut (comportement historique)
    wmIoDd.onChange = function () { refresh(); };
    var wmRow1 = pWM.add("group"); wmRow1.orientation = "row"; wmRow1.alignChildren = "center";
    var wmTopLbl = wmRow1.add("statictext", undefined, tr("lbl_wm_top"));
    wmTopLbl.preferredSize.width = 60;
    var wmTop = wmRow1.add("edittext", undefined, "0"); wmTop.preferredSize.width = 48;
    var wmBottomLbl = wmRow1.add("statictext", undefined, tr("lbl_wm_bottom"));
    wmBottomLbl.preferredSize.width = 60;
    var wmBottom = wmRow1.add("edittext", undefined, "0"); wmBottom.preferredSize.width = 48;
    var wmRow2 = pWM.add("group"); wmRow2.orientation = "row"; wmRow2.alignChildren = "center";
    var wmLeftLbl = wmRow2.add("statictext", undefined, tr("lbl_wm_left"));
    wmLeftLbl.preferredSize.width = 60;
    var wmLeft = wmRow2.add("edittext", undefined, "0"); wmLeft.preferredSize.width = 48;
    var wmRightLbl = wmRow2.add("statictext", undefined, tr("lbl_wm_right"));
    wmRightLbl.preferredSize.width = 60;
    var wmRight = wmRow2.add("edittext", undefined, "0"); wmRight.preferredSize.width = 48;
    // sélecteur de couleur de fond (nuancier du document, déjà lu plus haut)
    var wmColorDd = ddField(pWM, tr("lbl_wm_color"),
        [tr("wm_color_none")].concat(IW_SWATCH_NAMES), tr("tip_wm_color"), 190);
    wmColorDd.selection = 0;   // Aucune (blanc)
    wmColorDd.onChange = function () { refresh(); };

    var wmFields = [wmTop, wmBottom, wmLeft, wmRight];
    function wmSyncFrom(src) {
        if (!wmLink.value) return;
        var v = src.text;
        for (var wsi = 0; wsi < wmFields.length; wsi++) {
            if (wmFields[wsi] !== src) wmFields[wsi].text = v;
        }
    }
    function wmEnableState() {
        // V2 — le sélecteur « Bord de la pièce » commande tout le panneau.
        var on = wmEnable.value;
        wmLink.enabled = on;
        try { wmColorDd.enabled = on; } catch (eWcd) {}
        try { wmIoDd.enabled = on; } catch (eWio2) {}
        var lbls = [wmTopLbl, wmBottomLbl, wmLeftLbl, wmRightLbl];
        for (var li2 = 0; li2 < lbls.length; li2++) { try { lbls[li2].enabled = on; } catch (eWl) {} }
        var linked = wmLink.value;
        // si activé : Haut toujours éditable ; les 3 autres suivent le lien.
        wmTop.enabled    = on;
        wmBottom.enabled = on && !linked;
        wmLeft.enabled   = on && !linked;
        wmRight.enabled  = on && !linked;
    }
    for (var wfi = 0; wfi < wmFields.length; wfi++) {
        (function (fld) {
            fld.onChanging = function () { wmSyncFrom(fld); refresh(); };
            fld.onChange   = function () { wmSyncFrom(fld); refresh(); };
        })(wmFields[wfi]);
    }
    wmLink.onClick = function () {
        if (wmLink.value) { wmSyncFrom(wmTop); }
        wmEnableState();
        refresh();
    };

    // ── V2 — APPLICATION DU CHOIX « BORD DE LA PIÈCE » ──────────────────
    //  Un seul endroit décide qui est actif. Les VALEURS des deux panneaux sont
    //  conservées : le panneau inactif est grisé, jamais remis à zéro. Ce que
    //  l'imposition utilise réellement est décidé à la lecture (edgeBleedMM()),
    //  pas en écrasant ce que l'utilisateur a tapé.
    //  Historique : la V1 remettait bleedIn à « 0 » et décochait wmEnable, si
    //  bien qu'un aller-retour entre les deux réglages perdait les deux saisies.
    var IW_BLEED_LAST = "3";   // dernière valeur de fond perdu voulue par l'utilisateur
    function edgeMode() {
        if (edgeWm.value) return "wm";
        if (edgeBleed.value) return "bleed";
        return "none";
    }
    // Valeur de fond perdu RÉELLEMENT appliquée selon le mode de bord choisi.
    function edgeBleedMM() {
        return (edgeMode() === "bleed") ? (String(bleedIn.text) || "0") : "0";
    }
    function applyEdgeMode() {
        var m = edgeMode();
        var bleedOn = (m === "bleed");
        var ctl = [bleedIn, bleedIoDd];
        for (var i = 0; i < ctl.length; i++) { try { ctl[i].enabled = bleedOn; } catch (eEm) {} }
        // les libellés de ces lignes sont les premiers enfants de leur groupe
        try { bleedIn.parent.children[0].enabled = bleedOn; } catch (eEl1) {}
        try { bleedIoDd.parent.children[0].enabled = bleedOn; } catch (eEl2) {}
        try { bleedColDd.parent.children[0].enabled = bleedOn; } catch (eEl3) {}
        bleedIoState();                     // la couleur dépend aussi d'Intérieur/Extérieur
        wmEnable.value = (m === "wm");      // case interne lue par gatherConfig
        wmEnableState();
    }
    edgeNone.onClick  = function () { applyEdgeMode(); refresh(); };
    edgeBleed.onClick = function () {
        // rétablit la dernière valeur voulue si le champ avait été laissé à 0
        try { if ((parseFloat(bleedIn.text) || 0) === 0) bleedIn.text = IW_BLEED_LAST; } catch (eEb) {}
        applyEdgeMode(); refresh();
    };
    edgeWm.onClick    = function () { applyEdgeMode(); refresh(); };
    bleedIn.onChanging = function () { refresh(); };
    bleedIn.onChange   = function () {
        try { if ((parseFloat(bleedIn.text) || 0) > 0) IW_BLEED_LAST = String(bleedIn.text); } catch (eBl) {}
        refresh();
    };
    applyEdgeMode();

    // — Marques couleurs de page (calque dédié) —
    //   V2 — rattaché à « Repères » : ce sont des repères, au même titre que les
    //   croix et les mires. L'onglet « Couleurs » qui les isolait est supprimé.
    var pColorMarks = tMarks.add("panel", undefined, tr("panel_colormarks"));
    pColorMarks.orientation = "column"; pColorMarks.alignChildren = "fill"; pColorMarks.margins = 8; pColorMarks.spacing = 4;
    var mkColorMarks = check(pColorMarks, tr("cb_colormarks"), false, tr("tip_colormarks"));
    var colorEdgeDd = ddField(pColorMarks, tr("lbl_coloredge"),
        [tr("edge_short"), tr("edge_long")], tr("tip_coloredge"), 120);
    colorEdgeDd.selection = 0;
    colorEdgeDd.onChange = function () { refresh(); };
    var IW_CNS_KEYS = ["auto", "bas", "haut", "gauche", "droite"];
    var colorNameDd = ddField(pColorMarks, tr("lbl_colornameside"),
        [tr("cns_auto"), tr("cns_bas"), tr("cns_haut"), tr("cns_gauche"), tr("cns_droite")],
        tr("tip_colornameside"), 120);
    colorNameDd.selection = 0;
    colorNameDd.onChange = function () { refresh(); };
    // V2 — les deux listes ne servent que si les marques couleurs sont demandées.
    function colorMarksState() {
        var on = mkColorMarks.value;
        try { colorEdgeDd.enabled = on; colorEdgeDd.parent.children[0].enabled = on; } catch (eCm1) {}
        try { colorNameDd.enabled = on; colorNameDd.parent.children[0].enabled = on; } catch (eCm2) {}
    }
    colorMarksState();

    // ═══════ Onglet : RECTO/VERSO ═══════
    var tDup = iwAddSection();
    tDup.orientation = "column"; tDup.alignChildren = "fill"; tDup.margins = 8; tDup.spacing = 8;
    // V2 — le duplex et le pré-traitement des pages partageaient cet onglet
    //  sans rien qui les sépare, alors qu'ils n'ont rien à voir : deux panneaux
    //  titrés les distinguent, et le second porte l'avertissement qui manquait
    //  (ces champs MODIFIENT le document, dont une suppression de page).
    var pDupx = tDup.add("panel", undefined, tr("tab_duplex"));
    pDupx.orientation = "column"; pDupx.alignChildren = "fill"; pDupx.margins = 8; pDupx.spacing = 4;
    var dupCb = check(pDupx, tr("cb_duplex2"), false,
        tr("tip_duplex"));
    var flipDd = ddField(pDupx, tr("lbl_duplexflip2"), [
        { fr: "Bord long (turn)", en: "Long edge (turn)", it: "Lato lungo (turn)" }[IW.lang] || "Bord long (turn)",
        { fr: "Bord court (tumble)", en: "Short edge (tumble)", it: "Lato corto (tumble)" }[IW.lang] || "Bord court (tumble)"
    ], tr("tip_duplexflip"), 190);
    flipDd.selection = 0;
    var flipDesc = pDupx.add("statictext", undefined,
        tr("tip_duplexflip"),
        { multiline: true });
    flipDesc.preferredSize = [460, 44];
    iwItalic(flipDesc);
    var backPgIn = field(pDupx, tr("lbl_backpg"), "",
        tr("tip_backpg"));
    // V2 — retournement et page verso ne servent que si le verso est demandé.
    function duplexState() {
        var on = dupCb.value;
        try { flipDd.enabled = on; flipDd.parent.children[0].enabled = on; } catch (eD1) {}
        try { backPgIn.enabled = on; backPgIn.parent.children[0].enabled = on; } catch (eD2) {}
        try { flipDesc.enabled = on; } catch (eD3) {}
    }
    duplexState();

    // — Pré-traitement des pages (anciennement onglet séparé) —
    // ── V2 — LE PANNEAU « PRÉ-TRAITEMENT DES PAGES » EST SUPPRIMÉ ───────
    //  Il proposait de réordonner, cloner, supprimer et dupliquer des pages.
    //  Vérification faite dans iwExecute : le plan de pages est bien calculé à
    //  partir de ces champs (ppReorder / ppClone / ppDeletePage /
    //  ppDuplicatePage), puis la variable `plan` n'est JAMAIS relue — baseCfg
    //  ne la référence pas. Cinq champs qui ne produisaient rien, avec un
    //  avertissement qui annonçait à tort une modification du document.
    //  Les contrôles restent déclarés, HORS INTERFACE, pour deux raisons :
    //  gatherConfig/applyConfig continuent de les lire sans cas particulier,
    //  et les presets déjà enregistrés gardent leur champ `pre` intact — le
    //  jour où le plan sera raccordé au moteur, il n'y aura qu'à réafficher
    //  le panneau.
    var pPre = tDup.add("group");
    pPre.orientation = "column";
    pPre.visible = false;
    try { pPre.preferredSize = [0, 0]; pPre.maximumSize = [0, 0]; } catch (ePz2) {}
    var ppReorderIn = pPre.add("edittext", undefined, "");
    var ppCloneIn   = pPre.add("edittext", undefined, "1");
    var ppDelIn     = pPre.add("edittext", undefined, "");
    var ppDupPg     = pPre.add("edittext", undefined, "");
    var ppDupN      = pPre.add("edittext", undefined, "1");

    // V2 — « Recto/verso » est le seul onglet qui peut se vider entièrement
    //  (une affiche et un sticker n'ont ni verso ni pré-traitement de pages).
    //  Un onglet vide sans explication ressemble à un bug : on dit pourquoi.
    var dupNA = tDup.add("statictext", undefined, tr("dt_na"), { multiline: true });
    dupNA.preferredSize = [460, 34];
    iwItalic(dupNA);
    dupNA.visible = false;

    // ===== Onglet : PRESETS (V10 — dossiers + code couleur) =====
    var tPreset = iwAddSection();
    tPreset.orientation = "column"; tPreset.alignChildren = "fill"; tPreset.margins = 8; tPreset.spacing = 6;
    // — Création en haut —
    var saveRow = tPreset.add("group");
    saveRow.spacing = IW_UI_GAP;
    saveRow.add("statictext", undefined, tr("lbl_name")).preferredSize.width = 70;
    var saveName = saveRow.add("edittext", undefined, tr("preset_default")); saveName.preferredSize.width = 150;
    var saveBtn = saveRow.add("button", undefined, tr("btn_save"));
    saveBtn.preferredSize = [IW_UI_BTN_W, IW_UI_BTN_H];

    // — V2 — RECHERCHE. Les presets peuvent être rangés en dossiers colorés,
    //   mais rien ne permettait de retrouver un nom dans une longue liste :
    //   il fallait déplier les dossiers un par un et faire défiler.
    var searchRow = tPreset.add("group");
    searchRow.spacing = IW_UI_GAP;
    searchRow.add("statictext", undefined, tr("lbl_presetsearch")).preferredSize.width = 70;
    var presetSearch = searchRow.add("edittext", undefined, "");
    presetSearch.preferredSize.width = 150;
    try { presetSearch.helpTip = tr("tip_presetsearch"); } catch (ePs2) {}
    var searchHint = searchRow.add("statictext", undefined, "");
    searchHint.preferredSize.width = 160;
    iwItalic(searchHint);
    presetSearch.onChanging = function () { refreshPresetList(); };
    presetSearch.onChange   = function () { refreshPresetList(); };

    // — Liste des presets : PANNEAU DESSINÉ (ScriptUI ne sait ni colorer une
    //   ligne de listbox, ni retirer le surlignage bleu de sélection). On
    //   dessine donc chaque ligne nous-mêmes : la LIGNE ENTIÈRE prend la
    //   couleur du preset (toujours visible, sans avoir à sélectionner), un
    //   marqueur ● devant le nom, l'étoile du preset par défaut À DROITE, et
    //   un simple liseré (pas de cadre bleu) pour la sélection. Les clics sont
    //   lus de façon DÉFENSIVE (offsetX/localX/clientX) -> pas de plantage. —
    var IW_ROW_H = 24;                       // hauteur d'une ligne (px)
    var presetPanel = tPreset.add("panel", undefined, undefined);
    // V2 — la liste prenait la hauteur ENTIÈRE de l'aperçu (jusqu'à 620 px), à
    //  quoi s'ajoutaient la ligne d'enregistrement, la barre de défilement et
    //  deux rangées de boutons : l'onglet Presets dépassait donc le plafond
    //  responsive calculé pour la fenêtre, et comme un tabbedpanel adopte la
    //  hauteur de son plus grand onglet, il l'imposait à tous les autres. On
    //  réserve la place que les contrôles autour occupent réellement.
    var IW_PRESET_CHROME = 150;   // 2 lignes de saisie + scrollbar + 2 rangées de boutons
    var IW_PRESET_H = Math.min(IW_CANVAS_H, IW_TABS_MAX_H - IW_PRESET_CHROME);
    if (IW_PRESET_H < 160) IW_PRESET_H = 160;
    presetPanel.preferredSize = [370, IW_PRESET_H];

    // barre de défilement (un panneau dessiné n'a pas de scroll natif)
    var presetScrollRow = tPreset.add("group");
    presetScrollRow.orientation = "row"; presetScrollRow.alignChildren = "fill"; presetScrollRow.spacing = 4;
    var presetScroll = presetScrollRow.add("scrollbar", undefined, 0, 0, 0);
    presetScroll.preferredSize = [360, 16];

    // modèle : lignes visibles + sélection + repli des dossiers
    var presetRows = [];          // [{kind:'folder'|'preset', name, color, folder, starred, collapsed, count}]
    var presetSelName = null;     // nom du preset sélectionné
    var presetSelFolder = null;   // nom du dossier sélectionné (V11, pour le colorer)
    var presetHoverIdx = -1;      // index de la ligne survolée (V12, feedback)
    var presetScrollTop = 0;      // index 1re ligne visible
    var collapsedFolders = {};    // { "Dossier": true } -> replié

    // reconstruit presetRows depuis le disque + métadonnées + état de repli
    function refreshPresetList() {
        presetRows = [];
        var starred = iwLoadStarPreset();
        var names = listPresets();
        var meta = iwLoadPresetMeta();
        // V2 — FILTRE de recherche (insensible à la casse). Un dossier qui ne
        //  contient plus aucun preset correspondant disparaît de la liste ;
        //  ceux qui restent sont dépliés d'office, sinon le résultat serait
        //  caché derrière une flèche repliée.
        var q = "";
        try { q = String(presetSearch.text || "").replace(/^\s+|\s+$/g, "").toLowerCase(); } catch (eQ) {}
        var filtering = (q.length > 0);
        function matches(nm) { return !filtering || String(nm).toLowerCase().indexOf(q) >= 0; }
        var byFolder = {}, rootItems = [], nMatch = 0;
        for (var i = 0; i < names.length; i++) {
            var nm = names[i];
            if (!matches(nm)) continue;
            nMatch++;
            var e = meta.presets[nm] || {};
            var entry = { name: nm, color: e.color || "", folder: e.folder || "" };
            if (entry.folder) { if (!byFolder[entry.folder]) byFolder[entry.folder] = []; byFolder[entry.folder].push(entry); }
            else rootItems.push(entry);
        }
        try {
            searchHint.text = filtering
                ? (nMatch === 0 ? tr("preset_nomatch") : ("(" + nMatch + ")"))
                : "";
        } catch (eSh) {}
        var folders = iwListFolders();
        for (var f = 0; f < folders.length; f++) {
            var fol = folders[f];
            // en recherche, un dossier vide de résultats n'est pas affiché
            if (filtering && !byFolder[fol]) continue;
            var collapsed = filtering ? false : !!collapsedFolders[fol];
            var folColor = (meta.folderColors && meta.folderColors[fol]) ? meta.folderColors[fol] : "";
            presetRows.push({ kind: "folder", name: fol, collapsed: collapsed,
                              color: folColor,
                              count: (byFolder[fol] ? byFolder[fol].length : 0) });
            if (!collapsed && byFolder[fol]) {
                for (var k = 0; k < byFolder[fol].length; k++) {
                    var it = byFolder[fol][k];
                    // V11 — couleur EFFECTIVE : la couleur propre du preset si
                    // définie, sinon la couleur du DOSSIER (héritée). La couleur
                    // propre reste modifiable et prime toujours.
                    var effColor = it.color ? it.color : folColor;
                    presetRows.push({ kind: "preset", name: it.name, color: effColor,
                                      ownColor: it.color, inherited: (!it.color && !!folColor),
                                      folder: fol, starred: (it.name === starred) });
                }
            }
        }
        for (var r = 0; r < rootItems.length; r++) {
            presetRows.push({ kind: "preset", name: rootItems[r].name, color: rootItems[r].color,
                              ownColor: rootItems[r].color, inherited: false,
                              folder: "", starred: (rootItems[r].name === starred) });
        }
        // sélection disparue ?
        if (presetSelName) {
            var still = false;
            for (var s = 0; s < presetRows.length; s++) if (presetRows[s].kind === "preset" && presetRows[s].name === presetSelName) still = true;
            if (!still) presetSelName = null;
        }
        updatePresetScroll();
        redrawPresetPanel();
    }

    // V12 — petite MARGE au-dessus de chaque dossier (sauf le tout premier
    // élément affiché) pour aérer le tableau et séparer visuellement les
    // groupes. La position des lignes est donc CUMULÉE (plus simplement
    // linéaire) ; rendu et détection de clic partagent la même fonction.
    var IW_FOLDER_GAP = 8;   // px de marge au-dessus d'un dossier
    // hauteur d'espace ajoutée AVANT une ligne donnée (par son index global)
    function presetRowPad(idx) {
        if (idx <= 0) return 0;
        var row = presetRows[idx];
        return (row && row.kind === "folder") ? IW_FOLDER_GAP : 0;
    }
    // y du HAUT de chaque ligne visible (à partir de presetScrollTop), cumulé.
    // Renvoie un tableau parallèle aux lignes visibles : tops[vi] = y, et la
    // hauteur de chaque ligne reste IW_ROW_H.
    function presetVisibleTops() {
        var vis = presetVisibleCount();
        var tops = [], y = 3;
        for (var vi = 0; vi < vis; vi++) {
            var idx = presetScrollTop + vi;
            if (idx >= presetRows.length) break;
            // la marge d'un dossier ne s'applique pas s'il est la 1re ligne visible
            if (vi > 0) y += presetRowPad(idx);
            tops.push(y);
            y += IW_ROW_H;
        }
        return tops;
    }

    function presetVisibleCount() {
        var h = (presetPanel.size && presetPanel.size[1]) ? presetPanel.size[1] : IW_PRESET_H;
        return Math.max(1, Math.floor((h - 6) / IW_ROW_H));
    }
    function updatePresetScroll() {
        var vis = presetVisibleCount();
        var maxTop = Math.max(0, presetRows.length - vis);
        if (presetScrollTop > maxTop) presetScrollTop = maxTop;
        if (presetScrollTop < 0) presetScrollTop = 0;
        try {
            presetScroll.minvalue = 0;
            presetScroll.maxvalue = maxTop;
            presetScroll.value = presetScrollTop;
            presetScroll.enabled = (maxTop > 0);
        } catch (eSc) {}
    }
    presetScroll.onChanging = function () { presetScrollTop = Math.round(presetScroll.value); redrawPresetPanel(); };
    presetScroll.onChange   = presetScroll.onChanging;

    // luminance -> texte clair/foncé pour contraste sur une ligne colorée
    function presetTxtColor(rgb01) {
        if (!rgb01) return IW_TXT_DEFAULT;
        var lum = 0.299 * rgb01[0] + 0.587 * rgb01[1] + 0.114 * rgb01[2];
        return (lum > 0.6) ? [0.10, 0.12, 0.16, 1] : [0.92, 0.94, 0.98, 1];
    }

    presetPanel.onDraw = function () {
        var g = this.graphics;
        var W = this.size[0], H = this.size[1];
        // FOND TRANSPARENT : on ne peint PAS le fond du panneau (il prend la
        // couleur native de la fenêtre). Seules les lignes COLORÉES et les
        // en-têtes de dossier ont un fond ; les presets sans couleur restent
        // transparents.
        // V11 — texte par défaut BLANC (presets sans couleur écrits en blanc).
        // Les dossiers et presets COLORÉS prennent leur couleur de fond, avec un
        // texte clair/foncé selon la luminance pour le contraste.
        // V2 — le blanc était EN DUR : sur une interface InDesign en thème
        //   CLAIR, tous les presets sans couleur étaient invisibles (blanc sur
        //   fond clair). La couleur par défaut suit maintenant le thème.
        var DEF_TXT = IW_TXT_DEFAULT;
        var vis = presetVisibleCount();
        var tops = presetVisibleTops();
        for (var vi = 0; vi < vis; vi++) {
            var idx = presetScrollTop + vi;
            if (idx >= presetRows.length) break;
            var row = presetRows[idx];
            var rowTop = tops[vi];
            var isSel = (row.kind === "preset" && row.name === presetSelName) ||
                        (row.kind === "folder" && row.name === presetSelFolder);
            var bg = null, txt = DEF_TXT;
            if (row.kind === "folder") {
                var frgb = iwHexToRGB01(row.color);
                if (frgb) { bg = [frgb[0], frgb[1], frgb[2], 1]; txt = presetTxtColor(frgb); }
                else { bg = [0.30, 0.32, 0.38, 1]; txt = [1, 1, 1, 1]; }   // dossier sans couleur : gris + blanc
            } else {
                var rgb = iwHexToRGB01(row.color);
                if (rgb) { bg = [rgb[0], rgb[1], rgb[2], 1]; txt = presetTxtColor(rgb); }
                // preset sans couleur -> pas de fond (transparent), texte BLANC
            }
            if (bg) {
                // V2 — coins arrondis (rayon 4) : la ligne colorée devient une
                // pastille, comme les étiquettes de couleur d'InDesign.
                iwFillRound(g, 2, rowTop, W - 4, IW_ROW_H - 1, 4, bg);
            }
            // V12 — survol : léger voile par-dessus la ligne survolée
            //   (V2 : assombri en thème clair, où un voile blanc ne se voit pas)
            if (idx === presetHoverIdx && !isSel) {
                iwFillRound(g, 2, rowTop, W - 4, IW_ROW_H - 1, 4,
                    IW_UI_DARK ? [1, 1, 1, 0.12] : [0, 0, 0, 0.10]);
            }
            // sélection : liseré contrasté (V14 : blanc ; V2 : suit le thème)
            if (isSel) {
                iwStrokeRound(g, 2, rowTop, W - 4, IW_ROW_H - 1, 4, IW_TXT_DEFAULT, 2);
            }
            // texte
            var pen = g.newPen(g.PenType.SOLID_COLOR, txt, 1);
            var label;
            if (row.kind === "folder") {
                var arrow = row.collapsed ? "\u25B8" : "\u25BE";
                label = arrow + " " + row.name + "  (" + row.count + ")";
            } else {
                var indent = row.folder ? "    " : "";
                var dot = iwHexToRGB01(row.color) ? "\u25CF " : "";
                var star = row.starred ? "  \u2605" : "";
                label = indent + dot + row.name + star;
            }
            try { g.drawString(label, pen, 8, rowTop + 5); } catch (eDs) {}
        }
        // cadre fin (toujours utile pour délimiter la zone)
        iwStrokeRound(g, 0.5, 0.5, W - 1, H - 1, 6, [0.45, 0.45, 0.5, 0.6], 1);
    };
    function redrawPresetPanel() {
        var ok = false;
        try { presetPanel.onDraw(); ok = true; } catch (e) {}
        try { presetPanel.notify("onDraw"); } catch (e2) {}
        if (!ok) { try { presetPanel.hide(); presetPanel.show(); } catch (e3) {} }
    }

    // V2 — la lecture défensive des coordonnées est désormais une fonction
    //  partagée (iwEvXY, plus haut) : elle servait ici et dans la roue
    //  chromatique, tandis que le déplacement de l'aperçu lisait clientX
    //  directement — la seule des trois propriétés à ne pas exister partout.
    function presetEvXY(ev) { return iwEvXY(ev); }
    function presetRowAtY(py) {
        // V12 — recherche dans les positions CUMULÉES (avec marges de dossier).
        var vis = presetVisibleCount();
        var tops = presetVisibleTops();
        for (var vi = 0; vi < tops.length; vi++) {
            var top = tops[vi];
            if (py >= top && py < top + IW_ROW_H) {
                var idx = presetScrollTop + vi;
                if (idx < 0 || idx >= presetRows.length) return -1;
                return idx;
            }
        }
        return -1;
    }
    try {
        presetPanel.addEventListener("mousedown", function (ev) {
            var p = presetEvXY(ev); if (!p) return;
            var idx = presetRowAtY(p.y); if (idx < 0) return;
            var row = presetRows[idx];
            if (row.kind === "folder") {
                // V11 — comportement FIABLE (sans dépendre du double-clic) :
                //   • clic dans la ZONE DE LA FLÈCHE (gauche, ~22 px) => replie/déplie
                //   • clic AILLEURS sur la ligne => sélectionne le dossier (pour le colorer)
                if (p.x <= 22) {
                    collapsedFolders[row.name] = !collapsedFolders[row.name];
                    refreshPresetList();
                } else {
                    presetSelFolder = row.name;
                    presetSelName = null;
                    redrawPresetPanel();
                }
            } else {
                presetSelName = row.name;
                presetSelFolder = null;
                redrawPresetPanel();
            }
        });
        // double-clic : preset -> charge ; dossier -> replie/déplie (raccourci)
        presetPanel.addEventListener("dblclick", function (ev) {
            var p = presetEvXY(ev); if (!p) return;
            var idx = presetRowAtY(p.y); if (idx < 0) return;
            var row = presetRows[idx];
            if (row.kind === "preset") { presetSelName = row.name; var cfg = loadPreset(row.name); if (cfg) applyConfig(cfg); }
            else if (row.kind === "folder") { collapsedFolders[row.name] = !collapsedFolders[row.name]; refreshPresetList(); }
        });
        // V12 — défilement à la MOLETTE (fluidité). On lit le delta de façon
        // défensive (wheelDelta/deltaY) ; ev.detail est évité (instable).
        presetPanel.addEventListener("mousewheel", function (ev) {
            var d = 0;
            try { if (ev.wheelDelta != null) d = ev.wheelDelta; } catch (e1) {}
            if (d === 0) { try { if (ev.deltaY != null) d = -ev.deltaY; } catch (e2) {} }
            if (d === 0) return;
            var step = (d > 0) ? -1 : 1;          // molette vers le haut = remonte
            var vis = presetVisibleCount();
            var maxTop = Math.max(0, presetRows.length - vis);
            presetScrollTop += step;
            if (presetScrollTop < 0) presetScrollTop = 0;
            if (presetScrollTop > maxTop) presetScrollTop = maxTop;
            updatePresetScroll();
            redrawPresetPanel();
        });
        // V12 — SURVOL : surligne la ligne sous le curseur (montre qu'elle est
        // cliquable). On ne redessine que si la ligne survolée CHANGE (fluidité).
        presetPanel.addEventListener("mousemove", function (ev) {
            var p = presetEvXY(ev); if (!p) { if (presetHoverIdx !== -1) { presetHoverIdx = -1; redrawPresetPanel(); } return; }
            var idx = presetRowAtY(p.y);
            if (idx !== presetHoverIdx) { presetHoverIdx = idx; redrawPresetPanel(); }
        });
        presetPanel.addEventListener("mouseout", function () {
            if (presetHoverIdx !== -1) { presetHoverIdx = -1; redrawPresetPanel(); }
        });
    } catch (ePe) {}

    // nom du preset sélectionné (null si aucun)
    function presetSelectedName() { return presetSelName; }
    // nom du dossier sélectionné (null si aucun)
    function presetSelectedFolder() { return presetSelFolder; }

    // boutons d'action sur la sélection
    var presetBtns = tPreset.add("group");
    presetBtns.orientation = "row"; presetBtns.spacing = IW_UI_GAP;
    var loadBtn = presetBtns.add("button", undefined, tr("btn_load"));
    var updateBtn = presetBtns.add("button", undefined, tr("btn_update"));
    try { updateBtn.helpTip = tr("tip_update"); } catch (eUp) {}
    var starBtn = presetBtns.add("button", undefined, tr("btn_star"));
    try { starBtn.helpTip = tr("tip_star"); } catch (eSt) {}
    var delBtn  = presetBtns.add("button", undefined, tr("btn_delete"));
    try { delBtn.helpTip = tr("tip_delete"); } catch (eDl) {}
    loadBtn.preferredSize   = [IW_UI_BTN_W, IW_UI_BTN_H];
    updateBtn.preferredSize = [IW_UI_BTN_W + 16, IW_UI_BTN_H];
    starBtn.preferredSize   = [IW_UI_BTN_W + 24, IW_UI_BTN_H];   // « ★ Par défaut » plus long
    delBtn.preferredSize    = [IW_UI_BTN_W, IW_UI_BTN_H];

    // boutons d'organisation (couleur + dossiers) sur une 2e ligne
    var presetOrgBtns = tPreset.add("group");
    presetOrgBtns.orientation = "row"; presetOrgBtns.spacing = IW_UI_GAP;
    var colorBtn = presetOrgBtns.add("button", undefined, tr("btn_color"));
    try { colorBtn.helpTip = tr("tip_color"); } catch (eCb) {}
    var newFolderBtn = presetOrgBtns.add("button", undefined, tr("btn_newfolder"));
    try { newFolderBtn.helpTip = tr("tip_newfolder"); } catch (eNf) {}
    var moveFolderBtn = presetOrgBtns.add("button", undefined, tr("btn_movefolder"));
    try { moveFolderBtn.helpTip = tr("tip_movefolder"); } catch (eMf) {}
    colorBtn.preferredSize      = [IW_UI_BTN_W, IW_UI_BTN_H];
    newFolderBtn.preferredSize  = [IW_UI_BTN_W + 40, IW_UI_BTN_H];
    moveFolderBtn.preferredSize = [IW_UI_BTN_W + 20, IW_UI_BTN_H];

    var starHint = tPreset.add("statictext", undefined, tr("hint_star"));
    iwItalic(starHint);

    refreshPresetList();

    // ===== RÉGLAGES — état + boîte de dialogue MODALE (ouverte par un bouton) =====
    //  Les réglages ne sont plus affichés en permanence : ils vivent dans des
    //  VARIABLES (settings) éditées via une petite fenêtre que l'on ouvre avec
    //  le bouton « Réglages… » (en bas à gauche). gatherConfig()/l'aperçu lisent
    //  ces variables, donc la mire perso est prise en compte même fenêtre fermée.
    var LANG_CODES = ["fr", "en", "it"];
    var IW_PREFS = iwLoadPrefs();
    function prefOr(k, d) { return (IW_PREFS && IW_PREFS[k] != null) ? IW_PREFS[k] : d; }
    var settings = {
        regFile: (initialConfig && initialConfig.marks && initialConfig.marks.regFile)
                 ? initialConfig.marks.regFile
                 : iwLoadRegMark(),  // mire mémorisée au démarrage
        // — PERSONNALISATION (durable, hors presets) —
        // V2 — DIAMÈTRE DES MIRES en millimètres, plafonné à IW_REG_MAX_MM.
        //   Remplace l'ancien MULTIPLICATEUR « × longueur de repère » : une
        //   fois le diamètre plafonné à 4 mm, tout multiplicateur au-dessus de
        //   0,57 donnait le même résultat — le réglage ne réglait plus rien.
        //   `cornerMult` a disparu : les mires de COIN ont été retirées en v4,
        //   le réglage était transporté partout sans plus rien dessiner.
        regDiam:         iwRegDiam(prefOr("regDiam", IW_REG_MAX_MM)),
        crossCornerGap:  prefOr("crossCornerGap", 6),   // marge libre près des coins pour les croix de bord (mm)
        colorSwatchSize: prefOr("colorSwatchSize", 12), // côté du carré couleur (mm)
        colorBarW:       prefOr("colorBarW", 46),       // largeur du rectangle couleur (mm)
        colorBarH:       prefOr("colorBarH", 11),       // hauteur du rectangle couleur (mm)
        // `colorNamePt` a disparu : le nom de couleur est fixé à 8 pt blanc
        // depuis la v4, le réglage était mort.
        showDims:        prefOr("showDims", true),      // afficher les cotes dans l'aperçu
        previewTransparent: prefOr("previewTransparent", false), // fond de l'aperçu transparent
        screenPPI:       prefOr("screenPPI", 96)        // densité écran (px/pouce) pour l'affichage « taille réelle »
    };
    var pendingRelaunch = null; // recevra la config à réappliquer (changement de langue)

    // Ouvre la fenêtre de réglages. Modifie `settings` et, au besoin, relance
    // la fenêtre principale pour appliquer un changement de langue.
    function openSettingsDialog() {
        var sw = new Window("dialog", tr("tab_settings2"));
        sw.orientation = "column"; sw.alignChildren = "fill";
        sw.margins = 16; sw.spacing = 12; sw.preferredSize.width = 500;

        // — Repère de calage personnalisé (fichier importé) —
        var pReg = sw.add("panel", undefined, tr("panel_regcustom"));
        pReg.orientation = "column"; pReg.alignChildren = "fill"; pReg.margins = 6; pReg.spacing = 6;
        var rRow = pReg.add("group");
        rRow.add("statictext", undefined, tr("lbl_regfile")).preferredSize.width = 175;
        var sRegPath = rRow.add("edittext", undefined, settings.regFile || ""); sRegPath.preferredSize.width = 140;
        var sRegBtn = rRow.add("button", undefined, tr("btn_browse")); sRegBtn.preferredSize.width = 80;
        var sRegClear = rRow.add("button", undefined, tr("btn_clear")); sRegClear.preferredSize.width = 64;
        var rDesc = pReg.add("statictext", undefined, tr("desc_regfile"), { multiline: true });
        rDesc.preferredSize = [450, 82]; iwItalic(rDesc);
        sRegBtn.onClick = function () {
            var f = File.openDialog(tr("dlg_pickreg"));
            if (f) sRegPath.text = f.fsName;
        };
        sRegClear.onClick = function () { sRegPath.text = ""; };
        // mémorisation de la mire entre les sessions
        var sRegRemember = pReg.add("checkbox", undefined, tr("cb_regremember"));
        sRegRemember.value = (settings.regFile && settings.regFile === iwLoadRegMark());

        // — Langue de l'interface —
        var pLg = sw.add("panel", undefined, tr("panel_lang"));
        pLg.orientation = "column"; pLg.alignChildren = "fill"; pLg.margins = 6; pLg.spacing = 6;
        var lRow = pLg.add("group"); lRow.orientation = "row"; lRow.alignChildren = "center";
        lRow.add("statictext", undefined, tr("lbl_lang")).preferredSize.width = 190;
        var sLangDd = lRow.add("dropdownlist", undefined, ["Français", "English", "Italiano"]);
        var curLangIdx = 0;
        for (var li = 0; li < LANG_CODES.length; li++) if (LANG_CODES[li] === IW.lang) curLangIdx = li;
        sLangDd.selection = curLangIdx;
        var lDesc = pLg.add("statictext", undefined, tr("desc_lang"), { multiline: true });
        lDesc.preferredSize = [450, 60]; iwItalic(lDesc);

        function sfield(parent, label, def, tip) {
            var g = parent.add("group"); g.orientation = "row"; g.alignChildren = "center";
            var lb = g.add("statictext", undefined, label); lb.preferredSize.width = 250;
            var e = g.add("edittext", undefined, def); e.preferredSize.width = 56;
            if (tip) { try { e.helpTip = tip; lb.helpTip = tip; } catch (eT) {} }
            return e;
        }

        // — PERSONNALISATION DE L'INTERFACE —
        var pUI = sw.add("panel", undefined, tr("panel_ui"));
        pUI.orientation = "column"; pUI.alignChildren = "left"; pUI.margins = 8; pUI.spacing = 4;
        var sPrevTransp = pUI.add("checkbox", undefined, tr("cb_prevtransp"));
        sPrevTransp.value = !!settings.previewTransparent;
        try { sPrevTransp.helpTip = tr("tip_prevtransp"); } catch (ePT) {}
        var sShowDims = pUI.add("checkbox", undefined, tr("cb_showdims"));
        sShowDims.value = !!settings.showDims;
        try { sShowDims.helpTip = tr("tip_showdims"); } catch (eSD) {}

        // — REPÈRES & COULEURS (avancé) —
        var pCustom = sw.add("panel", undefined, tr("panel_advanced"));
        pCustom.orientation = "column"; pCustom.alignChildren = "left"; pCustom.margins = 8; pCustom.spacing = 4;
        var sRegDiam = sfield(pCustom, tr("lbl_regdiam"), String(settings.regDiam), tr("tip_regdiam"));
        var sCrossGap   = sfield(pCustom, tr("lbl_crossgap"), String(settings.crossCornerGap), tr("tip_crossgap"));
        var sColSq      = sfield(pCustom, tr("lbl_colsq"), String(settings.colorSwatchSize));
        var sColBarW    = sfield(pCustom, tr("lbl_colbarw"), String(settings.colorBarW));
        var sColBarH    = sfield(pCustom, tr("lbl_colbarh"), String(settings.colorBarH));
        // — Affichage « Taille réelle » : calibrage visuel (carte bancaire) —
        var calPxPerMM = (settings.screenPPI || 96) / 25.4;
        var calRow = pCustom.add("group"); calRow.orientation = "row"; calRow.alignChildren = "center";
        calRow.add("statictext", undefined, tr("lbl_screenppi")).preferredSize.width = 185;
        var sCalibrate = calRow.add("button", undefined, tr("btn_calibrate")); sCalibrate.preferredSize = [150, 24];
        var sCalReadout = calRow.add("statictext", undefined, ""); sCalReadout.preferredSize.width = 90;
        function updCalReadout() { sCalReadout.text = Math.round(calPxPerMM * 25.4) + " PPP"; }
        updCalReadout();
        sCalibrate.onClick = function () {
            var r = iwCalibrateScreen(calPxPerMM);
            if (r && r > 0) { calPxPerMM = r; updCalReadout(); }
        };

        // — Boutons —
        var sBtns = sw.add("group"); sBtns.alignment = "right"; sBtns.spacing = IW_UI_GAP;
        var sCancelBtn = sBtns.add("button", undefined, tr("btn_cancel"), { name: "cancel" });
        sCancelBtn.preferredSize = [IW_UI_BTN_W, IW_UI_BTN_H];
        var sOkBtn = sBtns.add("button", undefined, "OK", { name: "ok" });
        sOkBtn.preferredSize = [IW_UI_BTN_W, IW_UI_BTN_H];

        if (sw.show() !== 1) return; // Annuler : rien n'est modifié

        // — Personnalisation -> settings + persistance durable (prefs) —
        function numOr(s, d) { var v = parseFloat(s); return (isFinite(v) && v > 0) ? v : d; }
        settings.previewTransparent = !!sPrevTransp.value;
        settings.showDims        = !!sShowDims.value;
        settings.regDiam         = iwRegDiam(numOr(sRegDiam.text, IW_REG_MAX_MM));
        settings.crossCornerGap  = numOr(sCrossGap.text, 6);
        settings.colorSwatchSize = numOr(sColSq.text, 12);
        settings.colorBarW       = numOr(sColBarW.text, 46);
        settings.colorBarH       = numOr(sColBarH.text, 11);
        settings.screenPPI       = calPxPerMM * 25.4;
        iwSavePrefs({
            previewTransparent: settings.previewTransparent, showDims: settings.showDims,
            regDiam: settings.regDiam, crossCornerGap: settings.crossCornerGap,
            colorSwatchSize: settings.colorSwatchSize,
            colorBarW: settings.colorBarW, colorBarH: settings.colorBarH,
            screenPPI: settings.screenPPI
        });

        // Applique la mire (état partagé lu par gatherConfig/aperçu)
        settings.regFile = sRegPath.text || "";
        // Mémorisation persistante (ou effacement de la mémorisation)
        if (sRegRemember.value) iwSaveRegMark(settings.regFile);
        else iwSaveRegMark("");

        // Changement de langue éventuel -> relance la fenêtre principale
        var newCode = LANG_CODES[sLangDd.selection ? sLangDd.selection.index : 0];
        if (newCode !== IW.lang) {
            iwSaveLang(newCode);
            IW.lang = newCode;
            pendingRelaunch = gatherConfig();   // capture l'état courant
            dlg.close(2);                       // 2 = relancer
            return;
        }
        refresh(); // simple mise à jour de l'aperçu (mire perso)
    }

    // ── Colonne droite : APERÇU, SUR TOUTE LA HAUTEUR ────────────────
    //  Troisième et dernière colonne du corps. Elle est déclarée ici, après
    //  les sections, mais ScriptUI place les enfants dans l'ordre des appels :
    //  elle arrive donc bien à droite de la liste et des réglages.
    //  `alignment` en « fill » vertical est ce qui la fait occuper toute la
    //  hauteur du corps plutôt que se centrer sur son contenu.
    var rightCol = bodyRow.add("group");
    rightCol.orientation = "column";
    rightCol.alignChildren = "fill";
    rightCol.alignment = ["fill", "fill"];
    rightCol.spacing = 6;
    rightCol.preferredSize = [IW_CANVAS_W + 24, IW_BODY_H];

    var prevPanel = rightCol.add("panel", undefined, tr("panel_preview"));
    prevPanel.orientation = "column";
    prevPanel.alignChildren = "fill";
    prevPanel.alignment = ["fill", "fill"];
    prevPanel.margins = 6; prevPanel.spacing = 4;

    // contexte (pièce source) AU-DESSUS du dessin
    var pieceInfo = prevPanel.add("statictext", undefined, "");
    pieceInfo.text = hasSel
        ? (tr("piece_src") + r2(piece.w) + " × " + r2(piece.h) + " mm")
        : tr("piece_none");
    iwItalic(pieceInfo);

    // Canvas dessinable : un panel dont on surcharge onDraw. (ScriptUI ne
    // possède pas de type "canvas" ; onDraw sur un panel est la méthode fiable.)
    var canvas = prevPanel.add("panel", undefined, undefined);
    canvas.preferredSize = [IW_CANVAS_W, IW_CANVAS_H];
    // c'est le canvas qui absorbe la hauteur restante de la colonne : sans
    // cet alignement, il garderait sa taille voulue et laisserait un vide
    // sous lui quand la fenêtre est plus haute que prévu.
    canvas.alignment = ["fill", "fill"];

    // — Décalage de PAN (déplacement de la vue), en pixels écran —
    var previewPan = { x: 0, y: 0 };
    var panDrag = { active: false, sx: 0, sy: 0, ox: 0, oy: 0 };
    try { canvas.helpTip = tr("tip_previewpan"); } catch (eCt) {}
    // glisser à la souris dans l'aperçu pour déplacer la vue (utile en zoom)
    try {
        canvas.addEventListener("mousedown", function (ev) {
            // V2 — coordonnées lues défensivement : ce gestionnaire était le
            //  seul du fichier à se fier à clientX/clientY, absents sur
            //  certaines versions d'InDesign (le déplacement ne partait alors
            //  jamais, ou partait depuis NaN).
            var p = iwEvXY(ev); if (!p) return;
            panDrag.active = true;
            panDrag.sx = p.x; panDrag.sy = p.y;
            panDrag.ox = previewPan.x; panDrag.oy = previewPan.y;
        });
        canvas.addEventListener("mousemove", function (ev) {
            if (!panDrag.active) return;
            var p = iwEvXY(ev); if (!p) return;
            previewPan.x = panDrag.ox + (p.x - panDrag.sx);
            previewPan.y = panDrag.oy + (p.y - panDrag.sy);
            refresh();
        });
        canvas.addEventListener("mouseup", function () { panDrag.active = false; });
        // si le curseur sort du canvas en glissant, on arrête proprement
        canvas.addEventListener("mouseout", function () { panDrag.active = false; });
        // V2 — ZOOM À LA MOLETTE. La molette n'était câblée que sur la liste des
        //  presets ; dans l'aperçu — le seul endroit où l'on zoome vraiment —
        //  elle ne faisait rien, il fallait viser le curseur ou les boutons.
        canvas.addEventListener("mousewheel", function (ev) {
            var d = iwEvWheel(ev);
            if (d === 0) return;
            var cur = previewZoom * 100;
            var step = (cur < 100) ? 10 : (cur < 400 ? 25 : 100);
            applyZoom(cur + (d > 0 ? step : -step));
        });
    } catch (ePan) {}

    // — Contrôle de ZOOM de l'aperçu (1 = ajusté à la fenêtre) —
    //  V2 — la plage du curseur (50–400 %) ne correspondait pas à celle que
    //  applyZoom accepte (10–2000 %) : passé 400 %, le curseur restait collé en
    //  bout de course alors que le zoom continuait, et le tirer ensuite faisait
    //  brutalement retomber la vue à 400 %. Les deux plages sont désormais les
    //  mêmes, et l'échelle du curseur est LOGARITHMIQUE pour rester utilisable
    //  (un pas linéaire de 10 à 2000 rendait la zone 50–200 % intouchable).
    var IW_ZOOM_MIN = 10, IW_ZOOM_MAX = 2000;
    var previewZoom = 1;
    var zoomSliderBusy = false;   // évite la boucle curseur -> applyZoom -> curseur
    function zoomToSlider(pct) {
        var lo = Math.log(IW_ZOOM_MIN), hi = Math.log(IW_ZOOM_MAX);
        var v = (Math.log(pct) - lo) / (hi - lo) * 1000;
        return Math.max(0, Math.min(1000, v));
    }
    function sliderToZoom(v) {
        var lo = Math.log(IW_ZOOM_MIN), hi = Math.log(IW_ZOOM_MAX);
        return Math.exp(lo + (v / 1000) * (hi - lo));
    }
    // ── V2 — UNE SEULE LIGNE DE ZOOM, SOUS LE DESSIN ────────────────────
    //  Le zoom occupait DEUX rangées (curseur, puis boutons d'ajustement) :
    //  autant de hauteur en moins pour la feuille, qui est l'objet même de ce
    //  panneau. Tout tient désormais sur une ligne, et le curseur y prend
    //  l'espace restant (alignment « fill » horizontal) plutôt qu'une largeur
    //  fixe : il s'allonge donc avec la fenêtre au lieu de laisser un vide.
    //  Largeurs ADAPTATIVES : sept contrôles sur une ligne demandent 500 px à
    //  pleine taille, alors que l'aperçu peut descendre à 360 px sur un petit
    //  écran — la rangée déborderait et élargirait la fenêtre au-delà de
    //  l'écran. En dessous de 560 px de dessin, on passe donc à des largeurs
    //  resserrées ; les infobulles portent le sens si un libellé se serre.
    var _zWide = (IW_CANVAS_W >= 560);
    var ZW_FIT  = _zWide ? 74 : 54;
    var ZW_REAL = _zWide ? 104 : 74;
    var ZW_RECT = _zWide ? 82 : 62;
    var ZW_PCT  = _zWide ? 44 : 38;

    var zoomGrp = prevPanel.add("group");
    zoomGrp.orientation = "row"; zoomGrp.alignChildren = "center"; zoomGrp.spacing = 4;
    var zoomMinus = zoomGrp.add("button", undefined, "−"); zoomMinus.preferredSize = [26, 21];
    // taille VOULUE volontairement petite : c'est « fill » qui donne au
    // curseur toute la largeur restante, une fois les boutons servis.
    var zoomSlider = zoomGrp.add("slider", undefined, zoomToSlider(100), 0, 1000);
    zoomSlider.preferredSize = [50, 20];
    zoomSlider.alignment = ["fill", "center"];
    var zoomPlus = zoomGrp.add("button", undefined, "+"); zoomPlus.preferredSize = [26, 21];
    var zoomPct = zoomGrp.add("statictext", undefined, "100%"); zoomPct.preferredSize.width = ZW_PCT;
    var zoomFit  = zoomGrp.add("button", undefined, tr("btn_zoomfit"));  zoomFit.preferredSize  = [ZW_FIT, 21];
    var zoomReal = zoomGrp.add("button", undefined, tr("btn_zoomreal")); zoomReal.preferredSize = [ZW_REAL, 21];
    try { zoomReal.helpTip = tr("tip_zoomreal"); } catch (eZR) {}
    // V2 — RECENTRER : le déplacement de la vue ne pouvait être annulé que par
    //  « Ajuster », qui remettait aussi le zoom à 100 % — on perdait donc son
    //  grossissement pour simplement se recentrer.
    var zoomRecenter = zoomGrp.add("button", undefined, tr("btn_recenter"));
    zoomRecenter.preferredSize = [ZW_RECT, 21];
    try { zoomRecenter.helpTip = tr("tip_recenter"); } catch (eRc) {}
    zoomRecenter.onClick = function () { previewPan.x = 0; previewPan.y = 0; refresh(); };

    function applyZoom(pct) {
        // plage large (la taille réelle d'une grande feuille peut dépasser 400 %)
        if (pct < IW_ZOOM_MIN) pct = IW_ZOOM_MIN;
        if (pct > IW_ZOOM_MAX) pct = IW_ZOOM_MAX;
        previewZoom = pct / 100;
        // V2 — le curseur suit désormais TOUTE la plage (échelle log).
        if (!zoomSliderBusy) { try { zoomSlider.value = zoomToSlider(pct); } catch (eZs) {} }
        zoomPct.text = Math.round(pct) + "%";
        refresh();
    }
    zoomSlider.onChanging = function () {
        zoomSliderBusy = true;
        try { applyZoom(sliderToZoom(zoomSlider.value)); } catch (eZc) {}
        zoomSliderBusy = false;
    };
    zoomMinus.onClick = function () { applyZoom((previewZoom * 100) - 25); };
    zoomPlus.onClick  = function () { applyZoom((previewZoom * 100) + 25); };
    zoomFit.onClick   = function () { previewPan.x = 0; previewPan.y = 0; applyZoom(100); };
    // — TAILLE RÉELLE : zoom tel que 1 mm document = 1 mm physique à l'écran —
    zoomReal.onClick = function () {
        var ctx = currentZoneAndPage();
        var pw = ctx.pageWH;
        if (!pw || pw.w <= 0 || pw.h <= 0) return;
        var csz = canvas.size || canvas.preferredSize || [IW_CANVAS_W, IW_CANVAS_H];
        var Wc = csz[0], Hc = csz[1];
        var pad = 26;   // même marge interne que iwDrawPreview
        var fitScale = Math.min((Wc - pad * 2) / pw.w, (Hc - pad * 2) / pw.h); // px/mm à zoom 100 %
        if (!isFinite(fitScale) || fitScale <= 0) return;
        var ppmm = (settings.screenPPI || 96) / 25.4;   // px/mm physiques de l'écran
        var zf = ppmm / fitScale;                        // facteur pour atteindre la taille réelle
        previewPan.x = 0; previewPan.y = 0;
        applyZoom(zf * 100);
    };

    // ── V2 — LE PANNEAU « RÉSUMÉ » EST SUPPRIMÉ ─────────────────────────
    //  Il occupait un bloc de 46 px sous l'aperçu, autant de hauteur en moins
    //  pour la feuille. Son contenu n'est pas perdu pour autant : la BARRE
    //  D'ÉTAT, en bas de fenêtre, s'étend désormais sur toute la largeur et le
    //  reprend intégralement (mode, copies, grille, espacement, encombrement,
    //  fond perdu). Une seule ligne, un seul endroit où regarder.
    //  `iwSummaryLine` porte ce texte entre refresh() et updateStatus().
    var iwSummaryLine = "";

    // ── Calcul zone/page pour l'aperçu (page cible courante) ─────────
    function currentZoneAndPage() {
        var pn = parseInt(pgIn.text, 10);
        if (isNaN(pn) || pn < 1 || pn > doc.pages.length) pn = doc.pages.length;
        var pg = doc.pages[pn - 1];
        var pgB = pg.bounds, mp = pg.marginPreferences;
        var zone = {
            top: pgB[0] + mp.top, left: pgB[1] + mp.left,
            w: (pgB[3] - mp.right) - (pgB[1] + mp.left),
            h: (pgB[2] - mp.bottom) - (pgB[0] + mp.top)
        };
        var pageWH = { w: pgB[3] - pgB[1], h: pgB[2] - pgB[0] };
        // l'origine de l'aperçu est relative à la page : on translate zone
        var zoneRel = { top: zone.top - pgB[0], left: zone.left - pgB[1], w: zone.w, h: zone.h };
        return { zone: zoneRel, zoneAbs: zone, pageWH: pageWH, pageBounds: pgB };
    }

    // Descriptions de mode
    var MODE_DESCS = [
        tr("desc_mode_nup"), tr("desc_mode_steprep"), tr("desc_mode_cutstack"),
        tr("desc_mode_booklet"), tr("desc_mode_dutchcut"), tr("desc_mode_shuffle"),
        tr("desc_mode_riso"), tr("desc_mode_seri"), tr("desc_mode_patch")
    ];

    // ── Rafraîchissement de l'aperçu + résumé ────────────────────────
    function wmFromUI() {
        // V10 — si l'interrupteur est éteint, le blanc tournant est nul
        // (aucune marge interne) : l'aperçu ET l'export l'ignorent.
        if (!wmEnable.value) {
            return { top: 0, bottom: 0, left: 0, right: 0, colorName: "", colorRGB: null, enabled: false, outside: false };
        }
        var cn = "";
        try { if (wmColorDd.selection && wmColorDd.selection.index > 0) cn = IW_SWATCH_NAMES[wmColorDd.selection.index - 1] || ""; } catch (eWf) {}
        return {
            top:    parseFloat(wmTop.text)    || 0,
            bottom: parseFloat(wmBottom.text) || 0,
            left:   parseFloat(wmLeft.text)   || 0,
            right:  parseFloat(wmRight.text)  || 0,
            colorName: cn,
            colorRGB: cn ? iwSwatchRGB(doc, cn) : null,
            enabled: true,
            // V20 — position : true = marge AJOUTÉE autour (extérieur)
            outside: !!(wmIoDd.selection && wmIoDd.selection.index === 1)
        };
    }
    function colorEdgeFromUI() {
        return (colorEdgeDd.selection && colorEdgeDd.selection.index === 1) ? "long" : "short";
    }
    function colorNameSideFromUI() {
        var idx = (colorNameDd.selection) ? colorNameDd.selection.index : 0;
        return IW_CNS_KEYS[idx] || "auto";
    }
    function gatherMarks() {
        return {
            crop: mkCrop.value, trim: mkTrim.value, reg: mkReg.value,
            bar: mkBar.value, ang: mkAng.value, pageCenter: mkPageCtr.value,
            pageFrame: mkPageFrame.value,
            pageCross: mkPageCross.value,
            sideCross: mkSideCross.value, sideStep: parseFloat(mkSideStep.text) || 40,
            colorMarks: mkColorMarks.value,
            colorEdge: colorEdgeFromUI(),
            colorNameSide: colorNameSideFromUI(),
            wm: wmFromUI(),
            // V20 — couleur du fond perdu généré (pour teinter la bande dans
            //   l'aperçu). "auto" tente de lire la couleur de fond de la pièce.
            bleedColorRGB: (function () {
                var i = bleedColDd.selection ? bleedColDd.selection.index : 0;
                // V1 — 0 = visuel étiré : bande en BLEU CLAIR générique
                //   (l'étirement n'est pas simulé dans l'aperçu).
                if (i === 0) return null;
                if (i === 2) return null;                    // Aucune
                if (i >= 3) {                                 // nuance choisie
                    try { return iwSwatchRGB(doc, IW_BLEED_SWATCHES[i - 3]); } catch (eBC1) { return null; }
                }
                // Auto plat (i === 1) : couleur de fond de la 1re pièce sélectionnée
                try {
                    var fc = selItems && selItems[0] ? selItems[0].fillColor : null;
                    if (fc && fc.isValid && fc.name && fc.name !== "None")
                        return iwSwatchRGB(doc, fc.name);
                } catch (eBC2) {}
                return null;                                  // repli : bleu clair générique
            })(),
            // valeurs numériques réelles (mm/pt) pour que l'aperçu réagisse
            len: parseFloat(mLenIn.text) || 0,
            gap: parseFloat(mGapIn.text) || 0,
            weight: parseFloat(mWIn.text) || 0.25,
            // V2 — même source que le moteur (edgeBleedMM) : la bande de fond
            //   perdu ne se dessine que si « Bord de la pièce » est sur Fond
            //   perdu. Lire bleedIn directement ferait diverger l'aperçu de la
            //   sortie dès que l'utilisateur bascule sur Blanc tournant / Aucun,
            //   puisque la valeur tapée reste désormais dans son champ.
            bleed: parseFloat(edgeBleedMM()) || 0,
            txt: mkTxt.text || "",
            regFile: settings.regFile || "",
            // personnalisation (pour que l'aperçu reflète les réglages durables)
            regDiam: settings.regDiam,
            crossCornerGap: settings.crossCornerGap,
            colorSwatchSize: settings.colorSwatchSize, colorBarW: settings.colorBarW,
            colorBarH: settings.colorBarH,
            showDims: settings.showDims, previewTransparent: settings.previewTransparent
        };
    }
    function refresh() {
        // description du mode
        var mi = (modeDd.selection ? modeDd.selection.index : 0);
        modeDesc.text = MODE_DESCS[mi] || "";

        var cfg = gatherConfig();
        var ctx = currentZoneAndPage();
        var ep = effectivePiece();
        var L = iwComputeLayout(cfg, ep, ctx.zone);
        iwSummaryLine = iwLayoutSummary(L, cfg);   // repris par la barre d'état

        // info pièce : taille effective (après rotation éventuelle) + angle
        if (hasSel) {
            var pinfo = tr("piece_src") + r2(ep.w) + " × " + r2(ep.h) + " mm";
            if (origRotation) pinfo += tr("piece_rotated") + origRotation + "°)";
            pieceInfo.text = pinfo;
        }

        // grille calculée (lecture seule) + synchro des champs internes
        if (cfg.mode === 3) {
            gridRead.text = tr("grid_booklet");
        } else if (L.ok) {
            var gr = tr("grid_calc_label") + L.cols + " × " + L.rows +
                     "  (" + L.count + tr("grid_pieces");
            if (L.fitScale && Math.abs(L.fitScale - 1) > 0.001) {
                gr += tr("grid_scale") + Math.round(L.fitScale * 100) + "%";
            }
            gridRead.text = gr;
        } else {
            gridRead.text = tr("grid_nofit");
        }
        colsIn.text = String(L.cols); rowsIn.text = String(L.rows);
        // (la couleur de l'état est posée par updateStatus, sur la barre d'état)
        // V2 — états conditionnels regroupés : un seul endroit décide de ce qui
        //  est grisé, appelé à chaque rafraîchissement (donc aussi après le
        //  chargement d'un preset, qui les laissait tous actifs).
        try { modeOptsState(mi); } catch (eS1) {}
        try { sideCrossState(); } catch (eS2) {}
        try { colorMarksState(); } catch (eS3) {}
        try { duplexState(); } catch (eS4) {}
        try { updateStatus(L); } catch (eS5) {}
        // forçage du redraw. Selon les versions d'InDesign, ni l'appel
        // direct ni notify ne suffisent seuls ; on combine les deux et,
        // en dernier recours, un cycle hide/show qui force un repaint propre.
        var drawn = false;
        try { canvas.onDraw(); drawn = true; } catch (e) {}
        try { canvas.notify("onDraw"); } catch (e2) {}
        if (!drawn) { try { canvas.hide(); canvas.show(); } catch (e3) {} }
    }

    // ── V2 — BARRE D'ÉTAT ───────────────────────────────────────────────
    //  Il n'existait aucun endroit disant si la planche était réalisable :
    //  l'absence de sélection n'apparaissait qu'en italique gris au-dessus de
    //  l'aperçu, et une grille qui ne rentre pas ne se voyait qu'à la couleur
    //  du résumé. On pouvait donc tout régler, cliquer « Lancer », et recevoir
    //  une alerte. La barre dit l'état en une ligne, et « Lancer » se désactive.
    //  `statusBar` et `okBtn` sont créés plus bas (barre de boutons) : les
    //  appels passent par try/catch tant qu'ils n'existent pas encore.
    var IW_MODE_NOTE = "";   // ce qu'un changement de mode vient d'ajuster
    function updateStatus(L) {
        var msg, col, runnable;
        if (!hasSel) {
            msg = tr("status_nosel");
            col = [0.90, 0.55, 0.20, 1];
            runnable = false;
        } else if (!L || !L.ok) {
            msg = tr("status_nofit");
            col = [0.90, 0.45, 0.40, 1];
            runnable = false;
        } else {
            // V2 — la barre reprend le RÉSUMÉ de l'ancien panneau supprimé :
            //   mode, copies, grille, espacement, encombrement, fond perdu.
            //   Elle s'étend sur toute la largeur de la fenêtre, elle a donc
            //   la place que le panneau n'avait pas.
            msg = iwSummaryLine || tr("status_ready", { N: L.count, C: L.cols, R: L.rows });
            if (IW_MODE_NOTE) msg += "   ·   " + IW_MODE_NOTE;
            col = IW_UI_DARK ? [0.55, 0.80, 0.58, 1] : [0.15, 0.50, 0.25, 1];
            runnable = true;
        }
        try { statusBar.text = msg; } catch (eSb) {}
        try {
            statusBar.graphics.foregroundColor = statusBar.graphics.newPen(
                statusBar.graphics.PenType.SOLID_COLOR, col, 1);
        } catch (eSc2) {}
        try { okBtn.enabled = runnable; } catch (eSo) {}
    }

    // Pièce effective selon l'angle de rotation des copies : à 90°/270°,
    // largeur et hauteur sont échangées (la copie sera tournée d'un quart).
    function effectivePiece() {
        if (origRotation === 90 || origRotation === 270) {
            return { w: piece.h, h: piece.w };
        }
        return { w: piece.w, h: piece.h };
    }

    canvas.onDraw = function () {
        var cfg = gatherConfig();
        var ctx = currentZoneAndPage();
        var L = iwComputeLayout(cfg, effectivePiece(), ctx.zone);
        iwDrawPreview(this, L, ctx.zone, ctx.pageWH, gatherMarks(), previewZoom, previewPan);
    };

    // ── Collecte config (lecture défensive des dropdowns) ────────────
    function ddIndex(dd) { return (dd && dd.selection) ? dd.selection.index : 0; }
    function gatherConfig() {
        var _ctx = currentZoneAndPage();
        return {
            // V2 — le type de document est enregistré dans le preset. Un preset
            //   d'AVANT la V2 n'a pas ce champ : il est alors rechargé en
            //   « Personnalisé », le seul type qui n'impose aucun mode — son
            //   mode d'imposition d'origine est ainsi préservé tel quel.
            docType: docTypeIndex(),
            mode: ddIndex(modeDd),
            cols: colsIn.text, rows: rowsIn.text, page: pgIn.text,
            align: currentAlign,
            auto: autoCb.value, count: countIn.text, fit: fitCb.value,
            flipAlt: flipAltCb.value, origRotation: origRotation,
            pageW: _ctx.pageWH.w, pageH: _ctx.pageWH.h,
            pageCenterX: _ctx.pageWH.w / 2, pageCenterY: _ctx.pageWH.h / 2,
            shuffle: shufIn.text, bkPages: bkPages.text, bkCreep: bkCreep.text,
            asmOn: (ddIndex(modeDd) === 8), asmCols: iwPatchworkCols(), asmCount: selItems.length,
            gapH: gapHIn.text, gapV: gapVIn.text,
            // V2 — le fond perdu appliqué découle du choix « Bord de la pièce » :
            //   il ne vaut que si ce mode est sélectionné. La valeur TAPÉE reste
            //   dans son champ (et dans le preset), elle n'est simplement pas
            //   appliquée dans les deux autres modes — au lieu d'être écrasée
            //   par « 0 » comme le faisait la V1.
            bleed: edgeBleedMM(),
            // V20 — position Intérieur(0)/Extérieur(1) du fond perdu et du blanc tournant
            bleedOutside: (bleedIoDd.selection && bleedIoDd.selection.index === 1),
            wmOutside: (wmIoDd.selection && wmIoDd.selection.index === 1),
            // V1 — couleur du fond perdu généré (extérieur) :
            //   "mirror" (adapté au visuel, bords en miroir) | "auto" (plat) |
            //   "none" | nom de nuance
            bleedColorMode: (function () {
                var i = bleedColDd.selection ? bleedColDd.selection.index : 0;
                if (i === 0) return "mirror";
                if (i === 1) return "auto";
                if (i === 2) return "none";
                return IW_BLEED_SWATCHES[i - 3] || "none";
            })(),
            autoCenter: autoCenterCb.value,
            whiteMargin: wmFromUI(), whiteMarginLink: wmLink.value,
            whiteMarginOn: wmEnable.value,
            marks: { crop: mkCrop.value, trim: mkTrim.value, reg: mkReg.value,
                     bar: mkBar.value, ang: mkAng.value, pageCenter: mkPageCtr.value,
                     pageFrame: mkPageFrame.value,
                     pageCross: mkPageCross.value,
                     sideCross: mkSideCross.value, sideStep: mkSideStep.text,
                     colorMarks: mkColorMarks.value, colorEdge: colorEdgeFromUI(),
                     colorNameSide: colorNameSideFromUI(),
                     txt: mkTxt.text,
                     gr: mkGrPath.text, regFile: settings.regFile,
                     len: mLenIn.text, gap: mGapIn.text, w: mWIn.text },
            duplex: { on: dupCb.value, flip: ddIndex(flipDd), backPg: backPgIn.text },
            pre: { reorder: ppReorderIn.text, clone: ppCloneIn.text,
                   del: ppDelIn.text, dupPg: ppDupPg.text, dupN: ppDupN.text }
        };
    }
    function applyConfig(cfg) {
        if (!cfg) return;
        modeDd.selection = cfg.mode || 0;
        colsIn.text = cfg.cols; rowsIn.text = cfg.rows; pgIn.text = cfg.page;
        // V2 — la page cible est une LISTE : on la resynchronise sur la valeur
        //  du preset, en la bornant aux pages qui existent dans CE document
        //  (un preset enregistré sur un document de 8 pages pouvait demander la
        //  page 8 sur un document qui n'en a que 2).
        try {
            var _pn = parseInt(cfg.page, 10);
            if (isNaN(_pn) || _pn < 1) _pn = doc.pages.length;
            if (_pn > doc.pages.length) _pn = doc.pages.length;
            pgIn.text = String(_pn);
            pgDd.selection = _pn - 1;
        } catch (ePs) {}
        if (cfg.align) { currentAlign = cfg.align; refreshAlignButtons(); }
        if (cfg.auto != null) { autoCb.value = !!cfg.auto; countIn.enabled = !autoCb.value; }
        if (cfg.count != null) countIn.text = String(cfg.count);
        if (cfg.fit != null) fitCb.value = !!cfg.fit;
        if (cfg.flipAlt != null) flipAltCb.value = !!cfg.flipAlt;
        shufIn.text = cfg.shuffle || ""; bkPages.text = cfg.bkPages; bkCreep.text = cfg.bkCreep;
        gapHIn.text = cfg.gapH; gapVIn.text = cfg.gapV; bleedIn.text = cfg.bleed;
        autoCenterCb.value = !!cfg.autoCenter;
        if (cfg.whiteMarginLink != null) wmLink.value = !!cfg.whiteMarginLink;
        // V10 — restaure l'interrupteur d'activation. Rétrocompat : si le flag
        // est absent (ancien preset), on l'active dès qu'une marge non nulle
        // est présente, sinon on laisse désactivé.
        if (cfg.whiteMarginOn != null) {
            wmEnable.value = !!cfg.whiteMarginOn;
        } else if (cfg.whiteMargin) {
            var _wmAny = (parseFloat(cfg.whiteMargin.top) || 0) + (parseFloat(cfg.whiteMargin.bottom) || 0)
                       + (parseFloat(cfg.whiteMargin.left) || 0) + (parseFloat(cfg.whiteMargin.right) || 0);
            wmEnable.value = (_wmAny > 0);
        } else {
            wmEnable.value = false;
        }
        if (cfg.whiteMargin) {
            var _wm = cfg.whiteMargin;
            wmTop.text    = String(_wm.top    != null ? _wm.top    : 0);
            wmBottom.text = String(_wm.bottom != null ? _wm.bottom : 0);
            wmLeft.text   = String(_wm.left   != null ? _wm.left   : 0);
            wmRight.text  = String(_wm.right  != null ? _wm.right  : 0);
            try {
                var _cnIdx = 0;
                if (_wm.colorName) {
                    for (var _si = 0; _si < IW_SWATCH_NAMES.length; _si++) if (IW_SWATCH_NAMES[_si] === _wm.colorName) _cnIdx = _si + 1;
                }
                wmColorDd.selection = _cnIdx;
            } catch (eWcr) {}
        }
        // V2 — le sélecteur « Bord de la pièce » est reconstruit à partir de la
        //  config chargée : blanc tournant actif -> « Blanc tournant » ; sinon
        //  fond perdu non nul -> « Fond perdu » ; sinon « Aucun ». Les presets
        //  d'avant la V2 n'ont pas ce réglage, il est donc DÉDUIT — ce qui donne
        //  exactement l'état que l'ancienne exclusion produisait.
        try {
            var _bl = parseFloat(cfg.bleed) || 0;
            if (wmEnable.value)      { edgeWm.value = true; }
            else if (_bl > 0)        { edgeBleed.value = true; IW_BLEED_LAST = String(cfg.bleed); }
            else                     { edgeNone.value = true; }
            applyEdgeMode();
        } catch (eEm2) { try { wmEnableState(); } catch (eWMe) {} }
        if (cfg.marks) {
            mkCrop.value = cfg.marks.crop; mkTrim.value = cfg.marks.trim; mkReg.value = cfg.marks.reg;
            mkBar.value = cfg.marks.bar; mkAng.value = cfg.marks.ang;
            mkPageCtr.value = !!cfg.marks.pageCenter;
            if (cfg.marks.pageFrame != null) mkPageFrame.value = !!cfg.marks.pageFrame;
            if (cfg.marks.pageCross != null) mkPageCross.value = !!cfg.marks.pageCross;
            if (cfg.marks.sideCross != null) mkSideCross.value = !!cfg.marks.sideCross;
            if (cfg.marks.sideStep != null) mkSideStep.text = String(cfg.marks.sideStep);
            if (cfg.marks.colorMarks != null) mkColorMarks.value = !!cfg.marks.colorMarks;
            if (cfg.marks.colorEdge != null) colorEdgeDd.selection = (cfg.marks.colorEdge === "long") ? 1 : 0;
            if (cfg.marks.colorNameSide != null) {
                var _cnsIdx = 0;
                for (var _ci = 0; _ci < IW_CNS_KEYS.length; _ci++) if (IW_CNS_KEYS[_ci] === cfg.marks.colorNameSide) _cnsIdx = _ci;
                colorNameDd.selection = _cnsIdx;
            }
            mkTxt.text = cfg.marks.txt || "";
            mkGrPath.text = cfg.marks.gr || ""; mLenIn.text = cfg.marks.len; mGapIn.text = cfg.marks.gap; mWIn.text = cfg.marks.w;
            if (cfg.marks.regFile != null) settings.regFile = cfg.marks.regFile || "";
        }
        if (cfg.duplex) { dupCb.value = cfg.duplex.on; flipDd.selection = cfg.duplex.flip || 0; backPgIn.text = cfg.duplex.backPg || ""; }
        if (cfg.pre) { ppReorderIn.text = cfg.pre.reorder || ""; ppCloneIn.text = cfg.pre.clone || "1";
                       ppDelIn.text = cfg.pre.del || ""; ppDupPg.text = cfg.pre.dupPg || ""; ppDupN.text = cfg.pre.dupN || "1"; }
        // V2 — TYPE DE DOCUMENT, appliqué EN DERNIER pour que sa règle de
        //   visibilité s'applique à l'état complet du preset. `false` : on ne
        //   repose PAS les valeurs de départ du type, ce sont celles du preset
        //   qui font foi. Un preset sans docType retombe sur « Personnalisé »
        //   (dernier index), qui n'impose aucun mode et ne masque rien : son
        //   mode d'imposition d'origine est donc conservé intact.
        try {
            var _dt = (cfg.docType != null) ? parseInt(cfg.docType, 10) : (IW_DOCTYPES.length - 1);
            if (isNaN(_dt) || _dt < 0 || _dt >= IW_DOCTYPES.length) _dt = IW_DOCTYPES.length - 1;
            docTypeDd.selection = _dt;
            applyDocType(_dt, false);
        } catch (eDt2) {}
        refresh();
    }

    // ── Hooks live : tout contrôle qui change rafraîchit l'aperçu ────
    //  V2 — `pgIn` n'est plus un champ de saisie (c'est la liste `pgDd` qui
    //  rafraîchit) et `bleedIn` a ses propres gestionnaires, posés plus haut
    //  par le sélecteur « Bord de la pièce » : les inscrire ici les écraserait.
    var liveText = [shufIn, bkPages, bkCreep,
                    gapHIn, gapVIn, mLenIn, mGapIn, mWIn, mkSideStep];
    for (var t = 0; t < liveText.length; t++) {
        liveText[t].onChanging = refresh;
        liveText[t].onChange = refresh;
    }
    var liveCheck = [mkCrop, mkTrim, mkReg, mkBar, mkAng, mkPageCtr, mkPageFrame, mkPageCross,
                     mkSideCross, mkColorMarks, dupCb];
    for (var u = 0; u < liveCheck.length; u++) liveCheck[u].onClick = refresh;
    // V2 — NORMALISATION des champs numériques, posée APRÈS les hooks live
    //  (numField enveloppe le onChange existant, il doit donc être le dernier
    //  à s'installer). Bornes : ni négatif, ni absurde.
    numField(gapHIn, 0, 2000); numField(gapVIn, 0, 2000);
    numField(bleedIn, 0, 100);
    numField(mLenIn, 0, 200); numField(mGapIn, 0, 200); numField(mWIn, 0, 20);
    numField(mkSideStep, 1, 2000);
    numField(wmTop, 0, 500); numField(wmBottom, 0, 500);
    numField(wmLeft, 0, 500); numField(wmRight, 0, 500);
    numField(bkPages, 0, 9999); numField(bkCreep, 0, 100);
    numField(countIn, 1, 9999); numField(ppCloneIn, 1, 999); numField(ppDupN, 1, 999);

    // Présélections métier : aligne l'UI sur ce que produira le mode choisi.
    // Extrait dans une fonction pour pouvoir l'appeler aussi à l'ouverture
    // (la sélection programmatique de modeDd ne déclenche PAS onChange).
    //  V2 — ces présélections écrasaient des réglages saisis à la main SANS
    //  RIEN DIRE : passer en Riso remplaçait l'épaisseur de trait, passer en
    //  Patchwork remettait l'espacement à zéro et décochait les repères de
    //  coupe. On récapitule maintenant ce qui a été ajusté dans la barre
    //  d'état, pour que le changement soit au moins visible.
    function applyModePreselect(mi) {
        var changed = [];
        if (mi === 6) {            // Riso : bas-centre + trait fin
            if (currentAlign !== "BC") { currentAlign = "BC"; changed.push(tr("adj_align")); }
            refreshAlignButtons();
            if (parseFloat(mWIn.text) >= 0.25) { mWIn.text = "0.1"; changed.push(tr("adj_stroke")); }
        } else if (mi === 7) {     // Sérigraphie : centré + trait large
            if (currentAlign !== "CC") { currentAlign = "CC"; changed.push(tr("adj_align")); }
            refreshAlignButtons();
            if (parseFloat(mWIn.text) < 0.6) { mWIn.text = "1"; changed.push(tr("adj_stroke")); }
        } else if (mi === 8) {     // Patchwork : grille centrée EN BAS, jointif
            if (currentAlign !== "BC") { currentAlign = "BC"; changed.push(tr("adj_align")); }
            refreshAlignButtons();
            // espacement FORCÉ à 0 (raccord parfait) : on remet les champs à 0.
            if ((parseFloat(gapHIn.text) || 0) !== 0 || (parseFloat(gapVIn.text) || 0) !== 0) {
                gapHIn.text = "0"; gapVIn.text = "0"; changed.push(tr("adj_gap"));
            }
            // image CONTINUE : pas de repères de coupe par pièce (sinon des croix
            // découperaient la mosaïque). L'utilisateur peut les réactiver.
            if (mkCrop.value || mkTrim.value) {
                mkCrop.value = false; mkTrim.value = false; changed.push(tr("adj_marks"));
            }
        }
        IW_MODE_NOTE = "";
        if (changed.length) {
            var mname = "";
            try { mname = MODE_DESCS[mi] ? (modeDd.items[mi].text || "") : ""; } catch (eMn) {}
            IW_MODE_NOTE = tr("status_modeadj", { M: mname, W: changed.join(", ") });
        }
    }
    modeDd.onChange = function () {
        applyModePreselect(ddIndex(modeDd));
        refresh();
    };
    flipDd.onChange = refresh;

    // ═══════════════════════════════════════════════════════════════════
    //  V2 — TYPES DE DOCUMENT
    //
    //  Une table, six entrées. Chacune dit trois choses :
    //    mode     — l'imposition à utiliser (l'utilisateur ne la choisit plus)
    //    hide     — les panneaux à MASQUER, parce qu'ils ne veulent rien dire
    //               pour ce type de document
    //    setup()  — les valeurs de départ du type
    //
    //  « Personnalisé » ne masque rien et rend le sélecteur de mode visible :
    //  aucun réglage n'est devenu inatteignable, il est seulement rangé
    //  derrière le seul type qui en a besoin.
    // ═══════════════════════════════════════════════════════════════════

    // Raccourcis d'écriture des valeurs de départ.
    //  setNum écrit un champ ET met à jour son « dernière valeur correcte » :
    //  sans cela, numField ferait revenir une saisie invalide à la valeur
    //  d'installation du champ, et non à celle que le type vient de poser.
    function setNum(ctrl, v) {
        try { ctrl.text = String(v); ctrl.iwLastGood = String(v); } catch (eSn) {}
    }
    function dtEdge(kind, mm) {
        // kind : "bleed" | "wm" | "none"
        if (kind === "bleed") { setNum(bleedIn, mm); edgeBleed.value = true; IW_BLEED_LAST = String(mm); }
        else if (kind === "wm") { edgeWm.value = true; }
        else { edgeNone.value = true; }
        applyEdgeMode();
    }
    function dtGaps(h, v) { setNum(gapHIn, h); setNum(gapVIn, v); }
    function dtMarks(o) {
        mkCrop.value = !!o.crop; mkTrim.value = !!o.trim; mkReg.value = !!o.reg;
        mkBar.value = !!o.bar;   mkAng.value  = !!o.ang;
        mkPageCtr.value = !!o.pageCenter; mkPageFrame.value = !!o.pageFrame;
        mkPageCross.value = !!o.pageCross; mkSideCross.value = !!o.sideCross;
        mkColorMarks.value = !!o.colorMarks;
    }
    function dtRepeat(auto, count) {
        autoCb.value = !!auto; countIn.enabled = !auto;
        if (count != null) setNum(countIn, count);
        fitCb.value = false; flipAltCb.value = false;
    }

    // ── NEUTRALISATION ──────────────────────────────────────────────────
    //  RÈGLE : un réglage MASQUÉ ne doit plus rien produire. Sinon un preset
    //  chargé peut faire agir, en douce, un réglage que l'écran ne montre
    //  plus — exactement le défaut que la V2 s'emploie à supprimer partout
    //  ailleurs. `neutralize` s'exécute donc à CHAQUE application de type,
    //  y compris au chargement d'un preset, et pas seulement sur les défauts.
    function dtClearPre() {
        ppReorderIn.text = ""; setNum(ppCloneIn, 1);
        ppDelIn.text = ""; ppDupPg.text = ""; setNum(ppDupN, 1);
    }

    var IW_DOCTYPES = [
        {   // 0 — CARTE DE VISITE : grille serrée, coupes partagées (gap 0).
            key: "card", mode: 0, desc: "desc_dt_card",
            hide: ["pModeOpts"],
            neutralize: function () { shufIn.text = ""; dtClearPre(); },
            setup: function () {
                dtRepeat(true); dtGaps(0, 0); dtEdge("bleed", 3);
                currentAlign = "CC"; origRotation = 0;
                dtMarks({ crop: true, pageCross: true });
                setNum(mLenIn, 7); setNum(mGapIn, 2); setNum(mWIn, 0.25);
                dupCb.value = false;
            }
        },
        {   // 1 — FLYER / CARTON : même principe, mais on laisse respirer entre
            //     les poses (pas de coupe partagée sur un format qu'on manipule).
            key: "flyer", mode: 0, desc: "desc_dt_flyer",
            hide: ["pModeOpts"],
            neutralize: function () { shufIn.text = ""; dtClearPre(); },
            setup: function () {
                dtRepeat(true); dtGaps(5, 5); dtEdge("bleed", 3);
                currentAlign = "CC"; origRotation = 0;
                dtMarks({ crop: true, pageCross: true });
                setNum(mLenIn, 7); setNum(mGapIn, 2); setNum(mWIn, 0.25);
                dupCb.value = false;
            }
        },
        {   // 2 — AFFICHE : UNE pose. Ni répétition, ni espacement, ni verso.
            //     En revanche mires de calage et marques couleurs comptent :
            //     c'est là que se joue le repérage des encres.
            //     La rotation reste offerte : une affiche portrait sur une
            //     feuille paysage se tourne d'un quart, c'est un cas courant.
            key: "poster", mode: 0, desc: "desc_dt_poster",
            hide: ["pRep", "pGaps", "pModeOpts", "pDupx"],
            neutralize: function () {
                // une seule pose : répétition, tête-bêche et espacement n'ont
                // aucun sens et ne doivent pas subsister depuis un preset.
                autoCb.value = false; countIn.enabled = true; setNum(countIn, 1);
                flipAltCb.value = false;
                dtGaps(0, 0);
                dupCb.value = false;
                shufIn.text = ""; dtClearPre();
            },
            setup: function () {
                dtRepeat(false, 1); dtGaps(0, 0); dtEdge("bleed", 3);
                currentAlign = "CC"; origRotation = 0;
                dtMarks({ crop: true, reg: true, pageCenter: true, pageCross: true, colorMarks: true });
                setNum(mLenIn, 7); setNum(mGapIn, 2); setNum(mWIn, 0.25);
            }
        },
        {   // 3 — STICKER / ÉTIQUETTE : Step & Repeat, avec le jeu nécessaire
            //     au passage de la lame ou du massicot entre les poses.
            key: "sticker", mode: 1, desc: "desc_dt_sticker",
            hide: ["pModeOpts", "pDupx"],   // onglet Recto/verso vide -> dupNA
            neutralize: function () {
                dupCb.value = false;               // un sticker n'a pas de verso
                shufIn.text = ""; dtClearPre();
            },
            setup: function () {
                dtRepeat(true); dtGaps(2, 2); dtEdge("bleed", 3);
                currentAlign = "CC"; origRotation = 0;
                dtMarks({ crop: true, pageCross: true });
                setNum(mLenIn, 5); setNum(mGapIn, 1.5); setNum(mWIn, 0.25);
            }
        },
        {   // 4 — FANZINE / LIVRET : appariement des pages pour le pliage.
            //     Ce que le MOTEUR lit réellement en mode Booklet (vérifié dans
            //     iwComputeLayout et addBookletImposition) :
            //       • gapH  -> GOUTTIÈRE CENTRALE entre les deux pages : à garder,
            //                  et renommée en conséquence pour ce type ;
            //       • align -> utilisé (placement du couple sur la feuille) ;
            //       • fit   -> utilisé (iwFitDims) ;
            //       • gapV, nombre de copies, tête-bêche, rotation des copies
            //                -> IGNORÉS : L.cols/L.rows sont forcés à 2×1. Les
            //                   afficher laisserait croire qu'ils agissent.
            key: "zine", mode: 3, desc: "desc_dt_zine",
            hide: ["repRow", "repDesc", "flipAltCb", "rotGrp", "shufGrp",
                   "rowGapV", "gapAutoRow"],
            gutter: true,                          // gapH = gouttière, pas espacement
            neutralize: function () {
                autoCb.value = true; countIn.enabled = false;
                flipAltCb.value = false;
                origRotation = 0;
                setNum(gapVIn, 0);
                shufIn.text = ""; dtClearPre();
            },
            setup: function () {
                dtGaps(10, 0); dtEdge("bleed", 3);   // 10 mm de gouttière au départ
                currentAlign = "CC";
                dtMarks({ crop: true, pageCross: true });
                setNum(mLenIn, 7); setNum(mGapIn, 2); setNum(mWIn, 0.25);
                setNum(bkPages, Math.ceil(doc.pages.length / 4) * 4);
                setNum(bkCreep, 0);
                fitCb.value = false;
                dupCb.value = true;
                try { flipDd.selection = 0; } catch (eFz) {}   // bord long
            }
        },
        {   // 5 — PERSONNALISÉ : rien n'est masqué, le mode se choisit à la main.
            key: "custom", mode: null, desc: "desc_dt_custom",
            hide: [], neutralize: null, setup: null
        }
    ];

    // Table nom -> contrôle. Elle descend jusqu'à la RANGÉE : masquer un
    // panneau entier privait le fanzine de sa gouttière centrale (gapH), qui
    // vit dans le panneau « Espacement ». La granularité est donc celle du
    // réglage, pas celle du panneau.
    var IW_DT_PANELS = {
        // panneaux
        pRep: pRep, pAlign: pAlign, pModeOpts: pModeOpts,
        bkGrp: bkGrp, shufGrp: shufGrp,
        pGaps: pGaps, pEdge: pEdge, pBleed: pBleed, pWM: pWM,
        pPiece: pPiece, pPage: pPage, pCustom2: pCustom2, pStyle: pStyle,
        pColorMarks: pColorMarks,
        pDupx: pDupx,   // `pPre` n'y figure plus : il est hors interface
        // rangées et contrôles isolés
        repRow: repRow, repDesc: repDesc, fitCb: fitCb, flipAltCb: flipAltCb,
        rotGrp: rotGrp, alignPanel: alignPanel,
        rowGapH: gapHIn.parent, rowGapV: gapVIn.parent, gapAutoRow: gapAutoRow
    };

    function docTypeIndex() {
        return docTypeDd.selection ? docTypeDd.selection.index : 0;
    }

    // Applique un type de document.
    //   withDefaults = true  -> l'utilisateur vient de choisir ce type : on pose
    //                           aussi ses valeurs de départ.
    //   withDefaults = false -> on charge un preset : on ne touche QU'À la
    //                           visibilité, les valeurs viennent du preset.
    function applyDocType(idx, withDefaults) {
        var t = IW_DOCTYPES[idx] || IW_DOCTYPES[IW_DOCTYPES.length - 1];
        var isCustom = (t.mode === null);

        // 1. le mode d'imposition découle du type (sauf en Personnalisé)
        if (!isCustom) { try { modeDd.selection = t.mode; } catch (eDm) {} }

        // 2. visibilité : tout est rendu, puis on masque ce que le type exclut
        var k;
        for (k in IW_DT_PANELS) {
            if (!IW_DT_PANELS.hasOwnProperty(k)) continue;
            try { IW_DT_PANELS[k].visible = true; } catch (eDv) {}
        }
        for (var h = 0; h < t.hide.length; h++) {
            var ctl = IW_DT_PANELS[t.hide[h]];
            try { if (ctl) ctl.visible = false; } catch (eDh) {}
        }
        // le choix du mode n'existe que dans Personnalisé
        try { modeRow.visible = isCustom; modeDesc.visible = isCustom; } catch (eDr) {}
        // onglet Recto/verso entièrement vide -> on dit pourquoi
        try {
            var dupEmpty = !pDupx.visible;
            dupNA.visible = dupEmpty;
        } catch (eDn) {}
        // Un panneau dont toutes les rangées sont masquées ne doit pas rester
        // à l'écran sous forme de cadre vide.
        //   Le « visible && » n'est pas décoratif : sans lui, un panneau que le
        //   type vient EXPLICITEMENT de masquer (pRep pour l'affiche) serait
        //   ré-affiché ici, puisque ses rangées, elles, n'ont pas été masquées
        //   individuellement. On ne fait donc que REPLIER, jamais rouvrir.
        try { pRep.visible = pRep.visible && (repRow.visible || fitCb.visible || flipAltCb.visible); } catch (eDe1) {}
        try { pGaps.visible = pGaps.visible && (gapHIn.parent.visible || gapVIn.parent.visible || gapAutoRow.visible); } catch (eDe2) {}
        try { pModeOpts.visible = pModeOpts.visible && (bkGrp.visible || shufGrp.visible); } catch (eDe3) {}

        // 2b. LIBELLÉ CONTEXTUEL. En livret, gapH n'est pas un « espacement
        //     horizontal » entre poses : le moteur s'en sert comme GOUTTIÈRE
        //     CENTRALE entre les deux pages. Le même champ, un autre sens —
        //     le libellé doit le dire, sinon le réglage est incompréhensible.
        try {
            gapHIn.parent.children[0].text = t.gutter ? tr("lbl_gutter") : tr("lbl_gapH2");
            gapHIn.helpTip = t.gutter ? tr("tip_gutter") : tr("tip_gapH");
        } catch (eDg) {}

        // 3. NEUTRALISATION — avant les valeurs de départ, et TOUJOURS, même
        //    au chargement d'un preset : ce qui est masqué ne doit plus agir.
        if (t.neutralize) { try { t.neutralize(); } catch (eDnz) {} }

        // 3b. valeurs de départ
        //    Elles ÉCRASENT les réglages courants — c'est le but d'un changement
        //    de type — mais il n'y a pas d'annulation : on le dit donc dans la
        //    barre d'état, au lieu de laisser l'utilisateur découvrir que sa
        //    grille et ses repères ont changé.
        IW_MODE_NOTE = "";
        if (withDefaults && t.setup) {
            try { t.setup(); } catch (eDs) {}
            try { refreshAlignButtons(); } catch (eDa) {}
            try {
                IW_MODE_NOTE = tr("status_dtapplied",
                    { T: (docTypeDd.items[idx] ? docTypeDd.items[idx].text : "") });
            } catch (eDn2) {}
        }

        // 4. description du type + re-mise en page (sans quoi ScriptUI garde
        //    la place des panneaux masqués : c'est le point qui fait qu'un
        //    `visible = false` seul ne « range » rien à l'écran).
        try { typeDesc.text = tr(t.desc); } catch (eDd2) {}
        try { dlg.layout.layout(true); } catch (eDl) {}
    }

    docTypeDd.onChange = function () {
        applyDocType(docTypeIndex(), true);
        refresh();
    };
    typeResetBtn.onClick = function () {
        applyDocType(docTypeIndex(), true);
        refresh();
    };

    // Presets — sélection via le listbox natif (presetSelectedName)
    function presetSelectedOrWarn() {
        var nm = presetSelectedName();
        if (!nm) { Window.alert(tr("alert_selpreset")); return null; }
        return nm;
    }
    loadBtn.onClick = function () {
        var nm = presetSelectedOrWarn(); if (!nm) return;
        var cfg = loadPreset(nm); if (cfg) applyConfig(cfg);
    };
    // — METTRE À JOUR : remplace le preset sélectionné par la config courante.
    //   La couleur et le dossier (stockés dans _meta) sont conservés puisque
    //   createPreset n'écrase que le fichier de config, pas les métadonnées. —
    updateBtn.onClick = function () {
        var nm = presetSelectedOrWarn(); if (!nm) return;
        if (!Window.confirm(tr("confirm_update", { N: nm }))) return;
        if (createPreset(nm, gatherConfig())) {
            refreshPresetList();
            Window.alert(tr("preset_updated"));
        }
    };
    starBtn.onClick = function () {
        var nm = presetSelectedOrWarn(); if (!nm) return;
        iwToggleStarPreset(nm);
        refreshPresetList();
    };
    delBtn.onClick = function () {
        // V12 — si un DOSSIER est sélectionné, on le supprime (ses presets sont
        // remis à la racine, pas effacés), après confirmation. Sinon on supprime
        // le PRESET sélectionné.
        var fol = presetSelectedFolder();
        if (fol) {
            if (Window.confirm(tr("confirm_delfolder", { F: fol }))) {
                iwRemoveFolder(fol);
                presetSelFolder = null;
                refreshPresetList();
            }
            return;
        }
        var nm = presetSelectedOrWarn(); if (!nm) return;
        if (!Window.confirm(tr("confirm_delpreset", { N: nm }))) return;
        deletePreset(nm);
        if (iwLoadStarPreset() === nm) iwSaveStarPreset("");   // l'étoile suit la suppression
        refreshPresetList();
    };
    saveBtn.onClick = function () {
        var nm = saveName.text;
        if (createPreset(nm, gatherConfig())) {
            refreshPresetList();
            Window.alert(tr("preset_saved"));
        }
    };
    // — CODE COULEUR : roue chromatique. Colore le DOSSIER sélectionné, sinon
    //   le PRESET sélectionné (V11). —
    colorBtn.onClick = function () {
        var fol = presetSelectedFolder();
        if (fol) {
            var pickedF = iwPickPresetColor(iwGetFolderColor(fol));
            if (pickedF === false) return;       // annulé
            iwSetFolderColor(fol, pickedF);      // "" = aucune
            refreshPresetList();
            return;
        }
        var nm = presetSelectedName();
        if (!nm) { Window.alert(tr("alert_selpreset_or_folder")); return; }
        var picked = iwPickPresetColor(iwGetPresetMeta(nm).color);
        if (picked === false) return;            // annulé
        iwSetPresetColor(nm, picked);            // "" = aucune
        refreshPresetList();
    };
    // — NOUVEAU DOSSIER —
    newFolderBtn.onClick = function () {
        var nmF = iwPromptText(tr("folder_dlg_title"), tr("folder_dlg_intro"), "");
        if (nmF === null) return;
        nmF = nmF.replace(/^\s+|\s+$/g, "");
        if (!nmF) return;
        iwAddFolder(nmF);
        // si un preset est sélectionné, on l'y range directement (pratique)
        var selNm = presetSelectedName();
        if (selNm) iwSetPresetFolder(selNm, nmF);
        refreshPresetList();
    };
    // — RANGER DANS… (choix d'un dossier existant ou racine) —
    moveFolderBtn.onClick = function () {
        var nm = presetSelectedOrWarn(); if (!nm) return;
        var dest = iwPickFolder(iwGetPresetMeta(nm).folder);
        if (dest === false) return;             // annulé
        iwSetPresetFolder(nm, dest);            // "" = racine
        refreshPresetList();
    };

    // ── V2 — BARRE D'ÉTAT, au-dessus des boutons ────────────────────────
    //  Une ligne qui dit si la planche est réalisable, et sinon pourquoi.
    //  Elle est placée juste au-dessus de « Lancer », là où se porte le regard
    //  avant de cliquer.
    var statusRow = dlg.add("group");
    statusRow.orientation = "row"; statusRow.alignment = ["fill", "center"];
    statusRow.margins = [4, 0, 4, 0];
    var statusBar = statusRow.add("statictext", undefined, "");
    statusBar.alignment = ["fill", "center"];

    // ── Barre de boutons EN BAS de la fenêtre (sous les deux colonnes) ──
    //  À gauche : « Réglages… ». À droite : Annuler / Lancer.
    var mainBtns = dlg.add("group");
    mainBtns.orientation = "row"; mainBtns.alignment = ["fill", "center"]; mainBtns.alignChildren = "center";
    mainBtns.spacing = IW_UI_GAP;
    // les boutons à GAUCHE, dans l'ordre : Réglages · Annuler · Exporter · Lancer
    var settingsBtn = mainBtns.add("button", undefined, tr("tab_settings2") + "…");
    settingsBtn.preferredSize = [120, IW_UI_BTN_H];
    settingsBtn.onClick = function () { openSettingsDialog(); };
    var cancelBtn = mainBtns.add("button", undefined, tr("btn_cancel"), { name: "cancel" });
    cancelBtn.preferredSize = [IW_UI_BTN_W, IW_UI_BTN_H];
    // — Bouton EXPORTER (films / séparations), ENTRE Annuler et Lancer —
    //   IMPORTANT : l'export PDF ne peut PAS se faire tant qu'un dialogue modal
    //   est ouvert (erreur « boîte de dialogue modale active »). On FERME donc
    //   d'abord la fenêtre principale (code 3), et l'export est lancé APRÈS,
    //   une fois qu'aucun dialogue n'est actif (voir après dlg.show()).
    var filmsBtn = mainBtns.add("button", undefined, tr("btn_films"));
    filmsBtn.preferredSize = [IW_UI_BTN_W, IW_UI_BTN_H];
    try { filmsBtn.helpTip = tr("tip_films"); } catch (eFt) {}
    filmsBtn.onClick = function () { try { dlg.close(3); } catch (eClose) {} };
    var okBtn = mainBtns.add("button", undefined, tr("btn_run"), { name: "ok" });
    okBtn.preferredSize = [IW_UI_BTN_W + 20, IW_UI_BTN_H];

    // ── LOGO blanc + « Blueprint V16 », COIN BAS-DROIT ───────────────
    //  Un ressort élastique pousse le bloc tout à droite de la barre du bas ;
    //  le logo (blanc) et le nom sont ainsi calés dans le coin inférieur droit.
    //  CLIC sur le logo OU le nom -> fenêtre « À propos » (descriptif + lien
    //  Instagram). addEventListener("mousedown") est le moyen le plus fiable de
    //  capter un clic sur un panel/statictext en ScriptUI (CS6+).
    function openAbout() { try { iwShowAbout(IW.version); } catch (eAb) {} }
    var wmSpring = mainBtns.add("statictext", undefined, " ");
    wmSpring.alignment = ["fill", "center"];   // occupe l'espace -> pousse à droite
    var wmLogo = mainBtns.add("panel", undefined, undefined);
    wmLogo.preferredSize = [20, 20];
    wmLogo.maximumSize = [20, 20];
    wmLogo.alignment = ["right", "center"];
    wmLogo.onDraw = function () {
        var g = this.graphics;
        iwDrawLogo(g, 0, 0, this.size[0], this.size[1], IW_BRAND_WHITE);
    };
    var wmName = mainBtns.add("statictext", undefined, "Blueprint V" + IW.version);
    wmName.alignment = ["right", "center"];
    try {
        wmName.graphics.font = ScriptUI.newFont(wmName.graphics.font.name, "BOLD", 14);
        wmName.graphics.foregroundColor = wmName.graphics.newPen(
            wmName.graphics.PenType.SOLID_COLOR, IW_BRAND_BLUE, 1);
    } catch (eWn) {}
    // indices de clic + gestion de l'événement
    try { wmLogo.helpTip = tr("about_title"); wmName.helpTip = tr("about_title"); } catch (eHt) {}
    try { wmLogo.addEventListener("mousedown", openAbout); } catch (eEl1) {}
    try { wmName.addEventListener("mousedown", openAbout); } catch (eEl2) {}
    // repli : certaines versions exposent onClick sur le statictext
    try { wmName.onClick = openAbout; } catch (eEl3) {}

    // réapplique les réglages transmis (relancement après changement de langue)
    if (initialConfig) {
        try { applyConfig(initialConfig); } catch (eAC) {}
    } else {
        // Ouverture franche : on charge le preset PAR DÉFAUT (étoile) s'il existe,
        // sinon les derniers réglages de la session précédente.
        var _restored = false;
        var _starName = iwLoadStarPreset();
        var _starCfg = _starName ? loadPreset(_starName) : null;
        if (_starCfg) {
            try { applyConfig(_starCfg); _restored = true; } catch (eStar) {}
        } else {
            try {
                var iwLast = iwLoadLastConfig();
                if (iwLast) { applyConfig(iwLast); _restored = true; }
            } catch (eLast) {}
        }
        // PATCHWORK : à l'ouverture FRANCHE, plusieurs objets sélectionnés
        // signalent une mosaïque à raccorder.
        //   V2 — on bascule sur le type « Personnalisé » avant de poser le mode
        //   Patchwork. Sans cela, le sélecteur de type aurait annoncé « Carte de
        //   visite » pendant que l'imposition, elle, faisait du Patchwork : le
        //   type de document doit toujours dire la vérité sur ce qui va sortir.
        if (selItems.length >= 2) {
            try {
                docTypeDd.selection = IW_DOCTYPES.length - 1;   // Personnalisé
                applyDocType(IW_DOCTYPES.length - 1, false);
                modeDd.selection = 8;
                modeDesc.text = MODE_DESCS[8] || "";
                applyModePreselect(8);
            } catch (eAP) {}
        } else if (!_restored) {
            // Aucune session précédente : on pose le type par défaut ET ses
            // valeurs de départ. (Si une session a été restaurée, applyConfig
            // a déjà appliqué le type qu'elle portait.)
            try { applyDocType(docTypeIndex(), true); } catch (eDf) {}
        }
    }

    // ══ V2 — THÈME « PANNEAU INDESIGN » ════════════════════════════════
    //  ScriptUI ne permet pas de redessiner les contrôles natifs : on ne peut
    //  ni arrondir un bouton, ni colorer une case à cocher. Ce qui distingue
    //  visuellement un panneau InDesign est donc reproductible par les trois
    //  seuls leviers disponibles :
    //    • la TAILLE DE POLICE — l'interface d'InDesign tourne autour de 11 pt,
    //      là où ScriptUI part sur la police système (13 pt sur macOS) ;
    //    • la DENSITÉ — les panneaux d'InDesign sont serrés : gouttières de
    //      3-4 px, marges de 6 px, pas les 8 px par défaut ;
    //    • l'ACCENT — le bleu de sélection d'InDesign, repris par les
    //      panneaux que l'on dessine soi-même (grille d'alignement, presets).
    //  On parcourt l'arbre entier de la fenêtre plutôt que de reprendre chaque
    //  contrôle un par un : les nouveaux contrôles hériteront du thème sans
    //  qu'on ait à y penser.
    var IW_ID_FONT_PT = 11;   // taille de l'interface InDesign
    var IW_ID_MARGIN  = 6;    // marge intérieure d'un panneau
    var IW_ID_SPACING = 4;    // gouttière entre contrôles

    //  On ne change QUE la taille : le nom de police et le STYLE sont relus
    //  sur le contrôle. C'est ce qui préserve les descriptions en italique
    //  posées par iwItalic() — les réécrire en régulier aplatirait la
    //  hiérarchie que ces italiques servent justement à créer.
    function iwThemeFont(ctrl) {
        try {
            var f = ctrl.graphics.font;
            if (!f) return;
            // Les textes d'aide sont posés en ITALIQUE 10 pt par iwItalic().
            // Les remonter à 11 les mettrait au même corps que les libellés :
            // ils cesseraient de se lire comme du commentaire. On garde donc
            // l'italique un cran en dessous, comme le fait InDesign.
            var isItal = false;
            try {
                var st = String(f.style).toUpperCase();
                isItal = (st.indexOf("ITALIC") >= 0);
            } catch (eSt) {}
            ctrl.graphics.font = ScriptUI.newFont(f.name, f.style,
                isItal ? (IW_ID_FONT_PT - 1) : IW_ID_FONT_PT);
        } catch (eTf) {}
    }
    function iwApplyIDTheme(ctrl) {
        if (!ctrl) return;
        try {
            iwThemeFont(ctrl);
            // densité : uniquement sur les conteneurs qui ont des enfants.
            // Les panneaux DESSINÉS (aperçu, presets, grille d'alignement)
            // n'en ont pas : leurs marges ne sont pas touchées, et c'est
            // voulu — ils gèrent leur propre géométrie au pixel.
            if (ctrl.children && ctrl.children.length > 0) {
                var ty = String(ctrl.type);
                if (ty === "panel" || ty === "tab") {
                    try { ctrl.margins = IW_ID_MARGIN; } catch (eTm) {}
                }
                try { if (typeof ctrl.spacing === "number") ctrl.spacing = IW_ID_SPACING; } catch (eTs) {}
            }
        } catch (eTc) {}
        try {
            var n = (ctrl.children ? ctrl.children.length : 0);
            for (var i = 0; i < n; i++) iwApplyIDTheme(ctrl.children[i]);
        } catch (eTr) {}
    }
    try { iwApplyIDTheme(dlg); } catch (eTh2) {}
    // la barre du bas garde un peu d'air : c'est la zone d'action, la serrer
    // autant que les panneaux de réglage rendrait « Lancer » difficile à viser.
    try { mainBtns.spacing = 8; } catch (eTb) {}
    // les trois colonnes du corps restent séparées : à 4 px, la liste des
    // sections toucherait les réglages et la frontière disparaîtrait.
    try { bodyRow.spacing = 8; } catch (eTb2) {}

    // section affichée au départ : la première de la liste
    try { showSection(0); } catch (eSs0) {}
    // changer polices et marges modifie les tailles voulues de tous les
    // contrôles : sans recalcul, la fenêtre garderait la géométrie d'avant.
    try { dlg.layout.layout(true); } catch (eTl) {}

    // premier rendu
    refreshAlignButtons();
    refresh();

    // V10 — les panneaux DESSINÉS (aperçu + liste presets) n'ont leur taille
    // réelle qu'une fois la fenêtre affichée : on les redessine dans onShow.
    dlg.onShow = function () {
        try { updatePresetScroll(); } catch (eUS) {}
        try { redrawPresetPanel(); } catch (eRP) {}
        // V2 — la grille d'alignement est elle aussi un panneau DESSINÉ : sa
        //  taille réelle n'est connue qu'une fois la fenêtre affichée, il faut
        //  donc la redessiner ici comme la liste des presets.
        try { refreshAlignButtons(); } catch (eRA) {}
        try { refresh(); } catch (eRf) {}
    };

    var rc = dlg.show();

    // EXPORT DES FILMS demandé : la fenêtre principale est maintenant FERMÉE,
    // donc aucun dialogue modal n'est actif -> exportFile peut s'exécuter.
    // Si la page est VIDE et qu'une sélection existe, on CRÉE d'abord
    // l'imposition (comme « Lancer »), puis on exporte les films.
    if (rc === 3) {
        try {
            var pageEmpty = iwActivePageIsEmpty(doc);
            if (pageEmpty && hasSel) {
                var impCfg = gatherConfig();
                try { iwSaveLastConfig(impCfg); } catch (eSav3) {}
                iwExecute(doc, impCfg, selItems, settings);   // crée la planche
            }
        } catch (eImp) {}
        iwRunInkExport();   // sépare ce qui est sur la page
        return;
    }

    // changement de langue demandé : on relance la fenêtre dans la nouvelle
    // langue en réappliquant la config capturée. (récursion contrôlée : un
    // seul niveau à la fois, l'ancienne fenêtre est déjà fermée.)
    if (rc === 2 && pendingRelaunch) {
        mainV2(pendingRelaunch);
        return;
    }

    if (rc !== 1) return;

    // ── Garde-fou final : pas de sélection => on refuse l'exécution ──
    if (!hasSel) {
        Window.alert(tr("alert_nosel"));
        return;
    }
    // V4 — mémorisation : on enregistre la config avant d'exécuter, pour la
    // retrouver à la prochaine ouverture.
    var iwFinalCfg = gatherConfig();
    try { iwSaveLastConfig(iwFinalCfg); } catch (eSav) {}
    iwExecute(doc, iwFinalCfg, selItems, settings);
}


// ─────────────────────────────────────────────────────────────────────
//  Exécution : traduit la config UI en appels modules + pose les marks.
//  Réutilise iwComputeLayout() pour valider avant de créer quoi que ce soit.
// ─────────────────────────────────────────────────────────────────────
function iwExecute(doc, c, selItems, custom) {
    function cOr(k, d) { return (custom && custom[k] != null) ? custom[k] : d; }
    var mode  = parseInt(c.mode, 10) || 0;
    var pageN = parseInt(c.page, 10);
    var bleed = parseFloat(c.bleed) || 0;

    if (isNaN(pageN) || pageN < 1 || pageN > doc.pages.length) {
        Window.alert(tr("alert_badpage")); return;
    }
    if (!selItems || selItems.length === 0) {
        Window.alert(tr("alert_nosrc")); return;
    }
    // Patchwork (mode 8) : il faut au moins 2 objets sélectionnés.
    if (mode === 8 && selItems.length < 2) {
        Window.alert(tr("alert_assembly_nosel")); return;
    }
    var targetPage = doc.pages[pageN - 1];

    // Pièce + zone utile. À 90°/270° la pièce effective a largeur/hauteur
    // échangées (les copies seront tournées d'un quart de tour).
    var gb = iwMeasurePieceBounds(selItems[0]);   // V20 — mesure partagée avec l'aperçu
    var rawW = gb[3] - gb[1], rawH = gb[2] - gb[0];
    var oRot = ((parseInt(c.origRotation, 10) || 0) % 360 + 360) % 360;
    var piece = (oRot === 90 || oRot === 270)
        ? { w: rawH, h: rawW }
        : { w: rawW, h: rawH };
    var pgB = targetPage.bounds, mp = targetPage.marginPreferences;
    var zone = {
        top: pgB[0] + mp.top, left: pgB[1] + mp.left,
        w: (pgB[3] - mp.right) - (pgB[1] + mp.left),
        h: (pgB[2] - mp.bottom) - (pgB[0] + mp.top)
    };

    // centre absolu de la page (même repère que `zone` ci-dessus) pour que
    // l'alignement central tombe pile au milieu de la feuille, comme l'aperçu.
    c.pageCenterX = (pgB[1] + pgB[3]) / 2;
    c.pageCenterY = (pgB[0] + pgB[2]) / 2;

    // Validation via le moteur partagé (même calcul que l'aperçu)
    var L = iwComputeLayout(c, piece, zone);
    if (!L.ok) {
        // on prévient mais on autorise à forcer pour les cas limites
        var go = Window.confirm(tr("confirm_run", { MSG: L.message }));
        if (!go) return;
    }

    var gapH = L.gapH, gapV = L.gapV;

    // Calques (réutilise getOrCreateLayer v1)
    var imposLayer = getOrCreateLayer(doc, "IW Imposition - " + dateStamp());
    var markLayer  = getOrCreateLayer(doc, "Traits de coupe");
    try { markLayer.move(LocationOptions.AT_BEGINNING); } catch (e) {}

    // Plan de pages via preprocessors (pilote l'ordre des items)
    var plan = buildDefaultPlan(doc);
    if (c.pre) {
        if (c.pre.reorder) { var ord = iwParseList(c.pre.reorder); if (ord.length) plan = ppReorder(plan, ord); }
        var cl = parseInt(c.pre.clone, 10); if (cl > 1) plan = ppClone(plan, cl);
        var dp = parseInt(c.pre.del, 10);   if (!isNaN(dp)) plan = ppDeletePage(plan, dp);
        var dPg = parseInt(c.pre.dupPg, 10), dN = parseInt(c.pre.dupN, 10);
        if (!isNaN(dPg) && dN > 0) plan = ppDuplicatePage(plan, dPg, dN);
    }

    var baseCfg = {
        page: targetPage, slotW: L.slotW, slotH: L.slotH,
        rows: L.rows, cols: L.cols, gapH: gapH, gapV: gapV,
        originTop: L.originTop, originLeft: L.originLeft,
        layer: imposLayer, items: selItems, bleed: bleed,
        zoneW: zone.w, zoneH: zone.h,
        fit: (c.fit === true), maxCount: L.count,
        flipAlt: (c.flipAlt === true), origRotation: oRot,
        whiteMargin: (c.whiteMargin || null),
        // V20 — marges EXTÉRIEURES (mm) : slot = pièce + ces marges autour.
        // 0 en mode intérieur. La pièce est placée à taille pleine, inset de
        // (extLeft, extTop) dans le slot ; sinon comportement historique.
        extTop: (L.extTop||0), extBottom: (L.extBottom||0),
        extLeft: (L.extLeft||0), extRight: (L.extRight||0), extOn: !!L.extOn,
        wmOutside: (c.wmOutside === true), bleedOutside: (c.bleedOutside === true),
        bleedColorMode: (c.bleedColorMode || "none"),
        asmOn: (c.asmOn === true), asmCols: c.asmCols, asmCount: selItems.length
    };

    app.scriptPreferences.enableRedraw = false;
    var placed = [];
    try {
        switch (mode) {
            case 0: placed = addNUpImposition(baseCfg); break;
            case 1: placed = addStepRepeatImposition(baseCfg); break;
            case 2: placed = addCutStackImposition(baseCfg); break;
            case 3:
                baseCfg.nPages = parseInt(c.bkPages, 10) || doc.pages.length;
                baseCfg.creep  = parseFloat(c.bkCreep) || 0;
                baseCfg.getItemForPage = function (pn) { return selItems[(pn - 1) % selItems.length]; };
                placed = addBookletImposition(baseCfg); break;
            case 4: placed = addDutchCutImposition(baseCfg); break;
            case 5: baseCfg.order = iwParseList(c.shuffle); placed = addShuffleImposition(baseCfg); break;
            case 6: placed = addNUpImposition(baseCfg); break;   // Riso = N-Up + préréglages
            case 7: placed = addNUpImposition(baseCfg); break;   // Sérigraphie = N-Up + préréglages
            case 8: placed = addAssemblyImposition(baseCfg); break;   // Patchwork = raboutage bord à bord
        }
    } catch (e) {
        app.scriptPreferences.enableRedraw = true;
        Window.alert(tr("alert_imposerr") + e.message); return;
    }

    // Préréglages de repères selon le mode :
    //   Riso (6)        -> trait FIN
    //   Sérigraphie (7) -> trait LARGE
    // L'utilisateur peut toujours surcharger via le champ « Épaisseur ».
    var baseWeight = parseFloat(c.marks.w) || 0.25;
    var baseLen    = parseFloat(c.marks.len) || 7;
    if (mode === 6) { baseWeight = parseFloat(c.marks.w) || 0.10; }
    if (mode === 7) { baseWeight = (parseFloat(c.marks.w) || 0.25) < 0.6 ? 1.0 : parseFloat(c.marks.w); }

    // V4 — Repères enrichis : substitution de JETONS dans le texte perso,
    // pour des codes de calage automatiques (date, page, mode, format, n).
    //   {date} {page} {mode} {w} {h} {n}
    // addMarks() n'est pas modifié : on lui passe juste le texte déjà composé.
    var iwTxtFinal = c.marks.txt || "";
    try {
        if (iwTxtFinal && /\{/.test(iwTxtFinal)) {
            var _d = new Date();
            var _p2 = function (n) { return (n < 10 ? "0" : "") + n; };
            var _today = _d.getFullYear() + "-" + _p2(_d.getMonth() + 1) + "-" + _p2(_d.getDate());
            var _pb = targetPage.bounds;
            var _sw = Math.round((_pb[3] - _pb[1]) * 10) / 10;
            var _sh = Math.round((_pb[2] - _pb[0]) * 10) / 10;
            var _modeNames = [tr("mode_nup"), tr("mode_steprep"), tr("mode_cutstack"), tr("mode_booklet"), tr("mode_dutchcut"), tr("mode_shuffle"), tr("mode_riso"), tr("mode_seri"), tr("mode_patch")];
            iwTxtFinal = iwTxtFinal
                .replace(/\{date\}/g, _today)
                .replace(/\{page\}/g, String(c.page))
                .replace(/\{mode\}/g, _modeNames[mode] || "")
                .replace(/\{w\}/g, String(_sw))
                .replace(/\{h\}/g, String(_sh))
                .replace(/\{n\}/g, String(placed.length));
        }
    } catch (eTok) { iwTxtFinal = c.marks.txt || ""; }

    // Marks sur chaque slot
    var mkOpts = {
        crop: c.marks.crop, trim: c.marks.trim, registration: c.marks.reg,
        colorBar: c.marks.bar, angleMarks: c.marks.ang,
        customText: iwTxtFinal || null,
        customGraphicFile: (c.marks.gr ? new File(c.marks.gr) : null),
        regFile: (c.marks.regFile ? new File(c.marks.regFile) : null),
        // V20 — en mode EXTÉRIEUR, slotBounds passé à addMarks vaut déjà le
        //   bord de la PIÈCE (marges extérieures retirées) : la coupe ne doit
        //   donc PAS être re-rentrée -> bleed = 0 pour les repères. En mode
        //   intérieur, on garde le fond perdu habituel.
        bleed: (L.extOn ? 0 : bleed),
        length: baseLen,
        gap: parseFloat(c.marks.gap) || 2,
        weight: baseWeight,
        cross: (c.marks.pageCross !== false),
        // la mire de CENTRE de page est-elle posée ? (sert à laisser un trou
        // dans les pastilles couleurs pour ne pas masquer la mire centre-bas)
        pageCenterOn: !!c.marks.pageCenter,
        // cadre de coupe page passant par les centres des mires de coin
        cutFrame: !!c.marks.pageFrame,
        // style des marques couleurs selon le mode : Riso = noms seuls,
        // Sérigraphie (et autres) = rectangles + carrés. Modifiable plus tard.
        colorStyle: (mode === 6) ? "riso" : "seri",
        colorEdge: (c.marks.colorEdge === "long") ? "long" : "short",
        colorNameSide: (c.marks.colorNameSide || "auto"),
        sideStep: parseFloat(c.marks.sideStep) || 40,
        colorReserve: 70,
        // marges de la page (mm) : permettent de centrer les marques de page
        // (croix de bord, pastilles couleurs) au MILIEU de l'épaisseur de marge.
        margins: { top: mp.top, left: mp.left, bottom: mp.bottom, right: mp.right },
        // dimensions des marques couleurs (un peu plus grandes qu'avant)
        colorPad: 4,
        colorSwatchSize: cOr("colorSwatchSize", 12),  // côté du carré (haut-gauche)
        colorBarH: cOr("colorBarH", 11),               // hauteur du rectangle (bas-gauche)
        colorBarW: cOr("colorBarW", 46),               // largeur du rectangle (bas-gauche)
        crossCornerGap: cOr("crossCornerGap", 6),      // marge d'angle des croix de bord (mm)
        // V2 — diamètre des mires (mm), plafonné par iwRegDiam. Sans cette
        // ligne le moteur ne recevait pas le réglage et retombait sur la
        // valeur par défaut, quel que soit le choix fait dans Réglages.
        regDiam: iwRegDiam(cOr("regDiam", IW_REG_MAX_MM))
    };
    try {
        for (var i = 0; i < placed.length; i++)
            addMarks(targetPage, markLayer, placed[i].slotBounds, mkOpts);
        // repères de centre de page (une seule fois, sur la page entière)
        if (c.marks.pageCenter) {
            addPageCenterMarks(targetPage, markLayer, targetPage.bounds, mkOpts);
        }
        // croix de bord supplémentaires : DÉPLACÉES après le bloc couleurs
        // (voir plus bas) pour pouvoir éviter la zone des pastilles.
        // marques COULEURS de page sur un CALQUE DÉDIÉ. Couleurs prises de
        // DEUX façons combinées : (1) nuances RÉELLEMENT APPLIQUÉES au contenu
        // (fonds/contours/textes/images colorisées) — filtrées sur le Nuancier ;
        // (2) couleurs DOMINANTES extraites des PIXELS des images PNG en
        // couleurs (le fichier est décodé et analysé). On écarte ainsi les
        // nuances non utilisées, et on récupère enfin les couleurs des PNG.
        if (c.marks.colorMarks) {
            var colorLayer = getOrCreateLayer(doc, "Couleurs - " + dateStamp());
            try { colorLayer.move(LocationOptions.AT_BEGINNING); } catch (eCL) {}
            var nuancier = iwCollectNuancierColors(doc);
            var scanItems = [];
            for (var pci = 0; pci < placed.length; pci++) {
                if (placed[pci] && placed[pci].obj) { try { if (placed[pci].obj.isValid) scanItems.push(placed[pci].obj); } catch (ePV) {} }
            }
            if (selItems) for (var sci = 0; sci < selItems.length; sci++) {
                try { if (selItems[sci] && selItems[sci].isValid) scanItems.push(selItems[sci]); } catch (eSV) {}
            }
            // (1) nuances appliquées -> filtre le Nuancier
            var usedNames = {};
            try { var usedList = iwCollectUsedColors(scanItems); for (var uli = 0; uli < usedList.length; uli++) usedNames[usedList[uli].name] = true; } catch (eUL) {}
            var merged = [], seen = {};
            for (var nci = 0; nci < nuancier.length; nci++) {
                if (usedNames[nuancier[nci].name] && !seen[nuancier[nci].name]) { seen[nuancier[nci].name] = true; merged.push(nuancier[nci]); }
            }
            // (2) couleurs des PIXELS des PNG en couleurs (décodage du fichier)
            var imgColors = [];
            try { imgColors = iwCollectImageColors(scanItems, { maxColors: 4, maxRows: 200, maxFileMB: 8 }); } catch (eIC) {}
            for (var ici = 0; ici < imgColors.length; ici++) {
                if (!seen[imgColors[ici].name]) { seen[imgColors[ici].name] = true; merged.push(imgColors[ici]); }
            }
            // (3) TONS DIRECTS (SPOT) du Nuancier : on les AJOUTE toujours.
            //     Cas d'un .indd placé (ou d'un PDF/EPS) : ses couleurs sont
            //     des nuances SPOT du document mais NE sont PAS appliquées en
            //     fillColor sur un objet -> la détection (1)/(2) les rate. Or
            //     en riso/sérigraphie, un ton direct du Nuancier EST une encre
            //     à imprimer. On inclut donc toutes les nuances SPOT.
            for (var sni = 0; sni < nuancier.length; sni++) {
                var snc = nuancier[sni];
                if (seen[snc.name]) continue;
                var isSpot = false;
                try { isSpot = (snc.swatch && snc.swatch.model === ColorModel.SPOT); } catch (eSpot) {}
                if (isSpot) { seen[snc.name] = true; merged.push(snc); }
            }
            var usedColors = merged;
            if (usedColors.length === 0) {
                // pas de couleur détectée sur la planche : on retombe sur le
                // nuancier entier, SANS pop-up (l'utilisateur ne veut pas d'alerte).
                usedColors = nuancier;
            }
            if (usedColors.length > 0) {
                // ZONE DES COULEURS le long des bords haut/bas, d'après le
                // nombre RÉEL de pastilles -> permet d'écarter les croix de bord
                // qui y tomberaient (les rectangles du bas peuvent dépasser le
                // centre de la page).
                // Les pastilles partent du CENTRE, de part et d'autre de la
                // croix centrale. addPageColorMarks renvoie l'étendue réellement
                // occupée -> les croix de bord s'y adaptent (croix là où il n'y
                // a PAS de couleur, rien là où il y en a).
                var _czRet = addPageColorMarks(targetPage, colorLayer, targetPage.bounds, usedColors, mkOpts);
                if (_czRet) mkOpts.colorZone = _czRet;
            }
        }
        // croix de bord supplémentaires à intervalle régulier — APRÈS les
        // couleurs, pour éviter la zone des pastilles et les coins. (Les mires
        // de centre/coin restent posées par addPageCenterMarks plus haut.)
        if (c.marks.sideCross) {
            addPageSideCrosses(targetPage, markLayer, targetPage.bounds, mkOpts);
        }
    } catch (e) {
        app.scriptPreferences.enableRedraw = true;
        Window.alert(tr("alert_markserr") + e.message); return;
    }

    // Duplex
    if (c.duplex && c.duplex.on) {
        var backN = parseInt(c.duplex.backPg, 10);
        if (!isNaN(backN) && backN >= 1 && backN <= doc.pages.length) {
            var backPage = doc.pages[backN - 1];
            var flip = (c.duplex.flip === 1) ? "short" : "long";
            iwGenerateBack(backPage, baseCfg, placed, flip, mkOpts, markLayer);
        } else {
            app.scriptPreferences.enableRedraw = true;
            Window.alert(tr("alert_badbackpage"));
        }
    }

    app.scriptPreferences.enableRedraw = true;
    var sel = [];
    for (var k = 0; k < placed.length; k++) sel.push(placed[k].obj);
    if (sel.length) app.select(sel);
}

// Génère la face verso à partir des slots recto et de la règle de flip.
function iwGenerateBack(backPage, baseCfg, frontPlaced, flip, mkOpts, markLayer) {
    var backMap = iwBackPlan(baseCfg.cols, baseCfg.rows, flip);
    for (var slot = 0; slot < frontPlaced.length; slot++) {
        var srcSlotIndex = backMap[slot];
        if (srcSlotIndex == null) continue;
        var r = Math.floor(slot / baseCfg.cols);
        var c = slot % baseCfg.cols;
        var slotTop  = baseCfg.originTop  + r * (baseCfg.slotH + baseCfg.gapV);
        var slotLeft = baseCfg.originLeft + c * (baseCfg.slotW + baseCfg.gapH);
        var src = baseCfg.items[srcSlotIndex % baseCfg.items.length];
        // V20 — mode extérieur : pièce pleine inset des marges (comme le recto)
        var obj, _sbBk;
        if (baseCfg.extOn) {
            obj = iwPlaceCopyExt(src, backPage, slotTop + baseCfg.extTop, slotLeft + baseCfg.extLeft,
                                 baseCfg.layer, 0, baseCfg.wmOutside ? baseCfg.whiteMargin : null,
                                 baseCfg.extLeft, baseCfg.extTop, baseCfg.extRight, baseCfg.extBottom,
                                 baseCfg.slotW, baseCfg.slotH, baseCfg.bleedColorMode);
            _sbBk = baseCfg.wmOutside
                ? [slotTop, slotLeft, slotTop + baseCfg.slotH, slotLeft + baseCfg.slotW]
                : [slotTop + baseCfg.extTop, slotLeft + baseCfg.extLeft,
                   slotTop + baseCfg.slotH - baseCfg.extBottom, slotLeft + baseCfg.slotW - baseCfg.extRight];
        } else {
            var _fdB = iwFitDims(baseCfg.fit, baseCfg.whiteMargin, baseCfg.slotW, baseCfg.slotH);
            obj = iwPlaceCopy(src, backPage, slotTop, slotLeft, baseCfg.layer, 0, 0, _fdB[0], _fdB[1], baseCfg.whiteMargin);
            _sbBk = [slotTop, slotLeft, slotTop + baseCfg.slotH, slotLeft + baseCfg.slotW];
        }
        iwFlipObject(obj, flip);
        addMarks(backPage, markLayer, _sbBk, mkOpts);
    }
}

function iwParseList(s) {
    var out = [];
    if (!s) return out;
    var parts = String(s).split(",");
    for (var i = 0; i < parts.length; i++) {
        var v = parseInt(parts[i], 10);
        if (!isNaN(v)) out.push(v);
    }
    return out;
}


// ─────────────────────────────────────────────────────────────────────
//  [H] BOOTSTRAP — lancement direct (V5.2 : moteur V1 retiré)
// ─────────────────────────────────────────────────────────────────────
(function bootstrap() {
    mainV2();
})();
