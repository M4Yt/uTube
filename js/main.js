Array.prototype.remove = function(what) {
	while ((i = this.indexOf(what)) !== -1) {
		this.splice(i, 1);
	}
	return this;
};

Node.prototype.remove = Element.prototype.remove || function() {
	this.parentNode.removeChild(this);
}

Storage.prototype.setObject = function(key, value) {
	this.setItem(key, JSON.stringify(value));
}
 
Storage.prototype.getObject = function(key) {
	return JSON.parse(this.getItem(key));
}

var utube = function() {

	function _message(text, messageClass) {
		console.log(text); // TODO
	}

return {

	chan: {

		getAll: function() {
			return localStorage.getObject("channels") || [];
		},

		store: function(channels) {
			return localStorage.setObject("channels", channels);
		},

		exists: function(channelName) {
			var channels = utube.chan.getAll();
			for (var i = channels.length - 1; i >= 0; i--) {
				if (channels[i].name.toLowerCase().replace(" ", "") ==
					channelName.toLowerCase().replace(" ", "")) { // TODO
					return true;
				}
			};
			return false;
		},

		add: function(channelName)
		{
			var isNew = !utube.chan.exists(channelName);
			if (isNew) {
				var channels = utube.chan.getAll();
				data = utube.queryChannel(channelName);
				if (data.error) {
					utube.inform("The channel could not be added! (" + data.error + ")");
				} else {
					channels.push(data);
				}
				utube.chan.store(channels);
			} else {
				utube.inform(channelName + " is already added")
			}
			return isNew;
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

		reset: function() {
			for (key in utube.conf.standard) {
				localStorage.setItem(key, utube.conf.standard[key])
			}
			return true;
		},

		get: function(key) {
			return localStorage.getItem(key);
		},

		set: function(key, value) {
			localStorage.setItem(key, value);
		},

		standard: {
			channels: "[]",
			theme: "dusk.css",
			onvidclick: "EMBED",
			playback: "YTFLASH"
		},

		themes: [
			{
				source: "dusk.css",
				name: "Dusk",
				description: "A dark gradient infested theme"
			}
		]

	},

	showConfigMenu: function() {
		function themes() {
			var ret = "";
			for (i = 0; i < utube.conf.themes.length; i++) {
				theme = utube.conf.themes[i];
				cur = utube.conf.get("theme");
				sel = cur === theme.source ? " selected" : "";
				ret += '<option' + sel + ' value="' + theme.source + '" title="' +
					theme.description + '">' + theme.name + '</option>';
			}
			return ret;
		}
		menu = document.createElement("div");
		menu.style.width = "500px";
		menu.innerHTML = '\
			<h2>Configuration</h2>\
			<table>\
				<tr>\
					<td><h4>When I click a video<h4></td>\
					<td>\
						<input type="radio" name="onvidclick"\
							onchange="utube.conf.set(\'onvidclick\',\'EMBED\')">Embed</input><br />\
						<input type="radio" name="onvidclick"\
							onchange="utube.conf.set(\'onvidclick\', \'OPENYT\')">Open on YouTube</input>\
					</td>\
				<tr>\
				<tr>\
					<td><h4>Playback<h4></td>\
					<td>\
						<input type="radio" name="playback"\
							onchange="utube.conf.set(\'playback\', \'YTFLASH\')">YouTube Flash</input><br />\
						<input type="radio" name="playback"\
							onchange="utube.conf.set(\'playback\', \'YTHTML5\')">YouTube HTML5</input><br />\
						<input type="radio" name="playback"\
							onchange="utube.conf.set(\'playback\', \'HTML5\')">HTML5</input>\
					</td>\
				<tr>\
				<tr>\
					<td><h4>Theme<h4></td>\
					<td>\
						<select onchange="utube.conf.set(\'theme\', this.value)">' + themes() + '</select>\
					</td>\
				<tr>\
			</table>\
			<button onclick="if(confirm(\
				\'Delete channels and restore all settings to default?\'\
				) && utube.conf.reset()) window.location.reload(false);">Reset</button>\
		';
		utube.showOverlay(menu);
	},

	setTheme: function(source) {
		var oldTheme = document.getElementsByClassName("ut_themesource")[0];
		if (oldTheme) {
			oldTheme.remove();
		}
		var link = document.createElement("link");
		link.setAttribute("rel", "stylesheet");
		link.setAttribute("type", "text/css");
		link.setAttribute("href", "css/theme/" + source);
		link.setAttribute("class", "ut_themesource");
		document.getElementsByTagName("head")[0].appendChild(link);
	},

	queryChannel: function(channelName) {
		var req = new XMLHttpRequest();
		try {
			req.open("GET","https://gdata.youtube.com/feeds/api/users/" +
				channelName, false);
			req.send();
			xml = req.responseXML;
		} catch (err) {
			return {error: err};
		}
		if (!xml) {
			return {error: "No data received!"};
		}
		var thumbElem = xml.getElementsByTagName("media:thumbnail");
		if (!thumbElem.length) {
			thumbElem = xml.getElementsByTagName("thumbnail");
		}
		return {
			name: xml.getElementsByTagName("title")[0].textContent,
			icon: thumbElem[0].getAttribute("url"),
			url: "https://www.youtube.com/user/" + channelName + "/featured"
		};
	},

	queryVideos: function(channelName, offset, limit) {
		var req = new XMLHttpRequest();
		try {
			req.open("GET","https://gdata.youtube.com/feeds/api/users/" +
				channelName + "/uploads?orderby=updated&start-index=" +
				offset + 1 + (limit ? "&max-results=" + limit : ""), false);
			req.send();
			xml = req.responseXML;
		} catch (err) {
			return {error: err};
		}
		if (!xml) {
			return {error: "No data received!"};
		}
		var videos = [];
		var rv = xml.getElementsByTagName("entry");
		for (i = 0; i < rv.length; i++) {
			var id = rv[i].getElementsByTagName("id")[0].textContent;
			id = id.substring(id.lastIndexOf("/") + 1, id.length);
			videos.push({
				description: rv[i].getElementsByTagName("content")[0].textContent,
				id: id,
				thumbnail: "https://i1.ytimg.com/vi/" + id + "/mqdefault.jpg",
				time: new Date(rv[i].getElementsByTagName("published")[0].textContent),
				title: rv[i].getElementsByTagName("title")[0].textContent,
				url: "http://www.youtube.com/watch?v=" + id,
				video: "https://www.youtube-nocookie.com/embed/" + id,
			});
		};
		return videos;
	},

	updateChannels: function() {
		ch = document.getElementsByClassName("ut_channel");
		for (i = 0; i < ch.length; i++) {
			ch[i].remove();
		};
		ch = utube.chan.getAll();

		var chanBox = document.getElementsByClassName("ut_channelbox")[0];
		for (i = 0; i < ch.length; i++) {
			var icon = ch[i].icon;
			var name = ch[i].name;
			var url = ch[i].url;
			var chanElem = document.createElement("div");
			chanElem.classList.add("ut_channel");
			chanElem.innerHTML = '\
				<a href="' + url + '" target="_blank" title="' + name + '">\
					<div class="ut_channel_head">\
					<img src="' + icon + '" />\
						<h3>' + name + '</h3>\
					</div>\
				</a>\
				<div class="ut_channel_videos"></div>\
			';
			chanBox.appendChild(chanElem);
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
		}, 20);
		document.getElementsByTagName("body")[0].appendChild(ov);
		wr.style.width = contentElem.clientWidth + "px";
	},

	removeOverlay: function(contentElem) {
		ov = document.getElementsByClassName("ut_overlay");
		if (ov.length > 0) {
			ov = ov[0]
			ov.style.opacity = "0";
			setTimeout(function(){
				ov.remove();
			}, 300);
		}
	},

	inform: function(text) {
		_message(text, "ut_msg_info");
	},

	error: function(text) {
		_message(text, "ut_msg_err");
	},

	onload: function() {
		utube.updateChannels();

		// document.getElementsByClassName("ut_channelbox")[0].onclick = function() {
		// 		var d = document.createElement("div");
		// 		d.style.width = d.style.height = "500px";
		// 		utube.showOverlay(d);
		// };
	}

}}();

utube.setTheme("dusk.css");

// utube.conf.reset();
utube.chan.add("Numberphile");
utube.chan.add("LuminosityEvents");
// utube.chan.add("achannelthatdoesnotexist");
