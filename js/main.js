/*
 *  Copyright (c) 2013 PolyFloyd
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

Node.prototype.remove = Element.prototype.remove || function() {
  this.parentNode.removeChild(this);
};

Node.prototype.removeAll = function() {
  while (this.hasChildNodes()) {
    this.removeChild(this.lastChild);
  }
};

EventTarget.prototype.addMousewheel = function(callback) {
  this.addEventListener('mousewheel', callback, false);
  this.addEventListener('DOMMouseScroll', callback, false);
};

Storage.prototype.setObject = function(key, value) {
  this.setItem(key, JSON.stringify(value));
};

Storage.prototype.getObject = function(key) {
  return JSON.parse(this.getItem(key));
};

// Meh, who needs jQuery anyway?
window.$ = function() {
  return document.querySelector.apply(document, arguments);
};

var utube = {

  chan: {

    getAll: function() {
      return (localStorage.getObject('channels') || []).map(function(chan) {
          return new utube.yt.Channel(chan);
      });
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

    add: function(channelName, cb) {
      var isNew = !utube.chan.exists(channelName);
      if (isNew) {
        var channels = utube.chan.getAll();
        utube.yt.getChannelByID(channelName, function(err, channel) {
          if (err) {
            cb(err);
            return;
          }
          channels.push(channel);
          channels.sort(function(a, b) {
            return a.name > b.name ? 1 : -1;
          });
          localStorage.setObject('channels', channels);
          cb(null);
        });
      } else {
        cb(new Error(channelName+' is already added'));
      }
    },

    remove: function(channelName) {
      var channels = utube.chan.getAll();
      channels = channels.filter(function(chan) {
        return chan.name !== channelName;
      });
      localStorage.setObject('channels', channels);
    }

  },

  conf: {

    reset: function(source) {
      source = source || utube.conf.standard;
      localStorage.clear();
      for (var key in source) {
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
        case 'channels':
          break;
        case 'chanorder':
          utube.updateChannels();
          break;
        case 'theme':
          utube.reloadTheme();
          break;
        case 'transitions':
          utube.updateTransitionRule(value == 'true');
          break;
        }
      }
    },

    exportAll: function() {
      var temp = {};
      for (var key in localStorage) {
        if (key.indexOf('watched_') === 0) {
          continue;
        }
        temp[key] = localStorage[key];
      }
      return JSON.stringify(temp);
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

      autoplay: true,

      channels: '[]',

      chanorder: 'VIDDATE',

      markwatched: true,

      nativequeryurl: 'http://localhost/uTube/videoinfo.php?id=%ID',

      nativevideo: false,

      onvidclick: 'EMBED',

      theme: 'dusk.css',

      transitions: true,

      loadincrement: 6,

    },

    themes: [
      {
        source: 'dusk.css',
        name: 'Dusk',
      },
      {
        source: 'newhorizons.css',
        name: 'New Horizons',
      },
      {
        source: 'ohesicks.css',
        name: 'Oh Es Icks',
      }
    ]

  },

  showConfigMenu: function() {
    var menu = document.createElement('div');
    menu.classList.add('ut_configmenu');
    menu.style.width = '500px';
    menu.innerHTML = $('#ut_configmenu_content').innerHTML;
    utube.showOverlay(menu);
    var themeSelect = menu.querySelector('select');
    for (var i = 0; i < utube.conf.themes.length; i++) {
      var op = document.createElement('option');
      var theme = utube.conf.themes[i];
      op.value = theme.source;
      op.innerHTML = theme.name;
      themeSelect.appendChild(op);
    }
    var inputElems = menu.getElementsByTagName('input');
    for (var i = 0; i < inputElems.length; i++) {
      var input = inputElems[i];
      switch (input.type) {
        case 'number':
        case 'text':
          input.value = utube.conf.get(input.name);
          input.setAttribute('onchange', 'utube.conf.set(this.name, this.value)');
          break;
        case 'checkbox':
          if (utube.conf.get(input.name) == 'true') {
            input.checked = 'checked';
          }
          input.setAttribute('onclick', 'utube.conf.set(this.name, this.checked)');
          break;
        case 'radio':
          if (utube.conf.get(input.name) == input.value) {
            input.checked = 'checked';
          }
          input.setAttribute('onchange', 'utube.conf.set(this.name, this.value)');
          break;
      }
    }
    var selectElems = menu.getElementsByTagName('select');
    for (var i = 0; i < selectElems.length; i++) {
      var select = selectElems[i];
      select.setAttribute('onchange', 'utube.conf.set(this.name, this.value)');
      var value =  utube.conf.get(select.name);
      for (var j = select.childNodes.length - 1; j >= 0; j--) {
        var op = select.childNodes[j];
        if (op.value == value) {
          op.setAttribute('selected', 'selected');
          break;
        }
      }
    }
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
    var list = $('.ut_channelmenu_list');
    list.removeAll();
    var channels = utube.chan.getAll();
    var itemTemplate = $('#ut_channelmenu_item').innerHTML;
    for (var i = 0; i < channels.length; i++) {
      var c = channels[i];
      list.innerHTML += itemTemplate.template({
        icon:  c.icon,
        name:  c.name,
        title: c.title,
      });
    }
  },

  updateTransitionRule: function(enable) {
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
  },

  addChannelByForm: function() {
    var inputElem = $('.ut_addchannel_txt');
    var oldErr = $('.ut_chanconf_err');
    if (oldErr) oldErr.remove();
    utube.chan.add(inputElem.value, function(err) {
      if (err) {
        var errElem = document.createElement('h6');
        errElem.classList.add('ut_chanconf_err');
        errElem.innerHTML = err;
        inputElem.parentNode.appendChild(errElem);
      } else {
        utube.updateChannelMenu();
        utube.updateChannels();
      }
    });
  },

  removeChannelByForm: function(name) {
    utube.chan.remove(name);
    utube.updateChannels();
  },

  reloadTheme: function() {
    $('.ut_theme').setAttribute('href', 'css/theme/'+utube.conf.get('theme'));
  },

  insertVideos: function(channelName, offset, limit, vidListElem, cb) {
    var channel = utube.chan.getAll().filter(function(chan) {
      return chan.name === channelName;
    })[0];
    channel.getVideos(offset, limit, function(err, videos) {
      if (err) {
        var errElem = document.createElement('p');
        errElem.innerHTML = err.message;
        vidListElem.appendChild(errElem);
        console.error(err);
        cb()
        return;
      }
      videos.forEach(function(video) {
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
      if (offset === 0) {
        var mostRecent = videos[0] || { published: new Date(0) };
        vidListElem.parentNode.setAttribute('data-mostrecent', mostRecent.published.getTime());
      }
      var vidCount = parseInt(vidListElem.getAttribute('data-vidcount'), 10);
      vidListElem.setAttribute('data-vidcount', vidCount + limit);
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
      vidListElem.setAttribute('data-channelname', channel.name);
      vidListElem.setAttribute('data-vidcount', 0);
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
      utube.insertVideos(channel.name, 0, parseInt(utube.conf.get('loadincrement'), 10), vidListElem, function() {
        if (utube.conf.get('chanorder') === 'VIDDATE') {
          var channels = Array.prototype.slice.call(document.getElementsByClassName('ut_channel'));
          channels.sort(function(a, b) {
            var ta = parseInt(a.getAttribute('data-mostrecent'), 10);
            var tb = parseInt(b.getAttribute('data-mostrecent'), 10);
            return ta < tb ? 1 : -1;
          });
          channels.forEach(function(channel) {
            channel.parentNode.appendChild(channel);
          });
        }
      });
    });
  },

  playVideo: function(id) {
    var video = new utube.yt.Video({ id: id });
    function getNativeVideo() {
      var embedElem = document.createElement('video');
      embedElem.controls = 'controls';
      if (utube.conf.get('autoplay') == 'true') {
        embedElem.autoplay = 'autoplay';
      }
      embedElem.poster = video.getThumb('max');
      var vidList = viewtube.ytVideoList(utube.conf.get('nativequeryurl').replace('%ID', video.id));
      for (var mime in vidList) {
        var sourceElem = document.createElement('source');
        sourceElem.src = vidList[mime];
        sourceElem.type = mime;
        embedElem.appendChild(sourceElem);
      }
      return embedElem;
    }
    function getEmbeddedVideo() {
      return video.getEmbedLink({
        autoplay: utube.conf.get('autoplay') === 'true',
      });
    }
    switch (utube.conf.get('onvidclick')) {
      case 'EMBED':
        var embedElem;
        if (utube.conf.get('nativevideo') == 'true') {
          embedElem = getNativeVideo();
        } else {
          embedElem = document.createElement('iframe');
          embedElem.classList.add('ut_embedvideo');
          embedElem.src = getEmbeddedVideo();
          embedElem.setAttribute('allowfullscreen', 'allowfullscreen');
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
      case 'EMBEDINTAB':
        if (utube.conf.get('nativevideo') == 'true') {
          var videoElem = getNativeVideo();
          var page = $('#ut_video_newtab_native').innerHTML.template({
            body:    videoElem.outerHTML,
            docRoot: window.location,
          });
          videoElem.removeAll();
          videoElem.remove();
          window.open('data:text/html;base64,'+btoa(page));
        } else {
          window.open(getEmbeddedVideo());
        }
        break;
      case 'OPENYT':
        window.open(video.getLink());
        break;
    }
    if (utube.conf.get('markwatched') == 'true') {
      utube.markAsWatched(video.id);
    }
  },

  markAsWatched: function(id) {
    utube.conf.set('watched_'+id, true);
    document.getElementById('vid_'+id).classList.add('ut_video_watched');
  },

  hasWatched: function(id) {
    return utube.conf.get('watched_'+id) == 'true';
  },

  unwatchAll: function() {
    for (var k in localStorage) {
      if (k.indexOf('watched_') === 0) {
        localStorage.removeItem(k);
      }
    }
    var v = document.getElementsByClassName('ut_video_watched');
    for (var i = v.length - 1; i >= 0; i--) {
      v[i].classList.remove('ut_video_watched');
    }
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
    contentElem.onclick = function(e) {
      e.stopPropagation();
    };
    wr.appendChild(contentElem);
    td.appendChild(wr);
    tr.appendChild(td);
    ov.appendChild(tr);
    ov.classList.add('ut_overlay');
    ov.style.opacity = '0';
    td.onclick = utube.removeOverlay;
    var inputs = contentElem.getElementsByTagName('input');
    for (var i = 0; i < inputs.length; i++) {
      if (inputs[i].type == 'text') {
        inputs[i].setAttribute('onfocus', 'utube.keysEnabled=false');
        inputs[i].setAttribute('onblur', 'utube.keysEnabled=true');
      }
    }
    setTimeout(function() {
      ov.style.opacity = '1';
    }, utube.conf.get('transitions') == 'true' ? 20 : 0);
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
      }, utube.conf.get('transitions') == 'true' ? 300 : 0);
    }
  },

  loadVideos: function(n) {
    if (!n.classList.contains('ut_loading')) {
      n.classList.add('ut_loading');
      utube.insertVideos(n.getAttribute('data-channelname'), parseInt(n.getAttribute('data-vidcount'), 10), parseInt(utube.conf.get('loadincrement'), 10), n, function() {
        n.classList.remove('ut_loading');
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
      var vidcount = parseInt(utube.getSelectedChannel()
        .querySelector('.ut_channel_videos').getAttribute('data-vidcount'));
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

  init: function() {
    if (!localStorage.theme) {
      utube.conf.reset();
    }
    utube.yt = YouTubeAPI2;
    utube.reloadTheme();
    utube.updateChannels();
    utube.updateTransitionRule(utube.conf.get('transitions') == 'true');
    var cbox = $('.ut_channelbox');
    function scrollChannels(e) {
      cbox.scrollLeft -= e.wheelDelta / 2 || -e.detail * 20;
    }
    cbox.addMousewheel(scrollChannels);
    $('.ut_cbar').addMousewheel(scrollChannels);
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
  }
};
