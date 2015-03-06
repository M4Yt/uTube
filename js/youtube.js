/**
 *  uTube, Tube without the Google
 *  Copyright (C) 2013-2015  The uTube authors
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
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

GenericAPI.Channel.prototype.idIsID = function() {
  return !!this.id.match(/^[a-zA-Z0-9_-]{24}$/);
};


GenericAPI.Channel.prototype.getLink = function() {
  var url = 'https://www.youtube.com/{{ selector }}/{{ id }}/featured';
  return url.template({
    id:       this.id,
    selector: this.idIsID() ? 'channel' : 'user',
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

YouTubeAPI2.Channel.prototype.getVideos = function(next, limit, cb) {
  var url = 'https://gdata.youtube.com/feeds/api/users/{{ id }}/uploads?alt=json&orderby=published&start-index={{ offset }}&max-results={{ limit }}';
  var offset = next ? parseInt(next, 10) + 1 : 1;
  getJSON(url.template({
    id:     this.id,
    limit:  limit,
    offset: offset,
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
    cb(err, err ? null : {
      next:   offset + limit - 1,
      videos: videos,
    });
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

var YouTubeAPI3 = {};

YouTubeAPI3.key = '';
YouTubeAPI3.url = '';

YouTubeAPI3.Channel = inherit(GenericAPI.Channel, function(options) {
  this.icon    = options.icon;
  this.id      = options.id;
  this.title   = options.title;
  this.uploads = options.uploads;
});

YouTubeAPI3.Video = inherit(GenericAPI.Video, function(options) {
  this.description = options.description;
  this.duration    = options.duration;
  this.id          = options.id;
  this.published   = options.published;
  this.title       = options.title;
});

YouTubeAPI3.Channel.prototype.getVideos = function(next, limit, cb) {
  var url = '{{ root }}playlistItems?part=id%2Csnippet&maxResults={{ limit }}&pageToken={{ next }}&playlistId={{ id }}&key={{ key }}';
  getJSON(url.template({
    id:    this.uploads,
    key:   YouTubeAPI3.key,
    limit: limit,
    next:  next || '',
    root:  YouTubeAPI3.url,
  }), function(err, data) {
    if (err) {
      cb(err, null);
      return;
    }
    var videos = data.items.map(function(video) {
      return new YouTubeAPI3.Video({
        description: video.snippet.description,
        duration:    0, // TODO
        id:          video.snippet.resourceId.videoId,
        published:   new Date(video.snippet.publishedAt),
        title:       video.snippet.title,
      });
    });
    cb(err, err ? null : {
      next:   data.nextPageToken,
      videos: videos,
    });
  });
};

YouTubeAPI3.getChannelByID = function(id, cb) {
  var url = '{{ root }}channels?part=id%2Csnippet%2CcontentDetails&{{ selector }}={{ id }}&key={{ key }}';
  getJSON(url.template({
    id:       id,
    key:      YouTubeAPI3.key,
    root:     YouTubeAPI3.url,
    selector: GenericAPI.Channel.prototype.idIsID.call({ id: id }, {}) ? 'id' : 'forUsername',
  }), function(err, data) {
    if (!data.items[0]) {
      cb(null, null)
      return;
    }
    cb(err, err ? null : new YouTubeAPI3.Channel({
      icon:    data.items[0].snippet.thumbnails.default.url,
      id:      data.items[0].id,
      title:   data.items[0].snippet.title,
      uploads: data.items[0].contentDetails.relatedPlaylists.uploads,
    }));
  });
};
