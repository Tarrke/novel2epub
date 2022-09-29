import fs from 'fs';
import cheerio from 'cheerio';



// ===============================================================================
// DEB  functions for WUXIAWORLD.CO
// ===============================================================================

export default class readnoveldaily {

  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // extraire les infos de la page principale
  //    - author
  //    - image url
  //    - sous-pages de listing des chapitres
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  static getNovelMetadata(novel, metaHTML ){
    let contentHTML=fs.readFileSync(metaHTML);
    let $          =cheerio.load(contentHTML);
    // PARSING
    // -- base_url
    novel['base_url']        =novel.meta_url.replace( /^(https?:\/\/[^\/]+).*$/i, '$1');
    // -- author
    if (!novel.author) {
      // novel['author']        =$('div.info').children('div a').eq(0).text();
      novel['author'] = [];
      $('div.author').children('a').each( function (index, element) {
        //console.log("~~~", $(element).attr('href'));
        if( $(element).attr('title') ) {
          console.log("Author Found: ", $(element).text());
          novel['author'].push($(element).text());
        }
      });
      novel['author'] = novel['author'].join(', ');
      
      console.log("Read Author:", novel['author']);
    }
    // -- cover
    if ( !novel.cover_url) {
      novel['cover_url']     = $('div.book').children('img').eq(0).attr('src');
    }
    if ( !novel.cover ) {
      novel['cover']         =novel.cachedir+"/"+novel.tag+"-cover.jpg";
    }
    console.log("Cover URL: "+novel.cover_url)
    // -- URLs des sous-pages de listing des chapitres
    let chaplist_url_last = []
    let chaplist_indexes = []
    $("ul.pagination").children("li").each(
      function(index, element) {
        if( $(element).children('a').attr('href') ) {
          // console.log($(element).children("a").attr("href"))
          chaplist_indexes.push(parseInt($(element).children("a").attr("href").replace( /^.*\?page=([0-9]+)$/, '$1' )))
        }
      }
    )
    // console.log(chaplist_indexes)
    let last_list_index = Math.max(...chaplist_indexes)
    novel['chapters_url'] = Array( last_list_index ).fill().map( (_, index) => novel.meta_url+"?page="+ (index+1) )
    
    // novel['chapters_url']    =[ novel.meta_url ];
    // -- chapter list
    novel['chapters_props']  =[];
    // RESULTAT
    return novel;
  }

  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // extraire les proprietes des chapitres
  //   - page des chapitres avec les numéro/titre
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  static getChaptersProps(novel, chaptersHTML ){
    let contentHTML    =fs.readFileSync(chaptersHTML);
    let $              =cheerio.load(contentHTML);
    // PARSING
    // -- parcours des chapitres
    $('div#viewchapter').children('ul.list').find('a').each(function(index,element){
      let item={};
      // -- proprietes du chapitre
      item.href=      $(element).attr('href');
      item.url=       item.href;
      item.text=      $(element).text();
      item.num=       item.text.replace( /^\s*(\d+)\s(.+)\s*$/i,'$1');
      item.title=     item.text.replace( /^\s*(\d+)\s*(.+)\s*$/i,'$2');
      item.file=      novel['cachedir']+"/"+novel['tag']+"-chapter-"+(novel['chapters_props'].length+1)+".html";
      // -- add chapter
      novel['chapters_props'].push(item);
    });
    // RESULTAT
    return novel;
  }

  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // creer le contenu d'un chapitre
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  static getChapterData(chapter_prop, chapterHTML, novel){
    let contentHTML   =fs.readFileSync(chapterHTML);
    let $             =cheerio.load(contentHTML);
    // PARSING
    let content = $('div.c-content').remove('div.clearfix');

    content=content.html();
    content = content
      // tout remettre sur une seule ligne
      .replace( /\n/gm, '__LINE__')
      
      // remplacer les lignes de titre
      .replace( /&nbsp\;/g,                             ' ')
      // supprimer les lignes contenant des liens
      .replace( /<a [^>]*>.*?<\/a>/gm,               '__LINK__')
      // supprimer les lignes contenant des scripts
      .replace( /<script[^>]*>.*?<\/script>/g,        '__SCRIPT__')
      // supprimer les commentaires
      .replace( /<!--(.*?)-->/g,                       '__COMMENT__')
      // Suppression des pubs
      .replace( /<ins[^>]*>[^<]*<\/ins>/g,              '__PUB__')
      // Suppression des p Chapter
      .replace( /<p>\s*Chapter [^<]+?<\/p>/,               '')
      // Supression de la fin subscirbe and such
      .replace( /<div class=\"clearfix\"><\/div><div class=\"socialmediaicons text-center\">ADD TO WISHLIST &amp; SHARE  <\/div>/, '' )
      // Transformation multi ligne
      .replace( /<br\/?>/g,                             '__LINE__')
      .replace( '__LINE__',                             '\n')
      .replace( /<\/p><p>/g, '</p>\n<p>')
      ;

    Object.keys(novel.begins).forEach( key => {
      const reg = new RegExp(key);
      content = content.replace(reg, novel.begins[key])
    })
    /*
    content=content
      .replace( /[\s\t ]+If you find any[^<]+/, '')
      ;
    */
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
    // CHAPTER DATA
    let chapter_data={
      title:   chapter_prop.title,
      data:    content
    };

    // RESULTAT
    return chapter_data;
  }

}
// ===============================================================================
// END  functions for WUXIAWORLD.CO
// ===============================================================================
