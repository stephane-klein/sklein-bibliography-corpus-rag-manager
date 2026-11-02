---
source_url: https://www.youtube.com/watch?v=rk437qgR4PY
video_title: Séance 12 du 4 novembre
generated_at: 2026-09-20T17:17:01.265Z
llm:
  model: deepseek-flash
  duration_seconds: 103.6
  input_tokens: 32305
  cached_input_tokens: 0
  output_tokens: 28708
  estimated_cost_usd: 0.022071
  finish_reason: stop
  pricing:
    source: litellm
    peak: false
---

# Séance 12 du 4 novembre

## Annonces et informations pratiques

Nous reprenons, normalement le son doit être bien meilleur. J'aimerais avoir
quelques retours étudiants, n'hésitez pas à utiliser la discussion dans l'espace
de discussion. A priori le son est nettement meilleur. Je vais regarder combien
vous êtes connectés — oui, j'ai 12 personnes connectées. Est-ce que vous pouvez
me faire un retour sur le niveau sonore et sur la qualité globalement de ce que
vous voyez à l'écran ?

Je vais très rapidement partager mon PowerPoint là où on s'était arrêté la
dernière fois. J'ai remis la caméra parce que je pense que ça fait partie des
choses importantes, qu'on puisse se voir un petit peu, que vous puissiez me
voir, sachant que pour ceux qui vont regarder sur Moodle sans passer par un
smartphone, ils vont avoir un peu de mal sans doute à m'entendre. Tout est ok,
parfait, merci. Inutile de continuer parce que si vous êtes tous en train de
répondre, donc merci, c'est super.

Il se pose aussi la question de la connexion : normalement j'ai une très bonne
connexion, donc ça devrait marcher. Là je suis en wifi, si jamais ça marche pas,
vous me le dites. Ça fait plaisir de voir que tout le monde m'entend bien.

Avant de commencer le cours, le temps que tout le monde se connecte — là j'ai
116 personnes, donc ça va bientôt arriver — quelques informations. Évidemment on
est en confinement, c'est pas marrant. J'ai bien conscience que c'est pas
marrant pour vous, c'est pas marrant pour moi. J'ai fait hier une séance de TD
et franchement je trouve ça très compliqué. Je vais d'ailleurs demander — et je
pense qu'il faut respecter aussi les demandes de vos enseignants — d'allumer les
caméras, parce que faire cours sans voir les visages des étudiants c'est quelque
chose qui est très perturbant pour un enseignant. Bien sûr parfois vous ne
pouvez pas allumer votre caméra parce que soit vous n'en avez pas, soit vous
avez une mauvaise connexion internet, soit vous n'êtes pas dans un endroit qui
permet d'être filmé. Aucun souci, vous n'allumez pas tous votre caméra, mais
s'il y en a quelques-uns qui allument la caméra, ça sera vachement plus facile
pour moi pour enseigner et je pense pour certains de mes collègues.

Deuxième chose : j'ai bien conscience que tout ça va changer un peu nos systèmes
d'enseignement. N'hésitez pas à parler de vos problèmes à votre responsable
d'année qui est Macha Relle, elle est à l'écoute, elle est sensible aux
problèmes de connexion des étudiants. N'hésitez pas à aider ceux qui ne peuvent
pas se connecter correctement, n'hésitez pas à communiquer entre vous. J'ai un
étudiant qui m'a écrit parce qu'il voulait partager un lien Discord, donc moi je
pense que ça peut être une option. Il faut que vous ayez des espaces de
discussion, ça peut être aussi des comptes Facebook, des pages Facebook, des
choses comme ça. Ça me paraît plutôt sympathique que vous puissiez vous
entraîner. Je ne sais pas si l'étudiant Lucas — je crois que c'est un étudiant
de double licence matco — s'il veut partager son lien Discord dans l'espace de
discussion, aucun souci qu'il le fasse. L'idée c'est vraiment que vous vous
entraidiez.

Autre chose par rapport à l'IAE — c'est valable uniquement pour ce cours-là,
c'est pas forcément valable pour les autres cours — nous avons décidé
collectivement avec les autres enseignants chargés de TD de ne pas faire la
première évaluation sur table qui était prévue soit pour cette semaine, soit
pour la semaine dernière. Je sais que les étudiants de matco ont commencé avant
et eux ils ont déjà eu l'évaluation, c'est très bien. On verra s'il est possible
de faire une évaluation en présentiel au mois de décembre pour le dernier TD,
mais évidemment on est un peu dans l'incertitude : est-ce que le confinement va
se durcir ou au contraire s'assouplir ? Nous avons pour l'instant les garanties
que des examens terminaux pourront se faire au mois de janvier, donc ça c'est
très important. Nous demandons à ce que les examens terminaux se fassent en
présentiel parce que sinon en distanciel ça pose plein de problèmes : ça pose
des problèmes d'équité entre les étudiants, d'égalité de traitement, et ça c'est
illégal évidemment. Ça vous donne le sentiment que c'est injuste, et puis par
ailleurs c'est pas des bonnes conditions d'examen. Ce sur quoi j'insiste, c'est
donc qu'on va faire des examens en présentiel pour l'IAE, et il sera peut-être
possible de faire des évaluations de TD en présentiel aussi.

Moi je suis assez réticent avec l'idée de faire des évaluations de TD en
distanciel pour des raisons d'équité entre les étudiants. On ne sait pas qui est
derrière son écran pour répondre, on ne sait pas si vous êtes à plusieurs ou si
vous êtes tout seul. La triche — moi par exemple que vous alliez sur internet,
ça me dérange pas, je peux faire un sujet pour qu'il soit compatible avec le
fait que vous ayez accès à vos cours et internet, ça c'est pas un problème. Le
problème c'est si vous êtes à plusieurs en train de vous aider et de vous donner
des réponses, ça évidemment ça pose un problème. On l'a vu l'année dernière
quand on a fait des examens en distanciel : le taux de réussite a bondi, et on
ne s'est pas dit que le taux de réussite avait bondi parce que les étudiants
étaient devenus soudainement meilleurs à cause de l'enseignement distanciel,
c'est évidemment pas ce qui est arrivé. Donc nous allons faire en sorte d'avoir
des examens en présentiel pour l'IAE, et nous allons essayer d'organiser — et ça
c'est pas garanti — des examens en présentiel aussi pour les TD. Si jamais c'est
pas possible de faire examen en présentiel, on verra ce qu'on fait, tout n'est
pas tranché, on va en discuter plus tard. Pour l'instant venez en TD, nous
continuons de faire l'appel, continuez de préparer vos séances de TD, mettez-les
sur l'espace Moodle de votre groupe de TD, c'est très utile pour interagir avec
vos enseignants, vos chargés de TD. En ce qui me concerne, et je pense que
d'autres chargés de TD vont être un peu sur la même ligne, j'aimerais bien que
vous ayez la caméra branchée, en tout cas pour une partie des étudiants, parce
que faire TD sans voir les visages, sans voir si c'est compris ou pas compris,
je trouve ça très difficile.

Dernier point : j'ai un peu changé Moodle comme vous avez vu, j'ai rajouté les
groupes pour chaque TD. J'ai aussi changé le format des vidéos, maintenant ça
sera des vidéos YouTube. Pourquoi YouTube ? Parce que c'est très facile
d'accéder à YouTube avec un smartphone ou avec n'importe quoi, vous pourrez
toujours avoir en différé. Je ne vais pas les supprimer ces vidéos, je vais les
garder jusqu'aux examens. Bien sûr à vous ensuite de faire en sorte de ne pas
prendre de retard et d'essayer d'être en direct. Je vois qu'il y a plus de 200
étudiants qui sont en direct, c'est pas mal, mais sachez que comme vous le savez
on est 400 normalement, donc ça veut dire qu'il y a quand même la moitié de la
promotion qui n'est pas en direct. Pour ceux qui ont un smartphone, je le redis,
maintenant qui ne voient pas l'écran, qui voient juste mon visage, vous aurez la
possibilité de voir à la fois le PowerPoint et mon visage sur la vidéo en
différé. C'est la raison pour laquelle les smartphones — si vous n'avez pas le
PowerPoint et si ça vous pose un problème, et je pense que ça pose un problème
pour voir — vous pourrez tout à fait suivre le cours sur YouTube avec à la fois
le PowerPoint d'un côté et la petite vidéo de moi qui parle de l'autre côté.
J'ai voulu vraiment garder moi qui parle à côté parce que je pense vraiment que
c'est plus convivial et ça vous permettra de mieux suivre le cours plutôt qu'un
truc en PowerPoint. Donc si vous avez des remarques, n'hésitez pas à les envoyer
sur le forum de discussion.

## Reprise du cours : chapitre 4 — La consommation des ménages

Nous allons immédiatement commencer le cours. Nous étions... ah oui, ça c'est
mon chat, je vous présente Iglou. Iglou va gentiment me laisser faire cours
parce que c'est évidemment le cas typique de ce genre de truc où on fait des
cours chez soi.

Donc reprenons là où c'était arrêté. On est dans le chapitre 4. Ah oui, là aussi
beaucoup d'étudiants ont râlé : le chapitre 4 n'est pas en ligne. Le chapitre 4
maintenant est en ligne, mais vous comprenez bien que j'ai beaucoup de choses à
faire en ce moment, préparer tous les cours en ligne, ça demande tout le
weekend. Et puis par ailleurs j'ai eu aussi à organiser beaucoup de travail de
mes collègues — j'ai été désigné, enfin élu juste avant les vacances, vice-doyen
à la pédagogie de toute la Faculté de Droit Économie. Donc ça veut dire que je
suis sur la brèche depuis jeudi dernier et donc je n'ai pas pu mettre en ligne
et retravailler le chapitre 4. C'est l'effet là, je l'ai fait juste tout à
l'heure et il est sur Moodle, chapitre 4, vous pouvez le télécharger si vous
voulez l'avoir à côté.

## La consommation des ménages : pourquoi et comment

Donc chapitre 4 : la consommation des ménages. On essaie de comprendre le
mécanisme de consommation des ménages. Un indicateur qui est très intéressant —
déjà pourquoi est-ce que nous parlons de la consommation des ménages ? Parce que
la consommation des ménages c'est une composante extrêmement importante de ce
qu'on appelle la demande globale, c'est-à-dire la demande qui est adressée à
l'ensemble de l'économie. Et cette demande globale, c'est ce qui traduit en fait
la production des entreprises et donc le niveau du PIB. Souvenez-vous, vous
verrez dans la fin du cours que j'avais expliqué que la production, c'est-à-dire
le PIB, c'est-à-dire grand Y, est égal en fait à l'offre globale qui est
elle-même égale à la demande globale. Or quand on regarde qu'est-ce qui compose
la demande globale, on s'aperçoit que c'est très majoritairement la consommation
des ménages. En France, c'est 58 %. Là aussi je vous renvoie aux chiffres qu'on
a vus au chapitre précédent.

Une parenthèse parce que j'oublie de le dire : la vidéo du début du dernier
cours n'est toujours pas récupérée par Thomas Donadieu qui s'occupe de cela. Je
vais attendre de voir s'il arrive à la récupérer parce que j'aimerais bien
pouvoir vous la mettre. Si par contre c'est pas possible, ce que je ferai c'est
que je referai une vidéo, parce que je tiens à ce que vous ayez tout le cours en
vidéo, et puis pour moi aussi ça serait quand même satisfaisant qu'il ne manque
pas une heure. Donc je referai ce cours tout seul et je le remettrai en vidéo
sur l'espace Moodle, sur YouTube et sur l'espace Moodle. Donc c'est important
qu'on comprenne la consommation des ménages, ce qui détermine la consommation
des ménages, parce que derrière ce chiffre-là il y a la demande adressée aux
entreprises, et donc il y a la croissance. C'est la raison pour laquelle on
s'intéresse à cela.

### Pourquoi les ménages consomment

L'idée ici c'est de comprendre pourquoi les ménages consomment et qu'est-ce
qu'ils consomment. Pourquoi les ménages consomment ? Premièrement, il faut bien
comprendre qu'ils peuvent choisir de consommer ou d'épargner. Je m'étais arrêté
avant les vacances sur cette idée-là : tout revenu des ménages peut être soit
consommé, soit épargné. Cette épargne consiste en trois branches. Tout ce qui
est sur le livret, le compte des gens, c'est-à-dire tout ce qui est prêt à
dépenser mais qui n'est pas encore dépensé. Tout ce qui est épargné au sens
strict, c'est-à-dire qui est sur un livret d'épargne, ou qui est épargné d'un
point de vue financier, c'est-à-dire qu'on va acheter des actions, des
obligations, des titres financiers — donc on peut avoir un plan d'épargne en
actions, typiquement un PEA. Donc tout ça correspond à l'épargne : ce qu'on
appelle les liquidités, l'argent immédiatement disponible qu'on a sur son compte
; l'épargne au sens strict, c'est-à-dire tout ce qu'on a mis de côté, que ce
soit des livrets A, des choses comme ça, ou des comptes à terme, tout un
ensemble d'instruments d'épargne qui là aussi sont assez facilement disponibles
à la consommation pour ce qui est des livrets A, mais parfois moins disponibles
lorsqu'il s'agit d'épargne placée en titres financiers, où là il faut revendre
des titres pour pouvoir retrouver son argent. Et puis il y a un dernier élément
de l'épargne des ménages : c'est l'épargne en logement. Je m'étais arrêté
là-dessus, c'est-à-dire les remboursements d'emprunt, ce qu'on appelle les plans
d'épargne logement, les PEL, ou les comptes d'épargne logement. On a des
instruments comme ça qui sont ce qu'on appelle de l'épargne en logement et qui
de fait n'est pas consommée, parce qu'en fait toutes ces dépenses de
remboursement d'emprunt immobilier et cetera ne vont jamais dans la
consommation, ils vont dans l'investissement, puisque comme vous le savez
construire une maison ça correspond à l'investissement des ménages.

