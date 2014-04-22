/*
  
  This file was derived from the ViewTube project. Its contents were
  altered and reformatted to allow easier integration into µTube.
  The original is available at http://isebaro.com/viewtube

*/

/*

  Copyright (C) 2010 - 2013 Sebastian Luncan

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program. If not, see <http://www.gnu.org/licenses/>.

  Website: http://isebaro.com/viewtube
  Contact: http://isebaro.com/contact

*/

'use strict';

var viewtube = {

  FORMATS: {
    '5': 'Very Low Definition FLV',
    '17': 'Very Low Definition 3GP',
    '18': 'Low Definition MP4',
    '22': 'High Definition MP4',
    '34': 'Low Definition FLV',
    '35': 'Standard Definition FLV',
    '36': 'Low Definition 3GP',
    '37': 'Full High Definition MP4',
    '38': 'Ultra High Definition MP4',
    '43': 'Low Definition WebM',
    '44': 'Standard Definition WebM',
    '45': 'High Definition WebM',
    '46': 'Full High Definition WebM',
    '82': 'Low Definition 3D MP4',
    '83': 'Standard Definition 3D MP4',
    '84': 'High Definition 3D MP4',
    '85': 'Full High Definition 3D MP4',
    '100': 'Low Definition 3D WebM',
    '101': 'Standard Definition 3D WebM',
    '102': 'High Definition 3D WebM',
    '135': 'Standard Definition Video MP4',
    '136': 'High Definition Video MP4',
    '137': 'Full High Definition Video MP4',
    '138': 'Ultra High Definition Video MP4',
    '139': 'Low Bitrate Audio MP4',
    '140': 'Medium Bitrate Audio MP4',
    '141': 'High Bitrate Audio MP4',
    '171': 'Medium Bitrate Audio WebM',
    '172': 'High Bitrate Audio WebM'
  },

  ytDecrypter: null,
  ytDecryptFunction: null,

  cleanMyContent: function(content, unesc) {
    var myNewContent = content;
    if (unesc) myNewContent = unescape(myNewContent);
    myNewContent = myNewContent.replace(/\\u0025/g,'%');
    myNewContent = myNewContent.replace(/\\u0026/g,'&');
    myNewContent = myNewContent.replace(/\\/g,'');
    myNewContent = myNewContent.replace(/\n/g,'');
    return myNewContent;
  },

  getMyContent: function(url, pattern, clean) {
    var req = new XMLHttpRequest();
    req.open('GET', url, false);
    req.send();
    var myPageContent = req.responseText;
    if (clean) myPageContent = viewtube.cleanMyContent(myPageContent, true);
    var myVideosParse = myPageContent.match(pattern);
    var myVideosContent = (myVideosParse) ? myVideosParse[1] : null;
    return myVideosContent;
  },

  decryptSignature: function(s) {
    if (typeof ytDecrypter === 'function') {
    return viewtube.ytDecrypter(s);
    } else {
    if (!viewtube.ytDecryptFunction) viewtube.ytDecryptFunction = 'a=a.split("");a=EE(a,26);a=a.slice(1);a=EE(a,15);a=EE(a,3);a=EE(a,62);a=EE(a,54);a=EE(a,22);return a.join("")';
    var ytFncBody = viewtube.ytDecryptFunction;
    var ytFncSwap = viewtube.ytDecryptFunction.match(/\w=((\$|_|\w)+)\(\w,[0-9]+\)/);
    ytFncSwap = (ytFncSwap) ? ytFncSwap[1] : null;
    if (ytFncSwap) ytFncBody = 'function ' + ytFncSwap + '(a, b)' + '{var c=a[0];a[0]=a[b%a.length];a[b]=c;return a} ' + viewtube.ytDecryptFunction;
    viewtube.ytDecrypter = new Function('a', ytFncBody);
    return viewtube.ytDecrypter(s);
    }
    return null;
  },

  ytVideoList: function(url) {
    var ytVideosContent = viewtube.getMyContent(url, '"url_encoded_fmt_stream_map":\\s+"(.*?)"', false);
    if (ytVideosContent) ytVideosContent = viewtube.cleanMyContent(ytVideosContent, false);

    if (ytVideosContent) {
      var ytVideoList = {};
      var ytVideos = ytVideosContent.split(',');
      var ytVideoParse, ytVideoCodeParse, ytVideoCode, myVideoCode, ytVideo;
      for (var i = 0; i < ytVideos.length; i++) {
        if (!ytVideos[i].match(/^url/)) {
          ytVideoParse = ytVideos[i].match(/(.*)(url=.*$)/);
          if (ytVideoParse) {
            ytVideos[i] = ytVideoParse[2]+'&'+ytVideoParse[1];
          }
        }
        ytVideoCodeParse = ytVideos[i].match(/itag=(\d{1,3})/);
        ytVideoCode = (ytVideoCodeParse) ? ytVideoCodeParse[1] : null;
        if (ytVideoCode) {
          myVideoCode = viewtube.FORMATS[ytVideoCode];
          if (myVideoCode) {
            ytVideo = ytVideos[i].replace(/url=/, '').replace(/&$/, '').replace(/&itag=\d{1,3}/, '');
            if (ytVideo.match(/type=.*?&/)) ytVideo = ytVideo.replace(/type=.*?&/, '');
            else ytVideo = ytVideo.replace(/&type=.*$/, '');
            if (ytVideo.match(/&sig=/)) ytVideo = ytVideo.replace(/&sig=/, '&signature=');
            else if (ytVideo.match(/&s=/)) {
            var ytSig = ytVideo.match(/&s=(.*?)(&|$)/);
            if (ytSig) {
              var s = ytSig[1];
              s = viewtube.decryptSignature(s);
              if (s) ytVideo = ytVideo.replace(/&s=.*?(&|$)/, '&signature=' + s + '$1');
              else ytVideo = '';
            } else ytVideo = '';
            }
            ytVideo = viewtube.cleanMyContent(ytVideo, true);
            if (ytVideo && ytVideo.indexOf('http') === 0) {
            ytVideoList[myVideoCode] = ytVideo;
            }
          }
        }
      }
      return ytVideoList;
    }
    return null;
  }

};
