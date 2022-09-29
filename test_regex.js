import fs from 'fs';
import cheerio from 'cheerio';

let contentHTML=fs.readFileSync("test.html");
let $          =cheerio.load(contentHTML);
let content = $('div#chapter-content');

content = content.html();

console.log(content);

let r = content.match(/<a .*>(.*?)<\/a>/)
if( r ) {
    console.log("Special RegEx Selection :");
    console.log(r[0]);
    console.log(r[1]);
}

content = content
// tout remettre sur une seule ligne
.replace( /[\n\r]/gm, '__LINE__')
// remplacer les lignes de titre
.replace( /&nbsp\;/g,                             ' ')
.replace( /&#x2019\;/gm, "'")
// supprimer les lignes contenant des liens
.replace( /<a .*>(.*?)<\/a>/gm,               '__LINK__')
// supprimer les lignes contenant des scripts
.replace( /<script[^>]*>.*?<\/script>/g,        '__SCRIPT__')
// supprimer les commentaires
.replace( /<!--(.*?)-->/g,                       '__COMMENT__')
// Suppression des pubs
.replace( /<ins[^>]*>[^<]*<\/ins>/g,              '__PUB__')
// Suppression des p Chapter
.replace( /<p>Chapter [^<]+?<\/p>/,               '')

.replaceAll( '<div>', '')
.replaceAll( '</div>', '')

// Transformation multi ligne
.replace( /<br\/?>/g,                             '__LINE__')
.replace( /<\/p><p>/gm, '<\/p>__LINE__<p>');

console.log("***************************")
console.log(content);

content = content.replaceAll( '__LINE__',                             '\n')
;

let begins = {
    '[\\s\\t ]+If you find any[^<]+': '',
    '<h3>Chapter .*?<\/h3>': '',
    '(<p>)*(<strong>)*Translator:.*': ''
}


console.log("***************************")
console.log(content);

Object.keys(begins).forEach( key => {
    const reg = new RegExp(key);
    console.log("***************************")
    console.log(key)
    console.log(begins[key])
    content = content.replace(reg, begins[key])
    console.log("***************************")
    console.log(content);

})

//const reg = new RegExp('<div><h3>Chapter .*?<\/div>');
//content = content.replace(reg, '');

console.log("***************************")
console.log(content);

content=content
.replace( /<div[^>]+><\/div>/g, '')
// mise en place de paragraph in chapter
//   suppr la ligne vide
//   conserver les lignes avec contenu

.replace( /^[\s\t ]*$/g,                         '')
.replace( /^(.+)$/g,                             '<p>$1</p>')
.replace( /<p>[\s\t ]*?<\/p>/g,                  '')


// Suppression des marqueurs inutiles maintenant
.replace( /__(.*?)__/g, '')
;

console.log("***************************")
console.log(content);