Donc ce qui est intéressant c'est de voir comment les ménages réagissent par
rapport à leurs revenus : quelle part de leurs revenus ils vont consacrer à la
consommation et quelle part de leurs revenus ils vont consacrer à l'épargne,
c'est-à-dire à ne pas consommer.

### La propension moyenne à consommer

Cet indicateur qui représente cette propension des ménages à consommer, c'est ce
qu'on appelle justement la propension à consommer. Et la propension à consommer,
d'abord on peut la calculer en regardant en moyenne ce que l'ensemble des
ménages ont consommé de leurs revenus. C'est la petite formule qui est ici :
propension moyenne à consommer, c'est égal à dépenses de consommation des
ménages, C, divisé par RDB, le revenu disponible brut des ménages. Ça je vous
renvoie aussi au chapitre 3 où on a les chiffres pour l'économie française.
Alors évidemment c'est un ratio, donc ça s'exprime en pourcentage — forcément,
enfin on va voir que c'est pas forcément le cas tout le temps, mais c'est
souvent le cas. La consommation des ménages est inférieure à leur revenu
disponible. Alors c'est possible que la consommation des ménages soit supérieure
au revenu disponible ; dans ce cas ça veut dire que les ménages sont endettés,
donc ils ont une épargne négative. Et c'est tout à fait possible, on a des
économies parfois, ou à certains moments de leur histoire, notamment aux
États-Unis, on a pu avoir une épargne négative parce que les ménages ont
davantage dépensé qu'ils n'avaient de revenu via l'emprunt. Mais évidemment
c'est des cas exceptionnels et très rares. En général on a une proportion
moyenne à consommer qui est inférieure à 100 %, donc inférieure à 1.

Dans l'exemple que je vous montre ici sur la diapositive, c'est une PMC de 0,7.
Donc ça veut dire que les ménages, sur une durée d'un an — on calcule en général
de manière annuelle cette proportion moyenne à consommer — ont consommé 70 % de
leurs revenus. Bien sûr c'est une moyenne : il y a des ménages qui peuvent avoir
davantage consommé que leurs revenus, ils peuvent s'être endettés, d'autres qui
peuvent avoir très peu consommé. Donc évidemment quand on a une PMC, une
proportion moyenne à consommer de 0,7, ça veut dire qu'on a une proportion
moyenne à épargner — je ne l'ai pas mis ici mais c'est l'inverse — de 0,3,
c'est-à-dire qu'on va épargner 30 % de son revenu. Ça c'est le premier
indicateur qu'il faut bien connaître, qui mesure en quelque sorte la proportion
des ménages en moyenne à consommer leurs revenus.

### La propension marginale à consommer

On a un autre indicateur qui est intéressant : c'est la propension marginale à
consommer. C'est un indicateur qui est un peu plus difficile, technique à
comprendre, mais vous allez voir quand on va le comprendre il est très très
intéressant. Qu'est-ce que ça signifie ? Ça signifie de s'intéresser non pas à
l'ensemble des revenus et la proportion qu'on a de consommer l'ensemble de ces
revenus, mais à regarder la hausse ou la baisse des revenus et de voir, en
général en cas de hausse des revenus, ce qui va se passer en termes de hausse de
consommation. L'idée est la suivante : si on vous donne demain 100 €, donc vous
avez tout d'un coup des revenus qui s'accroissent, qu'est-ce que vous allez
faire de ces 100 € ? Vous n'allez peut-être pas les consommer de la même façon
que vos revenus courants normaux. Et donc ça c'est ce qu'on appelle la
propension marginale à consommer : quand vous avez une hausse à la marge de vos
revenus, vous avez plus 100 € de revenu, comment ces 100 € vont être utilisés en
termes d'épargne ou de consommation ?

Donc c'est ici la définition : petit c, la propension marginale à consommer,
c'est égal à la variation de la consommation sur la variation du revenu
disponible brut. Alors Delta ici, ce delta qui est là, c'est variation.
D'ailleurs je précise : prenez des notes, en fait comme si vous étiez en cours,
vous avez un bureau et vous écrivez. Si vous êtes avachi sur votre canapé ou
dans votre lit pour m'écouter, vous allez certes trouver ça vachement
intéressant parce que mes cours sont super intéressants, mais vous allez tout de
suite oublier parce que vous n'avez pas pris de notes. Prendre des notes ça sert
à capitaliser, à inscrire dans sa mémoire le contenu de ce qu'on écoute. C'est
difficile. Alors si vous voulez faire une pause, vous mettez sur pause —
normalement en direct on peut mettre sur pause — et puis vous reprenez après, il
y a aucun souci, c'est ça l'avantage. Moi-même je ne sais pas si je ferai une
pause tout à l'heure, peut-être pas, parce que je veux quand même avancer mon
cours, mais vous, vous prenez une pause quand vous voulez.

Donc je ferme la parenthèse et je reparle de la propension marginale à
consommer, qui représente donc cette formule-là : la variation de la
consommation sur la variation de revenu. Si je reprends l'exemple de tout à
l'heure : votre grand-mère vous a donné 100 €, super, qu'est-ce que vous allez
faire de ces 100 € ? Très souvent ce qu'on constate c'est que les gens, quand
ils ont des revenus exceptionnels qui arrivent, ne vont pas forcément les
consommer, ils vont très souvent les épargner, ou en tout cas ils ne vont pas
les consommer dans la même proportion qu'ils consomment les revenus habituels.
Et donc ce qu'on constate c'est très souvent que le petit c, la propension
marginale à consommer, est inférieure à la propension moyenne à consommer.
C'est-à-dire qu'en gros les 100 € que votre grand-mère vous donne, vous n'allez
pas forcément les dépenser. Là encore c'est une règle générale qui admet de très
nombreuses exceptions, puis vous êtes libre de faire ce que vous voulez des 100
€.

Par exemple, si votre grand-mère vous dit qu'elle vous donne 100 € pour vous
aider à acheter un ordinateur pour passer le confinement, et bien là vous allez
le consommer. Et on peut même considérer que vous allez consommer — un
ordinateur qui vaut, je ne sais pas, arrivez à trouver d'occasion un ordinateur
à 200 €, et bien vous allez consommer 200 avec juste 100. Donc là vous allez
avoir une propension marginale à consommer qui sera supérieure à 1, et qui sera
ici de 2 : c'est-à-dire que vos revenus augmentent de 100 et votre consommation
elle augmente de 200. Donc il peut se passer plein de choses, la propension
marginale à consommer varie beaucoup plus que la propension moyenne à consommer.
Ou alors votre grand-mère vous donne 100 € et vous dites « je vais les garder
pour plus tard, pour passer des vacances le jour où je pourrai me déplacer parce
que je serai plus confiné », et bien dans ce cas-là il y aura zéro qui aura été
consommé, vous aurez entièrement épargné ces 100 €, et on va dire que votre
propension marginale à consommer ici sera de zéro.

Donc ce chiffre petit c — je récapitule — dans la ligne du diaporama, ça
signifie que chaque euro supplémentaire de revenu va entraîner une hausse de la
consommation de 90 centimes si petit c est égal à 0,9, de 50 centimes si petit c
est égal à 0,5. Donc vous regardez les euros supplémentaires que vous obtenez.

## Applications : comportements de consommation en période de crise

Tout ça est intéressant et permet de comprendre à l'échelle nationale ce qui se
passe dans une économie. Pourquoi je vous dis tout ça ? Parce que ce qui est
intéressant c'est que les comportements des consommateurs sont évidemment
dépendants de ce qui se passe dans la société, de ce qui se passe dans
l'économie. Concrètement en période de crise, en période de récession, que vont
faire les ménages ? Est-ce qu'ils vont davantage consommer ou est-ce qu'ils vont
davantage épargner ? On peut penser qu'en moyenne — bien sûr il s'agit d'une
moyenne — quand on a une situation d'incertitude, de crise, quand on a peur de
perdre son emploi, on ne va pas vraiment être poussé à consommer, et notamment
des biens durables qui sont très chers comme les voitures, les automobiles, les
réfrigérateurs et cetera. Ou alors la consommation peut se reporter. On va
peut-être aussi changer ses habitudes de consommation en termes de loisirs : on
va pouvoir plus facilement supprimer un certain nombre de loisirs ou de
restaurants. Autre cas pour les restaurants : le gouvernement nous ferme tous
les restaurants administrativement, forcément là on ne peut plus y aller, donc
on va se retrouver à devoir épargner. Alors cette épargne ici, c'est pas parce
que c'est un choix, c'est parce que simplement on ne peut plus consommer ce
qu'on a l'habitude de consommer parce que les magasins sont fermés, ou les
restaurants sont fermés.

Donc ce qui est intéressant c'est que quand on va suivre au cours du temps —
c'est pour ça que j'ai montré ce tableau — l'évolution de la consommation des
ménages, on va voir apparaître des moments de changement de comportement de
consommation des ménages. Et ces changements de comportement, on va les voir en
particulier apparaître dans la propension marginale à consommer. Pourquoi ?
Parce que la propension moyenne à consommer, elle ne va pas beaucoup bouger,
elle ne va pas beaucoup varier en proportion. Par contre, tout ce qui est
propension marginale à consommer, ça peut varier beaucoup : parce que ça veut
dire par exemple vos revenus augmentent, vous regardez en fait ce qui se passe
par rapport à l'augmentation des revenus et l'augmentation de la consommation.

### Construction du tableau

Avant d'expliquer le tableau, il faut essayer de montrer comment il est
construit. Tout d'abord ici, voyez, j'ai pris exprès les années autour de la
crise 2008-2009 parce que c'est ça qui me semble intéressant à étudier : donc
2005, 2006, 2007, 2008, 2009, 2010 et cetera, 2012 et puis j'ai pris les
derniers chiffres. Alors je ne voulais pas — parce que sinon j'aurais prolongé
le tableau — donc je n'ai pas pris les années intermédiaires qui sont moins
intéressantes, mais j'ai pris ici la dernière année. Comment ce tableau est
construit ? En fait il suffit de reprendre les chiffres de l'INSEE, les chiffres
que je vous ai mis dans le chapitre 3 sur l'économie française. Et dans ces
chiffres vous avez premièrement le revenu disponible brut — donc revenu DB ici,
revenu disponible brut — qui est le revenu des ménages après… Alors là aussi ça,
il faut que ça vienne des automatismes, donc je vous invite à le noter sur votre
feuille pour bien l'ancrer dans votre mémoire : comment on calcule le revenu
disponible brut ?

Premièrement on va ajouter tous les revenus primaires. Les revenus primaires,
c'est quoi ? C'est les revenus du travail, les salaires ; c'est les revenus du
capital — alors les revenus du capital, c'est les intérêts par exemple de
l'épargne qu'on a placée sur les marchés financiers, c'est les revenus de la
propriété, ça peut être aussi les revenus des logements qu'on a loués par
exemple à des étudiants. Donc les revenus du capital c'est tous les revenus de
son patrimoine en quelque sorte, que ce soit financier ou immobilier ou d'autres
— si vous avez des actions d'entreprise vous êtes sociétaire, voilà, d'une SARL
par exemple, et bien vous avez à la fin de l'année des revenus qui sont partagés
entre tous les sociétaires. Donc premièrement revenu du travail, deuxièmement
revenu du capital, c'est-à-dire du patrimoine en quelque sorte immobilier ou
financier. Et puis troisièmement on a, souvenez-vous, des revenus qui sont dits
des revenus mixtes, c'est-à-dire dans lesquels on ne peut pas dissocier la part
du travail et la part du capital. C'est tout le cas des professions libérales,
des agriculteurs, des commerçants, des artisans. Donc tout un ensemble de
personnes qui ont une entreprise en fait, qui produisent mais dont on ne sait
pas s'il s'agit de revenus de capital et du travail, donc on appelle ça les
revenus mixtes. Donc on rajoute les trois sommes de revenus — c'est ce qu'on
avait fait dans le chapitre 3 — et donc ça nous fait les revenus primaires. Mais
ça c'est pas le revenu disponible brut.

Ensuite il faut enlever les impôts directs, c'est-à-dire tous les impôts qu'on
va payer : la CSG, l'impôt sur le revenu et cetera, les taxes d'habitation,
taxes foncières, tous ces impôts directs qu'on paye, il faut les enlever. Et ça
donne en quelque sorte un revenu inférieur, bien sûr, parce que c'est le revenu
primaire moins les taxes. Et puis ensuite il faut rajouter toutes les
subventions qu'on reçoit, les allocations qu'on reçoit plutôt : les allocations
familiales, les bourses pour les étudiants par exemple, les retraites — parce
que ça correspond au volume le plus important de la redistribution de l'État,
c'est les retraites, parce que tout un ensemble de retraités n'ont plus de
revenus du travail, ils peuvent avoir des revenus de capital encore bien sûr,
mais ils bénéficient en même temps d'une retraite. Et donc ça nous donne le
revenu disponible brut, c'est-à-dire ce qui reste une fois qu'on a enlevé les
taxes et qu'on a rajouté les allocations et les retraites. Donc c'est comme ça
qu'on calcule.

