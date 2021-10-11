
// ============================================================
// librairie de parsing pour wuxiaworld.co
import wuxiaworldco from './wuxiaworldco.js';
// librairie de parsing pour xiaowaz.fr
import xiaowazfr    from './xiaowazfr.js';
// Parsing library for novelfull.com
import novelfull from './novelfull.js';
// ============================================================

export default {
  // Tales Of Demons and Gods
  TODAG: {
    tag:                "TODAG",
    meta_url:           "https://novelfull.com/tales-of-demons-and-gods.html",
    bookSize:           250,
    ended:              false,
    lang:               "en",
    publisher:          "novelfull.com",
    cachedir:           process.env.HOME+"/cache/novel2epubs",
    outputdir:          process.env.HOME+"/Documents/Epubs/TODAG",
    // Suppression des paragraphes indésirables
    begins: {
      '[\\s\\t ]+If you find any[^<]+': ''
    },
    chapMax: 10,
    getNovelMetadata:   novelfull.getNovelMetadata,
    getChaptersProps:   novelfull.getChaptersProps,
    getChapterData:     novelfull.getChapterData
  },
  // I Alone Level-UP
  IALU: {
    tag:                "IALU",
    meta_url:           "https://novelfull.com/i-alone-level-up.html",
    ended: true,
    lang:               "en",
    publisher:          "novelfull.com",
    cachedir:           process.env.HOME+"/cache/novel2epubs",
    outputdir:          process.env.HOME+"/Documents/Epubs/IALU",
    // Suppression des paragraphes indésirables
    begins: {
      '[\\s\\t ]+If you find any[^<]+': '',
      '<h3>Chapter .*?<\/h3>': '',
      '&lt; Chapter .*': '',
      '< Chapter .*': ''
    },
    getNovelMetadata:   novelfull.getNovelMetadata,
    getChaptersProps:   novelfull.getChaptersProps,
    getChapterData:     novelfull.getChapterData
  },
  // Library Of Heaven's Path
  LHP: {
    tag:                "LHP",
    meta_url:           "https://www.wuxiaworld.co/Library-of-Heaven-is-Path/",
    lang:               "en",
    publisher:          "wuxiaworld.co",
    cachedir:           process.env.HOME+"/cache/novel2epubs",
    outputdir:          process.env.HOME+"/Documents/Epubs/LHP",
    getNovelMetadata:   wuxiaworldco.getNovelMetadata,
    getChaptersProps:   wuxiaworldco.getChaptersProps,
    getChapterData:     wuxiaworldco.getChapterData
  },
  // Tales Of Demons and Gods (francais)
  TODAG_FR: {
    tag:              "TODAG-FR",
    meta_url:         "https://xiaowaz.fr/series-en-cours/tales-of-demons-and-gods/",
    author:           "Mad Snail",
    lang:             "fr",
    publisher:        "xiaowaz.fr",
    cachedir:         process.env.HOME+"/cache/novel2epubs",
    outputdir:        process.env.HOME+"/Documents/Epubs/TODAG-FR",
    getNovelMetadata: xiaowazfr.getNovelMetadata,
    getChaptersProps: xiaowazfr.getChaptersProps,
    getChapterData:   xiaowazfr.getChapterData
  }
};
