const SCRIPT_VERSION = "13";
const fs = require('fs');
const path = require('path');
const firelib = require('./firelib.js');

const PREFIX_SUBRUBRIQUE = "Sous_Rubrique";

let node_path = "";
let script_path = "";
let db_path = "";
let command = "";
let params = [];

let DEBUG = false;

let db = {};

process.argv.forEach(function (val, index, array) {
	//console.log(`${index} : ${val}`)
	if (index == 0) {
		node_path = val
	} else if (index == 1) {
		script_path = val
	} else if (index == 2) {
		db_path = val
	} else if (index == 3) {
		command = val
	} else {
		//console.log("new val", typeof val);
		params.push(val)
	}
});

// ========================================================================

async function main() {
	
	// Load the DB
	if (db_path == "AUTO") db_path = path.join(__dirname, "DB");
	if (db_path == "" || !fs.existsSync(db_path)) {
		console.log("ERROR_DB_PATH_NOTFOUND " + db_path)
		return
	}
	if (fs.lstatSync(db_path).isDirectory()) {
		fs.readdirSync(db_path).forEach(file => {
			if (!/\.json$/.test(file)) return;
			let collname = path.basename(file, ".json");
			db[collname] = require(path.join(db_path, file));
		});
	} else {
		db = require(db_path);
	}

	if (['script_version', 'getSongbooksLight', 'titles2id'].includes(command)) {
		if (command == 'script_version') return console.log(SCRIPT_VERSION);
		if (command == 'getSongbooksLight') return getSongbooksLight();
		if (command == 'titles2id') return (params.length == 0) ? titles2id(): titles2id(params[0]);
	} else if (['titles2id', 'downloadBooksongs', 'getSurthemeTags', 'getSongRaw', 'getPsalmRaw', 'getSongIDsInBook', 'getSongsRubriques', 'getSongsSousRubriques', 'getSongsOrders', 'getSongsLangOrder', 'getRubriques', 'getSongBookSongAttr', 'getBookLang', 'getBookSousRubriques', 'getBookThemesSongs', 'getDbAttr', 'getSongsRaw', 'getSongBookSongFromFire'].indexOf(command) >= 0) {
		if (params.length == 1) {
			//console.log("PARAM0", typeof params[0], params[0], "\n");
			if (command == 'titles2id') return titles2id(params[0]); // not used anymore ?
			if (command == 'getSongIDsInBook') return getSongIDsInBook(params[0]);
			if (command == 'getSongsRubriques') return getSongsRubriques(params[0]);
			if (command == 'getSongsSousRubriques') return getSongsSousRubriques(params[0]);
			if (command == 'getSongsOrders') return getSongsOrders(params[0]);
			if (command == 'getSongsLangOrder') return getSongsLangOrder(params[0]);
			if (command == 'getRubriques') return envoyer(getRubriques(params[0]));
			if (command == 'getBookLang') return envoyer(getBookLang(params[0]));
			if (command == 'getBookSousRubriques') return envoyer(getBookSousRubriques(params[0]));
			if (command == 'getBookThemesSongs') return envoyer(getBookThemesSongs(params[0]));
			if (command == 'getDbAttr') return getDbAttr(params[0]);
			if (command == 'getSurthemeTags') return envoyer(getSurthemeTags(params[0]));
		} else if (params.length == 2) {
			if (command == 'downloadBooksongs') return downloadBooksongs(params[0], params[1]);
			if (command == 'getSongIDsInBook') return getSongIDsInBook(params[0], params[1]);
			if (command == 'getSongRaw') return getSongRaw(params[0], params[1]);
			if (command == 'getPsalmRaw') return getPsalmRaw(params[0], params[1]);
			if (command == 'getSongsRaw') return getSongsRaw(params[0].split(','), params[1]); // en paramètre : une liste d'ids (e.g. "[""233"", ""12""]") et un token (string)
			if (command == 'getBookThemesSongs') return envoyer(await getBookThemesSongs(params[0], params[1]));
		} else if (params.length == 3) {
			if (command == 'getSongBookSongFromFire') return envoyer(await getSongBookSongFromFire(params[0], params[1], params[2]));
			if (command == 'getSongBookSongAttr') return envoyer(getSongBookSongAttr(params[0], params[1], params[2]));
		} else {
			console.log('ERROR_INVALID_ARGS for command ' + command + ' ' + JSON.stringify(params))
		}
	} else if (command == 'getSongRawStocha') {
		if (params.length == 2) {
			getSongRawStocha(params[0], parseInt(params[1]))
		} else {
			console.log('ERROR_INVALID_ARGS for command ' + command + ' ' + JSON.stringify(params))
		}
	} else {
		if (command == 'getSurthemes') return envoyer(getSurthemes());
		console.log(`ERROR_UNKNOWN_CMD "${command}"`)
	}
}

function titles2id(title = null) {
	let songs = values(db.songs);
	let t = {}
	for (let song of songs) {
		t[song.title] = song.orgKey;
		if (song.i18n) for(let int_title of values(song.i18n)) t[int_title] = song.orgKey;
		if (title !== null && t[title]) return envoyer(t[title]);
	}
	if (title !== null) return envoyer(t);
	return envoyer("")
}

