Intégration du mini-jeu de creusage

Creuser pour gagner des ressources!

Le joueur fait face à une grille de N x N cases.
Certaines cases peuvent avoir une récompense aléatoire sous elles.
Chaque case a un nombre de Points de Vie (3 par défaut).
Chaque stade de PV de case a un visuel de fissures (3 = parfaite, 2 = légères fissures, 1 = lourdes fissures, 0 = case de terre cachée, place à la case de dessous (autre texture, avec la récompense affiché par dessus si necessaire))

Le joueur dispose d'un outil (pelle ou pioche).
Le curseur change en fonction de l'outil équipé lorsque la grille est survolée (voir cursor/tool_pickaxe.png et tool_shovel)
Les différents outils appliquent différents types de creusage tels que : 
- Pelle : Inflige 3 PV sur la case visée
- Pioche : Inflige 2 PV sur la case visée, plus 1 PV aux 4 cases adjacentes (en forme de +)
Afficher une preview de l'impact du clic en fonction de l'outil sélectionné. Avec un contour blanc + large si le clic inflige plus de PV 

L'attribution d'outils fonctionne comme une file. Sur la droite sous forme de pile sont affichés la liste d'outils à venir. L'outil actuellement utilisé est tout en bas, mis en évidence. Le suivant est juste au dessus, etc. Et le dernier est tout en haut.
Utiliser un outil 1 fois passe au suivant.
Lorsque le joueur est à court d'outils, le creusage est terminé et ses résultats sont affichés (récompenses récupérées)

Le mini-jeu sera donc un popup. En haut à droite de ce popup seront affichés le nombre de 🪨 jetons de minage. À droite sera la pile d'outils à venir. 
Pour démarrer une partie, le joueur devra utiliser un 🪨 jeton de minage. Si une partie n'est pas en cours et que le joueur ouvre le mini-jeu, un jeton est utilisé.

Ce qui doit être modulable :
- Nombre de cases de la grille
- Pool de récompenses
- Pool d'outils

Objectifs techniques :
- Sauvegarder les données du mini jeu en back end, pour permettre à l'utilisateur de partir / revenir sur la vue sans problème.
- Faire les calculs en back-end, pour éviter les fuites de données et la lecture-triche des données en front-end.

Style graphique :
- Couleurs bois/paille/pierre
- Cases de creusage : Terre, cases déja creusée : roche
- Pile d'outils : Tous de la même taille, style ActionButton.vue en plus carré
- Police Fredoka
- Direction artistique "mignonne"

Accès au mini-jeu :
- Dans production.vue, il y aura une petite icone de 🪨. La cliquer ouvre le popup de minage.









----

Améliorations du mini-jeu de creusage

- Baisser la brillance du hover quand la case peut être détruite en 1 coup

- Retirer entièrement l'étape du popup de "Voyons ce que vous avez trouvé" et plutot qu'un affichage abrupt des récompenses de fin de creusage, mettre un bouton "continuer" en bas de la vue quand le joueur n'a plus d'outils tout en laissant la grille affichée avant de passer aux récompenses.

- Augmenter la taille que prend la grille et la rendre fixe

- Faire en sorte que la pile d'outils aie une hauteur limitée (qu'elle ne dépasse pas celle de la grille)

- Faire en sorte que les elements de la pile d'outil disparaissent au fil des utilisations, et que les outils restants descendent ensuite pour que l'outil actuellement utilisé soit TOUJOURS tout en bas.

- Faire en sorte que tout les composants tiennent dans le pop-up et styliser la partie des outils en mettant dans une petite boite en bois (comme BottomBar)

- Changer le style de l'affichage du nombre de jetons de minage, actuellement il est trop gros et il chevauche la croix (X)

----
Plus tard

- Déplacer le bouton d'accès à la bottombar et rentre le popup accessible depuis partout (App.vue)

- Faire en sorte que les récompenses puissent prendre plusieurs cases de taille (avec une height et width), et qu'on aie besoin de déterrer toutes les cases qui la cache pour la récupérer. La récompense doit être visible même avant l'avoir deterré complètement.

Système d'artefacts de minage (similaire au système de poules):
- Le jeu a une liste d'artefacts avec leurs effets passifs fixes. (stockés dans sharedGameData)
- Chaque joueur a une collection d'artefacts. (Stockés dans la database User.js)
- Chaque joueur a un certain nombre d'emplacements, et équiper un artefact sur un emplacement déclenchera son effet pour la partie en cours.
- Les artéfacts équipés sont affichés en haut du popup de minage pendant une partie, avec une ToolTip.vue de son effet.



















---
- Ajouter des effets visuels pour l'amélioration de poules
- Effet visuel pour achat d'amélioration (marché)
- Marché : N'afficher les clés de coffre que si le joueur est niv 5+
- Les nouveaux succès ne marchent pas (nouveau moi, éleveur interessé)
- Marché : Arrondir les probas à la virgle si necessaire
---
Marché : Problème : Drop une poule qui a été déjà obtenue dont la quantité est 0 s'affiche comme 'Nouveau'.
BottomBar : Problème : Le badge du bouton marché (d'indication d'amélioration disponible) s'affiche alors qu'aucune amélioration n'est disponible
TeamParadeChicken : Problème : Quand une poule se fait améliorer depuis ChickenDetail, elle se téleporte. Il ne faut pas changer sa position à ce moment.
---
Social : Limiter la taille des leaderboards à 10. S'il y a au moins 10 personnes sur la leaderboard, mettre un bouton "Plus" qui lorsque cliqué ouvrira un popup (Popup.vue) qui affichera la leaderboard entière.