---
source_url: https://www.youtube.com/watch?v=DHw-dvrAv58
video_title: La méritocratie mathématique | Démocratie 23
generated_at: 2026-09-19T09:13:35.149Z
llm:
  model: mimo-v2.5
  duration_seconds: 114.9
  input_tokens: 5355
  cached_input_tokens: 0
  output_tokens: 4541
  estimated_cost_usd: 0.002021
  finish_reason: stop
---

# La méritocratie mathématique | Démocratie 23

Alice, Bob et Charlie vont à la mine pour amener une caisse de lingots d'or.
Cette caisse ne possède que deux poignées, une à gauche et une à droite. Le
problème c'est qu'il faut absolument être gaucher pour porter la poignée de
droite, et seul Alice est gauchère. Du coup, Alice porte toute seule un côté de
la caisse, alors que Bob et Charlie portent à deux l'autre côté. Il y a 10
lingots d'or dans la caisse. Comment ces lingots doivent-ils être répartis entre
Alice, Bob et Charlie, et en particulier, combien de lingots Alice mérite-t-elle
?

Intuitivement, on sent qu'Alice mérite plus de lingots d'or que Bob et Charlie,
parce qu'elle a intuitivement plus travaillé. Sauf que mesurer la quantité de
travail de quelqu'un, c'est pas facile. Comment comparer la quantité de travail
d'un caissier qui a travaillé toute la journée à celle d'un mathématicien qui a
passé la journée à dormir mais qui au moment de se réveiller a découvert la
preuve de son théorème ? En particulier, ni le nombre d'heures de travail ni
même la souffrance endurée au travail ne semblent être une bonne métrique. Jim a
peut-être fait en 15 minutes ce que Michael a fait en 3 heures, et Michael a
peut-être trouvé son travail immensément laborieux, mais peut-on alors vraiment
dire que Michael a plus travaillé que Jim ? Pas évident.

## La notion de contribution selon Shapley

Plutôt que de s'intéresser aux quantités de travail, le mathématicien économiste
Lloyd Shapley s'est plutôt intéressé à la notion de contribution. Michael en 3
heures et Jim en 15 minutes ont effectué la même contribution : selon Shapley,
ils méritent donc la même compensation.

Comment est-ce que ça s'applique à Alice, Bob et Charlie ? De façon naïve, on
pourrait se dire que sans Alice, Bob et Charlie n'auraient pas su ramener la
caisse, alors que sans Bob, Alice et Charlie auraient ramené la caisse, et sans
Charlie, Alice et Bob auraient ramené la caisse. Du coup, si on continue ce
raisonnement naïf, seule Alice a eu une contribution décisive, et donc seule
elle devrait récupérer les lingots de la caisse. Mais intuitivement, cette
redistribution n'est pas satisfaisante. Notamment parce que si les lingots
étaient redistribués ainsi, ni Bob ni Charlie n'auraient accepté d'aider Alice
en premier lieu. Et puis si Eve était gauchère et qu'elle venait contribuer à
son tour, alors ni Bob, ni Charlie, ni Alice n'auraient eu de contribution
décisive.

En fait, le concept pertinent qu'a su identifier Lloyd Shapley est la
contribution de chacun à différents sous-ensembles de travailleurs. Autrement
dit, au lieu de se restreindre à la contribution d'un individu lorsqu'il vient
aider tous les autres, Shapley s'est intéressé à ce que l'individu aurait
contribué s'il n'y avait qu'un sous-ensemble des autres qui avaient travaillé.

Dans notre cas, si on étudie les contributions de Bob, on voit que s'il est tout
seul, il sera incapable de ramener la caisse, donc sa contribution sera nulle.
S'il collabore uniquement avec Charlie, alors sa contribution demeure nulle
puisque que Bob soit là ou non, la caisse n'est pas ramenée. Mais si maintenant
Alice arrive et si Bob vient l'aider, alors grâce à Bob, Alice et Bob peuvent
ramener la caisse. La contribution de Bob à Alice est donc égale à tout le
contenu de la caisse, à savoir 10 lingots d'or. Enfin, si Alice et Charlie
travaillent tous les deux, alors la présence de Bob n'apporte aucune
contribution puisque Alice et Charlie ensemble auraient déjà pu ramener la
caisse. Les contributions de Charlie aux différentes présences imaginables des
autres sont similaires. Enfin, Alice quant à elle a une contribution de 10
lingots d'or dans tous les cas sauf celui où elle est seule, puisque sans Alice
rien n'est ramené, mais pourvu que Bob ou Charlie travaillent, alors les 10
lingots d'or seront bel et bien ramenés.