// downloads all songs of a book in the cache
async function downloadBooksongs(book_id, token) {
	let SONGBOOK = db.songbooks.find(sb => sb.id == book_id);
	if (!SONGBOOK) {envoyer(`ERROR In getSongIDsInBook : cannot find songbook with id '${book_id}'`); return}
	
	let sb_songs = SONGBOOK.songs.map(song => song.id);
	// get book's songs
	let song_chunks = chunkArray(sb_songs, 5);
	let songs_book = [];
	for (let chunk of song_chunks) {
		let p_songs = chunk.map(song_id => firelib.getSongFromFire(song_id, token, {cache: false}));
		let chunk_result = await Promise.all(p_songs);
		chunk_result = Object.values(chunk_result);
		if (typeof chunk_result[0] == 'string') return console.log(chunk_result[0]);
		songs_book = songs_book.concat(chunk_result)
	}
	envoyer(sb_songs.length)
}

// renvoie un dictionnaire simplifié/allégé des carnets de chants
function getSongbooksLight() {
	let sb_light = arr2obj(db.songbooks, 'id');
	for (let id in sb_light) {
		delete sb_light[id].songs
	}
	envoyer(sb_light)
}

function parseSong(song_id, book_id) {
	// TODO
}

function getSongBookSongAttr(book_id, song_id, attr) {
	let songbook = db.songbooks.find(sb => sb.id == book_id);
	if (!songbook || !songbook.songs) return "ERROR cannot find Songbook "+book_id;
	let song = songbook.songs.find(s => s.id == song_id);
	if (!song) return "ERROR cannot find song "+song_id+" in Songbook "+book_id;
	return song[attr] || "";
}

function getBookLang(book_id) {
	let songbook = db.songbooks.find(sb => sb.id == book_id);
	return songbook.lang;
}

// renvoie {'theme1': [liste_chants...], 'theme2': [liste_chants...], ...}
async function getBookThemesSongs(book_id, token = "") {
	let songbook = db.songbooks.find(sb => sb.id == book_id);
	let sb_songs = songbook.songs.map(song => song.id);
	
	// get book's songs
	let song_chunks = chunkArray(sb_songs, 5);
	let song_list = [];
	for (let chunk of song_chunks) {
		let p_songs = chunk.map(song_id => firelib.getSongFromFire(song_id, token));
		let chunk_result = await Promise.all(p_songs);
		chunk_result = Object.values(chunk_result);
		if (typeof chunk_result[0] == 'string') return chunk_result[0];
		song_list = song_list.concat(chunk_result)
	}
	
	let songsBook = song_list.map(song => {return {
									id:song.orgKey, 
									title: song.i18n ? song.i18n[songbook.lang.toUpperCase()] || song.title : song.title, //song.title,
									titles: [song.title].concat(values(song.i18n)),
									tags: song.tags
								}})
						.sortBy(song => removeDiacritics(song.title ? song.title.toLowerCase() : ""));
	let songsByTheme = songsBook.split(song => song.tags)
	return songsByTheme
}

// returns the list of tags attached to the appropriate sur theme
function getSurthemeTags(surtheme_id) {
	if (!db.tags) return "ERROR in getSurthemeTags : tags db does not exist";
	return Object.values(db.tags).filter(t => t.theme == surtheme_id).sortBy2(t => t.order);
}

function getSurthemes() {
	if (!db.sur_themes) return "ERROR in getSurthemes : sur_themes db does not exist";
	let surthemes = [];
	for (let k in db.sur_themes) {
		db.sur_themes[k].key = k;
		surthemes.push(db.sur_themes[k]);
	}
	return surthemes.sortBy2(el => el.order);
}

// renvoie {'song_id': 'rubrique_id', ...}
function getSongsRubriques(book_id) {
	let SONGBOOK = db.songbooks.find(sb => sb.id == book_id);
    if (!SONGBOOK) SONGBOOK = db.songbooks.find(sb => sb.id == '2017_FR');
	if (!SONGBOOK) {envoyer(`ERROR in getSongsRubriques : cannot find songbook '${book_id}'`); return}
	
	let rubriques = {}
	for (let song of SONGBOOK.songs) {
		//if (song.subrubrique) rubriques[song.id] = song.subrubrique;
		rubriques[song.id] = song.rubrique;
	}
	envoyer(rubriques)
}

// renvoie {'song_id': 'rubrique_or_subrubrique_id', ...}
function getSongsSousRubriques(book_id) {
	let SONGBOOK = db.songbooks.find(sb => sb.id == book_id);
    if (!SONGBOOK) SONGBOOK = db.songbooks.find(sb => sb.id == '2017_FR');
	if (!SONGBOOK) {envoyer(`ERROR in getSongsSousRubriques : cannot find songbook '${book_id}'`); return}
	
	let srubriques = {}
	for (let song of SONGBOOK.songs) {
		if (song.subrubrique) srubriques[song.id] = song.subrubrique;
	}
	envoyer(srubriques)
}

