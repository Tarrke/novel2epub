import http from 'http';
import https from 'https';
import cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import epub from 'epub-gen';

import novels from './novels.js';

// let novels = require('./novels.js');

// var   http      = require('http');
// var   https     = require('https');
// var   cheerio   = require('cheerio');
// const fs        = require('fs');
// const path      = require('path');
// const epub      = require('epub-gen');

import { getCover, mkDirByPathSync, getHttpsContent, usage } from './common.js';

// REGLAGES
// -- taille des livres
let BOOK_CHAPTERS_SIZE=250;
const BOOK_MIN_SIZE = 75;
// -- limite de telechargement des chapitres
// *** (!) pas tous les chapitres d'un coup sinon blocage (!) ***
const LIMIT_CHAPTERS_SIZE_DOWNLOAD=75;
const LIMIT_CHAPTERS_RESET_TIMEOUT=120000;


// ARGUMENTS
let NOVEL_TAG="";
let forceNewContent = false;
let maxChapterIndex = 0;

//console.log("ARGS  all   >> "+JSON.stringify(process.argv) );

// Command line: has --help
process.argv.map( item => { 
    if( item.startsWith('--help') ) {
        usage(); 
    } 
});

// Command line: has --force
// Command line: lastChaperIndex
process.argv.map( item => { 
    if( item.startsWith('--force') ) {
        forceNewContent = true; 
    }
    if( item.startsWith('--max')) {
        maxChapterIndex = item.split('=')[1];
    }
    if( item.startsWith('--min')) {
        minChapterIndex = item.split('=')[1];
    }
});




const tags= process.argv.filter( item => item.startsWith('--tag=') );
//console.log("ARGS  tag   >> "+JSON.stringify(tags) );
if ( tags.length>0 ){
    NOVEL_TAG=tags[0].replace( /^\-\-tag=/g, '');
    //console.log("TAG >> "+NOVEL_TAG);
} else {
    usage("ERR: missing argument : tag");
}

if ( !(NOVEL_TAG in novels) ){
    usage("ERR: unknown tag '"+NOVEL_TAG+"'");
}

let novel = novels[NOVEL_TAG];

// bookSize override
if( novel["bookSize"] ) {
    BOOK_CHAPTERS_SIZE = novel["bookSize"];
}

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

            if( maxChapterIndex == 0 ) {
                if( novel.chapMax ) {
                    maxChapterIndex = novel.chapMax;
                } else {
                    maxChapterIndex = novel['chapters_props'].length;
                }
            }
            console.log("Getting chapters 1 to", maxChapterIndex.toString());
            for( let ichapter=0;ichapter<maxChapterIndex;ichapter++ ) {
                // console.log("Getting chapter ", ichapter);
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
            if ( promiseChapters.length > 0 || forceNewContent ) {
                console.log("NOVEL["+novel['tag']+"] -> new content to parse ...");
                let promiseAllChapters=Promise.all( promiseChapters );
                promiseAllChapters.then( function(_){
                    // chapitres manquants downloaded

                    // ==================================================================================
                    // DEB EBOOKs
                    // ==================================================================================
                    let nbChapters = maxChapterIndex;
                    for(let ibook = 0; ibook <= Math.floor( (nbChapters-1)/BOOK_CHAPTERS_SIZE ); ibook++ ) {
                        let sbook         = ("0" + (ibook+1)).slice(-2);
                        // min et max chapter of book
                        let ichapmin      = 1 + (ibook*BOOK_CHAPTERS_SIZE);
                        // regular sup born
                        let ichapbormax   = Math.min( (ibook+1)*BOOK_CHAPTERS_SIZE, nbChapters);
                        let nextBookEnd   = Math.min( (ibook+2)*BOOK_CHAPTERS_SIZE, nbChapters);
                        if( nextBookEnd >= nbChapters ) {
                            // next book is the last one
                            if( nextBookEnd - ichapbormax < BOOK_MIN_SIZE ) {
                                // The next book will be too short, the current book will be larger
                                ichapbormax = nbChapters;
                            }
                        }

                        let schapmin=("0000" + ichapmin).slice(-4);
                        let schapbormax=("0000" + ichapbormax).slice(-4);
                        // min et max chapter sur 4 digits pour les noms de fichiers
                        let ichapmax=Math.min( ichapbormax, nbChapters );
                        // output file
                        let book_epub      =novel['outputdir']+"/"+novel['tag']+"-book-"+sbook+".epub";
                        let book_epub_tmp  =novel['outputdir']+"/"+novel['tag']+"-book-"+sbook+"_TMP.epub";
                        
                        // book non termine
                        if ( !novel.ended && (ibook+1)*BOOK_CHAPTERS_SIZE > nbChapters ) {
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
                        try {
                            if( forceNewContent && fs.existsSync(book_epub) ) {
                                fs.unlinkSync(book_epub)
                            }

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
                                    let chapter_data=novel.getChapterData( chapter_prop, chapter_prop['file'], novel );
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

                        if( ichapbormax == nbChapters ) {
                            break;
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