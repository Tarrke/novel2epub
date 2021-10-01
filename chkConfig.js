import os from 'os';
import path from 'path';
import fs from 'fs';

import novels from './novels.js';

import {getCover, getHttpsContent} from './common.js';

let novel = novels['TODAG_FR'];

// Checking directories
const homedir = os.homedir();
var cachedir = path.join(homedir, 'cache', 'novel2epubs');
console.log("Cache Path: ", cachedir);
if( !fs.existsSync(cachedir) ) {
    fs.mkdirSync(cachedir);
    console.log("Created directory ", cachedir);
}

// recup info
let metaPath = path.join(novel['cachedir'], novel['tag']+"-meta.html" );
console.log("MetaDataFile: ", metaPath);
let promiseNovelMetadata=getHttpsContent( novel['meta_url'], metaPath);
promiseNovelMetadata.then( () => {
    novel = novel.getNovelMetadata(novel, path.join(cachedir, 'TODAG-FR-meta.html'));
    novel = getCover(novel);
    console.log( novel );

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
        console.log(novel['chapters_props']);
    });
    /*
    // recup chapter
    novel=novel.getChaptersProps(novel, path.join(cachedir, 'TODAG-FR-chapterlist.html'));
    console.log("NB chapter :: "+ novel.chapters_props.length );
    console.log( JSON.stringify(novel.chapters_props) );    
    */
});


/*
// recup chapter
novel=novel.getChaptersProps(novel, path.join(cachedir, 'TODAG-FR-chapterlist.html'));
console.log("NB chapter :: "+ novel.chapters_props.length );
console.log( JSON.stringify(novel.chapters_props) );

// recup chapter content
let chapterData=novel.getChapterData( {title: "chapitre 1", num: 1}, path.join(cachedir, 'TODAG-FR-chapter-1.html' ));
console.log( chapterData.title );
console.log( chapterData.data );
*/