// renvoie {'song_id': ['FR', HU'], ...}
function getSongsLangOrder(book_id) {
	let SONGBOOK = db.songbooks.find(sb => sb.id == book_id);
    if (!SONGBOOK) SONGBOOK = db.songbooks.find(sb => sb.id == '2017_FR');
	if (!SONGBOOK) {envoyer(`ERROR in getSongsLangOrder : cannot find songbook '${book_id}'`); return}
	
	let langorder = {}
	for (let song of SONGBOOK.songs) {
		let langs = [];
		for (let lang in song.scenario) langs.push(lang);
		langorder[song.id] = langs;
	}
	envoyer(langorder);
}

function getSongsOrders(book_id) {
	let SONGBOOK = db.songbooks.find(sb => sb.id == book_id);
    if (!SONGBOOK) SONGBOOK = db.songbooks.find(sb => sb.id == '2017_FR');
	if (!SONGBOOK) {envoyer(`ERROR in getSongsOrders : cannot find songbook '${book_id}'`); return}
	
	let orders = {}
	for (let song of SONGBOOK.songs) {
		orders[song.id] = song.scenario;
	}
	envoyer(orders);
}

// renvoie les rubriques du carnet de chants book_id dans l'ordre (e.g. [{'id':'ANIMATION', 'title':...}, {...}]
function getRubriques(book_id) {
	let SONGBOOK = db.songbooks.find(sb => sb.id == book_id);
    if (SONGBOOK) {
        if (SONGBOOK.rubriques) {
			if (SONGBOOK.rubriques.length && typeof SONGBOOK.rubriques[0] == 'string') SONGBOOK.rubriques.map(el => {return {id: el, title: el}});
            return SONGBOOK.rubriques
        } else {
            if (book_id != "2017_FR") {
                return getRubriques("2017_FR")
                //console.log("WARNING The songbook " + book_id + " has no rubriques order specified ! Fallback to default order of 2017_FR"
            } else {
                return "ERROR Songbook 2017_FR has no order of rubriques specified !"
            }
        }
    } else {
        if (book_id != "2017_FR") {
            return getRubriques("2017_FR")
            //console.log("WARNING The songbook " + book_id + " does not exist in ""songbooks"" collection ! Fallback to default order of 2017_FR")
        } else {
            return "ERROR Songbook 2017_FR doens't exist in songbooks !"
        }
    }
}

// renvoie le dictionnaire rubrique_id => dict(sousrubr_id => sous_rubrique_bookmark_name)
function getBookSousRubriques(book_id) {
    let subrubr = {}
	let SONGBOOK = db.songbooks.find(sb => sb.id == book_id);
    let rubriquesOrder = getRubriques(book_id).map(el => el.id);
	if (typeof rubriquesOrder == "string") rubriquesOrder = db.rubriques;
    
    if (SONGBOOK) {
        if (SONGBOOK.rubriques) {
            b_sousrubr = false
            let rubrique_list = SONGBOOK.rubriques
            let rubrique_dict = arr2obj(rubrique_list, "id")
            
            rubr_num = 1
            for (let rubr_id of rubriquesOrder) {
                if (rubrique_dict[rubr_id]) {
                    let rubrique_obj = rubrique_dict[rubr_id]
                    if (rubrique_obj.subrubriques) {
                        let d = {}
                        for (let i = 0; i < rubrique_obj.subrubriques.length; i++) {
                            d[rubrique_obj.subrubriques[i]] = PREFIX_SUBRUBRIQUE + rubr_num + "_" + (i+1)
                        }
                        subrubr[rubrique_obj.id] = d
                        b_sousrubr = true
                    }
                } else {
                    //writeLog "WARNING", "Cannot find rubrique """ & rubr_id & """ in book " & book_id
                }
                rubr_num++
            }
            if (!b_sousrubr) {
                subrubr = getBookSousRubriques("2017_FR")
                //writeLog "WARNING", "The songbook " & book_id & " has 0 sous-rubriques order specified ! Falling back to ""2017_FR"" order"
            }
		} else {
            subrubr = getBookSousRubriques("2017_FR")
            //writeLog "WARNING", "The songbook " & book_id & " has no sous-rubriques order specified ! Falling back to default order"
        }
	} else if (book_id != "2017_FR") {
        subrubr = getBookSousRubriques("2017_FR")
        //writeLog "WARNING", "The songbook " & book_id & " does not exist in ""songbooks"" collection ! Fallback to default order"
    } else {
        return "ERROR The songbook " + book_id + " does not exist in 'songbooks' collection ! Cannot fallback"
    }
    return subrubr
}