Ensuite, deuxième chiffre ici : les dépenses de consommation. Ici souvenez-vous,
c'est bien les dépenses de consommation, c'est-à-dire ce qui est acheté sur le
marché. Et souvenez-vous, la consommation effective des ménages — là aussi
marquez-le si c'est pas clair, il faut que ce soit clair parce que ça fait
partie des choses très importantes qu'il faut comprendre en économie — pour la
consommation effective des ménages, c'est tout ce que le ménage consomme
effectivement, quelle que soit la personne qui a financé cette consommation. On
pense toujours, et on a tort, que la consommation des ménages c'est ce que les
gens achètent. Oui, c'est la très grande majorité de la consommation des
ménages, ce que vous achetez dans un magasin, ou par exemple vous louez un
logement, bah c'est la consommation aussi, vous achetez un service de location.
Mais il faut aussi prendre en compte dans la consommation des ménages toute la
consommation qui vous est donnée, distribuée au ménage, qui n'a pas été payée
par vous, qui a été payée par d'autres. Alors typiquement c'est bien sûr les
services publics dont vous pouvez bénéficier en tant que consommation — ce qui
veut dire pas l'éclairage des rues, pas les services collectifs, pas la justice,
l'armée et cetera, tout ça c'est des services collectifs, c'est pas la
consommation des ménages — mais par contre la santé, l'éducation, le fait que je
vous fais un cours aujourd'hui que je ne vous demande pas de payer à la fin —
même si vous voulez donner un peu d'argent je vous donnerai volontiers mon
compte PayPal, non je rigole. Donc toute cette consommation que vous avez, qui
n'est pas financée par vous, qui est financée par l'État, tout ça fait partie de
la consommation effective des ménages. Et puis troisièmement, souvenez-vous
qu'il y a une partie de la consommation effective des ménages qui n'est pas
d'origine publique, qui est les associations caritatives qui vous aident sans
que ce soit forcément un don des institutions publiques : donc les Restos du
Cœur, Secours populaire, Secours catholique et cetera. Donc voilà, on a la
consommation effective des ménages qui comprend à la fois la consommation dite
marchande, celle que vous achetez sur les marchés, et la consommation dite non
marchande, celle dont vous bénéficiez et que vous n'avez pas payée.

Bon, ici ce qui intéresse c'est la consommation marchande. Mais j'insiste, ce
n'est pas l'ensemble de la consommation des ménages, c'est une partie
majoritaire mais pas l'ensemble. Donc c'est ce que les gens vont acheter, parce
que ce qui nous intéresse c'est ce qu'ils font de leurs revenus. Donc on va
mettre ici les dépenses de consommation des ménages uniquement. Et là aussi
reprenez les chiffres du chapitre 3, vous verrez qu'on a les dépenses pour 2018
qui sont de 1220 milliards d'euros pour l'ensemble des ménages, ça fait
beaucoup.

### Calcul de la PMC et du petit c

Donc on a ces deux chiffres, et maintenant il faut calculer la proportion
moyenne à consommer et la proportion marginale à consommer. Alors la proportion
moyenne à consommer, c'est très simple : on prend le revenu disponible brut des
ménages — 1106, non excusez-moi — on prend la consommation finale des ménages,
946, et on divise par le revenu disponible brut des ménages, et on trouve ici
0,86. Donc ça veut dire 86 %. Ça veut dire que chaque euro de revenus pour les
ménages entraîne en moyenne une dépense de 86 centimes.

Et puis ensuite on a petit c, petit c c'est la proportion marginale à consommer.
Alors pour la calculer il faut regarder la variation de la consommation et la
variation du revenu disponible brut. Alors ici on ne peut pas le faire parce
qu'il faut voir la variation avec l'année précédente, or l'année 2004 n'est pas
présente ici, donc on ne va pas pouvoir la calculer, la proportion marginale à
consommer. Donc il faut attendre d'être en 2006. Ici vous voyez on est en 2006,
et donc en 2006, comment fait-on pour calculer le petit c ? Et bien on regarde
la variation de la consommation — là aussi de tête on va y arriver — on est
passé de 946 à 987, donc ça veut dire qu'on a 41 milliards qui ont été consommés
en plus, 41 milliards de consommation en plus. Combien de revenus en plus ? Ah
bah ça c'est facile : 1156, 50 milliards de revenus en plus pour les ménages.
Donc qu'est-ce qu'on constate ? Et bien qu'on a consommé 41 de plus alors qu'on
avait 56 de plus. Donc on fait 41 / 56 et là on a une proportion marginale à
consommer entre 2005 et 2006 qui est de 0,82. Voilà, 41 divisé par 50 ça fait
0,82 si vous prenez votre calculatrice. Et donc vous allez pouvoir retrouver
ainsi tous ces chiffres de petit c.

Maintenant qu'on a compris comment le calcul se fait — notez-le si c'est pas
clair — donc PMC c'est facile, c'est ici, petit c c'est là. Mais ici dans le
tableau on regarde la variation de la consommation et la variation des revenus
en regardant par rapport à l'année précédente. Alors on fait toujours ça par
rapport à l'année précédente. Bien sûr on peut regarder la variation des revenus
entre 2010 et 2005 par exemple sur 5 ans, on peut le calculer. Après, est-ce que
c'est pertinent ? Et bien non, parce que ça montre une évolution sur 5 ans, ce
qui n'est quand même plus tellement conjoncturel, ce qui est quand même assez
long comme écart, car tout est possible. Alors c'est la raison pour laquelle en
2017 ici, quand je reprends les chiffres, je n'ai pas calculé de variation de
consommation parce qu'on ne peut pas, parce qu'on n'a pas l'année 2016, donc on
ne peut pas calculer la proportion marginale à consommer.

Alors je répète : proportion marginale à consommer, petit c ; proportion moyenne
à consommer, on va appeler PMC. Ce sont deux chiffres différents. Ils ne sont
pas liés l'un à l'autre, ils sont différents, ils se calculent différemment et
ils ne disent pas les mêmes choses.

### Analyse du tableau : les effets des crises

Ce qui nous intéresse pour regarder la conjoncture économique, le sentiment, le
moral des ménages, ce qui va être intéressant c'est de regarder la proportion
marginale à consommer, puisque si on regarde la proportion moyenne à consommer
on voit qu'elle est très très stable : on a 0,86, 0,85, 0,85, 0,85, 0,84, 0,84,
0,85, 0,85. Bref, qu'est-ce que vous voulez dire comme analyse là-dessus ? On ne
peut pas dire grand-chose. Un économiste va dire « bon bah la proportion moyenne
à consommer des Français, 0,85 », voilà, mais ça ne renseigne pas grand-chose.

Imaginons que vous voulez faire une politique de relance — c'est ce qui est
intéressant, c'est ce que le gouvernement veut faire aujourd'hui. Il dit « bon
ça va pas, les entreprises sont en situation catastrophique à cause de la
situation actuelle, on peut le comprendre, il faut que les ménages arrêtent
d'épargner et il faut qu'ils consomment leur épargne ». Donc ils vont essayer de
mettre des aides aux ménages, ce qu'ils ont fait d'ailleurs. Concrètement le
chômage partiel c'est une aide massive qui a coûté très cher. Peut-être vos
parents ou vous-même vous êtes au chômage partiel. Si vous êtes au chômage
partiel, que se passe-t-il ? Et bien on vous paye et puis vous ne travaillez pas
parce que vous ne pouvez pas travailler, parce que par exemple votre magasin est
fermé. Donc l'idée de donner de l'argent comme ça, c'est évidemment de compenser
les fermetures administratives des magasins, mais c'est aussi de permettre aux
gens de continuer de consommer. Sauf que est-ce que c'est parce qu'on leur donne
de l'argent qu'ils vont entièrement consommer le revenu ? Et bien peut-être pas.
Et donc c'est intéressant de voir ce que les gens font avec de l'argent qu'ils
ont en plus. Alors ici c'est pas l'argent qu'ils ont en plus dans le chômage
partiel, c'est des compensations, et même parfois c'est de l'argent en moins,
mais globalement d'autres peuvent aussi avoir de l'argent en plus. On parle
d'une augmentation de 150 € pour les étudiants qui ont les APL, c'est pas
énorme, hein, 150 € ça ne vous permettra pas d'acheter un ordinateur, mais enfin
bon c'est déjà mieux que rien. Et la question est : qu'est-ce qu'ils vont faire
les étudiants avec ces 150 € ? Donc c'est là qu'on va regarder la proportion
marginale à consommer.

Ce qui est intéressant aussi c'est de voir comment tout ça évolue en fonction
des crises économiques. Ce qui est intéressant c'est que les années 2008-2009
sont justement des années de crise, et 2010 une année de reprise, et puis
ensuite 2011-2012 on va à nouveau avoir une année de crise. Donc que se
passe-t-il ? Si on reprend les années normales, on a une proportion marginale à
consommer qui est, vous voyez, comme je l'ai dit, un peu inférieure à la
proportion moyenne à consommer, ce qui est normal en moyenne, mais pas tellement
différente de la proportion moyenne à consommer. Quand on a plus de revenus, on
a parfois du mal à trouver des moyens de les consommer. Si un jour — vous vous
souviendrez de ça — quand vous aurez terminé vos études et vous trouverez vos
premiers emplois, vos revenus vont exploser : vous avez tout d'un coup des bons
salaires, surtout si vous avez terminé votre M2 et que vous trouvez un bon
emploi. Là vous allez passer d'un revenu de je ne sais pas, 600-700 € par mois
si vous avez un logement, à un revenu de 2000 € par mois, 2500 €. Évidemment ça
change vos habitudes, et au début vous allez avoir des scrupules à aller au
restaurant, à dépenser de l'argent parce que vous n'avez pas l'habitude de
dépenser de l'argent. Donc vous allez vous retrouver avec une épargne énorme au
bout d'un an, et vous allez dire « mais qu'est-ce que je vais faire de tout ça ?
» Et puis très vite vous allez voir que vous allez prendre des bonnes habitudes
— c'est-à-dire des mauvaises — c'est-à-dire vous allez commencer à dépenser
votre argent de plus en plus jusqu'à retrouver une proportion moyenne à
consommer de à peu près 0,85, comme l'ensemble, la moyenne des Français. Une
chose d'ailleurs qui va faire consommer davantage, c'est que vous allez vous
dire « tiens qu'est-ce que je vais faire de tout cet argent ? Ah bah tiens, si
j'achetais un appartement, une maison ou un truc comme ça ». Dès que vous allez
commencer à acheter une maison, alors là tout d'un coup votre consommation va
beaucoup augmenter et vous allez trouver des choses à faire avec votre argent.
Et bien sûr c'est pareil — on reviendra — si vous avez des enfants, là aussi ça
va commencer à augmenter beaucoup votre consommation.

Donc si je reviens sur le tableau, ce qui est intéressant c'est de voir ce qui
se passe. En période normale, voyez, jusqu'en 2008 on a une proportion marginale
à consommer qui est proche mais inférieure à la proportion moyenne à consommer,
aucun souci, on est en période normale. Et puis à partir de 2008 on va arriver à
une période pas normale. Regardons ce qui se passe en 2008 : vous voyez,
bizarrement on est au moment du début de la crise et on a une hausse de la
proportion marginale à consommer. Pourquoi cette hausse ? Regardons ce qui s'est
passé avant. En 2006-2007 on avait une hausse — et puis c'est pareil en
2005-2006 — on avait une hausse du revenu brut des ménages qui était de 56, de
1156 à 1216 ; avant c'était 50, donc plus 50, plus 60. Là tout d'un coup la
crise commence et là la hausse des revenus est plus faible : en 2008, voyez, on
est ici non pas à 50 ou 60 mais à 38. Donc déjà c'est plus faible, donc on voit
un premier effet de la crise : la baisse des revenus. Et en même temps, quand on
regarde la hausse des dépenses de consommation — ici souvenez-vous on était à
41, ici on est à 32 — plus 13 ça fait 50, 53, hein, 41, 53. Donc on voit une
hausse de la consommation importante. Puis voyez que là finalement on est à 32 à
67, et bien on est plus faible. Donc on a eu à la fois une baisse de revenus —
et enfin une baisse de la hausse des revenus plus précisément — et une baisse de
la hausse naturelle des dépenses de consommation finale, puisque là on est passé
non pas à 40 ou 50, 48 tout à l'heure, on était je crois — je ne sais plus
combien — 13 plus non, 45 c'est ça. Là maintenant on est à 35. Donc on a quand
même baissé un peu, mais les revenus ont baissé plus vite que les dépenses de
consommation n'ont augmenté — enfin la hausse des revenus a plus baissé que la
hausse des dépenses de consommation. Ce qui veut dire que globalement on va se
retrouver avec une PMC, proportion moyenne à consommer, ici en 2008, qui est
plus importante que la moyenne. Donc 0,92. Pourquoi ? Parce que les gens avaient
l'habitude d'augmenter leurs dépenses de consommation et leurs revenus ont
augmenté moins vite que prévu, et donc ils se retrouvent à voir une proportion
marginale à consommer qui a augmenté mais qui est inférieure à 1 tout de même.

Et puis voilà, là il se passe un truc en 2009, un truc assez intéressant,
puisque les revenus ont quasiment pas augmenté : les ménages sont passés de 1254
à 1255, ils ont augmenté de 1 milliard, c'est rien du tout. Et ça c'est un effet
de la crise évidemment. Et les dépenses de consommation, elles, ont baissé : on
est passé de 1067 à 1052. Et ça aussi c'est là qu'on voit les effets de la
crise. C'est-à-dire que là en 2009 les gens commencent à se rendre compte qu'il
y a une crise ; en 2008 ils n'en ont pas encore conscience, donc ils continuent
d'augmenter leurs dépenses de consommation au rythme d'avant, même si leurs
revenus globalement n'ont pas augmenté autant que prévu. Et là, bah, les revenus
ils augmentent plus que de 1 milliard, c'est rien du tout, ça ne se voit pas. Et
puis par ailleurs comme la population a augmenté, on peut penser que par unité
de consommation les revenus moyens des gens ont baissé. Et donc que se
passe-t-il ? Et bien la consommation s'effondre de -15. J'ai vu votre question,
je ne peux pas faire grand-chose, hein, la vidéo sera disponible et normalement
elle sera meilleure ; la vidéo sera disponible sur YouTube. Après il n'y aura
pas de désynchronisation — quelqu'un m'a dit qu'il y a une désynchronisation
entre l'explication et le diaporama.

