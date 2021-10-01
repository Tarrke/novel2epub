var   http      = require('http');
var   https     = require('https');
var   cheerio   = require('cheerio');
const fs        = require('fs');
const path      = require('path');
const epub      = require('epub-gen');

import { getCover, mkDirByPathSync, getHttpsContent } from './common.js';

// REGLAGES
// -- taille des livres
const BOOK_CHAPTERS_SIZE=250;
// -- limite de telechargement des chapitres
// *** (!) pas tous les chapitres d'un coup sinon blocage (!) ***
const LIMIT_CHAPTERS_SIZE_DOWNLOAD=75;
const LIMIT_CHAPTERS_RESET_TIMEOUT=120000;


// ARGUMENTS
let NOVEL_TAG="";
//console.log("ARGS  all   >> "+JSON.stringify(process.argv) );
const tags= process.argv.filter( item => item.startsWith('--tag=') );
//console.log("ARGS  tag   >> "+JSON.stringify(tags) );
if ( tags.length>0 ){
    NOVEL_TAG=tags[0].replace( /^\-\-tag=/g, '');
    //console.log("TAG >> "+NOVEL_TAG);
} else {
    console.error("Usage: npm run exec -- --tag=<<NOVEL-TAG>>");
    console.error("  missing argument : tag");
    console.error("--");
    process.exit(0);
}

let novels = require('./novels.js');

if ( !(NOVEL_TAG in novels) ){
    console.error("Usage: npm run exec -- --tag=<<NOVEL-TAG>>");
    console.error("  unknown tag '"+NOVEL_TAG+"'");
    console.error("--");
    process.exit(0);
}

let novel = novels[NOVEL_TAG];


// ==================================================
// create directory (recursively) ===================
// ==================================================
/*
function mkDirByPathSync(targetDir, { isRelativeToScript = false } = {}) {
    const sep = path.sep;
    const initDir = path.isAbsolute(targetDir) ? sep : '';
    const baseDir = isRelativeToScript ? __dirname : '.';

    return targetDir.split(sep).reduce((parentDir, childDir) => {
        const curDir = path.resolve(baseDir, parentDir, childDir);
        try {
            fs.mkdirSync(curDir);
        } catch (err) {
            if (err.code === 'EEXIST') { // curDir already exists!
                return curDir;
            }

            // To avoid `EISDIR` error on Mac and `EACCES`-->`ENOENT` and `EPERM` on Windows.
            if (err.code === 'ENOENT') { // Throw the original parentDir error on curDir `ENOENT` failure.
                throw new Error(`EACCES: permission denied, mkdir '${parentDir}'`);
            }

            const caughtErr = ['EACCES', 'EPERM', 'EISDIR'].indexOf(err.code) > -1;
            if (!caughtErr || caughtErr && curDir === path.resolve(targetDir)) {
                throw err; // Throw if it's just the last created dir.
            }
        }

        return curDir;
    }, initDir);
}

// ==================================================
// download webpage =================================
// ==================================================
function getHttpsContent(url,filepath,timeout=0) {
    return new Promise(function(resolve, reject) {
        setTimeout( function() {
            var req=https.request(url,function(res) {
                // reject on bad status
                if ( res.statusCode<200 || res.statusCode>=300 ) {
                    return reject( new Error('statusCode=' + res.statusCode) );
                }
                // write data

                // cumulate data
                var data=[];
                res.on('data',function(chunk) {
                    data.push(chunk);
                });
                res.on('end',function() {
                    var buffer=Buffer.concat(data);
                    fs.writeFileSync( filepath, buffer );
                    // --debug--
                    //if (timeout>0)  console.log("GET file '"+filepath+"' with sleep("+timeout+")");
                    resolve({msg: 'success',url: url,filepath: filepath});
                });
            });
            // si une erreur est survenu
            req.on('error',function(err) {
                console.error("GET '"+url+"' -> url.error");
                reject({msg: 'error',url: url,filepath: filepath});
            });
            // liberation
            req.end();
        }, timeout );
    });
}
// ==================================================
*/



