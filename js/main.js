Array.prototype.remove = function(what) {
	while ((i = this.indexOf(what)) !== -1) {
		this.splice(i, 1);
	}
    return this;
};

Storage.prototype.setObject = function(key, value) {
    this.setItem(key, JSON.stringify(value));
}
 
Storage.prototype.getObject = function(key) {
    return JSON.parse(this.getItem(key));
}

var utube = {

	channels: {

		getAll: function() {
			return localStorage.getObject("channels") || [];
		},

		store: function(channels) {
			return localStorage.setObject("channels", channels);
		},

		exists: function(channelName) {
			return localStorage.getObject("channels").indexOf(channelName) !== -1;
		},

		add: function(channelName)
		{
			var isNew = !utube.channels.exists(channelName);
			if (isNew) {
				var channels = utube.channels.getAll();
				channels.push(channelName);
				utube.channels.store(channels);
			}
			return isNew;
		},

		remove: function(channelName) {
			var channels = utube.channels.getAll();
			channels.remove(channelName);
			utube.channels.store(channels);
		}

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
	}

};
