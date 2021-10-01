
// ============================================================
// librairie de parsing pour wuxiaworld.co
// var   wuxiaworldco  = require('./wuxiaworldco.js');
import wuxiaworldco from './wuxiaworldco.js';
// librairie de parsing pour xiaowaz.fr
import xiaowazfr    from './xiaowazfr.js';
// ============================================================

export default {
  // Tales Of Demons and Gods
  TODAG: {
    tag:                "TODAG",
    meta_url:           "https://www.wuxiaworld.co/Tales-of-Demons-and-Gods/",
    lang:               "en",
    publisher:          "wuxiaworld.co",
    cachedir:           process.env.HOME+"/cache/novels",
    outputdir:          process.env.HOME+"/Documents/Epubs/TODAG",
    getNovelMetadata:   wuxiaworldco.getNovelMetadata,
    getChaptersProps:   wuxiaworldco.getChaptersProps,
    getChapterData:     wuxiaworldco.getChapterData
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