Donc les dépenses de consommation finale des ménages ont baissé de -15 : de 1077
à 1052. Et les revenus ont augmenté de 1. Donc on a forcément on va se retrouver
avec -15 divisé par 1, ça fait -15. Donc on a une proportion marginale à
consommer de -15.

Et puis après 2010, 2010 année de reprise. Alors on la voit la reprise : voyez
dans le revenu disponible brut des ménages, +30, on est passé de 1255 à 1285. Et
pareil on voit une hausse de la consommation de +30. Le monde économique ne
s'est pas effondré malgré la crise, et donc on voit une hausse de la
consommation, mais cette hausse de la consommation finalement elle va quand même
être plus lente, puisque on se retrouve avec une proportion moyenne à consommer
de 0,84. Donc la reprise va être moins forte que n'a été l'effondrement,
puisqu'on est passé de proportion moyenne à consommer de 0,85 à 0,84. Et ça va
perdurer jusqu'en 2012, où là on va se retrouver avec une proportion marginale à
consommer qui va vraiment cette fois-ci augmenter. 2012, c'est manifestement une
bonne année pour les ménages, puisque vous voyez que... alors non, c'est pas une
bonne année pour les ménages, excusez-moi, je suis en train de dire des bêtises,
c'est une deuxième crise. Puisque 2010-2011 c'est les années de reprise. Alors
voyez on les voit : 2010 forte reprise, plus 30 milliards — enfin forte reprise,
on était à +50 avant ; 2011 on est à 1311, donc on a 15 + 11, on est à 26. Donc
là encore une croissance mais pas très forte, mais la consommation elle est
assez forte, hein, on consomme quasiment tous les revenus supplémentaires qu'on
a. Et puis 2012, là, alors c'est pas comme en 2009 où on n'avait plus que 1
milliard de plus, là mais là on n'a pas grand-chose, on a 7 milliards de plus.
Et pourtant la consommation elle va davantage augmenter, elle va augmenter de
11. Donc là on va se retrouver à nouveau avec une proportion marginale à
consommer de 1,57.

Mais ce qu'il faut bien comprendre c'est que... oui, alors qu'est-ce qui s'est
passé en 2012 ? Et bien c'est les conséquences des politiques d'austérité.
François Hollande est arrivé au pouvoir, qu'est-ce qu'il a fait ? Et bien il a
essayé de rétablir les comptes publics, et donc pour cela il a supprimé — et ce
qui lui a été beaucoup reproché — la défiscalisation des heures supplémentaires,
et puis il a aussi gardé le gel des salaires des fonctionnaires, il a donc quand
même mené une politique d'austérité, il a augmenté les impôts déjà à ce
moment-là, et ça aussi ça lui a été beaucoup reproché. Et donc bah vous voyez
que ça va faire que les revenus disponibles bruts des ménages ont peu augmenté,
les dépenses de consommation ont davantage augmenté que les revenus, donc on a
un petit c à plus de 1. Mais on voit que quand même la hausse de la consommation
est moins forte que dans les années 2005-2006.

Si on regarde la période toute récente, et bien on est dans une situation qui
n'est pas encore revenue à 2005-2006. Souvenez-vous 2005-2006, on a plus 50,
plus 60 milliards de revenus disponibles bruts des ménages ; là on est à plus
31. Donc on est encore dans une croissance faible, les dépenses elles augmentent
ici de 29, donc on voit un petit c qui est supérieur à 0,85 : 0,94. Voilà, on
est revenu un peu à l'état normal. Ce qui sera intéressant — mais ça sera pour
les autres étudiants, enfin les étudiants des autres années — ce qui sera
intéressant c'est de voir ce qui va se passer en 2020 comparé à 2019. Donc là je
vais bien m'amuser à regarder cette crise et même à comparer peut-être la crise
de 2020 avec les crises de 2009, sachant qu'en plus cette crise elle pourrait se
prolonger en 2021 parce qu'il va y avoir un gros chaos.

### Consommation et inflation

Alors la bonne question : la consommation des ménages dépend-elle de l'inflation
? A priori non, notamment dans la période récente où on a des taux d'inflation
qui sont en fait assez faibles, qui sont entre 0 et 2 % sur toute cette
période-là, on a quasiment pas d'inflation. Si on avait une inflation à 30 ou 40
%, là alors qu'est-ce que ça ferait sur la consommation des ménages ? Sans doute
que ça aurait pour conséquence plutôt d'augmenter la consommation des ménages.
Alors c'est un peu paradoxal, mais quand les prix augmentent, qu'est-ce que vous
faites de votre argent ? Vous n'allez pas l'épargner en fait, parce que vos
capacités d'achat vont baisser. Il vaut mieux acheter maintenant quelque chose
dont les prix augmentent que d'attendre 6 mois et l'acheter plus tard quand il
sera plus cher. Et donc quand il y a une inflation forte mais pas excessive,
c'est-à-dire 10 %, 15 % — c'est arrivé dans l'histoire française d'avoir des
inflations à plus de 10 %, c'est arrivé à la fin des années 70, début des années
80 — ça ne s'est pas forcément traduit par un effondrement de la consommation,
et j'aurais tendance à penser au contraire que lorsqu'on sait que les prix vont
augmenter, on a tendance à acheter maintenant pour éviter d'acheter plus cher
plus tard.

Par contre si vous avez ce qu'on appelle une hyperinflation, c'est-à-dire une
inflation qui augmente de plus de 50 %, de plus de 100 %, comme par exemple vous
avez au Venezuela ou au Zimbabwe, ou dans certains pays comme il y a eu en
Allemagne en 1923, une hyperinflation, alors là ça peut quand même totalement
déstabiliser les comportements et là ce que vous allez faire c'est que vous
allez vous tourner non pas vers... vous ne cherchez pas à dépenser l'argent que
vous recevez, hein, vous cherchez à le dépenser le plus vite possible c'est
vrai, mais une grande partie de l'argent que vous avez, vous allez chercher à
acheter des choses qui ne vont pas perdre de la valeur, par exemple de l'or, des
métaux précieux, voire des bâtiments. Et donc ça ne va pas susciter la
consommation, c'est-à-dire que concrètement quand vous achetez de l'or, et bien
en fait vous stérilisez un peu votre argent, vous le mettez dans des lingots
d'or comme ça, vous avez une épargne, mais cette épargne, et bien vous ne
pourrez pas la dépenser pour consommer. Et donc ça peut nuire beaucoup à la
consommation, et ça peut entraîner une crise économique forte. Une
hyperinflation est très dangereuse pour l'économie, mais une inflation modérée
n'est pas forcément dangereuse, elle peut même favoriser la consommation et donc
favoriser l'économie, la demande globale, donc l'offre globale, et cetera.

## Les déterminants de la consommation : élasticité prix

Si vous avez des questions, voyez, je les vois quand elles apparaissent sur mon
écran, donc les questions je les vois, je peux les lire, si jamais c'est à
propos, je peux y répondre.

Une chose qui nous intéresse justement c'est de savoir qu'est-ce qui fait varier
la consommation des ménages, qu'est-ce qui va faire qu'un ménage va choisir de
plus consommer ou de moins consommer. Alors bien sûr deux choses sont
importantes dans la consommation des ménages : le prix — mais alors ici je ne
parle pas des prix en général, je parle du prix de l'objet dont il est question
— et bien sûr les revenus des ménages. Ce qui va nous permettre de déterminer
deux indicateurs clés — là aussi il faut bien les comprendre parce que c'est des
indicateurs clés, on a besoin de cela en tant qu'économiste — c'est l'élasticité
prix et l'élasticité revenu.

Alors l'élasticité prix détermine la variation de la consommation d'un bien
lorsque son prix varie. Donc c'est ça qu'on va regarder. Évidemment on pense,
mais ce n'est pas systématique — on va voir justement que parfois il y a des
exceptions — évidemment on pense que lorsqu'un bien voit son prix augmenter, et
bien la consommation va baisser ; inversement lorsque le prix d'un bien va
baisser, la consommation va augmenter. Alors encore une fois tout ça n'est pas
lié à l'inflation, c'est la variation de prix d'un bien en particulier. Tout à
l'heure je vous disais quand il y a la hausse de tous les prix, les gens vont
consommer davantage, oui, pour des raisons logiques, ils ont besoin de dépenser
leur argent maintenant. Mais si vous avez la hausse d'un seul prix, alors là
vous allez chercher plutôt à moins consommer cet objet et plutôt à vous reporter
sur la consommation d'autres objets équivalents, parce que vous allez renoncer à
un achat si c'est trop cher. Donc ça c'est le premier élément, ce qu'on appelle
l'élasticité prix, c'est la variation des achats de consommation par rapport à
la variation des prix.

C'est évidemment très important lorsque vous êtes un commerçant par exemple et
que vous êtes en train de vous dire « bah combien — voilà je ne sais pas — vous
êtes un restaurateur — combien va être le menu du jour ? » Vous savez que si
vous mettez un menu du jour à 25 € vous aurez du mal à remplir vos tables, donc
finalement ça va vous coûter très cher et ça ne va pas vous rapporter d'argent.
Si vous mettez un menu du jour à 10 €, bon bah là du coup vous aurez plus de
clients mais peut-être que vous ne ferez pas assez de marge et vous allez faire
faillite. Donc c'est tout le problème de tout commerçant, c'est de savoir à
combien il met le prix des choses. Voilà, même chose si vous êtes n'importe quel
autre commerçant. Et donc il faut savoir comment les gens achètent et leur
comportement d'achat. Et bien sûr cela va varier d'une marchandise à l'autre :
parfois certaines marchandises peuvent voir leur prix augmenter fortement sans
que ça change les habitudes de consommation des ménages ; parfois une toute
petite variation des prix d'un produit peut entraîner une très forte variation
de la consommation. Donc ce qu'on va mesurer avec l'élasticité c'est justement
cela : comment est-ce que la variation des prix va agir sur la consommation des
ménages. C'est ce qu'on appelle l'élasticité.

Alors l'idée de l'élasticité est simple : élasticité prix, c'est que certains
produits vont avoir une forte élasticité, c'est-à-dire qu'une faible variation
des prix va entraîner une forte variation de la consommation de ce produit. Ou
alors parfois ils sont dits faiblement élastiques, voire pas du tout élastiques.
Quand ils ne sont pas du tout élastiques ça veut dire que les variations de prix
n'ont aucun effet sur la consommation ; quand ils sont faiblement élastiques,
elle a très peu d'effet.

### Formule de l'élasticité prix

Alors la formule de l'élasticité — quand on va parler d'élasticité sans dire de
quoi il s'agit, c'est toujours élasticité prix. Parfois on peut dire élasticité
prix, parfois on peut dire élasticité tout court. Par contre quand on va parler
de l'autre élasticité dont je vais parler juste après, qui est l'élasticité
revenu, là il faut dire élasticité revenu, parce que c'est un autre indicateur,
il faut bien le préciser. Donc pour répéter : élasticité sans qualificatif, ça
veut dire élasticité prix ; et si on veut parler d'élasticité revenu, on est
obligé d'employer, de caractériser, de parler d'élasticité revenu.

Bref, je reviens sur l'élasticité prix. Donc la formule générale de l'élasticité
prix est la suivante : variation des quantités — donc Delta Q, souvenez-vous
Delta c'est variation — divisé par variation des prix, Delta P. Alors une
manière très simple de calculer e, c'est d'estimer les variations en pourcentage
directement. Bon alors voilà je vous donne un exemple ici : si on a une hausse
de prix de 10 % qui entraîne une baisse de la demande de 20 %, alors qu'est-ce
qu'on fait ? On fait 20 %, -20 % divisé par +10 %, parce que là les prix ont
augmenté de manière positive. -20 divisé par 10, ça fait -2. Donc on a une
élasticité prix de -2. Alors il n'y a pas d'unité à l'élasticité prix, il n'y a
pas de pourcentage, attention, parce qu'on a divisé pour 100 et pour 100, donc
on se retrouve sans unité du tout, c'est normal.

Alors qu'est-ce que ça veut dire ? Bah ça exprime le fait que lorsque vous
augmentez — alors là on a mis de 10 %, mais du coup on va généraliser — si vos
prix augmentent de 5 %, alors votre consommation va diminuer de 5 × 2 = 10 %.
Donc vous avez des prix qui augmentent de 50 %, alors votre consommation va
baisser — alors là on va se retrouver à un problème, parce que ça veut dire -100
%, et là il y a un souci, parce que 100 % ça veut dire que vous n'avez plus du
tout de demande de consommation. Donc voilà, on va voir que parfois ça marche
très bien, l'élasticité prix, quand il y a des faibles variations ; puis quand
on a des fortes variations, alors du coup il faut recalculer l'élasticité
différemment. Voyez par exemple : je dis « bah je double mes prix », ça veut
dire — ah bah tiens les prix, donc ils ont une augmentation de 100 % — ah bah
j'ai une élasticité de -2, ah bah ça veut dire que la consommation elle va
baisser de 200 %. Non, on ne peut pas dire ça parce que quand on est au-delà de
100 % on n'a plus de consommation du tout. Et vous allez voir tout à l'heure, je
vais vous montrer ça, ça pose parfois des petits problèmes. Mais en gros l'idée
c'est ça : en gros la variation de la consommation, des quantités vendues, va
être le double — si l'élasticité est de -2 — ça veut dire de la variation des
prix.

### La méthode du point milieu

