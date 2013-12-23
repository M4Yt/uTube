
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

Storage.prototype.setObject = function(key, value) {
	this.setItem(key, JSON.stringify(value));
}
 
Storage.prototype.getObject = function(key) {
	return JSON.parse(this.getItem(key));
}

var utube = function() {

	function _message(text, messageClass) {
		alert(text); // TODO
	}

	function _shouldTransition() {
		return utube.conf.get("transitions") == "true";
	}

	function _cbar() {
		return document.querySelector("div.ut_cbar");
	}

	function _channelbox() {
		return document.querySelector("div.ut_channelbox");
	}

	function _addMousewheel(elem, callback) {
		elem.addEventListener("mousewheel", callback, false);
		elem.addEventListener("DOMMouseScroll", callback, false);
	}

	function _queryJSON(url) {
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
	}

return {

	CHANNEL_DATA: "https://gdata.youtube.com/feeds/api/users/{0}?alt=json",

	CHANNEL_URL: "https://www.youtube.com/user/{0}/featured",

	VID_FEED: "https://gdata.youtube.com/feeds/api/users/{0}/uploads?alt=json&orderby=published{1}{2}",

	VID_EMDED_URL: "https://www.youtube-nocookie.com/embed/{0}",

	VID_THUMBNAIL_URL: "https://i1.ytimg.com/vi/{0}/mqdefault.jpg",

	VID_PAGE_URL: "http://www.youtube.com/watch?v={0}",

	chan: {

		getAll: function() {
			return localStorage.getObject("channels") || [];
		},

		store: function(channels) {
			return localStorage.setObject("channels", channels);
		},

		sortAlphabetical: function(channels) {
			channels.sort(function(a, b){
				return a.name > b.name ? 1 : -1;
			});
		},

		exists: function(channelName) {
			var channels = utube.chan.getAll();
			for (var i = channels.length - 1; i >= 0; i--) {
				if (channels[i].name.toLowerCase().replace(" ", "") ==
					channelName.toLowerCase().replace(" ", "")) {
					return true;
				}
			}
			return false;
		},

		add: function(channelName)
		{
			var isNew = !utube.chan.exists(channelName);
			if (isNew) {
				var channels = utube.chan.getAll();
				data = utube.queryChannel(channelName);
				if (data.error) {
					return "The channel could not be added: " + data.error;
				}
				channels.push(data);
				utube.chan.sortAlphabetical(channels);
				utube.chan.store(channels);
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
			utube.chan.store(channels);
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
					if (value == "CHANNAME") {
						utube.chan.sortAlphabetical(utube.chan.getAll());
					}
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
			channels: "[]",
			chanorder: "VIDDATE",
			onvidclick: "EMBED",
			theme: "dusk.css",
			nativequeryurl: "http://localhost/uTube/videoinfo.php?id=%ID&passwd=mysecretpassworddonotsteal",
			nativeformat: "MP4",
			nativevideo: false,
			transitions: true,
			markwatched: true
		},

		themes: [
			{
				source: "dusk.css",
				name: "Dusk",
				description: "A dark gradient infested theme"
			},

			{
				source: "mickeysoft.css",
				name: "MickeySoft",
				description: "Dunno"
			}
		]

	},

	showConfigMenu: function() {
		menu = document.createElement("div");
		menu.classList.add("ut_configmenu");
		menu.style.width = "500px";
		menu.innerHTML = document.getElementById("ut_configmenu_content").innerHTML;
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
		menu.innerHTML = document.getElementById("ut_channelmenu_content").innerHTML;
		menu.getElementsByClassName("ut_channelmenu_list")[0].style.height =
			(document.documentElement.clientHeight - 200) + "px";
		utube.showOverlay(menu);
		utube.updateChannelMenu();
	},

	updateChannelMenu: function() {
		var list = document.getElementsByClassName("ut_channelmenu_list")[1];
		list.removeAll();
		var ch = utube.chan.getAll();
		for (var i = 0; i < ch.length; i++) {
			var icon = ch[i].icon;
			var name = ch[i].name;
			var title = ch[i].title;
			list.innerHTML += '\
				<div class="ut_chanconf_item">\
					<img src="' + icon + '" />\
					<h5>' + title + '</h5>\
					<button onclick="this.parentNode.remove();\
						utube.removeChannelByForm(\'' + name + '\');">Remove</button>\
				</div>\
			';
		}
	},

	updateTransitionRule: function(enable) {
		var style = document.getElementById("disabletransitions");
		if (!enable && !style) {
			style = document.createElement("style");
			style.id = "disabletransitions";
			style.setAttribute("type", "text/css");
			style.innerHTML = "*{transition:none !important;}";
			document.getElementsByTagName("head")[0].appendChild(style);
		} else if (style) {
			style.remove();
		}
	},

	addChannelByForm: function() {
		var inputElem = document.getElementsByClassName("ut_addchannel_txt")[1];
		var oldErrs = document.getElementsByClassName("ut_chanconf_err");
		for (var i = 0; i < oldErrs.length; i++) {
			oldErrs[i].remove();
		}
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
		var oldTheme = document.getElementsByClassName("ut_themesource")[0];
		if (oldTheme) {
			oldTheme.remove();
		}
		var link = document.createElement("link");
		link.setAttribute("rel", "stylesheet");
		link.setAttribute("type", "text/css");
		link.setAttribute("href", "css/theme/" + utube.conf.get("theme"));
		link.setAttribute("class", "ut_themesource");
		document.getElementsByTagName("head")[0].appendChild(link);
	},

	queryChannel: function(channelName) {
		var json = _queryJSON(utube.CHANNEL_DATA.format(channelName));
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
		var json = _queryJSON(utube.VID_FEED.format(channelName, "&start-index=" + offset + 1,
			(limit ? "&max-results=" + limit : "")));
		if (json.error) return json;
		var entries = json.feed.entry;
		var videos = [];
		for (var i = 0; i < entries.length; i++) {
			var e = entries[i];
			var id = e['id']['$t'];
			videos.push({
				description: e['media$group']['media$description']['$t'],
				id: id.substring(id.lastIndexOf("/") + 1, id.length),
				time: utube.parseDate(e['published']['$t']),
				title: e['title']['$t'],
				duration: e['media$group']['yt$duration']['seconds'],
			});
		}
		return videos;
	},

	insertVideos: function(channelName, offset, limit, vidListElem) {
		var videos = utube.queryVideos(channelName, 0, 0);
		if (videos.error) {
			var err = document.createElement("p");
			err.innerHTML = videos.error;
			vidListElem.appendChild(err);
			return {};
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
	},

	updateChannels: function() {
		var channels = utube.chan.getAll();
		var chanBox = _channelbox();
		var channelsOut = [];
		chanBox.removeAll();
		for (var i = 0; i < channels.length; i++) {
			var icon = channels[i].icon;
			var name = channels[i].name;
			var title = channels[i].title;
			var url = channels[i].url;
			var chanElem = document.createElement("div");
			var vidListElem = document.createElement("div");
			vidListElem.classList.add("ut_channel_videos");
			_addMousewheel(vidListElem, utube.scrollVideos);
			chanElem.classList.add("ut_channel");
			chanElem.innerHTML = '\
				<a href="' + url + '" target="_blank" title="' + title + '">\
					<div class="ut_channel_head">\
						<img src="' + icon + '" />\
						<h3>' + title + '</h3>\
					</div>\
				</a>\
			';
			chanElem.appendChild(vidListElem);
			chanBox.appendChild(chanElem);
			setTimeout(function(n, s, l, v) {
				return function() {
					utube.insertVideos(n, s, l, v);
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
			}(name, 0, 0, vidListElem), 0);
		}
	},

	playVideo: function(id) {
		function html5Video() {
			var embedElem = document.createElement("video");
			embedElem.controls = "controls";
			embedElem.autoplay = "autoplay";
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
		switch (utube.conf.get("onvidclick")) {
			case "EMBED":
				var embedElem;
				if (utube.conf.get("nativevideo") == "true") {
					embedElem = html5Video();
				} else {
					embedElem = document.createElement("iframe");
					embedElem.classList.add("ut_embedvideo");
					embedElem.src = utube.VID_EMDED_URL.format(id);
					embedElem.setAttribute("allowfullscreen", "allowfullscreen");
				}
				var height = window.innerHeight - 100;
				var width = window.innerWidth - 100;
				var w = height * (16 / 9);
				var h = height;
				if (w > width) {
					w = width;
					h = w / (16 / 9);
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
					video.src = ""; // TODO
					window.open("data:text/html;base64," + btoa(page));
				} else {
					window.open(utube.VID_EMDED_URL.format(id));
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
		ov = document.createElement("table");
		tr = document.createElement("tr");
		td = document.createElement("td");
		wr = document.createElement("div");
		wr.classList.add("ut_overlay_wrapper");
		contentElem.classList.add("ut_overlay_content")
		contentElem.onclick = function(e){
			e.stopPropagation();
		};
		wr.appendChild(contentElem);
		td.appendChild(wr);
		tr.appendChild(td);
		ov.appendChild(tr);
		ov.classList.add("ut_overlay");
		ov.style.opacity = "0";
		td.onclick = utube.removeOverlay;
		setTimeout(function(){
			ov.style.opacity = "1";
		}, _shouldTransition() ? 20 : 0);
		document.getElementsByTagName("body")[0].appendChild(ov);
		wr.style.width = contentElem.clientWidth + "px";
	},

	removeOverlay: function(contentElem) {
		ov = document.getElementsByClassName("ut_overlay");
		if (ov.length > 0) {
			ov = ov[0];
			ov.style.opacity = "0";
			setTimeout(function(){
				ov.remove();
			}, _shouldTransition() ? 300 : 0);
		}
	},

	inform: function(text) {
		_message(text, "ut_msg_info");
	},

	error: function(text) {
		_message(text, "ut_msg_err");
	},

	onload: function() {
		if (!localStorage.theme) {
			utube.conf.reset();
		}
		utube.reloadTheme();
		utube.updateChannels();
		utube.updateTransitionRule(_shouldTransition());
		var cbox = _channelbox();
		function scrollChannels(e) {
			cbox.scrollLeft -= e.wheelDelta / 2 || -e.detail * 20;
		}
		_addMousewheel(_cbar(), scrollChannels);
		_addMousewheel(cbox, scrollChannels);
	},

	scrollVideos: function(e) {
		var n = e.target;
		for (; n && !n.classList.contains("ut_channel_videos"); n = n.parentNode);
		if (n) {
			e.target.parentNode.scrollTop -= e.wheelDelta / 2 || -e.detail * 20;
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

	parseDate: function(str) {
		var t = str.split(/-|T|\:|\./i);
		return new Date(t[0], parseInt(t[1]) - 1, t[2], t[3], t[4], t[5]);
	}

}}();