// voir fonction homonyme dans le module IMPORT_BOOK
async function getSongIDsInBook(book_id, token) {
	let SONGBOOK_LANG = "FR";
	let SONGBOOK = db.songbooks.find(sb => sb.id == book_id);
	if (!SONGBOOK) {envoyer(`ERROR In getSongIDsInBook : cannot find songbook with id '${book_id}'`); return}
	SONGBOOK_LANG = SONGBOOK.lang;
	
	let sb_songs = SONGBOOK.songs.map(song => song.id);
	// get book's songs
	let song_chunks = chunkArray(sb_songs, 5);
	let songs_book = [];
	for (let chunk of song_chunks) {
		let p_songs = chunk.map(song_id => firelib.getSongFromFire(song_id, token));
		let chunk_result = await Promise.all(p_songs);
		chunk_result = Object.values(chunk_result);
		if (typeof chunk_result[0] == 'string') return console.log(chunk_result[0]);
		songs_book = songs_book.concat(chunk_result)
	}
	
	// ==> uniqmt pour 2017_FR on discard les chants du carnet mais qui ont page = 0 ou vide car ça veut dire qu'ils sont dans les suppléments
	if (book_id == '2017_FR') songs_book = songs_book.filter(el => !el.page || el.page[book_id]);
	let songs = songs_book
	let complete_masses = [];
	
	let split1 = songs_book.split(el => (el['mass'] && el['mass'] != '' && !el['subsection'] || false).toString())
	if (isEmpty(split1)) {
		console.log("ERROR In getSongIDsInBook " + book_id + " cannot split songs and complete masses")
		return
	}
	debug("split1 " + Object.getOwnPropertyNames(split1).join("'"))
	if (split1['true'] && split1['false']) {
		debug("split1 ok ")
		complete_masses = split1["true"]
        songs = split1["false"]
		
		let split2 = complete_masses.split(el => (el['copyright'] != {} && el['copyright'] != '' && el.copyright.international == '5' || false).toString())
		if (isEmpty(split2)) {
			envoyer("ERROR In getSongIDsInBook " + book_id + " cannot split ACN masses")
			return
		}
		debug("split2 " + Object.getOwnPropertyNames(split2).join("'"))
		if (split2["true"] && split2["false"]) {
			debug("split2 ok ")
			let masses_acn = split2["true"].sortBy(el => el.mass + '_' + el.massOrder)
			let masses_other = split2["false"].sortBy(el => el.mass + '_' + el.massOrder)
			complete_masses = masses_acn.concat(masses_other)
		} else {
			complete_masses = complete_masses.sortBy(el => el.mass + '_' + el.massOrder)
		}
	}
	
	let song_plus = [];
	for (let song of songs) {
		let titre = "";
		if (song.i18n && song.i18n[SONGBOOK_LANG]) {
			titre = removeDiacritics(song.i18n[SONGBOOK_LANG])
		} else {
			titre = removeDiacritics(song.title ? song.title : "")
		}
		// case of Psalms
		if (song.ref && !song.ref[0]) console.log(song)
		if (song.ref && song.ref[0] && song.ref[0].chapter && song.ref[0].book == 'Ps') {
			let psalm_title = titre.replace(/[\d+\)\(\.\-\_ab]+/g, '').replace(/\s{2,}/g, ' ').trim();
			let num = song.ref[0].chapter;
			if (num < 10) num = '00' + num;
			else if (num < 100) num = '0' + num;
 			titre = psalm_title + ' ' + num;
		}
		// case of AT/NT
		if (song.psalmId && ["at", "nt"].includes(song.psalmId.substr(0,2))) {
			titre = titre.substr(0,2) + ' ' + song.psalmId.substr(2);
		}
		song_plus.push({orgKey: song.orgKey, title: titre})
	}
	song_plus = song_plus.sortBy2(el => el.title)
	debug(song_plus.map(el => el.orgKey + "_" + el.title))
	
	let songs_book2 = song_plus.concat(complete_masses)
	let songs_final = songs_book2.map(el => el.orgKey || el.id).filter(el => !!el);
	envoyer(songs_final)
}

// renvoie l'objet {"songid1": {...}, "songid2": {...}, ...}
async function getSongsRaw(ids_list, token) {
	let p_songs = [];
	for (let id of ids_list) {
		p_songs.push(firelib.getSongFromFire(id, token));
		//o[id] = db.songs[id]
	}
	let o = await Promise.all(p_songs);
	envoyer(o);
}


async function getSongBookSongFromFire(songbook_id, song_id, token) {
	let songmeta = await firelib.getSongBookSongFromFire(songbook_id, song_id, token, {cache:false});
	return songmeta;
}


function getSongRawStocha(song_id, nb = 20) {
	let o = {song_id: db.songs[song_id]};
	let song_id_list = Object.getOwnPropertyNames(db.songs);
	let ids = pickAlea(song_id_list, nb-1);
	for (let id of ids) {
		o[id] = db.songs[id];
	}
	return envoyer(o)
}

// renvoie un chant raw
async function getPsalmRaw(psalmId, token) {
	let song = await firelib.getPsalm(psalmId, token);
	envoyer(song)
}