Alors justement on a deux méthodes pour calculer cette élasticité. On a cette
méthode-là qui est la plus simple, mais on a aussi une autre méthode qui
justement est là pour éviter d'avoir des choses un peu bizarres dans les
calculs. Je prends un exemple ici : on va regarder deux points, on fait un
tableau de variation des quantités et des prix pour une marchandise quelconque,
un point A et un point B. Alors vous voyez le point A c'est un équilibre, vous
avez un prix de 4 € pour une marchandise et bien vous en vendez 120. Le point B
vous avez un prix de 6 €, alors vous en vendez 80. Donc là on a la même idée que
tout à l'heure, c'est que globalement lorsqu'on augmente les prix, et bien les
quantités achetées ou vendues diminuent. Le souci c'est que là on ne sait pas si
on va regarder une hausse des prix, on va passer de 4 à 6 €, ou si on va
regarder une baisse des prix, on passe de 6 à 4 €. Or si on calcule avec la
formule précédente on va se retrouver avec une élasticité prix qui va être
différente, et donc évidemment il y a une incohérence.

Alors prenons les deux exemples. Lorsqu'on va de A à B, donc une hausse de prix
— alors hausse de prix c'est combien ? 4 à 6 €, c'est ce qu'on appelle une
hausse de prix de 1/3, donc égal à 33 %... ah non, excusez-moi je dis une
bêtise, en plus c'est marqué ici : le prix de 4 à 6 € c'est une hausse de 50 %
des prix. Il ne faut pas que je dise n'importe quoi : 4 € qui se transforme en 6
€, ça fait plus 50 % des prix. Donc rayez ce que vous avez marqué, vous changez,
vous mettez : en passant du point A au point B, j'augmente les prix de 50 %. Par
contre ici, voilà, les quantités elles vont bien baisser de 33 % : 120 à 80, 33
%, ça veut dire 1/3. 1/3 de 120 c'est 40, donc on enlève 1/3 de 120, on arrive à
80. Donc voilà, on enlève 40 et ça veut dire 1/3, c'est bien 33 %. Donc ici
quand on passe du point A au point B, on a une hausse des prix de 50 % et une
baisse des quantités vendues de 33 %. Ce qui veut dire que si on calcule
l'élasticité par la formule précédente, qu'est-ce qu'on a ? On a variation des
quantités -33 % divisé par variation des prix +50 %, ça fait -33/50 = -0,66. Ok,
donc on trouve une élasticité prix qui sera -0,66.

Maintenant imaginons de regarder ce qui se passe dans l'autre sens. Imaginons
qu'on est au point B et qu'on va au point A. Ça veut dire que cette fois-ci il y
a une baisse des prix : on était à 6 € et on passe à 4 €, ce qui va entraîner
une hausse de la quantité vendue de 80 à 120. Alors là les prix varient de
combien ? Alors c'est là, il faut bien comprendre que tout à l'heure on avait
plus 50 %, mais là on n'a pas -50 %, parce que -50 % de 6 € ça fait 3 €. Pour
passer de 6 à 4 il faut reprendre 1/3, il faut enlever 1/3 de 6, ça veut dire il
faut enlever 33 %. Donc cette fois-ci on a une variation de prix qui est
considérée comme -33 %. Les quantités c'est pareil, on a le même problème,
puisque ce n'est pas 33 %, 1/3, parce que 1/3 de 80 ça ne fait pas 40 ; là ce
qu'on constate c'est que 40 c'est la moitié de 80, donc si on veut passer de 80
à 120 il faut faire plus 50 %. Et dans ce cas-là qu'est-ce qu'on a ? On a un
autre calcul, enfin la même formule e = Delta Q sur Delta P, qui va donner un
résultat différent, qui va donner Delta Q donc ici c'est +50 % divisé par Delta
P c'est -33 %, et ça fait ici -1,5. Et donc voyez qu'on a un souci : si dans un
énoncé on ne vous dit pas comment changent les prix, dans quelle direction,
est-ce qu'ils augmentent, est-ce qu'ils baissent, alors vous ne pouvez pas
calculer l'élasticité prix, ou alors vous avez deux calculs qui vont donner deux
résultats différents, et donc si on vous demande quelle est l'élasticité prix,
bah vous n'allez pas trouver.

C'est la raison pour laquelle quand on est face à ces situations, c'est-à-dire
on nous demande de calculer une élasticité prix en nous donnant juste le tableau
sans nous dire comment ça fait, alors il faut utiliser une autre méthode qui va
donner une formule un peu plus compliquée, mais qui permettra de trouver une
élasticité prix cohérente. Alors cette formule, donc c'est ce qu'on appelle la
formule du point milieu. Donc c'est marqué méthode du point milieu. Alors en
fait c'est une forme de moyenne, mais ce n'est pas une moyenne comme on pourrait
faire en calculant de A à B et de B vers A et puis on a... donc on avait dit
qu'on avait -0,66 et -1,5, donc deux résultats différents, mais en fait il ne
faut pas faire la moyenne de 0,66 et 1,5, sinon on ne trouvera pas le bon truc.
Donc il faut utiliser cette formule. Alors il faut la prendre par cœur, elle
n'est pas simple, mais en fait c'est la seule chose qu'on peut utiliser.
Peut-être que vous la voyez d'ailleurs en statistique, c'est vraiment là aussi
une formule de base.

Donc qu'est-ce qu'on fait ? On fait la moyenne, mais la moyenne des variations
en fait. Donc on regarde Q2 - Q1, donc Q2 - Q1 c'est donc ici Q2 c'est le point
B et Q1 c'est le point A, d'accord. Donc Q2 - Q1 c'est 80 - 120, ok, ça fait
-40, divisé par Q2 + Q1, c'est 200, d'accord, et divisé par 2, donc ça fait 100.
Donc là on a en haut de l'équation, au numérateur, on a donc on a dit -40 divisé
par 200 divisé par 2, c'est divisé par 100, ça fait -0,4. Vous pouvez le
marquer. Et puis dessous, et bien en fait c'est la même chose avec les prix :
donc P2 - P1, donc P2 c'est le point B, donc c'est 6 - 4, ça fait 2, cette
fois-ci c'est positif, divisé par P2 + P1, c'est 10 divisé par 2, 5, 4 divisé
par 5, et bien ça fait 0,8. Je crois... attendez, P2... 10, 5... non
excusez-moi, ce n'est pas 2, c'est... ce n'est pas 4, c'est 2, excusez-moi. P2 -
P1 c'est +2, voilà, +2 divisé par 5 ça fait 0,4. Donc on va se retrouver ici
avec -0,4 sur +0,4, et ça fait -1. Donc si vous n'avez pas bien compris ce que
je viens de dire, et bien vous remettez la vidéo et vous verrez que je ne me
suis pas trop trompé. Voilà, c'est bien 2 divisé par 5, ça fait bien 0,4.

Alors écoutez, il est midi et moi j'ai besoin de prendre un peu l'air, et donc
je vais faire une petite pause de 5-10 minutes. Voilà, comme d'habitude.
Écoutez, on va faire ça et je vous invite à faire aussi une pause. Donc à 12h30
nous reprenons ce cours. Et je vais d'ailleurs rester allumé, ça permettra
d'éviter de changer. Il n'est pas encore 12h13, mais de toute façon ce qui est
bien avec les enregistrements en ligne c'est que vous pouvez revenir en arrière,
enfin faire ce que vous voulez, passer rapidement. Donc je regarde vos
messages... oui, le diaporama ne s'affiche pas avec votre explication, mais
écoutez, ça concrètement je n'y peux pas grand-chose, il y a forcément un
décalage entre nous parce que ça prend du temps. Ce qui m'intéresse surtout
c'est que la vidéo soit bonne, enfin d'assez bonne qualité, que vous puissiez
voir le diaporama, et puis que globalement vous entendiez bien aussi,
évidemment, parce que ça c'est important. Ah oui je vois aussi, ouais, la
résolution, 8 images par seconde, évidemment ça ne va pas très vite, hein, mais
ce n'est pas très très grave pour ce qui est de la résolution. Alors donc il me
dit « non mais ça c'est bon maintenant », hein, vous m'entendez, voilà. Donc je
vous propose de reprendre le cours. Voilà, en plus il est 13h, c'est parfait. Et
donc voilà, cette formule du point milieu qui va être utilisée parfois.

Donc en fait il faut être malin là aussi : n'utilisez pas la formule du point
milieu si finalement vous savez le sens de variation qui est donné. Si on vous
dit par exemple « si on augmente les prix de 20 % et que la consommation baisse
de 20 % », vous n'allez pas vous embêter avec la formule du point milieu, là
vous avez simplement la première formule. Ah oui, le chapitre 3 avec les
questions, oui, oui, écoutez, je vais le faire là, j'avais oublié, je vais faire
ça tout à l'heure. Donc oui, pour revenir à la méthode qu'il faut utiliser : si
on vous dit que vous avez augmenté de 20 % les prix et vous constatez une baisse
de 20 % de la consommation de votre produit, vous ne vous embêtez pas à utiliser
la méthode du point milieu, vous vous dites l'élasticité est à -20 sur 20, est
égal à -1, pardon, élasticité — d'ailleurs elle est en général négative,
élasticité prix. Donc voilà, faites toujours au plus simple et regardez quelle
est la formule la plus pertinente pour l'exercice qui vous est demandé. Vous
verrez ça notamment en TD, dans le TD... je crois le TD5, alors... non, le TD...
pardon.

### Les déterminants de l'élasticité prix

Qu'est-ce qui fait que l'élasticité prix toujours varie d'un produit à l'autre ?
Alors en fait il y a différents éléments qui vont expliquer que l'élasticité
sera faible ou importante. Par exemple un premier élément : est-ce qu'on peut
facilement renoncer à l'achat ? Et qu'est-ce qui fait qu'on va pouvoir renoncer
à un achat si les prix sont trop élevés ? Typiquement dans ce cas l'élasticité
prix sera élevée, et bien c'est lorsqu'il existe des substituts proches. Et dans
ce cas-là on va pouvoir renoncer facilement. Un exemple : votre boulanger qui
augmente le prix du pain de 1 € à 1,50 € — si vous avez un autre boulanger pas
très loin qui lui continue de vendre du pain à 1 €, et bien vous allez très vite
renoncer à acheter le pain chez ce boulanger, parce que c'est très facile
d'aller acheter à côté. Tous les biens que vous trouvez en magasin, si vous
trouvez les mêmes biens un peu plus loin, globalement vous n'allez pas vous
embêter à continuer d'acheter dans ce magasin si les prix augmentent. Donc là ça
veut dire une élasticité élevée.

Par contre parfois vous ne trouvez pas forcément de substitut. Par exemple
l'essence, typiquement, c'est une élasticité prix qui est faible, parce que dans
votre voiture vous ne pouvez mettre que de l'essence — enfin l'essence, mettons,
vous êtes au sans plomb 95 ou 98. Bon, si le sans plomb il augmente, vous
n'allez pas forcément réduire votre consommation, soit parce que vous ne pouvez
pas mettre autre chose dans votre voiture, soit parce que vous n'avez pas
d'autres moyens de transport que votre voiture en fait pour aller là où vous
voulez aller. Donc là une hausse, une variation des prix de l'essence ne va pas
forcément se traduire par une baisse de la consommation. Donc on va voir ici ce
qu'on appelle une élasticité prix qui sera faible.

Alors deuxième élément, évidemment, qui est un peu lié à la même chose mais pas
tout à fait de la même façon, c'est l'idée des biens qui sont indispensables ou
essentiels. Tout à l'heure je vous parlais des restaurants. Tiens d'ailleurs
c'est marrant, parce qu'aujourd'hui on nous explique qu'il y a plein de choses
essentielles et plein de choses superflues, donc on interdit toute consommation
superflue. Bon, la question c'est qu'est-ce qui est superflu, qu'est-ce qui est
essentiel ? Alors on a entendu ça parce qu'on nous a parlé des livres par
exemple : est-ce que les librairies devraient être considérées comme magasins
essentiels ou non ? Bon, derrière cette question-là, en fait à mon avis elle
n'est pas très bien posée, il y a plein d'autres questions, hein. C'est-à-dire
que vendre des livres ce n'est pas qu'une question de « est-ce que les
consommateurs en ont besoin », c'est aussi les conséquences que ça a ensuite sur
la filière. Et une des particularités d'ailleurs de l'édition, pour cette
raison... moi je... enfin il ne faut pas déconner, les livres ce n'est pas
essentiel à la vie, on peut — d'abord on a plein de livres à lire chez soi —
voilà, s'il s'agit de ne pas consommer de livres pendant 6 mois on ne va pas en
mourir. Là où la question est plus spécifique pour l'édition, c'est qu'en
général on a des maisons d'édition qui sont elles très importantes et qui font
faillite si elles ne vendent plus de livres. On a aussi bien sûr des auteurs qui
sont rémunérés — et qui ne sont plus rémunérés, ça pose un problème — puis aussi
des imprimeurs. Et en fait tout ça, ce qui est intéressant dans le livre, c'est
que c'est une chaîne de production locale : les auteurs sont français, les
maisons d'édition sont françaises, les imprimeurs sont aussi français. Alors que
quand on interdit la vente de jouets par exemple, qui peuvent aussi être
considérés comme des produits importants, notamment en période de Noël, les
jouets ils sont fabriqués en Chine ou ailleurs. Et donc finalement c'est moins,
ça a moins d'impact sur l'économie française de fermer des boutiques de jouets
que de fermer des librairies. D'ailleurs un jour je vais le dire — enfin je vais
écrire un article là-dessus, parce que personne n'en parle — alors que pour moi
ça serait la vraie raison pour laquelle il faudrait ouvrir les librairies :
c'est que ça ne crée pas que des emplois de commerçants, ça crée des emplois
d'imprimeurs, des emplois de maisons d'édition, et ça donne des revenus aussi
aux auteurs. Donc c'est bien plus intéressant d'un point de vue économique
d'ouvrir les librairies. Alors mais ça c'est une autre question.

