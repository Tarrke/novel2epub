# Old documentation

## config

* fichier novels.js

c'est le fichier de declaration des novels support

* fichier wuxiaworldco.js

c'est le fichier contenant les functions d'extraction du contenu d'ebook pour le site wuxiaworld_co


## execution

* Installation des dependances

~~~shell
[user@computer ~/git/novels]$ npm install
...
[user@computer ~/git/novels]$
~~~

* Execution de la generation des ebooks

~~~shell
[user@computer ~/git/novels]$ npm run exec -- --tag=TODAG
...
[user@computer ~/git/novels]$ 
~~~

Attention, le téléchargement des chapitres peut prendre beaucoup de temps la 1ère fois