// renvoie un chant raw
async function getSongRaw(song_id, token) {
	//if (db.songs && db.songs[song_id]) {
		let song = await firelib.getSongFromFire(song_id, token);
		envoyer(song)
	// } else {
		// console.log("ERROR_SONG_NOTFOUND in getSongRaw, id=" + song_id)
	// }
}

// renvoie un attribut de l'objet db
function getDbAttr(attr) {
	if (db[attr]) {
		envoyer(db[attr])
	} else {
		console.log("ERROR in getDbAttr NODEJS : cannot find attribute " + attr + " in DB")
	}
}

// ========================================================================
//								HELPERS
// ========================================================================


function chunkArray(arr, chunk_size) {
	let chunks = [];
	for (let i = 0; i < arr.length; i += chunk_size) {
		chunks.push(arr.slice(i, i + chunk_size));
	}
	return chunks;
}

// returns an array of nb elements picked from arr
function pickAlea(arr, nb) {
	if (nb < arr.length) {
		let maxi = arr.length-1
		let new_arr = []
		for (let i = 0; i < nb; i ++) {
			let n = Math.round(Math.random() * maxi);
			new_arr.push(arr[n])
		}
		return new_arr
	}
	return arr
}

function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

function values(o) {
	let arr = [];
	for (let k in o) {
		arr.push(o[k])
	}
	return arr
}

function arr2obj(arr, attr) {
	let o = {}
	for (let el of arr) {
		if (el[attr]) {
			o[el[attr]] = el
		}
	}
	return o
}

// [{id: 1, coco: 11, riri: 111}, ...], id, coco ---> {'1':11, '2': 22, ...}
function arr2keyval(arr, attr_key, attr_val) {
	let o = {}
	for (let el of arr) {
		if (el[attr_key]) o[el[attr_key]] = el[attr_val];
	}
	return o
}

Array.prototype.flatten = function() {
	let res = [];
	for (let i = 0; i < this.length; i++) {
		if (typeof this[i] == 'object' && this[i].length > 0) {
			res = res.concat(this[i].flatten())
		} else {
			res.push(this[i])
		}
	}
	return res
}

Array.prototype.split = function(fn) {
	res = {};
	for (let i = 0; i < this.length; i++) {
		let k = fn(this[i]);
		if (typeof k == 'object' && k.length > 0) {
			for (let el of k) {
				if (!res[el]) res[el] = [];
				res[el].push(this[i])
			}
		} else {
			if (!res[k]) res[k] = [];
			res[k].push(this[i])
		}
	}
	return res
}

Array.prototype.sortBy = function(fn) {
	let myFun = fn
	if (typeof fn == "string") myFun = ((el) => el[fn]);
	return this.sort((a,b) => {
		if (myFun(a) < myFun(b)) return -1; // a < b
		return 1 // a > b
	})
}

Array.prototype.sortBy2 = function(fn) {
	let myFun = fn
	if (typeof fn == "string") myFun = ((el) => el[fn]);
	return this.sort((a,b) => {
		let aa = myFun(a);
		let bb = myFun(b);
		let n_aa = /^[0-9]+/gi.exec(aa);
		if (n_aa) {
			let n_bb = /^[0-9]+/gi.exec(bb);
			if (n_bb) {
				let na = parseInt(n_aa[0]);
				let nb = parseInt(n_bb[0]);
				if (na < nb) return -1;
				if (na == nb) return (aa < bb) ? -1: 1;
				return 1;
			}
		}
		if (aa < bb) return -1; // a < b
		return 1 // a > b
	})
}

