const firelib_version = "16";
const fs = require('fs');
const path = require('path');
const os = require('os');
const axios = require("axios");
const CONFIG = require('./config.json');
const SONGS_CACHE_DIR = path.join(__dirname, "SONGS_CACHE");


async function getPsalm(psalm_id, token_str, opt = {}) {
	let corresp = {
		"ps1": "476",
		"ps2": "Ywzoz4wDC0iNnyQK9VN7",
		"ps3": "tytqWhaz8P3qE9w8J4gx",
		"ps4": "477",
		"ps5": "478",
		"ps6": "eUqOgS8ksOqOlY9ZWhop",
		"ps7": "jOdLrBmCZA0DHqSOvFal",
		"ps8": "479",
		"ps148": "3p6BO30HGERLin6VonnJ",
		"ps149": "B7Iyl9YnuSurjg3UQjG0",
		"ps150": "kQrGEte9ojCQTrf8c6Bo",
		"ps10": "7ehgLBuHjRdcqHphoALE",
		"ps100": "aa8qzd5cbqjgb0WYTEGl",
		"ps101": "GmmAwMDGgPtkO8DoZlaf",
		"ps102": "ZYl7thxMK9aLuhUAQbts",
		"ps103": "ToNO4ExvP6RlZGhYOlAQ",
		"ps104": "zo8LISaLgDIIoUZ1QNh2",
		"ps105": "0uZorxCEDvAWeMg0UEYG",
		"ps106": "wFMtqpiV8xQ6HFzH2Ckp",
		"ps107": "S93BtKJ20AoBuNfGeFSE",
		"ps108": "fQGg0jQsM3tEYAt8euiM",
		"ps109": "501",
		"ps11": "N4z2f3ChR4oZDtoj95Bv",
		"ps110": "502",
		"ps111": "cABRGagJ5k29OmMnQXDp",
		"ps112": "z3KqYCEzFdLShiDVqovO",
		"ps113a": "RTnmEm625op6YSrHfFYa",
		"ps113b": "UxNHpcTPLac0Roie9UeN",
		"ps114": "503",
		"ps115": "504",
		"ps116": "ObZ3PnjGI8M18xKGAjIx",
		"ps117": "hSPyrhKSGPTfdWguKTfk",
		"ps118": "bMrzhpf4M8l6hYbNYj8Y",
		"ps118_14": "dlhmqEiho5KEK75kMIoe",
		"ps118_15": "E8zrAiTZ5Zamn8EdFpvb",
		"ps118_16": "RUwaqwAb08283yrauDpC",
		"ps118_17": "Lk22oOr9FS2pS9pj6m1z",
		"ps118_18": "vANznLdasVnqj9k6CcPv",
		"ps118_19": "TfPoyQjJK1veYTJkL6si",
		"ps118_20": "CvRFPaY7Ob15abBk857k",
		"ps118_21": "O60sWyPphrrxpQkgDDCX",
		"ps118_22": "DTtFdtHEaq2MRz7rzscs",
		"ps118_3": "OeUmSaAuT9H3l1EPCVkW",
		"ps118_1": "bMrzhpf4M8l6hYbNYj8Y",
		"ps118_4": "WlssJqsNJSqxks5taLXM",
		"ps118_5": "3n9WY353lnoeEJEvkFMt",
		"ps118_6": "RJHh5GMZHlCr5qwqpj1T",
		"ps118_7": "505",
		"ps118_8": "sXwbSAItY4p2e2yZBt6R",
		"ps118_9": "rHnGQZmMbtH4Tts6F77t",
		"ps118_10": "506",
		"ps118_11": "SAvsQVIn1u1FEEHevjld",
		"ps118_12": "EK07BhsXnxN22ZNZcmQN",
		"ps118_2": "NLgXTotiJRse3uYuKnCe",
		"ps118_13": "IF659beMjs4oFst2FDZf",
		"ps119": "VBLk31KB7fD9L2bK7gk2",
		"ps12": "YTWsQwcO60HatpTmMZu5",
		"ps120": "507",
		"ps121": "FUhmkXU6HvCWBBtyWihR",
		"ps122": "VlX9B0fiFvcbZjHJhnWX",
		"ps123": "sOrQ2gs5AWliwWfLllFF",
		"ps124": "XKaBMlCa36nqeaostpPb",
		"ps125": "Rxe8ujKBEVRa35XsjqpZ",
		"ps126": "9eK7ux3d03JFbd9Bx490",
		"ps127": "hUYglRKkL7XoZGNCERW4",
		"ps128": "d9YBD1SyreWqzljhkfgr",
		"ps129": "509",
		"ps13": "3BUCYfljTCZsdcJ7pk6J",
		"ps130": "510",
		"ps131": "yugUIAWKl8C6ThJSmraM",
		"ps132": "511",
		"ps133": "vx1woOgaVx5WAcPhyMsj",
		"ps134": "kdRGnqnquc1Ueig8KNDh",
		"ps135": "Aw6DHWcqIJrEzkDVjJjV",
		"ps136": "5gEsfefLsdtgLgnaBDXe",
		"ps137": "qnZKXr6AM8sYvutIg3Ih",
		"ps138": "HqbqjApbnpc8TCsYlQpV",
		"ps139": "U06NBktVVqg32NlHn2wb",
		"ps14": "PwLsFmaTbtKabXPijSNe",
		"ps140": "845NkkPMc2krSVgydsKs",
		"ps141": "iD0JmZyoV5fyWwy9YXHA",
		"ps142": "1pSV5UTY8Slw09ZFP9bU",
		"ps143": "rThUTO18Ogopr7ZISxeE",
		"ps144": "yv8XhEadPKVpDKP8Y9k6",
		"ps145": "513",
		"ps146": "514",
		"ps147": "7kTJf7DBFIASnZVFKePg",
		"ps15": "480",
		"ps16": "fdkPaeHkFJC6pEzNpSSj",
		"ps17": "VWsgaDfqL1XrJos9G9G3",
		"ps18a": "481",
		"ps18b": "482",
		"ps19": "TxEqBEq8MtQqMyOEun20",
		"ps20": "4UVsiaINSH6OAklDACOE",
		"ps21": "TGoJ61F7tAqgdVT4vBKI",
		"ps22": "483",
		"ps23": "484",
		"ps24": "sl1eWYVs3uDgRMSSFHRy",
		"ps25": "ryjOslhF1EYIleRiZTv8",
		"ps26": "485",
		// "ps26A": "485",
		// "ps26B": "OGYMpbchSHXaoY3lxpEg",
		"ps27": "O0em3UI5OLUFSenXRPPk",
		"ps28": "ogztSXFgWZkxayqjstWA",
		"ps29": "uSjcnbR3iZoOoPmYRYeE",
		"ps30": "jS8v0nPX3zGrRzLNGVFB",
		"ps31": "486",
		"ps32": "SZqkH8zAnqcg53LsX3eK",
		"ps33": "6Csthbj4olCFk06DFhto",
		"ps34": "IMLsRby9ubtJHND7vUjv",
		"ps35": "BQpqy1JbQrUC7NLwkDnr",
		"ps36": "JW65GL6VdW76DlP1Ld9k",
		"ps37": "mNruoJmBOeutsQpxwNJ4",
		"ps38": "C3RWyp2wpmH6qu2FP1nG",
		"ps39": "rOkRFYYecaxV3oqNq1oY",
		// "ps39a": "487",
		// "ps39b": "GXF8oheJP3n7nWwGBvjW",
		"ps40": "IbbLqjwLY9V9fYQDZo9Q",
		"ps41": "BL0VRMiEqUBZuAkhYOPC",
		"ps42": "488",
		"ps43": "etwpCQMw14kuBuXAB8kc",
		"ps44": "489",
		"ps45": "2Z6ZnfRdbTjqDIBFkWJE",
		"ps46": "GSYMennEVcL5Zr3OKvga",
		"ps47": "n6etXznkydesWTu1nSnw",
		"ps48": "gvrmweX8cm36CayrkwP1",
		"ps49": "pqJEkrNKPCWpHhwWs1g5",
		"ps50": "490",
		"ps51": "CbdUehPRczlR8RwqarPn",
		"ps52": "IpciyQxA9pNHCJZx2Kf1",
		"ps53": "0HRkSygHvizFA5RuNQMd",
		"ps54": "faJHxXJyFXIvcDmFfnMt",
		"ps55": "r4cThky3aZOLXvsmJrye",
		"ps56": "A2x8TxNcXYLHOAh9KYOg",
		"ps57": "ByiKw3rSSd000xvPN5Zq",
		"ps58": "NEOPZeZjTzu8LcWNgAiK",
		"ps59": "GJ2vx1FyEYQfWicuKuU5",
		"ps60": "Q7B9cB3UGW2bFgqYGNYz",
		"ps61": "enqTlh3ntItVEX6bdVTq",
		"ps62": "491",
		"ps63": "SHgOqtkOzjZFUnWUMHeb",
		"ps64": "8ZREIOmWY7H2ePQuTqM4",
		"ps65": "hvT61Bu1hgOt33juLoFJ",
		"ps66": "492",
		"ps67": "eJlHI4LgNphk3YM59oBE",
		"ps68": "ru2zxjeMG6GiNEf1VpsD",
		"ps69": "vLb4omjdKFZqSROCl83t",
		"ps70": "HcJeQIABbpTJ3t2frVD2",
		"ps71": "22vRMG6aZMtwysiFNp4F",
		"ps72": "G3tOwrRrOG7QLl1abJAO",
		"ps73": "CHAgT5H6aP2x3KNK50j1",
		"ps74": "7cCGPmIRUyX5p522UesS",
		"ps75": "yd2XvZgGDQPwsMvaCvR8",
		"ps76": "nxLozS6wqi59pWjxqw9E",
		"ps77": "2oZhImilhkbXwQ1sfxOT",
		"ps78": "yXTlW7PoJRa2BkzCs6Dl",
		"ps79": "baUnP95vgMKyiaEU8hkq",
		"ps80": "E2ZPT73oU14AL3iMgtrC",
		"ps81": "cW4RaihvfPQK09UNqqPl",
		"ps82": "Xpo8FenrifLtWHu2wqIE",
		"ps83": "493",
		"ps84": "494",
		"ps85": "495",
		"ps86": "BBgSsseYvvp3obcotGUm",
		"ps87": "aHJ91pZx7OQZVDk1241T",
		"ps88": "fNLihej5f5SCVqmeezBq",
		"ps89": "Hds5PCixHuRFpreHT5OD",
		"ps90": "496",
		"ps91": "RLwgRzBYTluEOvx28GLo",
		"ps92": "LVj6IycNBP1HFX3B48DF",
		"ps93": "xl3PzlTojTW1fQKmWD0u",
		"ps94": "497",
		"ps95": "498",
		"ps96": "nA9W2tf0dHXQxOmXyByr",
		"ps97": "499",
		"ps98": "sMx3GsdYDRicnxG8niVP",
		"ps99": "500",
		"ps9a": "g6rhtfM6vfJYUSsRFS63",
		"ps9b": "R5kApCWHKLZgrSKS3FwU",
		"nt1": "522",
		// "nt1": "xiosWtd37xawctmfGgpk",
		"nt10": "531",
		"nt11": "532",
		"nt12": "533",
		"nt2": "524",
		// "nt2": "jvWJUxKFTnlnOrRVquuB",
		"nt3": "525",
		"nt4": "526",
		"nt5": "527",
		"nt6": "528",
		"nt7": "R0o2PFdkVhKtkNHTJbyi",
		"nt8": "529",
		"nt9": "530",
		"at1": "4E2F6ZjNmJfpgyW7ApYZ",
		"at10": "OTCHRigZybWcQImSlf58",
		"at11": "czuWO9XpmLZEGIiXx9vi",
		"at12": "3IfdotEKGXVQespdjyyG",
		"at13": "C5qPjEweGkHQSsRGLClk",
		"at14": "ApahgAPRrhDOxDIN3ZAf",
		"at15": "npiw8Vg4Zsbe60JxLb0O",
		"at16": "QPoQRhriH4aGBhxipkNj",
		"at17": "YJKAl6Mg0pT4PcHuSzAz",
		"at18": "va9yPMrTmWKZRe7dO0FJ",
		"at19": "515",
		"at2": "K3ApxBroKPcWuFhVUbYI",
		"at20": "ae515XOTeaDlr4vUVSPM",
		"at21": "35OQ64LPj4utJgwL3dOv",
		"at22": "Ntnl3taDrPueZVZtuZ0i",
		"at23": "SlCBIkVnTWBSxx4cGANl",
		"at24": "JVVjORWtBDLL3zZzTjK9",
		"at25": "bc9gB8DGEzyl3yilVHtx",
		"at26": "5HoMLfcFA6Qm49FhVsmN",
		"at27": "aoYNM4Lq2M9Rpmj2yNR8",
		"at28": "Smwbc5ds0EKg2PjOyAqB",
		"at29": "POtofaowskaNaVtBvE4Q",
		"at3": "M5jprkvZM5DaLvETkDLN",
		"at30": "516",
		"at31": "KjrIDj87p5ckvl9RLj3o",
		"at32": "517",
		"at33": "ESbS6sOsA21XALiMI86J",
		"at34": "M0REuDXzHB530uiGREEe",
		"at35": "8OQCKrG8ZsW5Utn4XynO",
		"at36": "2ty5vEoYHUjBgeucmx2o",
		"at37": "rL2ppo1j2un5XgWGndg8",
		"at38": "518",
		"at39": "519",
		"at4": "lAmQx21j49U3B6u7Cxz0",
		"at40": "1Auw8hAfG4s4dZPFRCya",
		"at41": "aeYfPq9oNRrqyRCjpQCl",
		"at42": "cM8dXyfvPPWX4KAIljCU",
		"at43": "U286AL43RqbyyVaAdph0",
		"at44": "K904NrSUMGtkD0GJmAUG",
		"at45": "SEnESeiac9WZunErYVwW",
		"at46": "GujSWwGUfDBjW8M3Dhyi",
		"at47": "3kA2FVX4SX43gF8yTKZg",
		"at5": "Xxisd3YxnVLcVNhRlnbf",
		"at6": "wFuMIRC41oT7KkLJDdqy",
		"at7": "bJMrqfu6TrEnExIBHZhP",
		"at8": "BOCo0A0z8vZAwITl8zUG",
		"at9a": "j8OyUI14OwhVvqISgXrB",
		"at9b": "s9Oj3tmBpDylzP4JMnRJ"
	}
	if (!corresp[psalm_id]) return {"error": "psalmId " + psalm_id + " not found"}
	return getSongFromFire(corresp[psalm_id], token_str, opt);
}