Ce qui nous intéresse ici, c'est est-ce qu'on peut se passer d'un bien. Et par
exemple l'élasticité des prix des loisirs est toujours plus importante que
l'élasticité prix des choses qui nous sont nécessaires pour produire. Par
exemple les restaurants, les voyages, ils ont une élasticité prix importante.
D'ailleurs ils en ont conscience, hein, puisqu'ils ont parfois du mal à
augmenter leurs prix. Les billets d'avion aussi, ils ont une élasticité prix
très importante. Alors certes les billets d'avion sont des biens un peu
essentiels, mais la concurrence est tellement forte qu'on peut facilement
trouver des biens substituables, donc là c'est un autre élément. Mais parfois on
peut se dire : « bon, aller voyager au Japon, est-ce que c'est si important ?
Pour faire des randonnées par exemple, est-ce que c'est si important, alors
qu'on pourrait faire des randonnées dans les Alpes et ça coûterait beaucoup
moins cher ? » Donc là la question c'est pour un même service, on va dire la
randonnée, ou pour un même type de vacances, voilà, ça peut être plus simple de
renoncer à un billet d'avion au Japon. Donc c'est ça un peu le côté superflu :
c'est si on considère qu'on a absolument envie de faire une randonnée, est-ce
qu'on a besoin de la faire très très loin ? Les produits de loisir sont souvent
les premiers sacrifiés en période de crise, hein, donc les restos, les sorties,
les choses comme ça. Et là encore je me distingue de la question du
gouvernement, de ce que le gouvernement dit là en fermant des boutiques
soi-disant non essentielles. Ce qui m'intéresse ici c'est du point de vue des
consommateurs : quand il faut renoncer à la consommation, on préfère renoncer au
superflu parce qu'on ne peut pas renoncer à l'essentiel. L'essentiel c'est le
logement par exemple, c'est tout ce qui nous sert à travailler, c'est les
transports très souvent qui sont essentiels, enfin c'est plein de choses comme
ça, et bien sûr l'alimentaire qui est essentiel.

Ensuite, troisième élément qui détermine l'élasticité prix — donc si je reviens
— enfin parce que c'est évident, les biens essentiels ils vont avoir une
élasticité prix faible, alors que les biens superflus vont avoir une élasticité
prix forte. Marquez-le si vous n'avez pas compris dans l'explication. Troisième
élément donc qui détermine l'élasticité des marchandises, c'est la définition du
marché. Parce qu'en fait là aussi ce n'est pas si simple : est-ce que le marché
qu'on va regarder c'est un ensemble de produits ou est-ce que c'est juste un en
particulier ? Oui, je dis par exemple les biens de loisir ils sont plus
élastiques que les biens indispensables, mais c'est quoi les biens de loisir,
jusqu'où on étend les biens de loisir ? Est-ce qu'on prend par exemple tous les
voyages, ou est-ce qu'on prend simplement les voyages au Japon ? Est-ce qu'on
prend tous les restaurants, ou simplement les restaurants de luxe ? Donc tout ça
n'est pas simple, et en fait la manière dont on détermine la frontière du marché
va changer un peu les définitions qu'on peut avoir de l'élasticité.

Prenons un exemple : tout à l'heure les biens indispensables, c'est tout ce qui
est alimentaire. Oui, mais tout ce qui est alimentaire en général est
indispensable, mais par exemple ces pommes-là en particulier, individuellement,
je veux dire, elles ne sont pas forcément indispensables : on peut acheter
d'autres types de pommes, ou acheter des poires, ou acheter d'autres sortes de
dessert. Donc tout le problème est de savoir qu'est-ce qu'on regarde. Par
exemple si je reprends l'exemple des pommes, il est clair que la hausse du prix
d'une marque de pomme, ou enfin d'une espèce de pomme en particulier, dans un
magasin, ça entraînera une baisse forte de consommation, c'est-à-dire qu'en gros
le prix de ces pommes-là est assez élastique — oui, assez élastique — on peut
facilement renoncer à acheter ces pommes. Maintenant si on augmente non pas un
type de pomme en particulier, une espèce de pomme, mais tous les fruits et
légumes, alors là ça va être difficile de se passer totalement de fruits et
légumes. En fait donc là l'élasticité prix de l'ensemble des fruits et légumes
va être plus faible. Donc vous voyez c'est un peu paradoxal ce que je suis en
train de vous expliquer : c'est que le prix de chaque fruit, la consommation de
chaque fruit est très élastique, très sensible au prix — c'est-à-dire qu'on va
facilement pouvoir renoncer à l'achat d'un fruit en particulier si son prix
augmente trop vite. Par contre si on regarde l'ensemble des fruits, alors là ça
va devenir plus compliqué de renoncer à l'ensemble des fruits. Évidemment si
j'étends ça encore à tous les produits alimentaires, c'est le même problème :
vous avez une marque de pâtes dont le prix augmente, ça ne posera pas trop de
problème, vous pourrez continuer d'acheter une autre marque de pâtes, ou alors
du riz, ou des pommes de terre, enfin il y a plein de substituts. Mais vous avez
tous les féculents qui augmentent de prix, là ça commence à devenir plus
compliqué. Donc il faut regarder de quoi on parle, l'élasticité prix.

Là je vous ai donné un autre exemple sur un diapo. Si je reprends le chocolat
par exemple : si le prix du chocolat augmente, on peut toujours se passer de
chocolat, on peut trouver d'autres types de biens à acheter, d'autres friandises
par exemple, on peut se passer du chocolat parce qu'on considère que c'est
superflu. Par contre si toutes les friandises augmentent de prix, ça va être
plus compliqué de s'en passer, voilà, surtout si on aime le sucre et tout ça. Et
si tous les produits alimentaires augmentent, et bien alors là on ne peut plus
du tout s'en passer. Voilà, donc c'est ça qu'il faut regarder aussi. Et là par
exemple si je vous pose une question : quelle est l'élasticité prix des produits
alimentaires sans préciser ? Vous allez dire qu'elle est faible. Mais par contre
si je vous dis « le prix des marques Panzani », alors là vous pourrez dire
qu'elle est forte parce que voilà, ce n'est pas la même chose, ce n'est pas la
même frontière du marché qu'on regarde.

### L'horizon temporel

Quatrième élément — alors là aussi qui est très intéressant — c'est ce qu'on
appelle l'horizon temporel. C'est-à-dire que certaines marchandises peuvent être
très inélastiques à court terme et très élastiques à moyen et long terme. Alors
pourquoi ? Parce que très souvent la consommation d'un produit peut être liée au
fait qu'on dispose d'un autre produit. Alors c'est le cas de l'essence, c'est le
cas de l'électricité, globalement de l'énergie, c'est le cas de plein d'autres
choses qu'on peut trouver. Alors tout à l'heure je vous ai dit — disait —
l'essence est un produit assez élastique... assez peu élastique, pardon,
excusez-moi, parce qu'on a toujours besoin d'essence. Donc alors là aussi
intéressant : l'essence d'un commerce en particulier peut être très élastique,
c'est-à-dire que si Carrefour augmente son prix de l'essence de 3 centimes,
peut-être qu'ils n'auront plus aucun client et que tout le monde ira chez
Leclerc. Donc là on va avoir une élasticité forte de Carrefour. Mais si
l'ensemble de l'essence augmente à la fois chez Leclerc, chez Carrefour et chez
Total et cetera, alors là on sera conduit à continuer de payer davantage si les
prix augmentent sans pouvoir supprimer sa consommation.

Et maintenant, reprenons autre chose : si tous les prix, toutes les essences
augmentent partout, donc là on est dans le cas de figure numéro deux, donc on
est contraint de continuer d'acheter de l'essence, donc l'élasticité prix à
court terme elle va être faible. Mais au bout d'un moment on peut se dire : «
bah attendez, si l'essence continue d'augmenter comme ça, moi je vais arrêter,
hein, je vais changer, je vais acheter une voiture électrique par exemple, ou je
vais déménager, je vais me rapprocher de mon lieu de travail », et dans ce
cas-là et bien je ferai soit en transport en commun, soit à pied, soit en vélo.
Donc on peut changer ses modalités de fonctionnement, ses habitudes de
consommation, en déménageant par exemple. Vous êtes chauffé au gaz, si le prix
du gaz augmente, bah vous pouvez passer à l'électrique. Si le prix de
l'électricité augmente, vous pouvez changer votre isolation, et dans ce cas-là
bah vous allez baisser votre consommation énergétique. Donc ce qu'on constate
aussi, c'est que selon qu'on regarde à court terme ou à long terme, un bien
pourra avoir une élasticité faible à court terme — on ne peut pas changer son
mode de consommation maintenant — mais à long terme on pourra changer son mode
de consommation pour passer à un véhicule électrique ou au vélo. Et dans ce
cas-là on sera sensible : quand les prix de l'essence augmenteront, et bien on
va finir par abandonner la voiture. Alors ici c'est marqué dans le diaporama,
c'est la question de la complémentarité : à court terme certains biens —
l'essence, la consommation d'électricité et cetera — sont très inélastiques car
ils sont complémentaires d'autres types de biens — véhicule, système de
chauffage et cetera. À long terme on peut changer ces biens complémentaires, on
peut modifier profondément sa structure de consommation et donc renoncer à
consommer des produits dont on considère qu'ils sont trop chers.

## L'élasticité revenu de la demande

Deuxième élément qu'il faut voir, c'est l'élasticité revenu de la demande. Alors
cette fois-ci on va oublier tout ce qu'on vient de dire — on ne va pas regarder
comment la consommation varie en fonction des changements de prix — mais
maintenant on va chercher à regarder les variations de la consommation en
fonction des changements des revenus. Alors ça aussi on peut le regarder à
l'échelle individuelle, mais aussi même à l'échelle collective : que se
passe-t-il si dans une économie il y a une croissance économique, les revenus
globalement augmentent, qu'est-ce qui va se passer ? C'est ce qu'on a regardé
tout à l'heure quand on a parlé de la propension marginale à consommer, la
hausse des revenus, comment elle va se traduire en termes de hausse de
consommation. Alors c'est ce qu'on appelle l'élasticité revenu, qui mesure la
variation des revenus et la variation de la consommation de biens. Donc cette
fois-ci, et bien en fait c'est comme l'élasticité prix. Alors cette fois-ci vous
voyez je n'ai pas mis « e » tout court, j'ai mis « e revenu », hein. Tout à
l'heure je vous l'ai dit, on précise toujours quand on parle d'élasticité
revenu. Donc c'est égal à la variation des quantités divisé par la variation des
revenus. Concrètement, ce bien, je vais augmenter la consommation de 20 % alors
que j'ai une hausse de revenu de 10 %, alors on va voir une élasticité revenu de
2. Alors ici très souvent l'élasticité revenu elle est positive — l'élasticité
prix était négative parce qu'on avait des variations en sens inverse : quand les
prix augmentent, la consommation diminue. Cette fois-ci on peut s'attendre à ce
que globalement les variations des revenus entraînent une hausse de la
consommation, donc on va en général trouver une élasticité revenu qui est elle
positive.

### Les lois d'Engel

Alors il y a un statisticien allemand qui s'appelle Ernst Engel, qui en étudiant
la consommation ouvrière a fait une grande étude — alors c'est au 19e siècle —
ça s'appelle les lois d'Engel. Alors je vous invite à regarder dans Wikipédia si
vous voulez savoir tout sur les lois d'Engel. Et Engel donc c'est un
statisticien allemand qui a étudié la consommation des ouvriers et qui a
remarqué, justement, essayé de comprendre comment la consommation changeait à
mesure que les revenus variaient. Et notamment quand on regarde comment les
revenus augmentent : vous êtes un ouvrier de base, puis ensuite vous devenez un
ouvrier spécialisé, enfin qualifié, puis ensuite vous devenez un contremaître,
voilà, vous progressez dans la hiérarchie de votre usine, et bien ça va
entraîner un changement dans vos habitudes de consommation. Et donc c'est
intéressant de voir justement quels sont les changements.

Alors Engel il a remarqué que quand les revenus augmentent, et bien on allait
parfois se retrouver à des choses un peu particulières où la consommation de
certains produits va baisser. Par exemple la consommation de pain va baisser.
Alors pourquoi la consommation de pain va baisser ? Bah parce qu'on va varier
son alimentation. Avant on n'avait pas beaucoup de revenus, donc on consommait
essentiellement du pain — enfin et deux trois trucs — mais après on commence à
être plus riche, donc on va changer : on va moins consommer de pain, on va plus
consommer d'autres produits, plus intéressants, plus frais par exemple, qui
coûtent plus cher, plus de viande par exemple, ou de poisson, ou des choses
comme ça. Donc ça c'est ce qu'il appelle les biens inférieurs : c'est les biens
dont la consommation décroît lorsque les revenus augmentent, et dans ce cas-là
on a un petit e qui est inférieur à zéro. Alors élasticité revenu — je n'ai pas
marqué « revenu » parce que là je ne peux pas, c'est petit — donc là les
élasticités revenu sont négatives, dans ce cas-là on est affaire à un bien
inférieur.

Ensuite on a des biens neutres : des biens dont la consommation varie à un
niveau positif, donc supérieur à 0, mais inférieur à 1. Alors ça c'est la
consommation normale, la consommation normale qui est entre 0 et 1, puisque
souvenez-vous la proportion moyenne à consommer en général est inférieure à 1.
Donc là, quand on a des biens normaux, on va dire que l'élasticité revenu est
égale à un chiffre compris entre 0 et 1. Enfin on a les biens supérieurs. Alors
ces biens supérieurs, et bien c'est intéressant : ce sont des biens dont la
consommation croît plus vite que les revenus. Vous avez des revenus qui
augmentent de 10 %, et bien vous allez avoir une consommation de ce bien qui va
être de 20 %. Alors on vient de me poser une question tout à l'heure, qui était
: pourquoi est-ce qu'on n'utilise pas le revenu disponible brut des ménages ? En
fait on l'utilise, en fait, mais le revenu disponible brut des ménages, et bien
c'est la variation du revenu disponible brut des ménages qu'on va prendre en
considération ici. J'ai mis variation de R, hein, du revenu, mais c'est bien de
cela dont il s'agit. Je n'ai pas précisé qu'il s'agissait de revenu disponible
brut des ménages, c'est bien ça. Donc on regarde — par contre on ne va pas
regarder l'ensemble des revenus, nous, ce qui nous intéresse c'est comment la
consommation change avec le changement de revenus. Donc c'est ça qu'on regarde,
et qu'est-ce qui va changer dans les habitudes de consommation du ménage.