Ce tableau avec toutes les contributions marginales des différents travailleurs
à des sous-ensembles d'autres travailleurs est en gros ce que Shapley a appelé
la fonction caractéristique de la coopération, et pour Shapley, la
redistribution méritocratique des richesses doit dépendre uniquement de cette
fonction caractéristique.

## Les quatre propriétés de Shapley

Le génie de Shapley, c'est d'avoir proposé deux approches différentes pour
déterminer cette redistribution méritocratique et d'avoir démontré que ces deux
approches étaient en fait équivalentes. La première, c'est une équation sur
laquelle on reviendra plus tard. La seconde, que je trouve absolument
fascinante, c'est une approche axiomatique, un peu comme celle de von Neumann et
Morgenstern. En particulier, Shapley a listé quatre propriétés désirables de la
redistribution méritocratique.

La première, c'est l'absence de gaspillage. C'est tout bêtement dire qu'on ne va
rien jeter à la poubelle. Alors ce n'est pas vraiment une notion méritocratique,
mais on est d'accord pour dire que c'est une propriété désirable.

La seconde, c'est la symétrie entre contributeurs. Ce que ça dit, c'est que si
deux contributeurs ont la même contribution à chaque sous-ensemble de
travailleurs, alors ils doivent recevoir la même récompense. Dans notre cas, les
contributions de Bob et Charlie sont les mêmes, du coup ils doivent recevoir la
même chose à la fin. Ça paraît être un peu le B.A.-ba de la méritocratie.

La troisième propriété est celle du contributeur nul. Elle dit qu'un individu
qui n'a aucune contribution ne doit rien recevoir. Là encore, ça paraît être un
principe méritocratique raisonnable : si quelqu'un ne contribue rien, on a envie
de dire qu'il ne mérite rien. Et attention, on insiste bien sur l'aspect
méritocratique de cette définition. En particulier, on n'est ici pas en train de
parler d'égalité ou d'empathie. Bien sûr, on peut se demander si la méritocratie
c'est bien, mais ce n'est pas le débat aujourd'hui.

La quatrième propriété avancée par Shapley est la linéarité. Cette propriété est
un petit peu plus technique et un petit peu moins philosophique. Elle dit en
gros que si on fait deux coopérations différentes, alors la redistribution que
l'on obtient si on considère que ces deux coopérations font partie d'un
super-projet doit être la même que si on considère que ces deux projets sont
distincts et qu'on effectue les redistributions de façon séparée.

Bref, on a quatre propriétés assez naturelles et qui semblent vraiment
méritocratiques. Et bien, de façon étonnante, Shapley a démontré qu'il existait
une et une seule redistribution des richesses qui satisfassent ces quatre
propriétés. Cette redistribution est ce que l'on appelle la valeur de Shapley.

## Calculer la valeur de Shapley

Shapley a aussi déterminé une formule qui permet de calculer cette valeur de
Shapley. La redistribution méritocratique de Shapley est une moyenne pondérée de
ses contributions aux différents sous-groupes de travailleurs. Il y a une petite
technicalité, qui est que le poids d'une certaine contribution est une fonction
de la taille du sous-ensemble de contributeurs auquel on contribue, et ça fait
appel à ce qu'on appelle les coefficients binomiaux.

Il y a une façon plus simple de réinterpréter l'équation de Shapley. Imaginons
que les contributeurs arrivent un à un, mais dans un ordre aléatoire. Par
exemple, supposons que Bob arrive avant Charlie, qui arrive avant Alice. On peut
alors calculer la contribution de chacun au moment où il se met à travailler.
Avant Bob, rien n'est récolté puisqu'il n'y a personne pour amener la caisse.
Bob seul ne peut pas ramener la caisse non plus, donc sa contribution est nulle.
Quand Charlie arrive, la caisse ne peut toujours pas être ramenée puisqu'il faut
un gaucher : la contribution de Charlie est nulle. Mais quand Alice arrive, la
caisse peut enfin être ramenée. La contribution d'Alice pour cet ordre d'arrivée
est égale à 10 lingots d'or.

Supposons maintenant que l'ordre d'arrivée soit Alice, Charlie, Bob. Alors Alice
ne contribue rien, Charlie contribue 10 lingots d'or, et Bob ne contribue rien.
Supposons qu'il soit Bob, Alice, Charlie : alors Bob ne contribue rien, Alice
contribue 10, et Charlie ne contribue rien.

La valeur de Shapley d'Alice sera sa contribution moyenne lorsque l'ordre
d'arrivée des contributeurs est aléatoire. Dans notre cas, on peut voir qu'Alice
contribuera 10 si et seulement si elle n'est pas la première arrivée, et
contribuera zéro sinon. Or elle a une probabilité 2 sur 3 de ne pas arriver
première. Sa contribution moyenne, qui est aussi sa valeur de Shapley, est donc
10 × 2/3, qui est égal à environ 6,7 lingots d'or.

