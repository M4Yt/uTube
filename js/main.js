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

Date.prototype.format = function(fmt) {
  function pad(n, minLength) {
    var str = ''+n;
    for (; str.length < minLength; str = '0'+str);
    return str;
  }
  fmt = fmt.replace('%ms', this.getMilliseconds());
  fmt = fmt.replace('%s', this.getSeconds());
  fmt = fmt.replace('%m', pad(this.getMinutes(), 2));
  fmt = fmt.replace('%h', pad(this.getHours(), 2));
  fmt = fmt.replace('%d', this.getDate());
  fmt = fmt.replace('%M', this.getMonth() + 1);
  fmt = fmt.replace('%Y', this.getFullYear());
  return fmt;
};

String.prototype.template = function(args) {
  var str = this;
  for (var k in args) {
    str = str.replace(new RegExp('\\{\\{ '+k+' \\}\\}', 'g'), args[k]);
  }
  return str;
};

Array.prototype.remove = function(what) {
  var i;
  while ((i = this.indexOf(what)) !== -1) {
    this.splice(i, 1);
  }
  return this;
};

Node.prototype.remove = Node.prototype.remove || function() {
  this.parentNode.removeChild(this);
};

Node.prototype.removeAll = function() {
  while (this.hasChildNodes()) {
    this.removeChild(this.lastChild);
  }
};

HTMLCollection.prototype.toArray = function() {
  return Array.prototype.slice.call(this);
};

EventTarget.prototype.addMousewheel = function(listener) {
  this.addEventListener('mousewheel',     listener, false);
  this.addEventListener('DOMMouseScroll', listener, false);
};

EventTarget.prototype.removeMousewheel = function(listener) {
  this.removeEventListener('mousewheel',     listener, false);
  this.removeEventListener('DOMMouseScroll', listener, false);
};

// Meh, who needs jQuery anyway?
window.$ = function() {
  return document.querySelector.apply(document, arguments);
};

var VERSION = '2.0.2';

