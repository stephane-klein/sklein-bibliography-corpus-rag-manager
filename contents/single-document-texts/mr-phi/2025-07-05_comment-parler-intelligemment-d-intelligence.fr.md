---
source_url: https://www.youtube.com/watch?v=AwUpxjODogQ
video_title: Comment parler intelligemment d'intelligence ?
generated_at: 2026-09-19T09:54:46.673Z
authors:
  - Thibaut Giraud
original_published_date: 2025-07-05
llm:
  model: mimo-v2.5
  duration_seconds: 307.3
  input_tokens: 15778
  cached_input_tokens: 15744
  output_tokens: 12557
  estimated_cost_usd: 0.003565
  finish_reason: stop
---

# Comment parler intelligemment d'intelligence ?

## Comment parler intelligemment d'intelligence ?

Nous sommes plus intelligents que les machines. Pour le moment. Certains vont
dire : « C'est faux ! Les IA surpassent les êtres humains dans un nombre
croissant de tâches ! » Et d'autres vont rétorquer : « Mais non, ce n'est pas de
la VRAIE intelligence. Et d'ailleurs l'intelligence artificielle n'existe pas !
» Oui, faut arrêter de dire des conneries quand même. Faut arrêter de dire
n'importe quoi. Bon, c'est rigolo, d'accord, c'est marrant. Mais faut arrêter de
dire n'importe quoi. Mais la seule chose intelligente à objecter à ce stade,
c'est : « Qu'entends-tu par intelligence, mon cher ? » C'est une excellente
question, et ça va être le sujet : comment parler intelligemment d'intelligence
pour des machines ?

Pour ça, on va s'appuyer sur le travail du chercheur en IA François Chollet, de
son article « Sur la mesure de l'intelligence », et de ses benchmarks ARC-AGI.
On va voir pourquoi ils sont particulièrement intéressants pour mesurer les
avancées vers une forme d'intelligence générale (en un sens qu'on va expliciter
plus loin), et pourquoi on n'y est pas encore, même si force est de constater
qu'on s'en rapproche.

### Un tournant institutionnel : les « étincelles » d'AGI

Quand GPT-4 est présenté en mars 2023, une équipe de Microsoft Research publie
un article intitulé « Sparks of Artificial General Intelligence », c'est-à-dire
« Des étincelles d'intelligence générale artificielle ». C'est un papier qui
explore les diverses capacités de GPT-4 et qui soutient donc qu'on y détecterait
les prémices d'une intelligence générale. Et ça, ça marque une rupture au moins
sur le plan institutionnel, parce que, pour autant que je sache, c'est la
première fois qu'une publication issue d'un acteur majeur comme Microsoft défend
de façon aussi explicite la possibilité d'une telle forme d'intelligence dans un
système *existant*. Jusque-là, cette idée d'Artificial General Intelligence, ou
AGI, ça restait un sujet de discussion très spéculatif du genre qui intéresse
les philosophes bizarres à la Nick Bostrom, mais pas un truc de chercheurs
sérieux. Là, donc, tout à coup, avec GPT-4 et cet article, il y a un truc qui
change : ça devient acceptable de parler sérieusement d'intelligence générale
dans un système artificiel, non pas comme un horizon éloigné mais comme une
réalité potentiellement assez proche.

Et choisir les mots « Artificial General Intelligence » dans le titre de
l'article est d'autant moins anodin que l'accord noué en 2019 qui permet à
Microsoft d'utiliser les produits d'OpenAI (en échange de gros investissement),
cet accord stipule que Microsoft n'aura plus accès à ces produits dans
l'éventualité où OpenAI arriverait à produire une AGI. Et c'est ouvertement le
but d'OpenAI, c'est écrit blanc sur noir : « Notre but est de construire une
intelligence générale artificielle (AGI) qui soit sûre et bénéfique pour toute
l'humanité. » Par AGI, nous entendons un système hautement autonome qui surpasse
les humains dans la plupart des tâches économiquement rentables. Un tel système
est exclu des licences de propriété intellectuelle et des autres conditions
commerciales conclues avec Microsoft, qui ne s'appliquent qu'aux technologies
pré-AGI.

Cette clause sur les technologies pré-AGI, elle est là depuis le départ, en
2019, et à cette époque ça avait été jugé… assez fantasque, disons, voire
franchement ridicule. Faut se rappeler du contexte : 2019, c'est avant GPT-3, on
est au tout tout début des LLM. Typiquement dans cet article qui date de cette
époque, on voit que lorsqu'ils présentent les recherches d'OpenAI, ils parlent
d'abord d'un certain benchmark en robotique, puis d'une IA qui joue à Dota 2, et
seulement après, ils mentionnent des « systèmes de génération de textes très
flexibles » en ajoutant immédiatement qu'aucun de ces projets ne ressemble à ce
qu'il faudrait pour atteindre l'AGI. Bref, à cette époque, une clause qui
précise ce qu'on fera si on atteint l'AGI, c'est de la pure science-fiction.
C'est un peu comme si un contrat avec la NASA indiquait : « Ce contrat peut être
rompu en cas de rencontre extra-terrestre. » Ok, si vous voulez, ça engage pas à
grand-chose a priori.

Sauf que là, quatre ans et deux versions de GPT plus tard, les extraterrestres
ne semblent plus si loin. Notez que l'article « Sparks of AGI », c'est une
équipe de Microsoft qui le publie, et donc si on prend ces étincelles d'AGI au
sérieux, ça peut remettre en question l'avenir du partenariat entre OpenAI et
Microsoft. À cause de cette clause sur les technologies pré-AGI, savoir
exactement ce qui compte ou non comme une intelligence générale artificielle ça
devient un enjeu crucial. Comment ils se sont arrangés ? Alors, ça n'a pas été
officiellement confirmé mais apparemment en 2023, OpenAI et Microsoft auraient
précisé les choses en convenant que l'AGI serait considérée comme atteinte à
partir du moment où les systèmes d'OpenAI généreraient des profits dépassant 100
milliards de dollars. Autrement dit, selon OpenAI et Microsoft, intelligence
générale = pognon. Ça, c'est le niveau de langage qui parle aux investisseurs,
on simplifie un peu les choses. Or, pour l'instant, OpenAI ne dégage pas de
profit. Donc, techniquement, on peut le dire : les LLM ne sont pas intelligents
puisqu'ils ne font pas assez de pognon. CQFD, j'ai envie de dire. Mais j'ai
surtout envie de dire que c'est une approche assez discutable et limitée pour
définir l'intelligence. On sent que ça manque deux-trois subtilités.

