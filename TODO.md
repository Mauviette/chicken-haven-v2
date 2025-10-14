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

L'attribution d'outils fonctionne comme une file. Sur la droite sous forme de pile sont affichés la liste d'outils à venir. L'outil actuellement utilisé est tout en bas, mis en évidence. Le suivant est juste au dessus, etc. Et le dernier est tout en haut.
Lorsque le joueur est à court d'outils, le creusage est terminé et ses résultats sont affichés (récompenses récupérées)

Ce qui doit être modulable :
- Nombre de cases de la grille
- Pool de récompenses
- Pool d'outils