async function getPsalmOld(psalm_id, token_str, opt = {}) {
	let API_KEY = CONFIG.fire_api_key;
	let query = {        //body of the http request
	  "structuredQuery": {
		// "from": {
		  // "collectionId":"songs",
		  // "allDescendants": false,
		// },
		// "orderBy": {
			// "field": {
				// "fieldPath": "psalmId",
			// }, 
			// "direction": "descending"
		// },
		"limit": 1
	  },
	  "newTransaction": {}
	}
	let url = CONFIG.fire_root_url + '/documents/songs:runQuery';
	try {
		res = await axios.post(url, 
			{
				headers: {
					"User-Agent": "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.0)",
					"Content-Type": "application/json",
					"Authorization": "Bearer " + token_str,
				},
				data: query,
			}
		)
	} catch(e) {
		console.log(e);
		console.log(e.statusText);
		return "ERROR " + e.message;
	}
	
	let data = parseFireJson(res.data);
	return data;
}
// getPsalm("ps148", "token")
	// .then(console.log);


async function getSongFromFire(song_id, token_str, opt = {}) {
	let url = CONFIG.fire_root_url + "/documents/songs/" + song_id;
	
	opt = {
		cache: true,
		...opt
	}
	
	// song cache path
	let song_cache_path = path.join(SONGS_CACHE_DIR, "song_" + song_id + ".json");
	if (fs.existsSync(song_cache_path) && opt.cache) return require(song_cache_path);
	
	let res;
	try {
		res = await axios.get(url, 
			{
				headers: {
					"User-Agent": "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.0)",
					"Content-Type": "application/json",
					"Authorization": "Bearer " + token_str,
				}
			}
		)
	} catch(e) {
		return "ERROR " + e.message;
	}
	
	let data = parseFireJson(res.data);
	let song = Object.values(data)[0];
	
	// write in cache
	fs.writeFile(song_cache_path, JSON.stringify(song), function(err) {});
	
	return song;
}