### Vers une meilleure définition de l'intelligence

Mais bon, il fallait un critère clair et sans ambiguïté, et le problème, c'est
qu'en effet il n'y a pas de définition commune et consensuelle de la notion
d'AGI ou d'intelligence générale. D'ailleurs le texte d'OpenAI que je citais
tout à l'heure n'était pas beaucoup plus clair d'ailleurs : ça parle d'« un
système hautement autonome qui surpasse les humains dans la plupart des tâches
économiquement rentables ». Au fond, donner pour critère 100 milliards de
dollars, c'est une façon de préciser « rentable à quel point » (à un point assez
élevé, donc). Mais on sent bien que c'est pas une définition qui met le doigt
sur ce qui est essentiel dans la notion d'intelligence générale évidemment.

Eh bien donc, essayons de faire mieux, essayons de réfléchir en voyant plus loin
que 100 milliards de dollars. Qu'est-ce qui constituerait l'intelligence
générale dans une machine ? Déjà, on peut s'entendre sur le fait que
l'intelligence se manifeste notamment par une capacité à s'adapter à des
problèmes nouveaux ou des tâches nouvelles. Mais si cette capacité est
restreinte à des problèmes dans un domaine étroit, alors on ne peut pas parler
d'intelligence générale. Par exemple, un moteur d'échecs a une intelligence
prodigieuse du jeu d'échecs dans la mesure où, devant une configuration nouvelle
de l'échiquier, il est capable de l'évaluer et de trouver d'excellents coups.
Mais en dehors de ce domaine étroit, son intelligence est juste nulle. Et c'est
le cas de beaucoup de systèmes d'intelligence artificielle : ce sont des
intelligences très supérieures à la nôtre dans un domaine étroit, mais nulles en
dehors.

Un modèle d'apprentissage par renforcement comme Agent57 de DeepMind par exemple
qui a appris tout seul à jouer aux 57 jeux classiques d'Atari, ça présente déjà
une forme d'intelligence plus générale dans la mesure où c'est capable
d'apprendre à jouer à virtuellement n'importe quel jeu de ce genre, dans cet
environnement Atari, et même des jeux assez complexes. Son intelligence s'étend
donc à un domaine plus large, c'est moins étroit, mais ça reste quand même assez
étroit si on la compare à l'intelligence humaine qui, vous l'aurez remarqué,
s'étend bien au-delà des jeux Atari. Notre intelligence est générale au sens où
justement elle n'a pas de domaine spécifique : il y a une inpuisable diversité
de tâches auxquelles nous pouvons devenir au moins médiocrement compétents même
si nous les avons encore jamais rencontrées. Les machines nous dépassent sur des
tâches spécifiques, typiquement pour jouer aux échecs, même le meilleur humain
est extrêmement médiocre par rapport aux moteurs spécialisés. Mais la médiocrité
humaine est *générale*. Et ça, c'est fort ! C'est en ça que nous sommes
intelligents : potentiellement médiocres en tout.

Les LLM actuels approchent-ils, eux aussi, cette médiocrité générale ? C'est
vrai qu'ils semblent beaucoup plus polyvalents que n'importe quelle IA
spécialisée qu'on connaissait jusque-là. On peut leur donner toutes sortes de
tâches formulées en langage naturel et ils se débrouilleront pas trop mal pour
un grand nombre d'entre elles (et souvent même mieux qu'un être humain pris au
hasard). Et c'est d'autant plus remarquable que c'est pas quelque chose qu'on a
explicitement programmé, c'est le résultat d'un apprentissage qui n'avait rien
de spécifique. Le modèle de base est juste entraîné à prédire du texte de façon
générale. Et ce modèle de base est pourtant capable de traiter toutes sortes de
requêtes.

Était-il pour autant justifié de parler d'étincelles d'intelligence générale
comme le faisait cet article ? Beaucoup de gens ont rejeté cet usage du terme.
Pas toujours pour de bonnes raisons. L'intelligence, c'est un peu comme la
conscience ou le je-ne-sais-quoi : on a envie d'en faire un privilège de
l'humanité et on pourra toujours soutenir que les machines n'auront jamais accès
à la VRAIE intelligence, non, même dans 1000 ans. Mais mettons de côté ces
défenses dogmatiques de l'exceptionnalité humaine. Il y a aussi des raisons
intéressantes à faire valoir contre cette idée d'un début d'intelligence
générale dans les LLM comme GPT-4, et parmi les personnes qui ont rejeté cette
idée, il me semble qu'aucune n'a aussi clairement, rigoureusement et
empiriquement justifié sa position que le chercheur en intelligence artificielle
François Chollet.

