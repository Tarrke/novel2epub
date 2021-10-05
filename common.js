import http from 'http';
import https from 'https';
import cheerio from 'cheerio';
import fs    from 'fs';
import path  from 'path';
import epub  from 'epub-gen';

// ==================================================
// usage ============================================
// ==================================================
export function usage(message) {
    if( message ) {
        console.error(message);
        console.error();
    }
    console.error("Usage: node index.js -- [--help] [--force] --tag=<<NOVEL-TAG>>");
    console.error("\t--help:  display this screen");
    console.error("\t--force: force book regeneration");
    console.error("\t--tag:   tag to use (see novels.js for config)");
    process.exit(0);
}

// ==================================================
// create directory (recursively) ===================
// ==================================================
export function mkDirByPathSync(targetDir, { isRelativeToScript = false } = {}) {
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
export function getHttpsContent(url,filepath,timeout=0){
    console.log("Getting ", url, " to ", filepath);
    return new Promise(function(resolve, reject){
        setTimeout( function(){
            var req=https.request(url,function(res) {
                // reject on bad status
                if ( res.statusCode<200 || res.statusCode>=300 ){
                    return reject( new Error('statusCode=' + res.statusCode) );
                }
                // write data
                
                // cumulate data
                var data=[];
                res.on('data',function(chunk){
                    data.push(chunk);
                });
                res.on('end',function(){
                    var buffer=Buffer.concat(data);
                    fs.writeFileSync( filepath, buffer );
                    // --debug--
                    //if (timeout>0)  console.log("GET file '"+filepath+"' with sleep("+timeout+")");
                    resolve({msg: 'success',url: url,filepath: filepath});
                });
            });
            // si une erreur est survenu
            req.on('error',function(err){
                console.error("GET '"+url+"' -> url.error");
                reject({msg: 'error',url: url,filepath: filepath});
            });
            // liberation
            req.end();
        }, timeout );
    });
}
// ==================================================

export function getCover(novel) {
    console.log("Getting cover...");
    if ( novel['cover'] ){
        try{
            if ( !fs.existsSync(novel['cover']) ){
                if ( novel['cover_url'] ){
                    // telecharger l'image
                    getHttpsContent( novel['cover_url'], novel['cover'] ).then( function(){console.log("  cover downloaded !");} );
                } else {
                    // supprimer la reference
                    console.log("No cover URL...");
                    delete novel['cover'];
                }
            } else {
                console.log("Cover already exists...");
            }
        } catch(ioerr) {
            console.error("NOVEL['"+novel.tag+"',cover] => cache-file failed");
            console.error(ioerr);
        }
    } else {
        console.log("No cover in novel props.");
    }
    return novel;
}

// module.exports( { getHttpsContent, mkDirByPathSync } );