async function getSongBookSongFromFire(songbook_id, song_id, token_str, opt = {}) {
	let url = CONFIG.fire_root_url + "/documents/songbooks/" + songbook_id + "/songs/" + song_id;
	
	opt = {
		cache: true,
		...opt
	}
	
	// song cache path
	let song_cache_path = path.join(SONGS_CACHE_DIR, "songbook_" + songbook_id + "_song_" + song_id + ".json");
	//if (fs.existsSync(song_cache_path) && opt.cache) return require(song_cache_path);
	
	let res;
	try {
		res = await axios.get(url, 
			{
				headers: {
					"User-Agent": "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.0)",
					"Content-Type": "application/json",
					"Authorization": "Bearer " + token_str,
				}
			}
		)
	} catch(e) {
		return "ERROR " + e.message;
	}
	
	let data = parseFireJson(res.data);
	let song = Object.values(data)[0];
	song.id = song_id
	
	// write in songbooks db
	/*let songbooks_path = __dirname + '/DB/songbooks.json';
	let songbooks = require(songbooks_path);
	let done = false;
	for (let i = 0; i < songbooks.length; i++) {
		if (done) break
		if (songbooks[i].id == songbook_id) {
			for (let j = 0; j < songbooks[i].songs.length; j++) {
				//console.log('songid', songbooks[i].songs[j].id);
				if (songbooks[i].songs[j].id == song_id) {
					//console.log('before', songbooks[i].songs[j]);
					songbooks[i].songs[j] = song;
					//console.log('after', songbooks[i].songs[j]);
					done = true
					break
				}
			}
		}
	}*/
	//console.log('song', songbooks.find(s => s.id == songbook_id).songs.find(s => s.id == song_id))
	//fs.writeFile(songbooks_path, JSON.stringify(songbooks, null, '\t'), function(err) {});
	
	// write in cache
	fs.writeFile(song_cache_path, JSON.stringify(song), function(err) {});
	
	return song;
}