À l'inverse, Bob ne contribuera 10 que si Alice arrive avant et si Bob arrive
avant Charlie. Autrement dit, Bob ne contribue que si l'ordre d'arrivée est
Alice-Bob-Charlie, ce qui a une chance sur 6 d'arriver. La contribution moyenne
de Bob est donc de 10/6, qui est à peu près égale à 1,7 lingot d'or. De même, la
contribution moyenne de Charlie est aussi 1,7 lingot d'or.

On n'est pas en train de dire qu'il faut absolument utiliser la valeur de
Shapley en pratique, mais il faut bien voir que si on n'utilise pas la valeur de
Shapley, alors nécessairement il y a au moins une des quatre propriétés que l'on
a listées précédemment qui ne sera pas satisfaite.

## Limites de la valeur de Shapley

La valeur de Shapley a quand même de bonnes propriétés. Ceci étant dit, à
l'instar de nombreux concepts dont on a parlé dans cette série, la valeur de
Shapley a aussi des faiblesses. On peut notamment signaler le fait qu'on a
supposé ici qu'il n'y avait qu'un seul bien à se partager, à savoir l'or. Or en
pratique, tout ne peut pas toujours se ramener à de l'argent, notamment parce
que chacun d'entre nous diffère dans la manière dont on compare les loisirs à
l'argent. En pratique, il y a plutôt des biens hétérogènes à partager, et là on
tombe dans le cadre du partage de gâteau.

La valeur de Shapley suppose que rien n'est tombé du ciel. Autrement dit, elle
suppose qu'en l'absence de coopération aucun bien ne sera produit. Or en
pratique, c'est une hypothèse de plus en plus discutable, notamment avec
l'avènement de l'automatisation.

Et surtout, la valeur de Shapley ne favorise pas nécessairement la coopération.
Typiquement, dans notre cas, Bob a tout intérêt à exclure Charlie du deal et
s'arranger avec Alice pour qu'il n'aille récupérer la caisse à deux, en lui
promettant au passage peut-être 8 lingots plutôt que 6,7, auquel cas Bob pourra
mettre 2 lingots dans sa poche. De façon cruciale, en excluant Charlie du deal,
Bob garantit le fait qu'à la fois Alice et lui y gagnent au change.

Le bon concept pour étudier la stabilité des coopérations, qui est intimement
lié à la notion de contrat, est le corps. Le corps, c'est l'ensemble des
redistributions des richesses tel qu'aucun sous-ensemble de contributeurs n'a
intérêt à sortir de la coopération globale pour ne coopérer qu'entre eux. Dans
notre cas, la valeur de Shapley n'est pas dans le corps puisque Alice et Bob ont
intérêt à sortir de la coopération globale pour ne coopérer que tous les deux.
Malheureusement, le grand drame de la théorie des jeux coopératives —
c'est-à-dire la partie de la théorie des jeux qui étudie les coopérations —
c'est que bien souvent le corps est vide parce que les gains d'une coopération
globale ne sont pas suffisants pour empêcher certains d'en sortir. Et c'est
typiquement le cas de notre exemple : quelle que soit la redistribution
méritocratique, il y a fort à parier que Bob ou Charlie finira par se faire
exclure du deal.

## Questions de la communauté

Gendoline François nous demande pourquoi ne pas avoir fait des parts en forme de
cercle pour que chacun ait un peu de tout, et on peut du coup faire en sorte que
chacun ait exactement la même part, et ensuite autoriser le libre échange.
Autrement dit, on part d'une solution égalitaire et ensuite on libéralise le
marché. C'est quelque chose dont on avait parlé dans l'épisode 21, puisqu'on a
la bonne propriété que le partage proportionnellement juste est stable par
libéralisation du marché. Malheureusement, ce n'est pas le cas du partage sans
jalousie : on peut partir d'un partage égalitaire, permettre le libre échange,
et à la fin obtenir un partage qui n'est plus sans jalousie. L'autre problème,
c'est que le modèle qui est souvent étudié en partage de gâteau, c'est le cas où
le gâteau est juste un segment de droite et on a juste le droit de le couper
avec des coupes verticales. Bien sûr, on fait des maths et ce qui nous intéresse
ce sont des exemples ultra simplifiés, et dans ce cadre les préférences
individuelles sont soit des mesures de probabilité, soit on peut considérer
qu'il y a un algorithme : chacun réagit comme un algorithme qui est capable, si
on lui donne deux parts, de savoir laquelle est sa préférée, et qui est
également capable de couper le segment en deux parts qui sont égales selon lui.
On voit bien qu'avec ce formalisme plus général, ce n'est pas facile de faire un
partage égalitaire : c'est même très, très, très difficile. Il est même
impossible d'avoir un partage égalitaire dans le cas général.

