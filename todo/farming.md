Fonctionnalités du mini-jeu de Farming :

Accès à "Ma ferme" depuis le site via un bouton (comme MiningGame).

Pour chaque joueur, ajouter à la base de données un "niveau de ferme" et une liste de ressources unique à la ferme.

En montant de niveau éventuellement, le joueur débloquera de nouvelles ressources qui pourront être de différents types.

Style graphique : Mignon, Cozy, Vintage
Penser à utiliser des curseur custom comme sur les autres vues

Légumes de chaque utilisateur (à mettre dans sharedGameData):
- 🥔 Patates (débloqué de base)
- 🥕 Carottes (débloqué de base)
- 🌽 Maïs (débloqué de base)

Chaque légume a des graines magique correspondante. Elles peuvent être plantées (+ infos après)
Légumes de chaque utilisateur (à mettre dans sharedGameData):
- 🥔🫘 Patates (3h)
- 🥕🫘 Carottes (3h)
- 🌽🫘 Maïs (3h)

À gauche du menu de farming est une sidebar avec toutes les graines magiques de l'utilisateur. Il peut les glisser pour les planter sur les cases (plus d'infos après)
À droite du menu de farming est une sidebar avec tous les légumes de l'utilisateur.
Ajouter des tooltips de hover pour ces ressources, avec un titre en haut de chaque sidebar

Chaque joueur dispose d'une grille 3x3
Par défaut, les cases ne sont pas débloquées. (une seule à la base est débloquée.)
Si une case est débloquée, le joueur peut planter une graine magique d'un légume, qui prendra un certain temps à pousser.
À la fin du temps, le légume a entièrement poussé, et le joueur peut le récupérer.
Lors de la récupération, le joueur doit faire un mini jeu, qui change pour chaque légume. Le nombre de légumes que le joueur récupère dépend de la prestation du joueur.

Mini-jeux des 3 légumes :
- 🥔 Patates (Donne 1 à 3)
Petit démineur chronometré
- 🥕 Carottes (Donne 0 à 4)
Le joueur a en face de lui visiblement 5 carottes parmi lesquelles choisir, une est une bombe qui si deterrée, annule tous les gains obtenus jusqu'à la. Le joueur peut s'arreter quand il veut
- 🌽 Maïs (Donne 1 à 3)
Des grains de maïs tombent du ciel assez vite, il faut les cliquer avant qu'ils sortent de l'écran pour maximiser son gain.


En haut de l'onglet de ferme est affichée la météo, qui change toutes les 12h.
Exemple d'affichage : "☀️ Ensoleillé (4h37)" - "🌧️"
Donc ici il fait soleil pendant 4h37 et après il y aura la pluie.
Ajouter une tooltip de hover pour ces deux temps qui affichent les infos relatives au temps.
Il y aura 3 temps pour l'instant :
- Soleil (Maïs poussent 25% plus vite, Patates -25%)
- Nuage (Carottes +25%, Maïs -25%)
- Pluie (Patates +25%, Carottes -25%)


Tout ceci est déjà implémenté.
------------------------
MAINTENANT :

Chaque joueur a un niveau de potager. (potager = ferme)
Chaque joueur a un nombre de potathune. 💵

Chaque joueur a une limite de légumes dans son inventaire. (10 par défaut). Si le joueur est à sa limite, il ne peut pas récupérer un légume sur une parcelle prête (le mini-jeu ne se lance pas)

Pour améliorer la limite de sa réserve, il paiera un nombre de potathune et d'urnes (ancient_urn, disponibles en minant). (15 potathune et 2 urnes pour passer de 10 -> 15 au début)

Pour avoir de la pothatune et de l'XP de potager, un joueur pourra remplir des DEMANDES.

Tous les X heures, à droite de l'écran, un personnage à droite de l'écran pourra apparaitre pour faire une demande pendant un certain temps (X heures).
La demande sera composé d'un certain nombre des ressources (donc pour l'instant patates, carottes, maïs). (Pas de légumes que le joueur n'a pas encore débloqué)
Le temps que le joueur a pour compléter dépend de la difficulté de la demande. La récompense sera de la potathune et de l'XP de ferme (dépendant de la difficulté de la demande).

Le personnage à droite sera pour l'instant une image "personnage.png" avec un stickman desssiné. Il a un "!" rouge si l'utilisateur ne l'a pas encore cliqué. Une fois que l'utilisateur le clique, le personnage rerentre plus dans l'écran, et une boite de dialogue s'affiche avec à l'intérieur un petit texte (ex. "Bonjour") et les ressources demandées en dessous, ex. ("🌽x2 🥕x2"), avec encore en dessous en plus petit les récompenses de la demande (ex. "🔵x4 💵x6"). En haut de la bulle sera affiché le temps avant que le personnage parte. Si le personnage est recliqué ou qu'autre chose sur l'écran est cliqué, il se rétracte vers la droite et la bulle se ferme.
Lorsque la bulle est affiché, il y a 2 options : "Donner" si le joueur a les ressources necessaires, sinon "Renvoyer" ce qui fera partir le personnage après confirmation.
 
Evidemment les demandes et leur état sont à stocker en back end

Au niveau 1 de la ferme, le joueur ne peut avoir qu'une demande max en meme temps, mais dans le futur on pourra éventuellement voir + de demandes potentielles en même temps.
Monter de niveau éventuellement débloquera de nouveaux légumes, contenus etc.