var defaultDiacriticsRemovalMap = [
	{'base':'A', 'letters':'\u0041\u24B6\uFF21\u00C0\u00C1\u00C2\u1EA6\u1EA4\u1EAA\u1EA8\u00C3\u0100\u0102\u1EB0\u1EAE\u1EB4\u1EB2\u0226\u01E0\u00C4\u01DE\u1EA2\u00C5\u01FA\u01CD\u0200\u0202\u1EA0\u1EAC\u1EB6\u1E00\u0104\u023A\u2C6F'},
	{'base':'AA','letters':'\uA732'},
	{'base':'AE','letters':'\u00C6\u01FC\u01E2'},
	{'base':'AO','letters':'\uA734'},
	{'base':'AU','letters':'\uA736'},
	{'base':'AV','letters':'\uA738\uA73A'},
	{'base':'AY','letters':'\uA73C'},
	{'base':'B', 'letters':'\u0042\u24B7\uFF22\u1E02\u1E04\u1E06\u0243\u0182\u0181'},
	{'base':'C', 'letters':'\u0043\u24B8\uFF23\u0106\u0108\u010A\u010C\u00C7\u1E08\u0187\u023B\uA73E'},
	{'base':'D', 'letters':'\u0044\u24B9\uFF24\u1E0A\u010E\u1E0C\u1E10\u1E12\u1E0E\u0110\u018B\u018A\u0189\uA779\u00D0'},
	{'base':'DZ','letters':'\u01F1\u01C4'},
	{'base':'Dz','letters':'\u01F2\u01C5'},
	{'base':'E', 'letters':'\u0045\u24BA\uFF25\u00C8\u00C9\u00CA\u1EC0\u1EBE\u1EC4\u1EC2\u1EBC\u0112\u1E14\u1E16\u0114\u0116\u00CB\u1EBA\u011A\u0204\u0206\u1EB8\u1EC6\u0228\u1E1C\u0118\u1E18\u1E1A\u0190\u018E'},
	{'base':'F', 'letters':'\u0046\u24BB\uFF26\u1E1E\u0191\uA77B'},
	{'base':'G', 'letters':'\u0047\u24BC\uFF27\u01F4\u011C\u1E20\u011E\u0120\u01E6\u0122\u01E4\u0193\uA7A0\uA77D\uA77E'},
	{'base':'H', 'letters':'\u0048\u24BD\uFF28\u0124\u1E22\u1E26\u021E\u1E24\u1E28\u1E2A\u0126\u2C67\u2C75\uA78D'},
	{'base':'I', 'letters':'\u0049\u24BE\uFF29\u00CC\u00CD\u00CE\u0128\u012A\u012C\u0130\u00CF\u1E2E\u1EC8\u01CF\u0208\u020A\u1ECA\u012E\u1E2C\u0197'},
	{'base':'J', 'letters':'\u004A\u24BF\uFF2A\u0134\u0248'},
	{'base':'K', 'letters':'\u004B\u24C0\uFF2B\u1E30\u01E8\u1E32\u0136\u1E34\u0198\u2C69\uA740\uA742\uA744\uA7A2'},
	{'base':'L', 'letters':'\u004C\u24C1\uFF2C\u013F\u0139\u013D\u1E36\u1E38\u013B\u1E3C\u1E3A\u0141\u023D\u2C62\u2C60\uA748\uA746\uA780'},
	{'base':'LJ','letters':'\u01C7'},
	{'base':'Lj','letters':'\u01C8'},
	{'base':'M', 'letters':'\u004D\u24C2\uFF2D\u1E3E\u1E40\u1E42\u2C6E\u019C'},
	{'base':'N', 'letters':'\u004E\u24C3\uFF2E\u01F8\u0143\u00D1\u1E44\u0147\u1E46\u0145\u1E4A\u1E48\u0220\u019D\uA790\uA7A4'},
	{'base':'NJ','letters':'\u01CA'},
	{'base':'Nj','letters':'\u01CB'},
	{'base':'O', 'letters':'\u004F\u24C4\uFF2F\u00D2\u00D3\u00D4\u1ED2\u1ED0\u1ED6\u1ED4\u00D5\u1E4C\u022C\u1E4E\u014C\u1E50\u1E52\u014E\u022E\u0230\u00D6\u022A\u1ECE\u0150\u01D1\u020C\u020E\u01A0\u1EDC\u1EDA\u1EE0\u1EDE\u1EE2\u1ECC\u1ED8\u01EA\u01EC\u00D8\u01FE\u0186\u019F\uA74A\uA74C'},
	{'base':'OI','letters':'\u01A2'},
	{'base':'OO','letters':'\uA74E'},
	{'base':'OU','letters':'\u0222'},
	{'base':'OE','letters':'\u008C\u0152'},
	{'base':'oe','letters':'\u009C\u0153'},
	{'base':'P', 'letters':'\u0050\u24C5\uFF30\u1E54\u1E56\u01A4\u2C63\uA750\uA752\uA754'},
	{'base':'Q', 'letters':'\u0051\u24C6\uFF31\uA756\uA758\u024A'},
	{'base':'R', 'letters':'\u0052\u24C7\uFF32\u0154\u1E58\u0158\u0210\u0212\u1E5A\u1E5C\u0156\u1E5E\u024C\u2C64\uA75A\uA7A6\uA782'},
	{'base':'S', 'letters':'\u0053\u24C8\uFF33\u1E9E\u015A\u1E64\u015C\u1E60\u0160\u1E66\u1E62\u1E68\u0218\u015E\u2C7E\uA7A8\uA784'},
	{'base':'T', 'letters':'\u0054\u24C9\uFF34\u1E6A\u0164\u1E6C\u021A\u0162\u1E70\u1E6E\u0166\u01AC\u01AE\u023E\uA786'},
	{'base':'TZ','letters':'\uA728'},
	{'base':'U', 'letters':'\u0055\u24CA\uFF35\u00D9\u00DA\u00DB\u0168\u1E78\u016A\u1E7A\u016C\u00DC\u01DB\u01D7\u01D5\u01D9\u1EE6\u016E\u0170\u01D3\u0214\u0216\u01AF\u1EEA\u1EE8\u1EEE\u1EEC\u1EF0\u1EE4\u1E72\u0172\u1E76\u1E74\u0244'},
	{'base':'V', 'letters':'\u0056\u24CB\uFF36\u1E7C\u1E7E\u01B2\uA75E\u0245'},
	{'base':'VY','letters':'\uA760'},
	{'base':'W', 'letters':'\u0057\u24CC\uFF37\u1E80\u1E82\u0174\u1E86\u1E84\u1E88\u2C72'},
	{'base':'X', 'letters':'\u0058\u24CD\uFF38\u1E8A\u1E8C'},
	{'base':'Y', 'letters':'\u0059\u24CE\uFF39\u1EF2\u00DD\u0176\u1EF8\u0232\u1E8E\u0178\u1EF6\u1EF4\u01B3\u024E\u1EFE'},
	{'base':'Z', 'letters':'\u005A\u24CF\uFF3A\u0179\u1E90\u017B\u017D\u1E92\u1E94\u01B5\u0224\u2C7F\u2C6B\uA762'},
	{'base':'a', 'letters':'\u0061\u24D0\uFF41\u1E9A\u00E0\u00E1\u00E2\u1EA7\u1EA5\u1EAB\u1EA9\u00E3\u0101\u0103\u1EB1\u1EAF\u1EB5\u1EB3\u0227\u01E1\u00E4\u01DF\u1EA3\u00E5\u01FB\u01CE\u0201\u0203\u1EA1\u1EAD\u1EB7\u1E01\u0105\u2C65\u0250'},
	{'base':'aa','letters':'\uA733'},
	{'base':'ae','letters':'\u00E6\u01FD\u01E3'},
	{'base':'ao','letters':'\uA735'},
	{'base':'au','letters':'\uA737'},
	{'base':'av','letters':'\uA739\uA73B'},
	{'base':'ay','letters':'\uA73D'},
	{'base':'b', 'letters':'\u0062\u24D1\uFF42\u1E03\u1E05\u1E07\u0180\u0183\u0253'},
	{'base':'c', 'letters':'\u0063\u24D2\uFF43\u0107\u0109\u010B\u010D\u00E7\u1E09\u0188\u023C\uA73F\u2184'},
	{'base':'d', 'letters':'\u0064\u24D3\uFF44\u1E0B\u010F\u1E0D\u1E11\u1E13\u1E0F\u0111\u018C\u0256\u0257\uA77A'},
	{'base':'dz','letters':'\u01F3\u01C6'},
	{'base':'e', 'letters':'\u0065\u24D4\uFF45\u00E8\u00E9\u00EA\u1EC1\u1EBF\u1EC5\u1EC3\u1EBD\u0113\u1E15\u1E17\u0115\u0117\u00EB\u1EBB\u011B\u0205\u0207\u1EB9\u1EC7\u0229\u1E1D\u0119\u1E19\u1E1B\u0247\u025B\u01DD'},
	{'base':'f', 'letters':'\u0066\u24D5\uFF46\u1E1F\u0192\uA77C'},
	{'base':'g', 'letters':'\u0067\u24D6\uFF47\u01F5\u011D\u1E21\u011F\u0121\u01E7\u0123\u01E5\u0260\uA7A1\u1D79\uA77F'},
	{'base':'h', 'letters':'\u0068\u24D7\uFF48\u0125\u1E23\u1E27\u021F\u1E25\u1E29\u1E2B\u1E96\u0127\u2C68\u2C76\u0265'},
	{'base':'hv','letters':'\u0195'},
	{'base':'i', 'letters':'\u0069\u24D8\uFF49\u00EC\u00ED\u00EE\u0129\u012B\u012D\u00EF\u1E2F\u1EC9\u01D0\u0209\u020B\u1ECB\u012F\u1E2D\u0268\u0131'},
	{'base':'j', 'letters':'\u006A\u24D9\uFF4A\u0135\u01F0\u0249'},
	{'base':'k', 'letters':'\u006B\u24DA\uFF4B\u1E31\u01E9\u1E33\u0137\u1E35\u0199\u2C6A\uA741\uA743\uA745\uA7A3'},
	{'base':'l', 'letters':'\u006C\u24DB\uFF4C\u0140\u013A\u013E\u1E37\u1E39\u013C\u1E3D\u1E3B\u017F\u0142\u019A\u026B\u2C61\uA749\uA781\uA747'},
	{'base':'lj','letters':'\u01C9'},
	{'base':'m', 'letters':'\u006D\u24DC\uFF4D\u1E3F\u1E41\u1E43\u0271\u026F'},
	{'base':'n', 'letters':'\u006E\u24DD\uFF4E\u01F9\u0144\u00F1\u1E45\u0148\u1E47\u0146\u1E4B\u1E49\u019E\u0272\u0149\uA791\uA7A5'},
	{'base':'nj','letters':'\u01CC'},
	{'base':'o', 'letters':'\u006F\u24DE\uFF4F\u00F2\u00F3\u00F4\u1ED3\u1ED1\u1ED7\u1ED5\u00F5\u1E4D\u022D\u1E4F\u014D\u1E51\u1E53\u014F\u022F\u0231\u00F6\u022B\u1ECF\u0151\u01D2\u020D\u020F\u01A1\u1EDD\u1EDB\u1EE1\u1EDF\u1EE3\u1ECD\u1ED9\u01EB\u01ED\u00F8\u01FF\u0254\uA74B\uA74D\u0275'},
	{'base':'oi','letters':'\u01A3'},
	{'base':'ou','letters':'\u0223'},
	{'base':'oo','letters':'\uA74F'},
	{'base':'p','letters':'\u0070\u24DF\uFF50\u1E55\u1E57\u01A5\u1D7D\uA751\uA753\uA755'},
	{'base':'q','letters':'\u0071\u24E0\uFF51\u024B\uA757\uA759'},
	{'base':'r','letters':'\u0072\u24E1\uFF52\u0155\u1E59\u0159\u0211\u0213\u1E5B\u1E5D\u0157\u1E5F\u024D\u027D\uA75B\uA7A7\uA783'},
	{'base':'s','letters':'\u0073\u24E2\uFF53\u00DF\u015B\u1E65\u015D\u1E61\u0161\u1E67\u1E63\u1E69\u0219\u015F\u023F\uA7A9\uA785\u1E9B'},
	{'base':'t','letters':'\u0074\u24E3\uFF54\u1E6B\u1E97\u0165\u1E6D\u021B\u0163\u1E71\u1E6F\u0167\u01AD\u0288\u2C66\uA787'},
	{'base':'tz','letters':'\uA729'},
	{'base':'u','letters': '\u0075\u24E4\uFF55\u00F9\u00FA\u00FB\u0169\u1E79\u016B\u1E7B\u016D\u00FC\u01DC\u01D8\u01D6\u01DA\u1EE7\u016F\u0171\u01D4\u0215\u0217\u01B0\u1EEB\u1EE9\u1EEF\u1EED\u1EF1\u1EE5\u1E73\u0173\u1E77\u1E75\u0289'},
	{'base':'v','letters':'\u0076\u24E5\uFF56\u1E7D\u1E7F\u028B\uA75F\u028C'},
	{'base':'vy','letters':'\uA761'},
	{'base':'w','letters':'\u0077\u24E6\uFF57\u1E81\u1E83\u0175\u1E87\u1E85\u1E98\u1E89\u2C73'},
	{'base':'x','letters':'\u0078\u24E7\uFF58\u1E8B\u1E8D'},
	{'base':'y','letters':'\u0079\u24E8\uFF59\u1EF3\u00FD\u0177\u1EF9\u0233\u1E8F\u00FF\u1EF7\u1E99\u1EF5\u01B4\u024F\u1EFF'},
	{'base':'z','letters':'\u007A\u24E9\uFF5A\u017A\u1E91\u017C\u017E\u1E93\u1E95\u01B6\u0225\u0240\u2C6C\uA763'}
];

