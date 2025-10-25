
Ajouter des poules
> Légendaire fondamentale, 
> 1 épique dans chic

Mode APOCALYPSE : 
- Lorsqu'un utilisateur crée un compte, si le titre "chicken haven" est cliqué 100 fois alors que la page "créer un compte" est ouverte OU que 'ATOMIC' est écrit au clavier, la registerform devient rouge, et le s'inscrire a un emoji flamme, ainsi que d'autres effets effrayants.
- Dans ce cas, si l'utilisateur s'inscrit, son compte est en mode "Apocalypse". (booléen apocalypse dans User.js)
Sur un compte en apocalyse :
- Le background de Production.vue devient front\src\assets\hardcore\background\1.png.
- Le joueur a une ressource en plus affichées sur UserProfile (et dans User.js), les tomates pourries. Elles ne servent à rien.
- Chaque cadeau de poule a 50% de chance de donner une tomate pourrie à la place de la récompense de base.
- Chaque case de minage AVEC UNE RECOMPENSE a 25% que la récompense soit une tomate pourrie à la place.
- Sur les leaderboard de social et sur UserProfile, il y a un badge de flamme qui indique que le joueur est en mode apocalypse.
- Dans ChickenDetail, (ou TeamReplacementPopup), on ne peut pas remplacer une poule (avec capacité activable) dont le cooldown n'est pas prêt.
- Le clic de l'oeuf sur Production donne 10% des oeufs qu'il donnerait à la base.
- Le clic d'oeuf blanc (et autres Spawnable qui donnent des oeufs directement) donne 10% des oeufs qu'il donnerait à la base.
- Les prix d'améliorations dans le marché sont multipliés par 2



Faire un système d'annonces/mises à jour:
Chaque user a un attribut qui stocke la dernière version à laquelle il s'est connecté. Lors de chaque login, si la version de sharedGameData est supérieure à celle du joueur connecté, alors la version du compte du joueur est corrigée. Dans ce cas, un popup apparait pour informer des infos de la dernière mise à jour.
Système de pages d'annonces/mises à jour:
FRONT-END :
https://app.chicken-haven.fr/annonces mènera à la page qui liste tous les blogs d'annonces, plus récentes en haut, plus vieilles en bas (chargement dynamique)
https://app.chicken-haven.fr/annonces/mise-a-jour-25-oct mènera donc à la page d'annonce du dossier "mise-a-jour-25-oct" stockée en back end.
Accès aux https://app.chicken-haven.fr/annonces depuis la page Social, à la place de 'Bientot', avec une preview des dernières annonces.
Chaque preview pourra avoir une image "main", stockée dans le dossier correspondant. Utiliser la preview sur le popup de mise à jour, avec le titre de l'annonce et un résumé qui sera stocké sur un autre fichier texte
BACK-END :
Stocker donc la dernière version du jeu comme dit précedemment,
Gérer dans un répertoire tous les dossiers de blogs.
Je ne sais pas quelle est la meilleure organisation, mais il faut trouver un moyen d'avoir des fichiers textes où on peut écrire en gras, mettre des tableaux, des titres, ajouter des images, etc...