Pour comprendre pourquoi, penchons-nous d'abord sur son article fondateur
intitulé « Sur la mesure de l'intelligence », pour bien comprendre ce qu'il
entend justement par ce terme d'intelligence. Voici la définition qu'il en
propose : « L'intelligence d'un système est une mesure de son efficacité à
acquérir des compétences dans un ensemble de tâches, en tenant compte des a
priori, de l'expérience, et de la difficulté de généralisation. Intuitivement,
si vous considérez deux systèmes qui partent d'un ensemble similaire de
connaissances a priori, et qui passent par une quantité similaire d'expériences
(par exemple, un temps d'entraînement) en ce qui concerne un ensemble de tâches
non connues à l'avance, le système ayant une intelligence plus élevée est celui
qui finit par avoir de plus grandes compétences (c'est-à-dire celui qui a le
plus efficacement transformé ses connaissances a priori et son expérience en
compétences). (…) L'intelligence est distincte de la compétence elle-même : la
compétence n'est que la sortie du processus d'intelligence. » Pour reprendre une
formule usuelle : être intelligent, ce serait avoir une tête bien faite plutôt
qu'une tête bien pleine seulement.

Pour résumer ça, François Chollet aime bien donner une citation du psychologue
Jean Piaget : « L'intelligence n'est pas ce que l'on sait, mais ce que l'on fait
quand on ne sait pas. » (Notez que j'ai pas trouvé la source exacte de cette
phrase qui circule beaucoup mais uniquement en tant que citation de Jean Piaget
sans référence précise, et en général ça, c'est le signe que la citation est
plus ou moins inventée. Mais apparemment ça colle quand même assez bien à la
conception de Piaget, donc même si c'est faux, c'est bien trouvé, on va dire.
Bref.)

En somme, François Chollet soutient que l'intelligence réside dans la capacité à
acquérir facilement des compétences nouvelles pour faire face à des problèmes
nouveaux, plutôt que dans le fait d'avoir emmagasiné de multiples compétences
pour faire face à des problèmes déjà connus, si divers soient-ils. Cette
approche suppose donc un lien intrinsèque entre intelligence et généralisation.
Ce qui caractérise l'intelligence, c'est une capacité à résoudre des problèmes
en général, à s'adapter à n'importe quel type inédit de problème en acquérant
efficacement les compétences utiles pour y faire face.

Donc c'est une définition possible de l'intelligence ? Est-ce la seule possible
? Bien sûr que non. Et c'est pas ce que soutient François Chollet. « Soulignons
que de nombreuses définitions possibles de l'intelligence peuvent être valides,
dans de nombreux contextes différents, et nous ne prétendons pas que la
définition ci-dessus (…) représente la "seule vraie" définition. Notre
définition ne vise pas non plus à obtenir un large consensus. L'objectif de
notre définition est plutôt d'être exploitable, de favoriser un changement de
perspective utile pour la recherche sur les capacités cognitives larges et de
servir de base quantitative pour de nouveaux benchmarks en matière
d'intelligence générale. »

### Le problème des benchmarks traditionnels et l'ARC-AGI

Ce dernier point sur les benchmarks est central, et on va beaucoup parler de
benchmark aujourd'hui, donc autant clarifier un peu les choses sur ce que c'est.
Un benchmark, c'est un test standard utilisé pour évaluer les performances d’un
modèle par rapport aux autres, c'est avant tout un outil de comparaison pour
suivre l'évolution des performances. Donc très souvent quand un nouveau modèle
est publié, on va publier ses performances sur plein de benchmarks pour montrer
à quel point il fait mieux ou aussi bien que les modèles précédents.

Mais François Chollet reproche aux benchmarks censés mesurer les progrès des IA
en matière d'intelligence de s'en tenir à des tâches standard et stéréotypées
dont il y a de trop nombreux exemples dans les données d'entraînement. Et même
pour certains benchmarks on peut se demander si leurs contenus n'ont pas fait
partie des données d'entraînement. Typiquement un benchmark qui consiste à faire
passer un examen connu. On parle de problème de contamination, dans ce cas. Et
vu que les corpus d'entraînement sont gigantesques et qu'il est difficile de
savoir en détail ce qu'ils contiennent, ces problèmes de contamination peuvent
être difficiles à écarter. Tout ça fait que beaucoup de benchmarks usuels
mesurent peut-être surtout le progrès dans la mémorisation des connaissances et
compétences acquises au cours de l'entraînement, au lieu d'un réel progrès dans
l'intelligence comprise comme la capacité à acquérir de nouvelles compétences.

En somme, les benchmarks standard permettent surtout de mesurer à quel point les
LLM sont des têtes bien pleines de petits programmes variés, sans indiquer si ce
sont des têtes bien faites, c'est-à-dire capables de résoudre un problème
nouveau en créant un programme adapté. Et donc pour François Chollet, les
performances des LLM s'expliquaient avant tout ainsi : par de la mémorisation.
En grossissant, de GPT-1 à GPT-4, on n'a fait qu'ajouter toujours plus de
connaissances et de compétences. Ce sont de très grosses têtes très pleines,
ayant été entraînées sur tout Internet pour ainsi dire, disposant par là d'une
variété immense de méthodes, de schémas de raisonnement, de schémas de
programmes qu'ils peuvent recycler face à des problèmes suffisamment similaires,
ce qui les rend extrêmement polyvalents, mais sans capacité générale à s'adapter
face à une véritable nouveauté.

Et ça, ça crée illusion parce que, chez l'être humain, comme on n'a pas une
telle capacité de mémorisation, un très haut degré de polyvalence est
effectivement le signe d'une intelligence générale. Mais pour les LLM c'est
différent, c'est très important de bien distinguer ces deux aspects. L'extrême
polyvalence n'est pas l'intelligence générale.

Comment prouver rigoureusement que les LLM ne sont que des grosses têtes très
pleines dont les performances reposent uniquement sur la mémorisation ? Il
faudrait pour ça évaluer les performances des LLM à des tâches très accessibles
à l'intelligence humaine mais qui résistent justement au type de mémorisation
dont les LLM sont capables. Et c'est donc ce qu'a proposé François Chollet. Avec
son article de 2019, il publie un corpus de tâches de raisonnement précisément
conçues dans ce but : pour résister à la mémorisation. C'est le benchmark
ARC-AGI (ce qui veut dire Abstract and Reasoning Corpus for Artificial General
Intelligence).

Alors jetons un oeil à ces problèmes, justement. Sur le site arcprize.org on a
accès à une partie publique du benchmark (mais qui n'est pas le vrai benchmark
bien sûr : le vrai est complètement privé pour éviter les problèmes de
contamination). Alors voilà comment ça se présente, on a des entrées sous forme
de grilles de pixels, et chacune est associée à une sortie selon une certaine
logique qu'il faut réussir à comprendre. Et la tâche ensuite c'est de trouver la
sortie associée à cette entrée. Il y a des centaines de tâches et des centaines
de logiques différentes pour les résoudre, mais c'est toujours comme ça, c'est
jamais bien difficile.

Ils ont fait passer le test sur la plateforme Mechanical Turk (c'est une
plateforme où les participants sont rémunérés à la tâche et donc les données
sont pas de bonne qualité parce que les participants cherchent surtout à
répondre vite, mais ça reste très utilisé pour des tests de psychologie), et
donc les participants de Mechanical Turk atteignent 77% de réponses correctes en
moyenne. On peut considérer ça comme le niveau humain minimal vraiment. Mais en
réalité si vous vous donnez un peu la peine de réfléchir c'est facile
d'approcher les 100% de réussite. Par exemple, vous pouvez essayer en arrêt sur
image ces deux petites tâches. Normalement ça reste plutôt facile pour un
cerveau humain. Il devrait suffire de quelques secondes pour saisir la logique
de ces transformations et on n'a besoin d'aucune connaissance particulière pour
y arriver.

Si les LLM avaient une forme d'intelligence générale similaire à la nôtre, ça
devrait donc leur sembler également facile. Mais trouver la logique de ces
couples entrées-sorties et l'appliquer à une entrée supplémentaire, c'est pas un
type de tâche standard dont il existe des tas d'exemples dans les données
d'entraînement des modèles, donc c'est pas un exercice qui repose sur la pure
mémorisation. Il faut vraiment, par soi-même en quelque sorte, « comprendre » la
logique qui nous est présentée et l'appliquer.

Les LLM comme GPT-3 qui ne traitent que du texte ne pouvaient résoudre aucun
problème de ce type (même en essayant de les traduire sous forme de texte). Avec
GPT-4, on pouvait s'attendre à un progrès, déjà parce que le modèle est plus
performant de façon générale, et aussi parce qu'il est multi-modal, c'est-à-dire
qu'il est capable de prendre une image en entrée. Et c'est mieux de voir pour
résoudre des tâches visuelles, évidemment. Pourtant, les tentatives d'appliquer
GPT-4 ou 4o au benchmark ARC-AGI sont restées en-dessous des 5% de réussite. Et
les autres LLM ne faisaient pas mieux. Donc GPT-3 c'était en 2020, et GPT-4 et
4o c'est en 2023-2024. Pourtant par ailleurs, durant la même période, les LLM
accomplissaient de plus en plus de prouesses sur d'autres benchmarks dans de
très nombreux domaines, relevant typiquement d'épreuves scolaires ou
universitaires. On pouvait leur faire passer le bac, l'épreuve du barreau, les
benchmarks semblaient tomber les uns après les autres. Mais pas ARC-AGI. Le
petit benchmark gaulois qui résiste encore et toujours aux envahissants LLM.

Tout ça semblait bien confirmer le point de vue de François Chollet selon lequel
les performances des LLM reposaient avant tout sur de la mémorisation et non sur
une forme d'intelligence générale. Leur entraînement permet d'emmagasiner
beaucoup de connaissances et de compétences, (notamment des connaissances et des
compétences liées à des concours comme l'épreuve du barreau ou des tests
standard comme les tests de QI qui sont largement référencés), autrement dit
l'entraînement des LLM les rend extraordinairement polyvalents, et une
extraordinaire polyvalence peut donner l'illusion de la généralité jusqu'à un
certain point, mais les LLM resteraient en quelque sorte figés dans l'état de
compétence auxquels ils arrivent à la fin de leur entraînement, sans capacité à
apprendre des nouvelles compétences à la volée, en contexte, pour s'adapter à
des situations et des problèmes vraiment nouveaux.

Alors vous vous dites c'est peut-être parce que les gens ont pas assez essayé
sur ce benchmark, mais depuis 2024 il y a même une compétition publique
organisée à l'initiative de François Chollet et dotée d'1 million de dollars
pour les premiers qui atteindront 85% de succès d'un système d'IA à ce benchmark
ARC-AGI. Il me semble qu'on peut difficilement faire plus d'effort pour mettre
une hypothèse à l'épreuve de l'expérience !

### L'arrivée des modèles de raisonnement

Où en sommes-nous maintenant ? Quelles sont les performances des meilleurs
modèles aujourd'hui sur ce benchmark ? Pour rappel, GPT-3 c'est 0% de réussite.
GPT-4o, plusieurs années plus tard, ne monte qu'à 4,5%. Et puis brusquement, en
septembre 2024, le modèle o1 d'OpenAI dépasse 30% de réussite. Ce modèle o1,
c'est le premier modèle de raisonnement, c'est-à-dire un modèle qui résulte d'un
apprentissage par renforcement sur ce qu'on appelle des chaines de réflexion
(*chains of thought*), c'est-à-dire des sortes de verbalisations de réflexion ou
de raisonnement. Alors je vais pas rentrer dans le détail du fonctionnement d'un
modèle de raisonnement mais si ça vous intéresse, la dernière partie de cette
vidéo de Science Étonnante le fait très bien. Et juste là pour esquisser les
choses à gros trait, disons qu'un modèle de raisonnement, c'est un modèle qui
est entraîné à verbaliser des réflexions avant de répondre, c'est donc la *chain
of thought* (ou CoT), et en optimisant cette *chain of thought* par renforcement
sur des tâches vérifiables, on s'est aperçu qu'on pouvait améliorer les
performances d'un système basé sur un LLM de façon assez impressionnante. La
performance de o1 sur le benchmark ARC-AGI en est justement une des premières
illustrations : c'est typiquement le genre de résultat qu'on ne pouvait pas
obtenir avec un LLM de base mais qu'on obtient avec un modèle de raisonnement.

Trois mois après o1, OpenAI présente son modèle o3, qui est juste en fait la
deuxième version de o1 (mais ils pouvaient pas l'appeler o2 pour une histoire de
propriété intellectuelle donc ils sont passés directement à o3, bref), et ce
modèle o3 a de nouveau été testé sur ARC-AGI où il obtiendrait entre 76% et 88%
de réussite. Là, on est au-dessus du niveau moyen d'un participant humain
recruté sur Mechanical Turk. Par contre, c'est pas du tout pour le même prix, et
on va y revenir parce que ça aura son importance.

Ce résultat proche du niveau humain était assez inattendu. François Chollet ne
s'y attendait pas en tout cas, et voici ce qu'il en dit : « Le nouveau modèle o3
d'OpenAI représente une avancée significative dans la capacité de l'IA à
s'adapter à de nouvelles tâches. Il ne s'agit pas d'une simple amélioration
incrémentielle, mais d'une véritable percée, qui marque un changement qualitatif
dans les capacités de l'IA par rapport aux limites antérieures des LLM. o3 est
un système capable de s'adapter à des tâches qu'il n'a jamais rencontrées
auparavant, approchant vraisemblablement des performances de niveau humain dans
le domaine des tâches d'ARC-AGI. Pour s'adapter à la nouveauté, il faut deux
choses. Premièrement, il faut des connaissances – un ensemble de fonctions ou de
programmes réutilisables sur lesquels s'appuyer. Les LLM en ont plus qu'il n'en
faut. Deuxièmement, il faut être capable de recombiner ces fonctions en un tout
nouveau programme pour faire face à une nouvelle tâche – un programme qui
modélise la tâche en question. De la synthèse de programme. Les LLM ont
longtemps été dépourvus de cette capacité. La série de modèles o y a remédié. »

Pour François Chollet, cette capacité à créer des programmes à la volée pour
s'adapter à une nouvelle tâche est un signe caractéristique de l'intelligence :
une tête bien faite, et pas seulement bien pleine. Et donc, avec les modèles o1
et o3, François Chollet constate qu'on s'en rapproche. Lui qui, au départ était
vraiment sceptique vis-à-vis de ces capacités dans les LLM, a donc changé d'avis
ou en tout cas fait évoluer son avis à la lumière de ce nouveau résultat.

Avant d'aller plus loin, je voudrais souligner à quel point la démarche de
François Chollet est scientifiquement exemplaire. Il part d'une hypothèse
clairement formulée : les performances des LLM reposent avant tout sur une forme
de mémorisation. Puis il s'efforce d'en tirer des conséquences empiriques
précises en construisant le benchmark ARC-AGI de tâches qui résistent à la
mémorisation, ce qui revient à rendre l'hypothèse aussi facile à réfuter que
possible : ça désigne vraiment ces tâches comme les tâches qu'un LLM ne devrait
pas pouvoir faire si l'hypothèse est correcte. Et on va jusqu'à inciter
financièrement à la réfutation avec le prix d'un million de dollars. Et puis
face à de nouvelles données, François Chollet a effectivement révisé son
jugement : un système basé sur un LLM comme o3 est capable de faire davantage
que de la mémorisation, il reconnaît bien un saut qualitatif qui rapproche ce
système d'une forme d'intelligence générale. Voilà, ça, c'est de la science
comme j'aime.

### L'écart croissant avec les chatbots de base

Si vous vous intéressez pas plus que ça à l'IA et aux LLM en particulier, c'est
possible que vous ayez assez peu ou même jamais entendu parler de ces modèles de
raisonnement o1, o3, etc. Vous en êtes restés au ChatGPT de base, c'est-à-dire
la version 4o. Mais pour réfléchir au potentiel de l'IA aujourd'hui, ça me
semble crucial de prendre la mesure de l'écart qui sépare les chatbots de base
comme ChatGPT-4o (qui est de loin le plus utilisé aujourd'hui) et ces modèles de
raisonnement introduits depuis fin 2024. Dans beaucoup de domaines pointus,
l'écart est phénoménal et s'est creusé en très peu de temps. Le cas du benchmark
ARC-AGI en est un premier exemple : on est passé de pas même 5% de réussite à
88% en quelques mois.

Mais on peut citer d'autres cas de progression hallucinante sur des tâches
beaucoup plus difficiles. En tout cas difficiles pour nous être humains. Prenez
le concours de programmation Codeforces : c'est une plateforme de programmation
compétitive où on doit résoudre des problèmes de difficulté croissante. En mai
2024, ChatGPT-4o ne battait que 11% des participants. En septembre 2024, o1, le
premier modèle de raisonnement, dépassait 90% des participants ; et enfin, en
décembre 2024, o3 se classait au 175e rang mondial, dépassant 99,8% des
participants. Notez qu'aujourd'hui, o4-mini atteint la même performance en étant
un modèle distillé, c'est-à-dire un petit modèle qui imite un plus gros, donc
c'est plus rapide mais moins performant, et quand on voit que o3-mini était à
peu près au niveau de o1, et ça fait un écart de 700 points Elo avec le vrai o3,
c'est raisonnable de supposer que le vrai o4 qui n'est pas encore publié est
encore un cran au-dessus de ça. Sam Altman disait il y a quelques mois qu'ils
avaient un modèle interne qui atteint le 50e rang mondial sur ces tâches
Codeforces et qui pourrait arriver top 1 d'ici à la fin de l'année. Eh ben, ça
me semble plutôt crédible effectivement, vue la vitesse de progression. Les
problèmes de Codeforces c'est assez particulier, c'est très différent de ce à
quoi est confronté un développeur dans son métier, mais ces problèmes de
Codeforces sont des problèmes algorithmiques difficiles, et qui sont même conçus
pour être difficile vu que c'est une compétition, donc c'est quand même un
résultat assez impressionnant.

Autre benchmark ambitieux qu'il est intéressant de suivre : Humanity's Last
Exam. C'est un benchmark constitué de 2500 questions relevant de diverses
disciplines scientifiques et conçues de façon à ce que, même avec un accès à
Internet, seuls des spécialistes soient en mesure de répondre correctement. Donc
il faut à la fois des connaissances solides sur le sujet d'expertise et une
utilisation raisonnée de ces connaissances. Les questions ont été proposées
directement par plusieurs centaines de spécialistes de diverses disciplines, et
c'est participatif en fait, si vous avez une expertise sur un sujet vous pouvez
vous-même envoyer une question sur le site du benchmark pour que peut-être ce
soit intégré à une prochaine version. Les vraies questions sont évidemment
gardées privées pour l'évaluation mais il y a quelques échantillons pour se
faire une idée du type de question : par exemple cette question de traduction
d'une inscription romaine (j'ai quelques notions de latin mais ça va pas
suffire). Ou bien cette petite question de biologie pas piquée des hannetons : «
Les colibris de la famille des Apodiformes ont de manière unique un os ovale
apparié bilatéralement, un sésamoïde intégré dans la partie caudo-latérale de
l’aponévrose croisée élargie d’insertion du muscle dépresseur de la queue.
Combien de tendons appariés sont soutenus par cet os sésamoïde ? Répondez par un
nombre. »

Donc c'est le genre de benchmark où le score humain moyen c'est probablement à
peine au-dessus de 0. Mon score à moi ce serait probablement 0 en fait, sauf
coup de bol et question sur un truc que j'aurais étudié pendant ma thèse, quoi.
Comment s'en sortent les LLM à ce dernier examen de l'humanité, donc ?
ChatGPT-4o, le modèle par défaut de ChatGPT aujourd'hui, ça n'atteint que 2,7%
de réussite. Pour o1, ça montait à 8%. Et pour o3 et aussi pour Gemini-2.5-pro
ça atteint 20%. C'est pas encore très élevé, mais on voit que ça évolue vite et
c'est déjà impressionnant compte tenu de la difficulté des questions.

Dernier exemple : les mathématiques. Pour mesurer les performances en maths
beaucoup de benchmarks classiques sont déjà saturés (c'est-à-dire que le taux de
réussite des modèles actuels est trop élevé pour permettre de mesurer encore un
progrès). Du coup, ça a motivé la création d'un nouveau benchmark beaucoup plus
exigeant publié fin 2024 qui s'appelle FrontierMath. C'est un ensemble de
problèmes touchant à diverses branches des mathématiques que seuls des
spécialistes peuvent résoudre, et pas en un claquement de doigt, ça leur
prendrait plutôt plusieurs heures voire plusieurs jours de travail. Terence Tao,
l'un des meilleurs mathématiciens au monde, et qui a participé à la création de
certains de ces problèmes, se reconnaît lui-même incapable de résoudre les
problèmes les plus difficiles de ce benchmark qui ne relèvent pas de sa propre
aire de spécialisation. Jusqu'à o3, les meilleurs modèles ne dépassaient pas 2%
de réussite sur ce benchmark. Et puis là, fin 2024, OpenAI annonce dans le plus
grand des calmes que o3 aurait atteint 25% de réussite à FrontierMath.

Alors, petit disclaimer : le labo qui produit ce benchmark a notamment reçu des
financements d'OpenAI et ces résultats publiés par OpenAI n'avaient pas été
reproduits de façon indépendante. Maintenant qu'une version de o3 est accessible
au public, le labo a refait les tests et ils n'obtiennent que 10-11% de
réussite, ce qui reste quand même impressionnant si on considère la difficulté
des problèmes. Et vous voyez aussi qu'avec o4-mini, ça monte à 18% environ, donc
on n'est pas si loin des 25% annoncés initialement, ça semble bien à portée de
ce type de modèle ou ça le sera bientôt. Une des choses qui peut expliquer
l'écart entre les 25% initialement annoncés et le résultat de 10% avec o3
version publique, c'est qu'OpenAI a pu faire un test en donnant à o3 un budget
beaucoup plus élevé pour son raisonnement. Je vais revenir sur ce problème du
budget un peu plus loin, gardez ça dans un coin de votre tête.

Mais vous me direz : si les modèles approchent du niveau d'un chercheur en
maths, à quand une véritable découverte mathématique ? Eh ben, pour les modèles
d'OpenAI je sais pas, mais pour ceux de Google, c'est déjà le cas. DeepMind a
publié en mai les résultats d'AlphaEvolve, un agent basé sur les modèles Gemini
de Google. C'est bien plus complexe qu'un modèle de raisonnement, en gros il y a
un processus de sélection et mutation sur des raisonnements générés par LLM, un
peu comme l'évolution sauf que c'est pas sur des populations animales, c'est sur
des populations de textes, et donc c'est quand même basé sur des LLM. Et donc
AlphaEvolve a produit des dizaines de découvertes mathématiques inédites sur des
problèmes ouverts, des découvertes que les êtres humains n'avaient pas réussi à
faire jusque-là. Par exemple, entre autres choses, AlphaEvolve a découvert une
méthode qui réduit légèrement le nombre d'opérations nécessaires pour certaines
multiplications de matrice. Et bah déjà bravo. Mais surtout les chercheurs
expliquent que cette découverte a été utilisée pour réduire légèrement le temps
d'entraînement de Gemini. Ça reste modeste comme amélioration, ils parlent de
1%, mais ça montre que les IA actuelles sont déjà susceptibles de faire
d'authentiques découvertes qui accélèrent l'entraînement d'IA futures. Et ça,
c'est le genre de boucle qui pourrait finir par avoir des effets intéressants,
disons. Mais faudra qu'on en parle une autre fois.

### Le coût de la réflexion : un enjeu crucial

Revenons à ARC-AGI et ces petites tâches de raisonnement faciles pour l'être
humain et pas si faciles pour la machine. J'ai dit donc que lorsque o3 a été
annoncé, OpenAI affirmait avoir atteint 76% à 88% de réponses correctes mais ce
que j'ai pas précisé c'est : à quel prix ?

Parlons pognon un petit peu, ou plutôt token. Parce que donc ce qui distingue o3
du premier LLM venu, c'est que c'est un modèle de raisonnement et qu'il va donc
générer des *chain of thought*, c'est-à-dire une verbalisation de réflexion sur
le problème qu'on lui soumet. Et cette verbalisation, ça peut faire beaucoup,
beaucoup de textes générés pour une seule réponse. Par exemple la version de o3
qui a atteint 76% de réponses correctes sur ARC-AGI, elle produit 330 000 tokens
en moyenne par tâche. Et un token c'est, disons, 3/4 de mots. Donc ça fait
l'équivalent d'un bon millier de pages environ.

Mais ça encore c'est minuscule comparé à la version de o3 qui atteint les 88% de
réussite : cette version-là produit 57 millions de tokens par réponse. Soit
environ 150 000 pages de texte par tâche, en moyenne. Donc je sais même pas si
ça tiendrait dans la bibliothèque derrière. Imaginez 150 bouquins de 1000 pages.
Notez qu'il y a probablement un grand nombre de CoT qui sont générées en
parallèle avec ensuite un système qui évalue leur qualité et va prolonger celles
jugées les plus prometteuses et ainsi de suite. Les modèles de raisonnement ne
font pas forcément ça mais pour o3 surtout avec ce budget hyper élevé, c'est
très probable, même si on ne peut pas tout à fait en être sûr vu qu'on connaît
pas la cuisine interne de tout ça, OpenAI étant pas du tout transparent.

Notez qu'évidemment quand vous utilisez o3 avec la version publique c'est pas
ces versions-là qui sont utilisées a priori. Là c'était à des fins
expérimentales, c'est OpenAI qui menait ces expériences, et c'était pour eux une
façon de voir jusqu'à quel point augmenter la taille des *chain of thought*
améliore les performances, et effectivement même en poussant les choses si loin,
jusqu'à des millions de tokens, ça continue d'augmenter les performances même si
ça semble de plus en plus marginal, pas sûr que ça en vaille la peine. Mais au
moins ils ont dépassé le seuil de 85% qui avait été fixé pour la victoire à
l'ARC-Prize. Du coup, est-ce qu'OpenAI a gagné le prix d'1 million ? Eh ben, non
en fait, parce que, j'ai pas précisé un point mais pour que ce soit validé, il
faut atteindre ces 85% de réussite en dépensant moins d'un demi-dollar par tâche
en moyenne. Il y a une contrainte sur le budget. Et autant dire qu'avec ses 57
millions de tokens de CoT par tâche, o3 explose complètement ce budget (on n'a
pas de chiffres précis de ce que ça coûterait mais c'est probablement plusieurs
milliers de dollars par tâche). Le cerveau humain reste la solution optimale.

Mais faut mesurer le fait qu'on est au tout début de cette approche : il y a
quelques mois seulement le niveau des LLM de base sur ces tâches-là était proche
de 0. Donc faut pas s'arrêter à l'état actuel, c'est surtout la tendance qui est
importante. Et ce benchmark ARC-AGI est probablement l'un des meilleurs outils
qu'on ait pour mesurer et suivre cette tendance vers davantage d'intelligence
générale dans les systèmes fondés sur des LLM.

### ARC-AGI-2 et le leaderboard actuel

Et on a mieux encore : en début d'année, François Chollet a publié ARC-AGI-2 le
retour. Une seconde version de ce benchmark en plus difficile. Les tâches sont
similaires dans la forme, toujours des couples d'entrées-sorties en grille de
pixels, mais ça nécessite nettement plus de réflexion. Genre regardez-là, c'est
la première tâche parmi celles qui sont accessibles au public, et allez-y,
essayez de la résoudre. Je veux pas vous mettre la pression mais si vous êtes
plus malin qu'une machine ça devrait être facile. Franchement il y a moyen de
rester bloqué quelques minutes avant de trouver la logique. C'est beaucoup moins
évident que les exemples que j'ai montrés tout à l'heure.

Le corpus de cette version 2 d'ARC-AGI a été testé sur un panel d'humains, et en
moyenne ils résolvent 62% des tâches avec un temps de réflexion médian supérieur
à 2 minutes, là où avec la version 1 d'ARC-AGI un panel d'humains dans les mêmes
conditions peut réussir pas loin de 98% des tâches. Je note aussi qu'ils ont pas
testé les tâches sur la plateforme Mechanical Turk alors qu'ils l'avaient fait
pour la version 1 (et ça ne donnait que 77% de réussite – parce que les gens
vont vite et font un minimum d'effort). Là pour cette version 2 ce serait sans
doute nettement moins, peut-être même pas 50%. Parce que de fait elles sont pas
si faciles, ces tâches. Bien sûr elles sont accessibles au sens où elles ne
nécessitent pas d'expertise particulière, donc c'est abordable pour n'importe
qui a priori, mais il y a moyen de se tromper à son premier essai ou de bloquer
sur une bonne partie d'entre elles quand même.

Due à cette difficulté accrue, pour le moment, les meilleurs modèles ne
dépassent pas 10% de réussite à la version 2 d'ARC-AGI. Celui qui fait le mieux
avec 8% c'est le modèle de raisonnement Claude-Opus-4 qui vient de sortir, avec
un budget de près de 2$ par tâche. Je crois que l'indication 16K là correspond
au budget de tokens dans la *chain of thought*, on voit que plus le budget est
important plus le pourcentage de bonnes réponses augmente, et donc on peut
présumer qu'en poussant plus loin on pourrait encore augmenter ce taux de bonnes
réponses. Notez que les versions de o3 qui sont indiquées là, ce sont les
versions publiques, ça monte à 6,5% avec un coût inférieur à 1$. Mais on n'a pas
le score que pourrait faire la version surboostée de o3 avec ses 57 millions de
tokens par réponse. Parce que ça c'est un test que OpenAI avait fait dans son
coin, et ils l'ont pas refait pour la nouvelle version du benchmark. Ceci dit,
j'ai entendu François Chollet estimer que ce o3 surboosté pourrait atteindre
déjà 15% de réponse correcte.

Pour synthétiser les choses, voici le leaderboard d'ARC-AGI à l'heure actuelle :
en bleu ce sont les performances à la version 1, et en rouge à la version 2.
L'axe des abscisses représente le coût par tâche (et c'est logarithmique, donc
là on passe de 1 à 10$, là de 10 à 100). Et en ordonnée on a le pourcentage de
tâches réussies. Notez que le résultat de la version mégaboostée de o3 à 88% de
bonnes réponses ça n'apparaît pas sur ce graph : je pense que c'est parce que ça
a pas été confirmé de façon indépendante (et aussi c'était compliqué aussi
d'estimer le coût par tâche), mais sinon ça devrait apparaître quelque part par
là pour ARC-AGI-1, et peut-être vers 15% pour la version 2 mais ça c'est encore
plus incertain.

L'intelligence humaine, elle est représentée dans cette zone-là pour la version
1 d'ARC-AGI, ce sont tous ces points, avec le point plus bas c'est pour les
participants recrutés sur Mechanical Turk. Et pour la version 2 d'ARC-AGI, ça
devrait être plus bas normalement : ce point rouge là il devrait être à 62% je
sais pas pourquoi ils ont indiqué 100% de réussite. Alors en fait, j'ai fini par
trouver l'explication. Effectivement, au niveau individuel, le taux n'est que de
62% de réussite. Mais ce que François Chollet souligne dans sa présentation,
c'est que si on prend un panel de 10 humains et qu'on retient la solution
majoritaire, on profite d'un effet sagesse des foules et du coup ça monte à
100%. Mais c'est un peu bizarre d'avoir noté ce résultat-là comme ça et pas le
résultat au niveau individuel qui me semble être ce à quoi on pense quand on
présente le niveau humain de performance à ce type de test. Mais bref.

Le prix ARC-AGI sera donc gagné quand il y aura des points dans cette zone en
vert en haut à gauche, c'est-à-dire des performances d'un bon niveau humain pour
un coût très inférieur, et vous voyez qu'on n'y est pas encore, loin de là. Tous
les autres points ce sont divers systèmes d'intelligence artificielle basés sur
des LLM. Et on voit bien un fossé entre les performances humaines et celles des
meilleurs modèles, un fossé pas si large dans le cas d'ARC-AGI-1, mais assez
large quand même pour la version 2 effectivement.

### Conclusion : suivre la trajectoire, pas seulement l'état actuel

J'ai commencé en disant : nous sommes plus intelligents que les machines. Eh
bien ce graphique en est, en quelque sorte, une représentation. Les points qui
correspondent aux humains sont au-dessus. En tout cas, pour le moment, alors que
j'enregistre ces mots. Mais faut bien voir que les progrès qui ont été faits
récemment sont très impressionnants : tous ces points-là qui représentent des
modèles, ils n'existaient pas il y a juste un an. Il y a un an, les meilleurs
décollaient à peine de la ligne du bas pour la version 1 d'ARC-AGI, et auraient
été collés à zéro pour la version 2. Tous ces divers modèles sont apparus en
l'espace de quelques mois seulement. Et d'ailleurs peut-être qu'au moment où
vous consulterez ce leaderboard (dont je vais vous mettre le lien en
description, c'est régulièrement mis à jour), il y aura de nouveau points dessus
beaucoup plus proche de la zone humaine ou même de la zone verte, qui sait ?

Ce benchmark donne un signal dont il est intéressant de suivre l'évolution,
voilà pourquoi je voulais vous en parler, mais faut pas non plus exagérer sa
signification. Ou comme le formule François Chollet : « Vous saurez que l'AGI
est arrivée quand l'exercice de créer des tâches qui soient faciles pour les
humains mais difficiles pour l'IA devient tout simplement impossible. »

Alors certes c'est pas impossible aujourd'hui mais le fait est que ça devient de
plus en plus difficile. Essayez là de me donner un exemple de tâche qui sera
réussie par plus de 95% des êtres humains pris au hasard, mais qu'aucun système
d'IA actuel ne peut réussir avec un taux similaire. Vous pourrez en trouver
encore bien sûr (c'est en gros ce que ARC-AGI-2 essaye de proposer), mais il
faudrait être aveugle ou très mal informé pour ne pas constater que l'espace de
ces tâches se réduit de plus en plus et à un rythme inédit. Et notez qu'en
parallèle les modèles s'améliorent aussi et même davantage sur des tâches
relevant d'expertises de plus en plus pointues, comme en témoignent les
performances sur Humanity's Last Exam ou FrontierMath. Ou encore les découvertes
d'AlphaEvolve, etc.

Alors vous pourrez toujours refuser de considérer que tout cela manifeste la
moindre once de VRAIE intelligence, parce qu'il manquera toujours aux machines
ce je-ne-sais-quoi qui fait briller l'oeil des Enthoven, mais ça change rien à
toutes ces performances et à la trajectoire que cela suit, et j'ai l'impression
que pinailler sur l'usage approprié ou non du mot « intelligence » pour en
parler est surtout une façon de se mettre la tête dans le sable pour éviter d'y
réfléchir. Et c'est pas une bonne idée. Rien ne va disparaître juste parce qu'on
trouve ça trop triste ou trop effrayant de parler de machines intelligentes.
Mieux vaut regarder ces réalités en face, et des benchmarks comme ARC-AGI sont
particulièrement bien adaptés pour mesurer et suivre tout ça. Voilà pourquoi je
voulais vous présenter ça aujourd'hui. C'est, je pense, l'une des façons les
plus intelligentes de parler d'intelligence pour les machines.
