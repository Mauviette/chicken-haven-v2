sharedGameData, tools de minage : Prendre en compte secondary_damage dans mining.controller.js, le secondary_damage correspond aux dégats que fait un outil sur les autres cases que la case cliquée.

Coder les effets de tous les artefacts (de artifactsData). 
La logique doit être implémentée dans mining.controller.js.

Ajouter un système d'onglets au menu de succès; 2 catégories. Succès classiques, et de la mine.
Tous les succès déjà existants vont dans l'onglet classique.
Ajouter ces succès à la mine :
> Trouver 1, 3, 5 artefact
> Miner 10, 25, 100 cases au total
> Finir une grille sans avoir aucune récompense
> Casser toute la grille de 5x5

Lorsqu'un objet marqué de 'special' à true dans le mini-jeu de minage, dans les la grille et résultats, mettre un halo 

Ajouter des effets visuels pour l'amélioration de poules
Faire en sorte que l'instance de poule en bas ne soit pas reset dans ce cas

Social : Limiter la taille des leaderboards à 10. S'il y a au moins 10 personnes sur la leaderboard, mettre un bouton "Plus" qui lorsque cliqué ouvrira un popup (Popup.vue) qui affichera la leaderboard entière.