Donc les biens supérieurs sont des biens dont la consommation croît plus vite
que les revenus, donc on a une élasticité revenu supérieure à 1. Et concrètement
ça signifie que ce sont des biens qui sont plus consommés par les riches. Alors
c'est bien supérieur, typiquement bah c'est les biens de loisir, hein. On va
voir tout à l'heure d'ailleurs — vous allez voir dans le TD6 — repérer quels
sont les biens supérieurs chez les Français, qu'est-ce qui augmente plus vite
que les revenus. Ça peut être des dépenses de communication aussi : quand on
accroît ses revenus, voilà, on va augmenter ces dépenses de communication de
manière plus importante, et cetera.

Au passage, attention à une incompréhension : plus on devient riche, plus la
part des dépenses alimentaires diminue dans ses revenus. Mais notez bien ça :
les biens alimentaires ne sont pas des biens inférieurs. Pourquoi ? Parce que le
fait que la part de la consommation diminue ne veut pas dire qu'en valeur
absolue la consommation de biens alimentaires diminue. On a toujours besoin de
manger, et donc on ne va pas diminuer sa nourriture, ses achats de nourriture,
parce qu'on devient plus riche. À la limite il peut y avoir un changement dans
la manière dont on consomme la nourriture, c'est-à-dire qu'on va moins de pain —
tout à l'heure j'ai dit — et puis plus de viande, mais ça ne va pas diminuer
globalement les achats alimentaires, ça va augmenter les achats alimentaires.
Mais on va dire que les achats alimentaires augmenteront moins que les revenus,
donc ça a baissé en consommation. On est typiquement dans des biens dits
neutres. Si par contre — alors ça on ne constate pas, ou alors c'est très très
très riche — vous ne faites plus jamais la cuisine, vous n'achetez plus jamais
de produits alimentaires et vous ne faites que aller au restaurant, alors là oui
on pourra dire que la nourriture deviendra un bien inférieur. Mais là il s'agit
vraiment d'un cas très particulier, hein, la plupart des gens ne passent pas
leur temps au restaurant. Et quand on regarde le budget alimentaire d'un cadre
supérieur, alors quand on le compare à quelqu'un qui est un ouvrier précaire, on
va s'apercevoir que globalement le cadre supérieur dépense plus d'argent pour
son alimentation que l'ouvrier, mais la part dans son revenu des dépenses
alimentaires est plus faible. Donc qu'est-ce que ça veut dire ? Ça veut dire que
la nourriture n'est pas un bien inférieur, c'est un bien neutre, mais qui
augmente lentement. Au lieu d'être à 0,09 par exemple en élasticité, on va être
plutôt vers 0,1 ou 0,2, c'est-à-dire qu'on va augmenter un peu au fur et à
mesure que ses revenus augmentent, on augmente un peu plus les achats
alimentaires, mais on ne les augmente pas très vite, donc très vite ça va
prendre une proportion de plus en plus faible dans l'ensemble de sa
consommation. Donc retenez bien ça : les biens alimentaires ne sont pas des
biens inférieurs. Quand on les prend en général, ce sont plutôt des biens
neutres avec une élasticité revenu faible, plus proche de 0 que de 1.

## La théorie keynésienne de la consommation

Et ben voilà, c'est fini. Alors je suis un peu surpris parce que j'ai réduit —
je ne sais pas si vous avez remarqué — je ne vais pas jusqu'au bout des diapos
parce qu'après dans la vidéo YouTube il y aura un petit encart en bas, donc je
vais laisser la place pour cet encart. Si vous avez des questions, voilà,
n'hésitez pas, j'essaie de répondre aux questions quand je les vois, j'arrive à
les lire quand elles apparaissent sur mon écran, c'est assez pratique.

Maintenant ce qu'il faut comprendre, c'est comment on théorise tout ça. Là je
vous ai donné les instruments : la compréhension, comment on calcule la
propension marginale à consommer, la propension moyenne à consommer, comment on
calcule l'élasticité prix, revenus. Donc tout ça est intéressant, mais tout ça
ne fait pas une théorie. Or les économistes ont besoin de faire des théories,
ils ont besoin de comprendre qu'est-ce qui va faire que les gens vont consommer
de différentes façons. Pourquoi c'est important ? Bah parce que je l'ai dit, ça
détermine la demande adressée aux entreprises, ça détermine donc le PIB, ça
détermine l'emploi. Et donc tout économiste doit aussi comprendre — pas
simplement ce qui se passe à l'échelle d'un ménage en particulier, mais ce qui
se passe à l'échelle collective, à l'échelle globale. Et donc on a des théories
qui vont chercher à comprendre les variations de la consommation des
consommateurs.

### L'équation de consommation keynésienne

Alors une théorie qui est très connue, que vous allez retrouver dans certains
exercices qu'on va vous donner — euh, Q dans les formules ça représente les
quantités, Q voilà, quantité — donc la consommation des ménages peut être
analysée par Keynes à partir de deux paramètres : une consommation dite
incompressible et une consommation qui dépend des revenus. Alors l'idée de
Keynes c'est qu'il y a toujours une consommation qui ne va pas dépendre des
revenus, notamment à court terme. Exemple tout bête, à l'échelle individuelle —
on va le voir aussi tout à l'heure à l'échelle collective — c'est le loyer que
vous payez tous les mois : vous devez payer un logement, et si vos revenus
baissent, et bien vous allez continuer de payer la même somme, donc c'est une
consommation dite incompressible. Vous êtes même prêt parfois à vous endetter
pour continuer de payer votre logement, éviter comme ça de vous retrouver à la
rue. Donc c'est vraiment une consommation qui est insensible aux revenus. Et
puis chez Keynes c'est aussi une consommation qui est sensible aux variations de
revenus, et c'est ce qu'on appelle donc — c'est une consommation — alors j'ai
mis ici « consommation qui dépend des revenus », mais en fait ça serait plus
juste de dire que c'est une consommation qui dépend des variations des revenus.
Alors on va l'appeler comment ? On va l'appeler petit c, propension marginale à
consommer, multiplié par Y, qui est ici le revenu. Alors je n'ai pas mis R, j'ai
mis Y, parce qu'en fait ce qui va nous intéresser chez Keynes c'est l'analyse à
l'échelle de l'ensemble de la société, c'est-à-dire à l'ensemble des revenus. Et
l'ensemble des revenus des ménages, qu'est-ce que c'est ? C'est le PIB, donc
c'est grand Y. Donc on va regarder ce qui se passe dans l'ensemble des ménages :
une consommation incompressible, donc on appelle C0, qui donc ne dépend pas des
revenus ni de leur variation ; et puis une consommation qui dépend de la
variation des revenus, qui est la multiplication entre la proportion marginale à
consommer — pardon — et grand Y. Tout ça va nous donner une consommation moyenne
qui est l'addition des deux : dépense de consommation C0 plus petit c Y,
propension marginale à consommer fois Y. Ok.

Alors ensuite si on veut calculer la proportion moyenne à consommer, on va
prendre C et puis on va diviser par RDB, revenu disponible brut, ou grand Y ici,
parce qu'en fait dans l'équation Y c'est le RDB — c'est là aussi on simplifie un
peu les choses. Alors c'est la proportion marginale à consommer — alors en
moyenne elle est combien ? Tout à l'heure on a vu des petits c à -15 ou à plus
de 1 et cetera, mais ça c'est des cas particuliers. En général la proportion
marginale à consommer, en moyenne, on va dire qu'elle est positive et inférieure
à 1, donc elle est comprise entre 0 et 1. L'idée c'est que la plupart du temps,
quand on regarde en moyenne et sur une longue période — alors c'est là où on ne
va pas regarder juste les petites évolutions à court terme, on va regarder les
grandes évolutions — on va considérer que les ménages ne consomment pas
entièrement le revenu supplémentaire. Si on veut calculer grand C ici, alors là
je vous fais appel à vos cours de 3e normalement. Donc vous reprenez ici la
formule C grand C = C0 + cY. On a en fait ici, si on veut tracer sur un — la
droite qui correspond à ça, c'est ce qu'on appelle une courbe affine. C'est une
variation de C avec un quelque chose qui est stable, qui est indépendant, et
quelque chose qui est dépendant. Donc en fait on a une équation de genre y = ax
+ b — souvenez-vous de cours de 3e, c'est facile, y = ax + b, c'est une fonction
affine — et en fait ça se traduit par une droite, d'accord. Donc en fait on va
tracer une droite qui correspond à C. On va le faire tout à l'heure.

Alors j'ai eu deux questions : C0 ça correspond à quoi ? J'ai dit consommation
incompressible, qui ne dépend pas des revenus. Et est-ce que ces formules sont à
connaître ? Oui, ces formules sont à savoir, et il va falloir rentrer un peu
dans la technique, il va falloir travailler. Alors tout ça ça veut dire qu'il
faut apprendre bien sûr, et ensuite vous allez venir vers des exercices de TD
qui vont vous permettre d'apprendre aussi, parce qu'on apprend beaucoup mieux en
faisant des exercices. Donc voilà. Donc petit c, qu'est-ce que c'est ? C'est le
coefficient directeur quand on a une fonction affine de type y = ax + b. Petit c
ça correspond à a, et c'est le coefficient directeur, ça veut dire la pente de
la droite. En gros, quand petit c est égal à zéro, bah on va avoir une droite
qui sera horizontale. Quand petit c est grand, et bien on va avoir une pente
plus importante. Si petit c est égal à 1, ce qui est un peu un cas limite, alors
la pente elle sera égale à 45°. Mais en général comme j'ai dit petit c est
inférieur à 1, donc la pente elle est inférieure à 45°.

Bon alors j'ai vu qu'on m'a posé une autre question, alors comme elle a disparu
je vais la lire. « La consommation incompressible c'est la consommation qui est
sensible au revenu ? » — qui est insensible au revenu, par exemple. Oui voilà
c'est ça. Ah oui non, si vous répondez à la place c'est très bien. Donc c'est
ça.

### Représentation graphique

Alors on va reprendre et essayer de représenter tout ça graphiquement, parce que
c'est ça l'apport de Keynes en fait, c'est un graphique qui permet de comprendre
des choses. Alors d'abord un repère ici avec en ordonnée C, donc le volume de
consommation, et en abscisse Y, donc les revenus, qui ici correspondent à
l'ensemble du PIB, puisque le PIB grand Y c'est égal aux revenus. Alors
premièrement on va commencer par tracer une droite — alors c'est une droite
virtuelle en fait, qui va permettre de réfléchir — c'est la droite... pourquoi
je dis virtuelle ? Parce que c'est qu'est-ce qui se passerait si tous les
revenus étaient consommés, si C était égal à Y. Alors si tous les revenus sont
consommés, mais le volume de consommation est égal à l'ensemble des revenus,
d'accord. Donc on a ici une droite — alors pardon — une droite qui a une pente
de 45°, C = petit c = 1, et ici on n'a pas de C0. Voilà, tout c'est la droite
théorique si tout le monde consommait tous les revenus dont il disposait. Mais
ça c'est pas ce qui se passe en pratique. En pratique on a une autre droite, qui
est celle que... on a une autre droite qui est celle-ci, alors avec une pente
plus faible parce que c n'est plus égal à 1, il est égal à un chiffre qui est
entre 0 et 1. Donc c'est plus 45°, maintenant je l'ai dit tout à l'heure, c'est
moins — c'est pas négatif parce que sinon ça serait que ce serait négatif.

Donc pour répondre à la question qui vient de m'être posée, alors suivez bien.
Si on — ce que je vous dis c'est que cette formule-là elle est égale à une
formule affine. La formule affine c'est y = ax + b, hein, c'est ce qu'on vous a
appris en 3e normalement — enfin moi je l'ai appris en 3e mais vous l'avez vu
forcément — y = ax + b. Donc dans ce cas-là b c'est C0, x c'est petit c, et euh
non excusez-moi, x c'est grand Y et petit c c'est a. ax + b c'est ça. Bref.

Donc je reprends : nous avons ici donc une droite qui est la fonction réelle,
donc C = Y, c'est une fonction virtuelle, c'est ce qui se passerait si — c'est
jamais le cas — C0 est égal à 0 et petit c égal à 1, c'est-à-dire qu'on consomme
tous les revenus. Mais la réalité de la droite dans une économie normale c'est C
= C0 + cY. Alors ce qui m'intéresse ici c'est de voir que cette droite-là elle
détermine donc le niveau de consommation de l'ensemble des ménages par rapport
au niveau de revenu. C'est normal que ça soit en croissance, parce que plus les
revenus vont augmenter, plus le niveau de consommation va être élevé. Ici on a
un faible revenu donc on va avoir une faible consommation ; ici on a un revenu
élevé donc on va avoir une consommation importante. C'est ça que représente
cette droite.