John 1 le Marston nous fait remarquer que ça ressemble pas mal aux enchères au
final. En effet, si on prend le coup du couteau qui bouge, ça ressemble
finalement beaucoup à l'enchère à la hollandaise : on a quelque chose qui bouge,
et puis dès que quelqu'un se dit « c'est bon », il obtient le bien. À l'inverse,
le dernier réducteur correspond un peu plus à une enchère à la japonaise si on a
vu le couteau qui allait dans l'autre sens. Si on fait par pas discrets, ça
correspond plus à une enchère à un tour classique. Et la méthode des marqueurs
ressemble vraiment à l'enchère à un tour mais cachée, où chacun annonce
uniquement un prix, et ce prix est dans une enveloppe.

Anthony Canou nous demande si l'enchère cachée avec redistribution du surplus
ressemble à VCG. Ce n'est pas tout à fait pareil, c'est assez différent. En
particulier, VCG a la bonne propriété d'être incentive compatible, c'est ce qui
fait que les théoriciens des jeux adorent VCG. Mais VCG ne permet pas de
garantir le partage proportionnellement juste, et les propriétés de VCG sont en
fait très différentes de celles de l'enchère cachée avec redistribution du
surplus. Bref, si vous êtes avec des gens cool qui sont plutôt honnêtes de base
et qui aiment l'équité, alors je vous conseille l'enchère cachée avec
redistribution du surplus. Mais si vous êtes avec des gens suspects qui sont
prêts à mentir pour avoir un maximum de trucs, et que tout ce qui compte pour
vous c'est l'optimalité sociale et que vous vous moquez complètement des notions
d'équité, alors je conseille plutôt VCG.

Marc Baget nous fait remarquer que dans la Déclaration des droits de l'homme et
du citoyen, dans le premier article, il y a une seconde phrase qui dit que les
distinctions sociales ne peuvent être fondées que sur l'utilité commune. Ça
permet en particulier de justifier le fait que dans le bus, les personnes âgées
ont la priorité pour certaines places assises. Ceci dit, cette seconde phrase du
premier article est quand même souvent oubliée, et du coup les gens retiennent
souvent, peut-être trop souvent, le fait que ce qui compte c'est l'égalité avant
tout. Un point sur lequel on voulait vraiment insister dans la vidéo précédente
et dont on profite pour insister à nouveau, c'est que l'égalitarisme a également
ses propres difficultés et que ce n'est pas forcément la solution à tout. Ça ne
veut pas dire non plus que cette seconde phrase de l'article 1 de la Déclaration
des droits de l'homme et du citoyen résout tout, parce que déjà la notion
d'utilité commune est une notion extrêmement difficile, et on aura l'occasion
d'y revenir dans une prochaine vidéo.

Sébastien Herbroto nous demande pourquoi ne pas maximiser le produit des
utilités. C'est une question très intéressante puisque notamment John Nash y
avait pensé, et il a défini le cas où on essaie toujours de maximiser la
multiplication des utilités, des bonheurs des différentes personnes. Quand il
n'y a que deux joueurs, ça conduit à la solution du Nash Bargaining, de la
négociation de Nash. Bien sûr, ça peut être très facilement généralisé au cas où
il y a plus de joueurs, et il y a des articles de recherche, par exemple un
papier qui s'appelle « The Price of Fairness » de Bertsimas et d'autres, qui
étudient cela. Il y a quand même une petite limite à cette notion de
maximisation du produit des utilités, qui est le fait qu'elle dépend fortement
du statu quo. Si on considère que le statu quo du partage du gâteau est le
partage égalitaire, ou si on considère que le statu quo c'est le cas où personne
n'a aucune part de gâteau, on obtient des partages différents du gâteau
lorsqu'on cherche à maximiser ce produit des utilités. D'ailleurs, Nash, un peu
comme Shapley, a prouvé que la solution du Nash Bargaining est la seule façon de
satisfaire quatre propriétés qu'il considérait désirables. Lorsque le statu quo
a vraiment un point important dans les prises de décision, le Nash Bargaining
est sans doute très pertinent, mais quand on ne sait pas trop comment définir le
statu quo, c'est une notion qui pose un petit peu problème.

## Conclusion

Cette vidéo clôt un peu une série de vidéos. On était un petit peu plus sur des
aspects mathématiques de la théorie des jeux. À partir de la prochaine vidéo, on
va revenir sur des notions un peu plus proches de la politique, et notamment
plus philosophiques et plus morales. En particulier, la prochaine fois on va
parler du libre arbitre.