var utube = {

  conf: {

    onchange: {},

    reset: function(source) {
      source = source || utube.conf.standard;
      localStorage.clear();
      for (var key in source) {
        utube.conf.set(key, source[key], true);
      }
      window.location.reload(false);
    },

    get: function(key) {
      try {
        return JSON.parse(localStorage.getItem(key));
      } catch (err) {
        return null;
      }
    },

    set: function(key, value, noapply) {
      localStorage.setItem(key, JSON.stringify(value));
      if (!noapply && utube.conf.onchange[key]) utube.conf.fireChanged(key, value);
    },

    fireChanged: function(key, value) {
      if (typeof value === 'undefined') value = utube.conf.get(key);
      utube.conf.onchange[key](value);
    },

    exportAll: function() {
      var temp = {};
      for (var k in utube.conf.standard) {
        temp[k] = utube.conf.get(k);
      }
      return JSON.stringify(temp);
    },

    importAll: function(data) {
      if (!data) return true;
      try {
        utube.conf.reset(JSON.parse(data));
        return true;
      } catch (err) {
        return false;
      }
    },

    standard: {
      althscroll:     true,
      api:            'YouTubeAPI2',
      apiyt3key:      '',
      apiyt3url:      'https://www.googleapis.com/youtube/v3/',
      autoplay:       true,
      channels:       [],
      chanorder:      'VIDDATE',
      loadincrement:  6,
      markwatched:    true,
      onvidclick:     'EMBED',
      playback:       'HTML5',
      theme:          'dusk.css',
      transitions:    true,
      version:        VERSION,
    },

    themes: [
      {
        name:   'Dusk',
        source: 'dusk.css',
      },
      {
        name:   'New Horizons',
        source: 'newhorizons.css',
      },
      {
        name:   'Oh Es Icks',
        source: 'ohesicks.css',
      },
      {
        name:   'Material',
        source: 'material/theme.css',
      }
    ],

  },

  chan: {

    getAll: function() {
      return utube.conf.get('channels').map(function(chan) {
          return new utube.yt.Channel(chan);
      });
    },

    exists: function(channel) {
      return utube.chan.getAll().some(function(chan) {
        return chan.id === channel.id;
      });
    },

    add: function(channel, cb) {
      if (utube.chan.exists(channel)) {
        cb(new Error(channel.title+' is already added'));
        return;
      }
      var channels = utube.chan.getAll();
      channels.push(channel);
      channels.sort(function(a, b) {
        return a.title > b.title;
      });
      utube.conf.set('channels', channels);
      cb(null);
    },

    remove: function(channel) {
      utube.conf.set('channels', utube.chan.getAll().filter(function(chan) {
        return chan.id !== channel.id;
      }));
    },

  },

  showConfigMenu: function() {
    var menu = document.createElement('div');
    menu.classList.add('ut_configmenu');
    menu.style.width = '500px';
    menu.innerHTML = $('#ut_configmenu_content').innerHTML.template({
      version: VERSION,
    });
    utube.showOverlay(menu);
    var themeSelect = menu.querySelector('select');
    utube.conf.themes.forEach(function(theme) {
      var op = document.createElement('option');
      op.value     = theme.source;
      op.innerHTML = theme.name;
      themeSelect.appendChild(op);
    });
    menu.getElementsByTagName('input').toArray().forEach(function(input) {
      switch (input.type) {
        case 'text':
          input.value = utube.conf.get(input.name);
          input.setAttribute('onchange', 'utube.conf.set(this.name, this.value)');
          break;
        case 'number':
          input.value = utube.conf.get(input.name);
          input.setAttribute('onchange', 'utube.conf.set(this.name, parseInt(this.value))');
          break;
        case 'checkbox':
          if (utube.conf.get(input.name)) {
            input.checked = 'checked';
          }
          input.setAttribute('onclick', 'utube.conf.set(this.name, !!this.checked)');
          break;
        case 'radio':
          if (utube.conf.get(input.name) == input.value) {
            input.checked = 'checked';
          }
          input.setAttribute('onchange', 'utube.conf.set(this.name, this.value)');
          break;
      }
    });
    menu.getElementsByTagName('select').toArray().forEach(function(select) {
      select.setAttribute('onchange', 'utube.conf.set(this.name, this.value)');
      var value =  utube.conf.get(select.name);
      for (var j = select.childNodes.length - 1; j >= 0; j--) {
        var op = select.childNodes[j];
        if (op.value == value) {
          op.setAttribute('selected', 'selected');
          break;
        }
      }
    });
  },

  showChannelMenu: function() {
    var menu = document.createElement('div');
    menu.style.width = '500px';
    menu.classList.add('ut_channelmenu');
    menu.innerHTML = $('#ut_channelmenu_content').innerHTML;
    var list = menu.querySelector('.ut_channelmenu_list');
    list.style.height = (document.documentElement.clientHeight - 200)+'px';
    utube.showOverlay(menu);
    utube.updateChannelMenu();
  },

  updateChannelMenu: function() {
    var itemTemplate = $('#ut_channelmenu_item').innerHTML;
    $('.ut_channelmenu_list').innerHTML = utube.chan.getAll().reduce(function(prev, channel) {
      return prev+itemTemplate.template(channel);
    }, '');
  },

  addChannelByForm: function() {
    var inputElem = $('.ut_addchannel_txt');
    var oldErr    = $('.ut_chanconf_err');
    if (oldErr) oldErr.remove();

    function error(err) {
      var errElem = document.createElement('h6');
      errElem.classList.add('ut_chanconf_err');
      errElem.innerHTML = err.message;
      inputElem.parentNode.appendChild(errElem);
    }

    var string = [
      /^([a-zA-Z0-9]{1,20})$/,
      /^([a-zA-Z0-9_-]{24})$/,
      /^https?:\/\/www\.youtube\.com\/user\/([a-zA-Z0-9]{1,20}).*/,
      /^https?:\/\/www\.youtube\.com\/channel\/([a-zA-Z0-9_-]{24}).*/,
    ].reduce(function(prev, regex) {
      var m = inputElem.value.match(regex);
      return prev || (m ? m[1] : null);
    }, null);
    if (!string) {
      error(new Error('No valid channel identifier not found in input'));
      return;
    }

    utube.yt.getChannelByID(string, function(err, channel) {
      if (err) {
        error(err);
        return;
      }
      if (!channel) {
        error(new Error('Channel not found'));
        return;
      }
      utube.chan.add(channel, function(err) {
        if (err) {
          error(err);
          return;
        }
        utube.updateChannelMenu();
        utube.updateChannels();
      });
    });
  },

  removeChannelByForm: function(id) {
    utube.chan.remove(new utube.yt.Channel({ id: id }));
    utube.updateChannels();
  },

  insertVideos: function(channelID, next, limit, vidListElem, cb) {
    utube.chan.getAll().filter(function(chan) {
      return chan.id === channelID;
    })[0].getVideos(next, limit, function(err, result) {
      if (err) {
        var errElem = document.createElement('p');
        errElem.innerHTML = err.message;
        vidListElem.appendChild(errElem);
        console.error(err);
        cb()
        return;
      }
      result.videos.forEach(function(video) {
        var vidElem = document.createElement('div');
        vidElem.id = 'vid_'+video.id;
        vidElem.classList.add('ut_list_video');
        if (utube.hasWatched(video.id)) {
          vidElem.classList.add('ut_video_watched');
        }
        vidElem.setAttribute('onclick', 'utube.playVideo(\''+video.id+'\')');
        vidElem.title = video.title+'\n'+video.description;
        var timeFormat = video.published.getTime() > (new Date().getTime() - 1000 * 60 * 60 * 24)
          ? '%h:%m' : '%d-%M-%Y';
        vidElem.innerHTML = (
          '<p class="ut_video_title">{{ title }}</p>'+
          '<p class="ut_video_time">{{ time }}</p>'+
          '<p class="ut_video_duration">{{ duration }}</p>'+
          '<img src="{{ thumb }}" />'
        ).template({
          duration: utube.timeString(video.duration),
          thumb:    video.getThumb(),
          time:     video.published.format(timeFormat),
          title:    video.title,
        });
        vidListElem.appendChild(vidElem);
      });
      if (!next) {
        var mostRecent = result.videos[0] || { published: new Date(0) };
        vidListElem.parentNode.setAttribute('data-mostrecent', mostRecent.published.getTime());
      }
      vidListElem.setAttribute('data-nextpage', result.next);
      cb();
    });
  },

  updateChannels: function() {
    var channels = utube.chan.getAll();
    utube.selectorX = utube.selectorY = 0;
    utube.selectorYSave = [];
    utube.chan.count = channels.length;
    var chanBox = $('.ut_channelbox');
    chanBox.removeAll();
    channels.forEach(function(channel) {
      var chanElem = document.createElement('div');
      var vidListElem = document.createElement('div');
      vidListElem.classList.add('ut_channel_videos');
      vidListElem.setAttribute('data-channelid', channel.id);
      vidListElem.addMousewheel(utube.scrollVideos);
      chanElem.classList.add('ut_channel');
      chanElem.innerHTML = (
        '<a href="{{ url }}" target="_blank" title="{{ title }}">'+
          '<div class="ut_channel_head">'+
            '<img src="{{ icon }}" />'+
            '<h3>{{ title }}</h3>'+
          '</div>'+
        '</a>'
      ).template({
        icon:  channel.icon,
        title: channel.title,
        url:   channel.getLink(),
      });
      chanElem.appendChild(vidListElem);
      chanBox.appendChild(chanElem);
      var increment = utube.conf.get('loadincrement');
      utube.insertVideos(channel.id, null, increment, vidListElem, function() {
        if (utube.conf.get('chanorder') === 'VIDDATE') {
          document.getElementsByClassName('ut_channel').toArray().sort(function(a, b) {
            var ta = parseInt(a.getAttribute('data-mostrecent'), 10);
            var tb = parseInt(b.getAttribute('data-mostrecent'), 10);
            return ta < tb;
          }).forEach(function(channel) {
            channel.parentNode.appendChild(channel);
          });
        }
      });
    });
  },

  playVideo: function(id) {
    var video = new utube.yt.Video({ id: id });
    function getEmbeddedVideo() {
      return video.getEmbedLink({
        autoplay: utube.conf.get('autoplay'),
        html5:    utube.conf.get('playback') === 'HTML5',
      });
    }
    switch (utube.conf.get('onvidclick')) {
      case 'EMBED':
        var embedElem = document.createElement('iframe');
        embedElem.classList.add('ut_embedvideo');
        embedElem.src = getEmbeddedVideo();
        embedElem.setAttribute('allowfullscreen', 'allowfullscreen');
        var height = window.innerHeight - 100;
        var width  = window.innerWidth  - 100;
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
      case 'EMBEDINTAB':
        window.open(getEmbeddedVideo());
        break;
      case 'OPENYT':
        window.open(video.getLink({
          html5: utube.conf.get('playback') === 'HTML5',
        }));
        break;
    }
    if (utube.conf.get('markwatched')) {
      utube.markAsWatched(video.id);
    }
  },

  markAsWatched: function(id) {
    utube.conf.set('watched_'+id, true);
    $('#vid_'+id).classList.add('ut_video_watched');
  },

  hasWatched: function(id) {
    return utube.conf.get('watched_'+id);
  },

  unwatchAll: function() {
    for (var k in localStorage) {
      if (k.indexOf('watched_') === 0) {
        localStorage.removeItem(k);
      }
    }
    document.getElementsByClassName('ut_video_watched').toArray().forEach(function(v) {
      v.classList.remove('ut_video_watched');
    });
  },

  isOverlayOpen: function() {
    return !!$('.ut_overlay');
  },

  showOverlay: function(contentElem) {
    if (utube.isOverlayOpen()) return false;
    var ov = document.createElement('table');
    var tr = document.createElement('tr');
    var td = document.createElement('td');
    var wr = document.createElement('div');
    wr.classList.add('ut_overlay_wrapper');
    contentElem.classList.add('ut_overlay_content');
    contentElem.onclick = function(e) { e.stopPropagation(); };
    wr.appendChild(contentElem);
    td.appendChild(wr);
    tr.appendChild(td);
    ov.appendChild(tr);
    ov.classList.add('ut_overlay');
    ov.style.opacity = '0';
    td.onclick = utube.removeOverlay;
    contentElem.getElementsByTagName('input').toArray().forEach(function(input) {
      if (input.type === 'text') {
        input.setAttribute('onfocus', 'utube.keysEnabled=false');
        input.setAttribute('onblur', 'utube.keysEnabled=true');
      }
    });
    setTimeout(function() {
      ov.style.opacity = '1';
    }, utube.conf.get('transitions') ? 20 : 0);
    var body = $('body');
    body.insertBefore(ov, body.childNodes[1]);
    wr.style.width = contentElem.clientWidth+'px';
  },

  removeOverlay: function() {
    var ov = $('.ut_overlay');
    if (ov) {
      ov.style.opacity = '0';
      setTimeout(function() {
        ov.remove();
      }, utube.conf.get('transitions') ? 300 : 0);
    }
  },

  loadVideos: function(vidList) {
    if (!vidList.classList.contains('ut_loading')) {
      vidList.classList.add('ut_loading');
      var increment = utube.conf.get('loadincrement')
      var next      = vidList.getAttribute('data-nextpage');
      utube.insertVideos(vidList.getAttribute('data-channelid'), next, increment, vidList, function() {
        vidList.classList.remove('ut_loading');
      });
    }
  },

  scrollVideos: function(e) {
    var n = e.target;
    for (; n && !n.classList.contains('ut_channel_videos'); n = n.parentNode);
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
    var s = '';
    var hasHours = seconds > 3600;
    if (hasHours) {
      s += Math.round(seconds / 3600)+':';
      seconds %= 3600;
    }
    var min = Math.round(seconds / 60 - 0.5);
    if (min < 10 && hasHours) {
      s += '0';
    }
    s += min+':';
    var sec = seconds % 60;
    if (sec < 10) {
      s += '0';
    }
    return s + sec;
  },

  updateSelector: function() {
    var old = $('.ut_list_video.ut_selected');
    if (old) {
      old.classList.remove('ut_selected');
    }
    var vid = utube.getSelectedVideo();
    vid.classList.add('ut_selected');
    vid.scrollIntoView(false);
    if (vid == old) {
      utube.loadVideos(vid.parentNode);
    }
  },

  playSelectedVideo: function() {
    if (!utube.isOverlayOpen()) {
      utube.getSelectedVideo().onclick();
    }
  },

  getSelectedChannel: function() {
    var cbox = $('.ut_channelbox');
    return cbox.childNodes[utube.selectorX];
  },

  getSelectedVideo: function() {
    var chan = utube.getSelectedChannel();
    if (chan) {
      var list = chan.querySelector('.ut_channel_videos');
      return list.childNodes[utube.selectorY];
    }
    return null;
  },

  selectorMoveUp: function() {
    if (utube.selectorY > 0 && !utube.isOverlayOpen()) {
      utube.selectorY--;
      utube.updateSelector();
    }
  },

  selectorMoveDown: function() {
    if (!utube.isOverlayOpen()) {
      var vidcount = utube.getSelectedChannel().getElementsByClassName('ut_list_video').length;
      if (utube.selectorY < vidcount - 1) {
        utube.selectorY++;
      }
      utube.updateSelector();
    }
  },

  selectorMoveLeft: function() {
    if (utube.selectorX > 0 && !utube.isOverlayOpen()) {
      utube.selectorYSave[utube.selectorX] = utube.selectorY;
      utube.selectorX--;
      utube.selectorY = utube.selectorYSave[utube.selectorX] || 0;
      utube.updateSelector();
    }
  },

  selectorMoveRight: function() {
    if (utube.selectorX < utube.chan.count - 1 && !utube.isOverlayOpen()) {
      utube.selectorYSave[utube.selectorX] = utube.selectorY;
      utube.selectorX++;
      utube.selectorY = utube.selectorYSave[utube.selectorX] || 0;
      utube.updateSelector();
    }
  },

  addKey: function(key, callback) {
    utube.keybindings[key] = callback;
  },

  alternativeHorizontalScroll: function(e) {
    $('.ut_channelbox').scrollLeft -= e.wheelDelta / 2 || -e.detail * 20;
  },

  init: function() {
    if (!utube.conf.get('version')) {
      utube.conf.reset();
      return;
    }
    document.addEventListener('keydown', function(e) {
      var func = utube.keybindings[e.keyCode];
      if (func && utube.keysEnabled) func(e);
    }, false);
    utube.keybindings = {};
    utube.keysEnabled = true;
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
    utube.conf.onchange.chanorder   = utube.updateChannels;
    utube.conf.onchange.theme       = function() {
      $('.ut_theme').setAttribute('href', 'css/theme/'+utube.conf.get('theme'));
    };
    utube.conf.onchange.althscroll = function(enable) {
      if (enable) {
        $('.ut_channelbox').addMousewheel(utube.alternativeHorizontalScroll);
        $('.ut_cbar').addMousewheel(utube.alternativeHorizontalScroll);
      } else {
        $('.ut_channelbox').removeMousewheel(utube.alternativeHorizontalScroll);
        $('.ut_cbar').removeMousewheel(utube.alternativeHorizontalScroll);
      }
    };
    utube.conf.onchange.transitions = function(enable) {
      var style = $('#disabletransitions');
      if (!enable && !style) {
        style = document.createElement('style');
        style.id = 'disabletransitions';
        style.setAttribute('type', 'text/css');
        style.innerHTML = '*{transition:none !important;}';
        $('head').appendChild(style);
      } else if (style) {
        style.remove();
      }
    };
    utube.conf.onchange.api         = function(api) {
      utube.yt = {
        YouTubeAPI2: YouTubeAPI2,
        YouTubeAPI3: YouTubeAPI3,
      }[api];
      if (api === 'YouTubeAPI3') {
        utube.conf.fireChanged('apiyt3key');
        utube.conf.fireChanged('apiyt3url');
        utube.chan.getAll().filter(function(channel) {
          return !channel.uploads;
        }).forEach(function(channel) {
          utube.yt.getChannelByID(channel.id, function(err, newChannel) {
            if (!err && newChannel) {
              utube.chan.remove(channel);
              utube.chan.add(newChannel, function() {});
            }
          });
        });
      }
    };
    utube.conf.onchange.apiyt3key   = function(key) {
      YouTubeAPI3.key = key;
    };
    utube.conf.onchange.apiyt3url   = function(url) {
      YouTubeAPI3.url = url;
    };
    [
      'api',
      'althscroll',
      'transitions',
      'theme',
    ].forEach(function(k) { utube.conf.fireChanged(k); });
    utube.updateChannels();
  },

};
