
/*
 *  Copyright (c) 2013 PolyFloyd
 */

String.prototype.format = String.prototype.format || function() {
	var args = arguments;
	return this.replace(/{(\d+)}/g, function(match, number) {
		return typeof args[number] != "undefined" ? args[number] : match;
	});
};

String.prototype.startsWith = String.prototype.startsWith || function(str) {
	return this.indexOf(str) == 0;
};

Array.prototype.remove = function(what) {
	while ((i = this.indexOf(what)) !== -1) {
		this.splice(i, 1);
	}
	return this;
};

Node.prototype.remove = Element.prototype.remove || function() {
	this.parentNode.removeChild(this);
}

Node.prototype.removeAll = function() {
	while (this.hasChildNodes()) {
		this.removeChild(this.lastChild);
	}
}

EventTarget.prototype.addMousewheel = function(callback) {
	this.addEventListener("mousewheel", callback, false);
	this.addEventListener("DOMMouseScroll", callback, false);
}

Storage.prototype.setObject = function(key, value) {
	this.setItem(key, JSON.stringify(value));
}

Storage.prototype.getObject = function(key) {
	return JSON.parse(this.getItem(key));
}

var utube = {

	CHANNEL_DATA: "https://gdata.youtube.com/feeds/api/users/{0}?alt=json",

	CHANNEL_URL: "https://www.youtube.com/user/{0}/featured",

	VID_FEED: "https://gdata.youtube.com/feeds/api/users/{0}/uploads?alt=json&orderby=published{1}{2}",

	VID_FEED_INCREMENTS: 6,

	VID_EMDED_URL: "https://www.youtube-nocookie.com/embed/{0}{1}",

	VID_THUMBNAIL_URL: "https://i1.ytimg.com/vi/{0}/mqdefault.jpg",

	VID_POSTER_URL: "https://i1.ytimg.com/vi/{0}/maxresdefault.jpg",

	VID_PAGE_URL: "http://www.youtube.com/watch?v={0}",

	chan: {

		getAll: function() {
			return localStorage.getObject("channels") || [];
		},

		exists: function(channelName) {
			var channels = utube.chan.getAll();
			for (var i = channels.length - 1; i >= 0; i--) {
				if (channels[i].name.toLowerCase() == channelName.toLowerCase()) {
					return true;
				}
			}
			return false;
		},

		add: function(channelName) {
			var isNew = !utube.chan.exists(channelName);
			if (isNew) {
				var channels = utube.chan.getAll();
				data = utube.queryChannel(channelName);
				if (data.error) {
					return "The channel could not be added: " + data.error;
				}
				channels.push(data);
				channels.sort(function(a, b) {
					return a.name > b.name ? 1 : -1;
				});
				localStorage.setObject("channels", channels);
			} else {
				return channelName + " is already added";
			}
		},

		remove: function(channelName) {
			var channels = utube.chan.getAll();
			for (var i = channels.length - 1; i >= 0; i--) {
				if (channels[i].name == channelName) {
					channels.splice(i, 1);
				}
			};
			channels.remove(channelName);
			localStorage.setObject("channels", channels);
		}

	},

	conf: {

		reset: function(source) {
			localStorage.clear();
			if (!source) {
				source = utube.conf.standard;
			}
			for (key in source) {
				utube.conf.set(key, source[key], true);
			}
			window.location.reload(false);
		},

		get: function(key) {
			return localStorage.getItem(key);
		},

		set: function(key, value, noapply) {
			localStorage.setItem(key, value);
			if (!noapply) {
				switch (key) {
				case "channels":
					break;
				case "chanorder":
					utube.updateChannels();
					break;
				case "theme":
					utube.reloadTheme();
					break;
				case "transitions":
					utube.updateTransitionRule(value == "true");
					break;
				}
			}
		},

		exportAll: function() {
			return JSON.stringify(localStorage);
		},

		importAll: function(data) {
			if (!data) {
				return true;
			}
			try {
				utube.conf.reset(JSON.parse(data));
				return true;
			} catch (err) {
				return false;
			}
		},

		standard: {

			autoplay: false,

			channels: "[]",

			chanorder: "VIDDATE",

			markwatched: true,

			nativequeryurl: "http://localhost/uTube/videoinfo.php?id=%ID",

			nativeformat: "MP4",

			nativevideo: false,

			onvidclick: "EMBED",

			theme: "dusk.css",

			transitions: true
		},

		themes: [
			{
				source: "dusk.css",
				name: "Dusk",
				description: "Dark gradients composed in an ordinary way"
			},

			{
				source: "mickeysoft.css",
				name: "MickeySoft",
				description: "Dunno"
			},

			{
				source: "newhorizons.css",
				name: "New Horizons",
				description: "A Simple Obligatory Theme"
			},

			{
				source: "ohesicks.css",
				name: "Oh Es Icks",
				description: "Inb4 lawsuit"
			}
		]

	},

	showConfigMenu: function() {
		menu = document.createElement("div");
		menu.classList.add("ut_configmenu");
		menu.style.width = "500px";
		menu.innerHTML = document.querySelector("#ut_configmenu_content").innerHTML;
		utube.showOverlay(menu);
		var themeSelect = menu.getElementsByTagName("select")[1];
		for (var i = 0; i < utube.conf.themes.length; i++) {
			var op = document.createElement("option");
			theme = utube.conf.themes[i];
			op.value = theme.source;
			op.title = theme.description;
			op.innerHTML = theme.name;
			themeSelect.appendChild(op);
		}
		inputElems = menu.getElementsByTagName("input");
		for (var i = 0; i < inputElems.length; i++) {
			input = inputElems[i];
			switch (input.type) {
				case "text":
					input.value = utube.conf.get(input.name);
					input.setAttribute("onchange", "utube.conf.set(this.name, this.value)");
					break;
				case "checkbox":
					if (utube.conf.get(input.name) == "true") {
						input.checked = "checked";
					}
					input.setAttribute("onclick", "utube.conf.set(this.name, this.checked)");
					break;
				case "radio":
					if (utube.conf.get(input.name) == input.value) {
						input.checked = "checked";
					}
					input.setAttribute("onchange", "utube.conf.set(this.name, this.value)");
					break;
				default:
					break;
			}
		}
		var selectElems = menu.getElementsByTagName("select");
		for (var i = 0; i < selectElems.length; i++) {
			select = selectElems[i];
			select.setAttribute("onchange", "utube.conf.set(this.name, this.value)");
			var value =  utube.conf.get(select.name);
			for (var j = select.childNodes.length - 1; j >= 0; j--) {
				var op = select.childNodes[j];
				if (op.value == value) {
					op.setAttribute("selected", "selected");
					break;
				}
			}
		}
	},

	showChannelMenu: function() {
		menu = document.createElement("div");
		menu.style.width = "500px";
		menu.classList.add("ut_channelmenu");
		menu.innerHTML = document.querySelector("#ut_channelmenu_content").innerHTML;
		var list = menu.querySelector(".ut_channelmenu_list");
		list.style.height = (document.documentElement.clientHeight - 200) + "px";
		utube.showOverlay(menu);
		utube.updateChannelMenu();
	},

	updateChannelMenu: function() {
		var list = document.querySelector(".ut_channelmenu_list");
		list.removeAll();
		var channels = utube.chan.getAll();
		for (var i = 0; i < channels.length; i++) {
			var c = channels[i];
			list.innerHTML += '\
				<div class="ut_channelmenu_item">\
					<img src="' + c.icon + '" />\
					<h5>' + c.title + '</h5>\
					<button onclick="this.parentNode.remove();\
						utube.removeChannelByForm(\'' + c.name + '\');">Remove</button>\
				</div>\
			';
		}
	},

	updateTransitionRule: function(enable) {
		var style = document.querySelector("#disabletransitions");
		if (!enable && !style) {
			style = document.createElement("style");
			style.id = "disabletransitions";
			style.setAttribute("type", "text/css");
			style.innerHTML = "*{transition:none !important;}";
			document.querySelector("head").appendChild(style);
		} else if (style) {
			style.remove();
		}
	},

	addChannelByForm: function() {
		var inputElem = document.querySelector(".ut_addchannel_txt");
		var oldErr = document.querySelector(".ut_chanconf_err");
		if (oldErr) oldErr.remove()
		var err = utube.chan.add(inputElem.value);
		if (err) {
			var errElem = document.createElement("h6");
			errElem.classList.add("ut_chanconf_err");
			errElem.innerHTML = err;
			inputElem.parentNode.appendChild(errElem);
		} else {
			utube.updateChannelMenu();
			utube.updateChannels();
		}
	},

	removeChannelByForm: function(name) {
		utube.chan.remove(name);
		utube.updateChannels();
	},

	reloadTheme: function() {
		document.querySelector(".ut_theme").setAttribute("href",
			"css/theme/" + utube.conf.get("theme"));
	},

	queryJSON: function(url) {
		var req = new XMLHttpRequest();
		try {
			req.open("GET", url, false);
			req.send();
			if (req.responseText.indexOf("{") != 0) {
				return {error: "No data received!"};
			}
			return JSON.parse(req.responseText);
		} catch (err) {
			return {error: err.message};
		}
	},

	queryChannel: function(channelName) {
		var json = utube.queryJSON(utube.CHANNEL_DATA.format(channelName));
		if (json.error) return json;
		json = json.entry;
		return {
			name: json['yt$username']['$t'],
			icon: json['media$thumbnail']['url'],
			title: json['title']['$t'],
			url: utube.CHANNEL_URL.format(channelName)
		};
	},

	queryVideos: function(channelName, offset, limit) {
		var json = utube.queryJSON(utube.VID_FEED.format(channelName,
			"&start-index=" + (offset + 1), limit ? "&max-results=" + limit : ""));
		if (json.error) return json;
		var entries = json.feed.entry;
		var videos = [];
		for (var i = 0; i < entries.length; i++) {
			var e = entries[i];
			var id = e['id']['$t'];
			videos.push({
				description: e['media$group']['media$description']['$t'],
				id: id.substring(id.lastIndexOf("/") + 1, id.length),
				time: new Date(e['published']['$t']),
				title: e['title']['$t'],
				duration: e['media$group']['yt$duration']['seconds'],
			});
		}
		return videos;
	},

	insertVideos: function(channelName, offset, limit, vidListElem) {
		var videos = utube.queryVideos(channelName, offset, limit);
		if (videos.error) {
			var err = document.createElement("p");
			err.innerHTML = videos.error;
			vidListElem.appendChild(err);
		}
		for (var i = 0; i < videos.length; i++) {
			var v = videos[i];
			var vidElem = document.createElement("div");
			vidElem.id = "vid_" + v.id;
			vidElem.classList.add("ut_list_video");
			if (utube.hasWatched(v.id)) {
				vidElem.classList.add("ut_video_watched");
			}
			vidElem.setAttribute("onclick", 'utube.playVideo(\'' + v.id + '\')');
			vidElem.title = v.title;
			var time = v.time.getDate() + "-" + (v.time.getMonth() + 1) + "-" + v.time.getFullYear();
			vidElem.innerHTML = '\
				<p class="ut_video_title">' + v.title + '</p>\
				<p class="ut_video_time">' + time + '</p>\
				<p class="ut_video_duration">' + utube.timeString(v.duration) + '</p>\
				<img src="' + utube.VID_THUMBNAIL_URL.format(v.id) + '" />\
			';
			vidListElem.appendChild(vidElem);
		}
		if (offset == 0) {
			vidListElem.parentNode.setAttribute("data-mostrecent", videos[0].time.getTime())
		}
		vidListElem.setAttribute("data-vidcount",
			parseInt(vidListElem.getAttribute("data-vidcount")) + limit);
	},

	updateChannels: function() {
		var channels = utube.chan.getAll();
		utube.selectorX = utube.selectorY = 0;
		utube.selectorYSave = [];
		utube.chan.count = channels.length;
		var chanBox = document.querySelector(".ut_channelbox");
		var channelsOut = [];
		chanBox.removeAll();
		for (var i = 0; i < channels.length; i++) {
			var c = channels[i];
			var chanElem = document.createElement("div");
			var vidListElem = document.createElement("div");
			vidListElem.classList.add("ut_channel_videos");
			vidListElem.setAttribute("data-channelname", c.name);
			vidListElem.setAttribute("data-vidcount", 0);
			vidListElem.addMousewheel(utube.scrollVideos);
			chanElem.classList.add("ut_channel");
			chanElem.innerHTML = '\
				<a href="' + c.url + '" target="_blank" title="' + c.title + '">\
					<div class="ut_channel_head">\
						<img src="' + c.icon + '" />\
						<h3>' + c.title + '</h3>\
					</div>\
				</a>\
			';
			chanElem.appendChild(vidListElem);
			chanBox.appendChild(chanElem);
			setTimeout(function(n, l, v) {
				return function() {
					utube.insertVideos(n, 0, l, v);
					switch (utube.conf.get("chanorder")) {
						case "VIDDATE":
							var channels = Array.prototype.slice.call(
								document.getElementsByClassName("ut_channel"));
							channels.sort(function(a, b) {
								var ta = parseInt(a.getAttribute("data-mostrecent"));
								var tb = parseInt(b.getAttribute("data-mostrecent"));
								return ta < tb ? 1 : -1;
							});
							for (var i = 0; i < channels.length; i++) {
								channels[i].parentNode.appendChild(channels[i]);
							}
							break;
						default: break;
					}
				}
			}(c.name, utube.VID_FEED_INCREMENTS, vidListElem), 0);
		}
	},

	playVideo: function(id) {
		function html5Video() {
			var embedElem = document.createElement("video");
			embedElem.controls = "controls";
			if (utube.conf.get("autoplay") == "true") {
				embedElem.autoplay = "autoplay";
			}
			embedElem.poster = utube.VID_POSTER_URL.format(id);
			vidList = vt.ytVideoList(utube.conf.get("nativequeryurl").replace("%ID", id));
			var format = utube.conf.get("nativeformat");
			for (var v in vidList) {
				if (v.indexOf(format) != -1) {
					embedElem.src = vidList[v];
					break;
				}
			}
			if (!embedElem.src) {
				embedElem = document.createElement("h3");
				embedElem.innerHTML = "This video is not available in " + format;
				embedElem.style.width = "500px";
			}
			return embedElem;
		}
		function embedVideo() {
			return utube.VID_EMDED_URL.format(id,
				utube.conf.get("autoplay") == "true" ? "?autoplay=1" : "");
		}
		switch (utube.conf.get("onvidclick")) {
			case "EMBED":
				var embedElem;
				if (utube.conf.get("nativevideo") == "true") {
					embedElem = html5Video();
				} else {
					embedElem = document.createElement("iframe");
					embedElem.classList.add("ut_embedvideo");
					embedElem.src = embedVideo();
					embedElem.setAttribute("allowfullscreen", "allowfullscreen");
				}
				var height = window.innerHeight - 100;
				var width = window.innerWidth - 100;
				var w = height * (16 / 9);
				var h = height;
				if (w > width) {
					w = width;
					h = width / (16 / 9);
				}
				embedElem.width = w;
				embedElem.height = h;
				utube.showOverlay(embedElem);
				break;
			case "EMBEDINTAB":
				if (utube.conf.get("nativevideo") == "true") {
					var video = html5Video();
					var page = "\
					<!DOCTYPE html>\
					<html>\
						<head>\
							<title>&mu;Tube Video</title>\
							<style type=\"text/css\">\
								* { margin: 0; padding: 0; }\
								html, body, video { height: 100%; }\
								body { background-color: #000;  overflow: hidden; }\
								video { display: block; margin: auto; }\
							</style>\
						</head>\
						<body>" + video.outerHTML + "</body>\
					</html>";
					video.remove();
					window.open("data:text/html;base64," + btoa(page));
				} else {
					window.open(embedVideo());
				}
				break;
			case "OPENYT":
				window.open(utube.VID_PAGE_URL.format(id));
				break;
		}
		if (utube.conf.get("markwatched") == "true") {
			utube.markAsWatched(id);
		}
	},

	markAsWatched: function(id) {
		utube.conf.set("watched_" + id, true);
		document.getElementById("vid_" + id).classList.add("ut_video_watched");
	},

	hasWatched: function(id) {
		return utube.conf.get("watched_" + id) == "true";
	},

	unwatchAll: function() {
		for (var o in localStorage) {
			if (o.startsWith("watched_")) {
				localStorage.removeItem(o);
			}
		}
		var v = document.getElementsByClassName("ut_video_watched");
		for (var i = v.length - 1; i >= 0; i--) {
			v[i].classList.remove("ut_video_watched");
		};
	},

	showOverlay: function(contentElem) {
		if (document.querySelector(".ut_overlay")) return false;
		ov = document.createElement("table");
		tr = document.createElement("tr");
		td = document.createElement("td");
		wr = document.createElement("div");
		wr.classList.add("ut_overlay_wrapper");
		contentElem.classList.add("ut_overlay_content");
		contentElem.onclick = function(e) {
			e.stopPropagation();
		};
		wr.appendChild(contentElem);
		td.appendChild(wr);
		tr.appendChild(td);
		ov.appendChild(tr);
		ov.classList.add("ut_overlay");
		ov.style.opacity = "0";
		td.onclick = utube.removeOverlay;
		var inputs = contentElem.getElementsByTagName("input");
		for (var i = 0; i < inputs.length; i++) {
			if (inputs[i].type == "text") {
				inputs[i].setAttribute("onfocus", "utube.keysEnabled=false");
				inputs[i].setAttribute("onblur", "utube.keysEnabled=true");
			}
		}
		setTimeout(function() {
			ov.style.opacity = "1";
		}, utube.conf.get("transitions") == "true" ? 20 : 0);
		var body = document.querySelector("body");
		body.insertBefore(ov, body.childNodes[1]);
		wr.style.width = contentElem.clientWidth + "px";
	},

	removeOverlay: function() {
		ov = document.querySelector(".ut_overlay");
		if (ov) {
			ov.style.opacity = "0";
			setTimeout(function() {
				ov.remove();
			}, utube.conf.get("transitions") == "true" ? 300 : 0);
		}
	},

	loadVideos: function(n) {
		if (!n.classList.contains("ut_loading")) {
			n.classList.add("ut_loading");
			utube.insertVideos(n.getAttribute("data-channelname"),
				parseInt(n.getAttribute("data-vidcount")), utube.VID_FEED_INCREMENTS, n);
			n.classList.remove("ut_loading");
		}
	},

	scrollVideos: function(e) {
		var n = e.target;
		for (; n && !n.classList.contains("ut_channel_videos"); n = n.parentNode);
		if (n) {
			n.scrollTop -= e.wheelDelta / 2 || -e.detail * 20;
			if (n.scrollTop == n.scrollHeight - n.clientHeight) {
				utube.loadVideos(n);
			}
		}
		e.stopPropagation();
	},

	timeString: function(seconds) {
		seconds = parseInt(seconds);
		var s = "";
		var hasHours = seconds > 3600;
		if (hasHours) {
			s += Math.round(seconds / 3600) + ":";
			seconds %= 3600;
		}
		var min = Math.round(seconds / 60 - 0.5);
		if (min < 10 && hasHours) {
			s += "0";
		}
		s += min + ":";
		var sec = seconds % 60;
		if  (sec < 10) {
			s += "0";
		}
		return s + sec;
	},

	updateSelector: function() {
		var old = document.querySelector(".ut_list_video.ut_selected");
		if (old) {
			old.classList.remove("ut_selected");
		}
		var vid = utube.getSelectedVideo();
		vid.classList.add("ut_selected");
		vid.scrollIntoView(false);
		if (vid == old) {
			utube.loadVideos(vid.parentNode);
		}
	},

	playSelectedVideo: function() {
		utube.getSelectedVideo().onclick();
	},

	getSelectedChannel: function() {
		var cbox = document.querySelector(".ut_channelbox");
		return cbox.childNodes[utube.selectorX];
	},

	getSelectedVideo: function() {
		var chan = utube.getSelectedChannel();
		if (chan) {
			var list = chan.querySelector(".ut_channel_videos");
			return list.childNodes[utube.selectorY];
		}
		return null;
	},

	selectorMoveUp: function() {
		if (utube.selectorY > 0) {
			utube.selectorY--;
			utube.updateSelector();
		}
	},

	selectorMoveDown: function() {
		var vidcount = parseInt(utube.getSelectedChannel()
			.querySelector(".ut_channel_videos").getAttribute("data-vidcount"));
		if (utube.selectorY < vidcount - 1) {
			utube.selectorY++;
		}
		utube.updateSelector();
	},

	selectorMoveLeft: function() {
		if (utube.selectorX > 0) {
			utube.selectorYSave[utube.selectorX] = utube.selectorY;
			utube.selectorX--;
			utube.selectorY = utube.selectorYSave[utube.selectorX] || 0;
			utube.updateSelector();
		}
	},

	selectorMoveRight: function() {
		if (utube.selectorX < utube.chan.count - 1) {
			utube.selectorYSave[utube.selectorX] = utube.selectorY;
			utube.selectorX++;
			utube.selectorY = utube.selectorYSave[utube.selectorX] || 0;
			utube.updateSelector();
		}
	},

	addKey: function(key, callback) {
		utube.keybindings[key] = callback;
	},

	init: function() {
		if (!localStorage.theme) {
			utube.conf.reset();
		}
		utube.reloadTheme();
		utube.updateChannels();
		utube.updateTransitionRule(utube.conf.get("transitions") == "true");
		var cbox = document.querySelector(".ut_channelbox");
		function scrollChannels(e) {
			cbox.scrollLeft -= e.wheelDelta / 2 || -e.detail * 20;
		}
		cbox.addMousewheel(scrollChannels);
		document.querySelector(".ut_cbar").addMousewheel(scrollChannels);
		document.addEventListener("keydown", function(e) {
			var func = utube.keybindings[e.keyCode];
			if (func && utube.keysEnabled) func(e);
		}, false);
		utube.keybindings = {},
		utube.keysEnabled = true,
		utube.addKey(82, utube.updateChannels);    // R
		utube.addKey(67, utube.showConfigMenu);    // C
		utube.addKey(73, utube.showChannelMenu);   // I
		utube.addKey(81, utube.removeOverlay);     // Q
		utube.addKey(79, utube.playSelectedVideo); // O
		utube.addKey(75, utube.selectorMoveUp);    // K
		utube.addKey(74, utube.selectorMoveDown);  // J
		utube.addKey(72, utube.selectorMoveLeft);  // H
		utube.addKey(76, utube.selectorMoveRight); // L
		utube.addKey(27, utube.removeOverlay);     // Escape
		utube.addKey(38, utube.selectorMoveUp);    // Up
		utube.addKey(40, utube.selectorMoveDown);  // Down
		utube.addKey(37, utube.selectorMoveLeft);  // Left
		utube.addKey(39, utube.selectorMoveRight); // Right
		utube.addKey(13, utube.playSelectedVideo); // Return
	}
};
