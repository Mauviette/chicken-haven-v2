

Ajouter des poules
> Légendaire fondamentale, 
> 1 épique dans brillant
> 1 épique dans chic

Mode difficile : 
- Lorsqu'un utilisateur crée un compte, si le titre "chicken haven" est cliqué 100 fois et que la page "créer un compte" est ouverte, la registerform devient rouge, et le s'inscrire a un emoji flamme.
- Dans ce cas, si l'utilisateur s'inscrit, son compte est en mode "Apocalypse". (booléen apocalypse dans User.js)
Sur un compte en apocalyse :
- Le background de Production.vue devient front\src\assets\hardcore\background\1.png.
- Le joueur a une ressource en plus sur UserProfile (et dans User.js), les tomates pourries. Elles ne servent à rien.
- Chaque cadeau de poule a 50% de chance de donner une tomate pourrie à la place de la récompense de base.
- Chaque case de minage AVEC UNE RECOMPENSE a 25% que la récompense soit une tomate pourrie à la place.
- Sur les leaderboard de social et sur UserProfile, il y a un badge de flamme qui indique que le joueur est en mode apocalypse.
- Dans ChickenDetail, (ou TeamReplacementPopup), on ne peut pas remplacer une poule (avec capacité activable) dont le cooldown n'est pas prêt.
- Le clic de l'oeuf sur Production donne 10% des oeufs qu'il donnerait à la base.
- Le clic d'oeuf blanc (Spawnable) donne 10% des oeufs qu'il donnerait à la base.
- 