// ==================================================
// TRADUCTIONS
// ==================================================
async function loadTranslationsFromFire(token_str, opt = {}) {
	let url = CONFIG.fire_root_url + "/documents/traductions?pageSize=4000";
	
	opt = {
		cache: true,
		...opt
	}
	
	// trad cache path
	let trad_path = path.join(__dirname, "translations.json");
	//if (fs.existsSync(song_cache_path) && opt.cache) return require(song_cache_path);
	
	let res;
	try {
		res = await axios.get(url, 
			{
				headers: {
					"User-Agent": "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.0)",
					"Content-Type": "application/json",
					"Authorization": "Bearer " + token_str,
				}
			}
		)
	} catch(e) {
		return "ERROR " + e.message;
	}
	
	let data = parseFireJson(res.data);

	// Transform to proper format
	let trads = {};
	for (let t of Object.values(data)) {
		trads[t.title] = t.i18n;
		if (!trads[t.type]) trads[t.type] = {};
		trads[t.type][t.title] = t.i18n;
	}


	// write in cache
	fs.writeFileSync(trad_path, JSON.stringify(trads, null, '\t'));

	return trads;
}




function parseFireJson(o) {
	let doc_list = (!o.documents) ? [o] : o.documents;
	let data = {};
	for (let doc of doc_list) {
		let new_doc = {}
		for (let f in doc.fields) {
			new_doc[f] = parseFireVal(doc.fields[f]);
		}
		data[path.basename(doc.name)] = new_doc;
	}
	return data;
}

function parseFireVal(d) {
	if (!d) return null;
    if ( d.stringValue ) return d.stringValue;
	//if ( JSON.stringify(d).includes("nullValue") ) return null;
    if ( d.integerValue ) return d.integerValue;
    if ( d.booleanValue ) return d.booleanValue;
    if ( d.arrayValue ) {
        let c = [];
        if ( d.arrayValue && d.arrayValue.values ) {
            for (let el of d.arrayValue.values) {
                c.push(parseFireVal(el))
            }
        }
        return c;
    } else if ( d.mapValue ) {
        let newd = {}
        if ( typeof d.mapValue.fields == 'object' ) {
            for (let attr in d.mapValue.fields) {
                newd[attr] = parseFireVal(d.mapValue.fields[attr]);
            }
        }
        return newd;
    }
	return null;
}



module.exports = {
	getSongBookSongFromFire, // gets song metadata for a specific songbook
	getSongFromFire,
	getPsalm,
	loadTranslationsFromFire,
}
