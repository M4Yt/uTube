/*
 *  Copyright (c) 2013 PolyFloyd
 */

'use strict';

function getJSON(url, cb) {
  var req = new XMLHttpRequest();
  req.onreadystatechange = function() {
    if (req.readyState !== XMLHttpRequest.DONE) return;
    try {
      cb(null, JSON.parse(req.responseText));
    } catch(err) {
      cb(err, null);
    }
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
  return 'https://www.youtube.com/user/{{ id }}/featured'.template({
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

var YouTubeAPI2 = function() {};

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

YouTubeAPI2.prototype.getChannelByID = function(id, cb) {
  var url = 'https://gdata.youtube.com/feeds/api/users/{{ id }}?alt=json';
  getJSON(url.template({ id: id }), function(err, data) {
    cb(err, err ? null : new YouTubeAPI2.Channel({
      id:    id,
      icon:  data.entry.media$thumbnail.url,
      title: data.entry.title.$t,
    }));
  });
};