var diacriticsMap = {};
for (var i=0; i < defaultDiacriticsRemovalMap .length; i++){
	var letters = defaultDiacriticsRemovalMap [i].letters;
	for (var j=0; j < letters.length ; j++){
		diacriticsMap[letters[j]] = defaultDiacriticsRemovalMap [i].base;
	}
}

// "what?" version ... http://jsperf.com/diacritics/12
function removeDiacritics (str) {
	return str.replace(/[^\u0000-\u007E]/g, function(a){ 
	   return diacriticsMap[a] || a; 
	});
}

// ========================================================================
//								DEBUG
// ========================================================================

function debug(s) {
	if (DEBUG) console.log(s)
}

function envoyer(o) {
	if (typeof o == "string") console.log(o);
	else console.log(normEncoding(JSON.stringify(o)));
}

function normEncoding(str) {
	s = ""
	for (let i = 0; i < str.length; i++) {
		c = str.charAt(i)
		if (c.match(/[A-z0-9\'\"\-\_\{\}\[\]\:\;\,\.\s]/g)) {
			s += c
		} else {
			s += "@u" + str.charCodeAt(i) + ";"; //toUTF8Array(c)[0]
		}
	}
	return s
}

function toUTF8Array(str) {
    var utf8 = [];
    for (var i=0; i < str.length; i++) {
        var charcode = str.charCodeAt(i);
        if (charcode < 0x80) utf8.push(charcode);
        else if (charcode < 0x800) {
            utf8.push(0xc0 | (charcode >> 6), 
                      0x80 | (charcode & 0x3f));
        }
        else if (charcode < 0xd800 || charcode >= 0xe000) {
            utf8.push(0xe0 | (charcode >> 12), 
                      0x80 | ((charcode>>6) & 0x3f), 
                      0x80 | (charcode & 0x3f));
        }
        // surrogate pair
        else {
            i++;
            // UTF-16 encodes 0x10000-0x10FFFF by
            // subtracting 0x10000 and splitting the
            // 20 bits of 0x0-0xFFFFF into two halves
            charcode = 0x10000 + (((charcode & 0x3ff)<<10)
                      | (str.charCodeAt(i) & 0x3ff))
            utf8.push(0xf0 | (charcode >>18), 
                      0x80 | ((charcode>>12) & 0x3f), 
                      0x80 | ((charcode>>6) & 0x3f), 
                      0x80 | (charcode & 0x3f));
        }
    }
    return utf8;
}




// ========================================================================
//						MAIN
// ========================================================================

main()