import fs from 'fs';
import cheerio from 'cheerio';



// ===============================================================================
// DEB  functions for WUXIAWORLD.CO
// ===============================================================================

export default class novelfull {

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
    if (!novel.author)
      novel['author']        =$('div.author').children('span.name').eq(0).text();
    // -- cover
    if ( !novel.cover_url)
      novel['cover_url']     =novel.base_url + $('div.book').children('img').eq(0).attr('src');
    if ( !novel.cover )
      novel['cover']         =novel.cachedir+"/"+novel.tag+"-cover.jpg";
    // -- URLs des sous-pages de listing des chapitres
    let chaplist_url_last = $("div#list-chapter").children("ul.pagination").children("li.last").children("a").eq(0).attr("href");
    let last_list_index = parseInt( chaplist_url_last.replace( /^.*\?page=([0-9]+)$/, '$1' ) );
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
    $('ul.chapter-list').find('a.chapter-item').each(function(index,element){
      let item={};
      // -- proprietes du chapitre
      item.href=      $(element).attr('href');
      item.url=       novel['base_url']+item.href;
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
  static getChapterData(chapter_prop, chapterHTML){
    let contentHTML   =fs.readFileSync(chapterHTML);
    let $             =cheerio.load(contentHTML);
    // PARSING
    let content=$('div.chapter-entity').html()
          // remplacer les lignes de titre
          .replace( /&nbsp\;/g,                            ' ')
          .replace( /<br\/?>/g,                            "\n")
          // supprimer les lignes contenant des liens
          .replace( /.*<a .*>.*<\/a>.*/gm,                 '__LINK__')
          // supprimer les lignes contenant des liens
          .replace( /.*<script>.*<\/script>.*/gm,          '__SCRIPT__')
          // mise en place de paragraph in chapter
          //   suppr la ligne vide
          //   conserver les lignes avec contenu
          .replace( /^[\s\t ]*$/gm,                        '')
          .replace( /^(.+)$/gm,                            '<p>$1</p>')
          .replace( /^<p>[\s\t ]*<\/p>/gm,                 '')
          ;
    // CHAPTER DATA
    let chapter_data={
      title:   ""+(chapter_prop.num?chapter_prop.num+" - ":"")+chapter_prop.title,
      data:    content
    };
    // RESULTAT
    return chapter_data;
  }

}
// ===============================================================================
// END  functions for WUXIAWORLD.CO
// ===============================================================================
