import fs from 'fs';
import cheerio from 'cheerio';

// ===============================================================================
// DEB  functions for XIAOWAZ.FR
// ===============================================================================

export default class xiaowasfr {
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // extraire les infos de la page principale
    //    - author
    //    - image url
    //    - sous-pages de listing des chapitres
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    static getNovelMetadata(novel, metaHTML) {
        console.log("GetNovelMetaData...");
        let contentHTML = fs.readFileSync(metaHTML);
        let $           = cheerio.load(contentHTML);
        // PARSING
        // -- base_url
        novel['base_url'] = novel.meta_url.replace( /^(https?:\/\/[^\/]+).*$/i, '$1');
        // -- author
        if (!novel.author) {
            novel['author'] = $('div.author').children('span.name').eq(0).text();
        }
        // -- cover
        if ( !novel.cover_url ) {
            novel['cover_url'] = $('div.entry-content > h4 > img.size-full').attr('src');
        }
        console.log("COVER_URL :: "+novel['cover_url']);
        if ( !novel.cover ) {
            novel['cover'] = novel.cachedir+"/"+novel.tag+"-cover.jpg";
        }
        // -- URLs des sous-pages de listing des chapitres
        novel['chapters_url'] = [ novel.meta_url ];
        // -- chapter list
        novel['chapters_props'] = [];
        // RESULTAT
        return novel;
    }

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // extraire les proprietes des chapitres
    //   - page des chapitres avec les numéro/titre
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    static getChaptersProps(novel, chaptersHTML) {
        let contentHTML = fs.readFileSync(chaptersHTML);
        let $           = cheerio.load(contentHTML);
        // PARSING
        // -- parcours des chapitres
        $('ul.lcp_catlist').find('a').each(function(index,element) {
            let item = {};
            // -- proprietes du chapitre
            item.href = $(element).attr('href');
            item.url = item.href;
            item.text = $(element).text();
            item.num = item.text.replace( /^.+\s(\d+)(\s.+)?$/i,  '$1');
            item.title = item.text.replace( /^\s*(.+)\s*$/i,        '$1');
            item.file = novel['cachedir']+"/"+novel['tag']+"-chapter-"+(novel['chapters_props'].length+1)+".html";
            // -- add chapter
            novel['chapters_props'].push(item);
        });
        // RESULTAT
        return novel;
    }

  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // creer le contenu d'un chapitre
  //    - recuperation du titre
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  static getChapterData(chapter_prop,chapterHTML, novel) {
    // parsing page
    let contentHTML   =fs.readFileSync(chapterHTML);
    let $             =cheerio.load(contentHTML);
    //
    // -- parsing titre + content
    //
    // supprimer les paragrahpes des commentaires
    $('div.comment').remove();
    //
    // -- parser le titre
    let title=""+(chapter_prop.num?chapter_prop.num+" - ":"")+chapter_prop.title;
    let recherche="";
    let regex = /^\s*chapitre\s+(\d+)\s?[\-–]\s?(.+)/gi;
    $('div.entry-content-inner').find('p:not([class])').find('strong').each(function(index,element){
      let stext=$(element).text().replace( '&nbsp;', ' ').replace( "&nbsp;", " ");
      //console.log("HYP >> "+stext);
      if ( recherche==="" && stext.match(regex) ){
        //console.log("FIND TITLE >> "+stext);
        recherche=stext.replace( regex, '$1 - $2').replace("\n","");
        title=recherche;
      }
    });
    if ( recherche === "" )
      console.log("title not found for chapter ("+chapter_prop.num+") => "+title);
    //
    // -- parser le text
    let paragraphs=[];
    $('div.entry-content-inner').find('p:not([class])').each(function(index,element){
      let ptext=$(element).text();
      if ( ptext.length>0 )
        paragraphs.push( '<p>'+$(element).text()+'</p>'+"\n");
    });
    var content=paragraphs.join("\n");  //Buffer.concat(paragraphs);

    // chapter data
    let chapter_data={
      title: title,
      data: content
    };

    // RESULTAT
    return chapter_data;
  }
}

// ===============================================================================
// END  functions for WUXIAWORLD.CO
// ===============================================================================