// Demarrage ========================================
console.log("NOVEL-SERIE: "+JSON.stringify(novel));

// initialisation
mkDirByPathSync(novel['cachedir']);
mkDirByPathSync(novel['outputdir']);

// telechargement de la page des informations
// -- metadata
let metaHTML=novel['cachedir']+"/"+novel['tag']+"-meta.html";
let metaJSON=novel['cachedir']+"/"+novel['tag']+"-meta.json";
let promiseNovelMetadata=getHttpsContent( novel['meta_url'], novel['cachedir']+"/"+novel['tag']+"-meta.html" );
// -- execution promesse
promiseNovelMetadata.then(
    // si success
    function(filepath){
        // =========================================
        // PARSING INFO
        // =========================================
        novel = novel.getNovelMetadata(novel, metaHTML);

        // =========================================
        // RECUP COVER
        // =========================================
        novel = getCover(novel);

        // =========================================
        // RECUP DES PAGES LISTING CHAPTERS
        // =========================================
        let delaiPages=250;
        let promisePages=[];
        for(let ipage=0;ipage<novel['chapters_url'].length;ipage++) {
            let chaptersURL  =novel['chapters_url'][ipage];
            let chaptersHTML =novel['cachedir']+"/"+novel['tag']+"-chapterlist-"+ipage+".html";
            promisePages.push( getHttpsContent( chaptersURL, chaptersHTML, ipage*delaiPages) );
        }
        console.log("NOVEL['"+novel.tag+"',page-chapter-list] => "+novel['chapters_url'].length+" subpage(s)");
        var promiseAllPages=Promise.all( promisePages );
        promiseAllPages.then(
            function(resolve){

            // PARSING DES CHAPITRES DANS LES SOUS-PAGES
            for(let ipage=0;ipage<novel['chapters_url'].length;ipage++) {
                let chaptersHTML =novel['cachedir']+"/"+novel['tag']+"-chapterlist-"+ipage+".html";
                novel=novel.getChaptersProps(novel,chaptersHTML);
            }
            console.log("NOVEL['"+novel.tag+"',page-chapter-list] => "+novel['chapters_props'].length+" chapter(s)");

            // LISTING DES CHAPITRES A TELECHARGER
            let promiseChapters=[];
            for( let ichapter=0;ichapter<novel['chapters_props'].length;ichapter++ ) {
                let chapterProps=novel['chapters_props'][ichapter];
                try {
                    if ( !fs.existsSync(chapterProps['file']) ) {
                        // telecharger par block limite
                        let nbDownload  =promiseChapters.length;
                        let timeout     =Math.floor(nbDownload/LIMIT_CHAPTERS_SIZE_DOWNLOAD)*LIMIT_CHAPTERS_RESET_TIMEOUT + (nbDownload%LIMIT_CHAPTERS_SIZE_DOWNLOAD);
                        promiseChapters.push( getHttpsContent(chapterProps['url'],chapterProps['file'],timeout) );
                    }
                } catch(ioerr) {
                    console.error("NOVEL['"+novel.tag+"',chapter-file-"+ichapter+"] => cache-file failed");
                    console.error(ioerr);
                }
            }

            // AFFICHAGE DE WAITING
            console.log("DOWNLOAD >> "+promiseChapters.length+"/"+novel['chapters_props'].length+" chapter(s)");
            let nbsec=(Math.floor( promiseChapters.length/LIMIT_CHAPTERS_SIZE_DOWNLOAD )*LIMIT_CHAPTERS_RESET_TIMEOUT) /1000;
            console.log("WAIT     >> "+Math.floor(nbsec/60)+" min "+(nbsec%60) +" sec ...");
            
            // EXECUTION DES TELECHARGEMENT
            if ( promiseChapters.length > 0 ) {
                console.log("NOVEL["+novel['tag']+"] -> new content to parse ...");
                let promiseAllChapters=Promise.all( promiseChapters );
                promiseAllChapters.then(
                    function(files){
                    // chapitres manquants downloaded

                    // ==================================================================================
                    // DEB EBOOKs
                    // ==================================================================================
                    let nbChapters=novel['chapters_props'].length;
                    for(let ibook=0;ibook<=Math.floor( (nbChapters-1)/BOOK_CHAPTERS_SIZE );ibook++) {
                        let sbook         =("0" + (ibook+1)).slice(-2);
                        // min et max chapter of book
                        let ichapmin      =1+(ibook*BOOK_CHAPTERS_SIZE);
                        let ichapbormax   =(ibook+1)*BOOK_CHAPTERS_SIZE;
                        let schapmin=("0000" + ichapmin).slice(-4);
                        let schapbormax=("0000" + ichapbormax).slice(-4);
                        // min et max chapter sur 4 digits pour les noms de fichiers
                        let ichapmax=Math.min( ichapbormax, nbChapters );
                        // output file
                        let book_epub      =novel['outputdir']+"/"+novel['tag']+"-book-"+sbook+".epub";
                        let book_epub_tmp  =novel['outputdir']+"/"+novel['tag']+"-book-"+sbook+"_TMP.epub";
                        // book non termine
                        if ( (ibook+1)*BOOK_CHAPTERS_SIZE > nbChapters ) {
                            book_epub=book_epub_tmp;
                        } else {
                            // nettoyage des fichiers temporaires
                            try {
                                if ( fs.existsSync(book_epub_tmp) )   fs.unlinkSync(book_epub_tmp);
                            } catch(ioerr) {
                                console.error("I/O error on clean tmp book["+ibook+"]");
                                console.error(ioerr);
                            }
                        }
                        // supprimer le precedant pour mieux le re-creer
                        try{
                            if ( !fs.existsSync(book_epub) ) {
                                // construction du contenu ebook
                                console.log("Book["+sbook+","+schapmin+"~"+schapbormax+"] ...");
                                // propriete ebook
                                let ebook_props = {
                                    title:      novel.tag+" "+ichapmin+"-"+ichapmax,
                                    author:     novel.author,
                                    publisher:  novel.publisher,
                                    cover:      novel.cover,
                                    tocTitle:   "chapters",
                                    lang:       novel.lang,
                                    output:     book_epub,
                                    content:    []
                                }
                                // parser le contenu des chapters en fichier markdown
                                for(let ichap=ichapmin-1;ichap<ichapmax;ichap++) {
                                    let chapter_prop=novel['chapters_props'][ichap];
                                    // recuperation du markdown
                                    let chapter_data=novel.getChapterData( chapter_prop, chapter_prop['file'] );
                                    // ecriture dans le fichier global
                                    ebook_props.content.push( chapter_data );
                                }
                                // generation du book
                                new epub(ebook_props).promise.then( function() {
                                    console.log("Book["+sbook+";"+schapmin+"~"+schapbormax+"] -> "+book_epub);
                                });
                            } else {
                                console.log("Book["+sbook+";"+schapmin+"~"+schapbormax+"] -> keep");
                            }
                        } catch(ioerr) {
                            console.error("I/O error on book["+ibook+"]");
                            console.error(ioerr);
                            process.exit(301);
                        }
                    }
                    // ==================================================================================
                    // FIN EBOOKs
                    // ==================================================================================

                },
                function(err) {
                    console.error("NOVEL['"+novel.tag+"',download-chapters] => download failed");
                    console.error(err);
                });
            } else {
                console.log("NOVEL["+novel['tag']+"] -> no new content");
            }
        }, function(err){
            console.error("NOVEL['"+novel.tag+"',page-chapter-list] => download failed");
            console.error(err);
        });
    },
    // si echec
    function(err){
        console.error("novel["+novel.tag+"],meta] => download failed");
        console.error(err);
        process.exit(1);
    });
// 