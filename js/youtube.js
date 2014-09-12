/*
 *  Copyright (c) 2013 PolyFloyd
 */

'use strict';

function getJSON(url, cb) {
  var req = new XMLHttpRequest();
  req.onreadystatechange = function() {
    if (req.readyState !== XMLHttpRequest.DONE) return;
    var data = null;
    try {
      data = JSON.parse(req.responseText);
    } catch(err) {
      cb(err, null);
      return;
    }
    cb(null, data);
  };
  req.open('GET', url, true);
  req.send();
};

function inherit(sup, sub) {
  for (var k in sup.prototype) sub.prototype[k] = sup.prototype[k];
  return sub;
}

var GenericAPI = {
  Channel: function() {},
  Video:   function() {},
};

GenericAPI.Channel.prototype.getLink = function() {
  var url;
  if (this.id.match(/^[a-zA-Z0-9]{1,20}$/)) {
    url = 'https://www.youtube.com/user/{{ id }}/featured';
  } else {
    url = 'https://www.youtube.com/channel/{{ id }}/featured';
  }
  return url.template({
    id: this.id,
  });
};

GenericAPI.Video.prototype.getThumb = function(type) {
  type = type || 'def';
  return 'https://i1.ytimg.com/vi/{{ id }}/{{ type }}.jpg'.template({
    id:   this.id,
    type: {
      def: 'mqdefault',
      max: 'maxresdefault',
    }[type],
  });
};

GenericAPI.Video.prototype.getLink = function(options) {
  return 'http://www.youtube.com/watch?v={{ id }}&html5={{ html5 }}'.template({
    html5: options.html5 ? '1' : '0',
    id:    this.id,
  });
};

GenericAPI.Video.prototype.getEmbedLink = function(options) {
  return 'https://www.youtube-nocookie.com/embed/{{ id }}?autoplay={{ autoplay }}&html5={{ html5 }}'.template({
    autoplay: options.autoplay ? '1' : '0',
    html5:    options.html5    ? '1' : '0',
    id:       this.id,
  });
};

var YouTubeAPI2 = {};

YouTubeAPI2.Channel = inherit(GenericAPI.Channel, function(options) {
  this.icon  = options.icon;
  this.id    = options.id;
  this.title = options.title;
});

YouTubeAPI2.Video = inherit(GenericAPI.Video, function(options) {
  this.description = options.description;
  this.duration    = options.duration;
  this.id          = options.id;
  this.published   = options.published;
  this.title       = options.title;
});

YouTubeAPI2.Channel.prototype.getVideos = function(offset, limit, cb) {
  var url = 'https://gdata.youtube.com/feeds/api/users/{{ id }}/uploads?alt=json&orderby=published&start-index={{ offset }}&max-results={{ limit }}';
  getJSON(url.template({
    id:     this.id,
    limit:  limit,
    offset: offset + 1,
  }), function(err, data) {
    if (err) {
      cb(err, null);
      return;
    }
    data.feed.entry = data.feed.entry || [];
    var videos = data.feed.entry.map(function(video) {
      return new YouTubeAPI2.Video({
        description: video.media$group.media$description.$t,
        duration:    parseInt(video.media$group.yt$duration.seconds, 10),
        id:          function(id) {
          return id.substring(id.lastIndexOf('/') + 1, id.length);
        }(video.id.$t),
        published:   new Date(video.published.$t),
        title:       video.title.$t,
      });
    });
    cb(err, err ? null : videos);
  });
};

YouTubeAPI2.getChannelByID = function(id, cb) {
  var url = 'https://gdata.youtube.com/feeds/api/users/{{ id }}?alt=json';
  getJSON(url.template({ id: id }), function(err, data) {
    cb(err, err ? null : new YouTubeAPI2.Channel({
      icon:  data.entry.media$thumbnail.url,
      id:    id,
      title: data.entry.title.$t,
    }));
  });
};