Mais ce qui m'intéresse c'est : que se passe-t-il donc — le PIB il peut varier
en fait dans une économie — que se passe-t-il sur la consommation des ménages ?
Alors trois cas de figure. Premier cas de figure : on est ici un PIB faible,
d'accord, le PIB est tellement faible que la consommation globale des ménages
sera supérieure à la consommation théorique — hein, à cette droite-là. Qu'est-ce
que ça veut dire ? Ça veut dire qu'en fait les ménages consomment davantage
qu'ils n'ont de revenus, donc ça veut dire que les ménages sont endettés, donc
la proportion moyenne à consommer est supérieure à 1. Alors pourquoi je vous dis
que les ménages sont endettés ? Pourquoi ils consomment davantage que le revenu
? Parce que si on a le Y ici, normalement si on dépensait tous ses revenus on
serait à ce niveau-là — c'est pour ça que j'ai tracé cette courbe, pour qu'on
comprenne. Donc si on est plus haut, ça veut dire que la consommation est
supérieure au revenu, ok. Donc ça veut dire que globalement les ménages sont
endettés parce qu'ils consomment davantage que leur revenu. Pourquoi ? Parce que
c'est à cause de la force de la consommation incompressible qui devient très
importante dans leur niveau de consommation.

Au point Y2, alors le niveau de consommation des ménages est strictement égal à
son revenu, donc on a ici une proportion marginale à consommer qui est égale à
1, puisqu'on est au point de croisement entre la droite grise et la droite
rouge. Et puis enfin on est au point Y3, c'est la situation la plus courante en
réalité, c'est une situation dans laquelle les revenus — donc grand Y — sont
importants et le niveau de consommation est inférieur au niveau de consommation
possible. Donc là on va dégager une épargne. Donc quand dans tous les points Y
qui sont à droite de E ici — à droite de Y2 si vous préférez — on va se
retrouver dans une épargne qui va être croissante : plus les revenus augmentent,
plus on va avoir une épargne importante qui va apparaître dans l'économie. À
gauche de E, et bien c'est l'inverse, on est obligé de s'endetter pour continuer
de satisfaire un minimum de consommation.

Alors C0 — C0 tout à l'heure j'ai dit à l'échelle d'un ménage individuel, j'ai
dit bah par exemple ça peut être les loyers qu'on paye et qu'on va continuer de
payer quitte à s'endetter si jamais ses revenus sont trop faibles. Mais on peut
interpréter ces zéros différemment : on peut considérer que ce C0 c'est une
consommation, ça correspond à une consommation effective des ménages. Alors là
je change un peu le cadre d'analyse : tout à l'heure je me disais ce qui
intéresse c'est les dépenses de consommation, ce que les ménages vont dépenser
concrètement. Mais souvenez-vous, l'ensemble de la consommation des ménages
c'est aussi une consommation que les ménages n'ont pas achetée. À l'échelle
macroéconomique, une partie de la consommation des ménages c'est les services
publics, ou ce qu'offrent aux ménages gratuitement les associations caritatives.
Et dans ce cas-là, et bien on va se retrouver avec un C0 qui pourrait tout à
fait être interprété comme une consommation non marchande. Et dans ce cas-là on
comprend que les ménages, s'ils n'ont pas de revenu, ils continuent de
consommer, ils continuent de bénéficier de services publics. Mais alors la dette
ici, d'où elle va venir ? Elle va venir de l'État. C'est en fait l'État — parce
qu'on est ici à l'échelle macroéconomique — c'est l'État qui va continuer de
financer des services publics alors même qu'il n'a pas les moyens de les
financer, et que les ménages surtout n'ont pas les moyens de payer les impôts
parce qu'ils ont trop peu de revenus. Et donc les ménages vont continuer de
consommer ces services publics parce que justement ces services publics sont
gratuits.

Voilà, donc on a ici une manière de comprendre l'évolution de la consommation
des ménages. Ce qu'il faut comprendre c'est que le niveau d'épargne ou le niveau
d'endettement va être en quelque sorte ce qui va ajuster la consommation des
ménages. Et avec une logique qui est derrière la logique de Keynes, c'est une
logique extrêmement importante sur laquelle je vais revenir tout à l'heure, qui
est que lorsque les revenus croissent, la consommation croît elle aussi mais
moins vite que les revenus. Ce qui veut dire que globalement l'épargne va
augmenter beaucoup. Quand au contraire les revenus baissent, en période de crise
économique en particulier, et bien l'épargne va disparaître, et même on peut se
retrouver avec un endettement qui apparaît dans l'économie. C'est ce qu'on
constate quand on voit qu'à chaque crise économique, et bien tout d'un coup la
dette globale, la dette de l'État en particulier, augmente, parce que l'État va
financer une partie de la consommation des ménages, notamment toute celle qui
n'est pas dépendante.

### Application aux agents économiques

Une autre manière d'interpréter cette courbe c'est de ne pas regarder l'ensemble
de l'économie mais de considérer les agents, les agents globaux de l'économie.
Et que constate-t-on ? On constate que les riches ont tendance à davantage
épargner que les pauvres. Alors ça il y a de très nombreuses études statistiques
qui le démontrent : plus les revenus croissent dans l'échelle des revenus, les
gens qui ont le plus de revenus sont aussi ceux qui peuvent dégager le plus
d'épargne. Pourquoi ? Parce que eux, leur consommation a compris, en fait elle
est — on va dire — alors elle augmente bien sûr, on va avoir des loyers plus
importants, on va avoir plus de consommation compressible, mais on aura plus de
marges pour augmenter ensuite la consommation, et ces marges ne vont pas toutes
être utilisées, et donc on va davantage épargner. Par contre quand on est
pauvre, et bien très souvent on n'a pas la possibilité d'épargner — parfois même
on peut s'endetter — et donc on va être plutôt dans la partie droite, partie
gauche pardon, du graphique, c'est-à-dire qu'on va vérifier que globalement la
proportion marginale à consommer va augmenter jusqu'à — quand on est vraiment en
situation extrêmement précaire — devoir s'endetter. Alors attention, hein,
l'endettement : concrètement quand on est pauvre on a aussi du mal à s'endetter,
donc très vite ce qui va se passer c'est qu'on va se retrouver avec une
proportion moyenne à consommer qui va être quasiment égale à zéro — c'est ce qui
fait dire à Keynes, et à beaucoup d'économistes parce qu'il s'est avéré que
c'est vrai, que les pauvres consomment davantage en proportion de leur revenu
que les riches.

Alors comment une personne peut épargner et s'endetter dans le même — moi elle
ne peut pas, c'est soit l'un soit l'autre : soit elle est riche, elle épargne ;
soit elle est pauvre, et elle s'endette, ou en tout cas elle épargne moins, elle
consomme davantage. C'est ça que je voulais montrer. Alors donc en fait ce
schéma il peut s'appliquer à la fois à l'ensemble de l'économie quand on regarde
la variation du PIB, donc de l'ensemble des revenus, et au ménage en
particulier.

## Conclusion : Keynes et la redistribution

Donc c'est ça que je voulais dire pour terminer et conclure l'analyse de Keynes.
Pour Keynes, la proportion moyenne à consommer varie en fonction des revenus.
Lorsque les revenus sont faibles ou diminuent, les ménages ont tendance à
diminuer moins fortement leur consommation. Souvenez-vous, on l'a vu en 2012 —
je vous reprendrai le graphique de tout à l'heure — en 2012 que s'est-il passé ?
Les revenus ont très peu augmenté et la consommation des ménages elle a plus
augmenté, on s'est retrouvé avec une proportion marginale à consommer supérieure
à 1. Que s'est-il passé ? Et bien un peu cette histoire-là, c'est-à-dire que
crise inattendue et globalement hausse de la proportion moyenne à consommer,
parce que les gens ont continué de consommer un peu au même rythme
qu'auparavant. Autrement dit, on a aussi l'effet que les ménages avec les plus
faibles revenus ont tendance à consommer une proportion plus faible de leurs
revenus que les ménages avec de forts revenus — euh, plus forte pardon. Ça aussi
ça va être intéressant pour comprendre par exemple l'intérêt qui peut y avoir à
mener des politiques de redistribution.

Alors marquez-le parce que ça c'est important, c'est au cœur de l'analyse
économique. Vous savez, en ce moment, bon, on a une crise évidemment sanitaire
et une crise économique effroyable, beaucoup d'entreprises vont faire faillite.
Et donc évidemment l'État voit que les gens, pour des raisons administratives,
ils arrêtent de consommer : ils ne vont plus faire de voyage, ils ne vont plus
faire de resto, donc forcément la consommation des ménages baisse. Et qui dit
consommation des ménages qui baisse dit aussi problème pour les entreprises
derrière, y compris les entreprises qui peuvent continuer d'ouvrir. Donc il est
question par exemple d'augmenter le RSA. Les gens disent « mais pourquoi
augmenter le RSA, quel est l'intérêt ? » Et bien l'intérêt c'est qu'en fait
quand on augmente les salaires — les revenus pardon, c'est pas des salaires —
les revenus des ménages pauvres, et bien ils vont consommer tous ces revenus.
Alors quand on augmente les revenus des ménages riches, par exemple avec le
chômage partiel des gens qui ont beaucoup d'argent, on va subventionner les
entreprises et continuer de leur verser leur salaire, mais en fait eux ils ne
vont pas consommer l'essentiel de ce revenu parce que finalement, surtout en
période de crise sanitaire, bah ils n'ont pas les moyens physiques d'acheter des
choses qui correspondent à leurs habitudes de consommation. Donc il y a aussi
une logique économique à redistribuer les richesses. Souvenez-vous de ce grand A
qu'on a vu dans le chapitre 3 : le niveau de redistribution des richesses,
donner des allocations familiales, donner le RSA, voire la prime de rentrée
scolaire et cetera, ça a un effet très direct sur l'économie parce que c'est
toujours dépensé. Alors que baisser les impôts des riches par exemple, ça n'a
pas beaucoup d'effet sur leur consommation parce qu'ils ont tendance à plus
épargner. Donc cette idée-là elle est très intéressante pour comprendre le sens
de certaines politiques économiques.

Donc voilà : quand les revenus sont élevés ou augmentent, les ménages consomment
une part plus faible de leurs revenus, et de fait la proportion moyenne à
consommer diminue. Voilà, donc ça on l'a vu tout à l'heure.

### Les limites de l'analyse de Keynes

Alors l'analyse de Keynes elle est extrêmement utile et intéressante, et elle
explique très bien les variations conjoncturelles à court terme. Mais Keynes il
avait aussi une autre idée qui pour le coup est beaucoup plus contestable, et en
fait assez fausse. Alors je parle de John Maynard Keynes — je ne vous ai pas dit
qui c'était, hein, enfin vous l'avez un peu vu — mais c'est un économiste
britannique, mort en 1946, et qui a surtout écrit dans les années 30, qui est
quand même l'un des plus grands économistes du 20e siècle, qui a vraiment fondé
une école de pensée à son nom qui s'appelle le keynésianisme.

Alors pour revenir ici, l'analyse de Keynes est très utile à court terme parce
qu'effectivement on s'aperçoit que quand les revenus augmentent, la consommation
augmente moins vite, et du coup le niveau d'épargne augmente plus vite. Mais ça
c'est vrai à court terme. À long terme en fait on ne va pas voir ça. Si vous
regardez ce qui se passe aujourd'hui, la proportion moyenne à consommer des
Français elle est de 0,85, donc 85 %. Mais il y a 20 ans les Français étaient
bien plus pauvres, mais la proportion moyenne à consommer n'était pas plus forte
qu'aujourd'hui, parce que le temps d'adaptation — la croissance économique de 1,
2 % par an fait qu'on a beaucoup de temps pour s'adapter — et en fait en général
on consomme une part importante de ses revenus. Un truc par exemple qu'il faut
comprendre, qui est parfois un peu contre-intuitif, c'est que les pays les plus
inégalitaires, par exemple les États-Unis sont plus inégalitaires que la France
— ça veut dire qu'il y a très riches qui ont beaucoup d'argent — et bien ce
n'est pas forcément des pays dans lesquels la consommation globalement est plus
faible. On pourrait penser que s'il y a beaucoup de riches, il y a beaucoup plus
d'épargne, alors que si les revenus sont distribués un peu plus également, bah
il y aura plus de consommation. Mais en fait ça ne s'avère pas toujours vrai,
parce qu'en fait c'est plutôt la hausse des revenus qui fait foi plutôt que le
niveau d'inégalité. Je veux dire par là que si vous augmentez beaucoup les
revenus à un instant T, les gens ne vont pas forcément consommer davantage à
l'instant T, donc ils vont épargner davantage. Mais si vous avez des habitudes
de consommation d'ultra-riches, vous êtes presque capable de consommer tous vos
revenus, ou en tout cas une proportion de revenu qui reste importante. Donc
c'est comme ça qu'on constate que les Français d'aujourd'hui, même s'ils sont
plus riches que les Français de 2005, et bien ils ont une proportion moyenne à
consommer de 0,85 comme en 2005. Et donc à long terme en fait on constate un
ajustement de la consommation des ménages au revenu.

Les ménages — voilà, vous aussi vous verrez, quand je vous ai dit, quand vous
allez passer salarié, soudainement vous allez vous retrouver avec plein
d'argent, au début vous allez avoir du mal à consommer cet argent, puis très
vite vous allez voir que finalement vous allez consommer presque autant et
épargner presque autant que quand vous étiez étudiant — pas tout à fait, on
épargne davantage mais pas tant que ça — et ça s'ajuste avec le temps, ça
s'ajuste assez bien. Donc on se retrouve toujours à manquer d'argent même quand
on a beaucoup plus de revenus, hein, ça aussi c'est un paradoxe de la vie.

Bon, je vois... voilà, donc c'est ça que je voulais dire ici sur longue période.
Je ne sais pas si le numéro positif, pas... enfin bon, c'est à part du tableau.
Voilà, donc on va arrêter le cours là parce que c'est l'heure et je crois que
c'est la fin. Voilà, donc ça je l'ai déjà dit, je crois que c'est la fin de la
diapo. Donc et bien à demain, merci de m'avoir écouté, et apprenez bien vos
cours, et surtout faites bien les exercices, faites bien l'exercice de TD pour
apprendre toutes ces formules, c'est là qu'on va les voir.
