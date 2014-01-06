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
        '102': 'High Definition 3D WebM'
    },

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
        myPageContent = req.responseText;
        if (clean) myPageContent = viewtube.cleanMyContent(myPageContent, true);
        var myVideosParse = myPageContent.match(pattern);
        var myVideosContent = (myVideosParse) ? myVideosParse[1] : null;
        return myVideosContent;
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
                        if (ytVideo.match(/type=.*?&/)) {
                            ytVideo = ytVideo.replace(/type=.*?&/, '');
                        } else {
                            ytVideo = ytVideo.replace(/&type=.*$/, '');
                        }
                        if (ytVideo.match(/&sig=/)) {
                            ytVideo = ytVideo.replace(/&sig=/, '&signature=');
                        } else {
                            var ytSig = ytVideo.match(/&s=(.*?)(&|$)/);
                            if (ytSig) {
                                var s = ytSig[1].split('');
                                s = s[28] + s.slice(2, 28).join('') + s[52] + s.slice(29, 52).join('') +
                                s[0] + s.slice(53, 73).join('') + s[82] + s.slice(74, 81).join('') + s[73];
                                ytVideo = ytVideo.replace(/&s=.*?(&|$)/, '&signature='+s+'$1');
                            } else {
                                ytVideo = '';
                            }
                        }
                        ytVideo = viewtube.cleanMyContent(ytVideo, true);
                        if (ytVideo && ytVideo.indexOf('http') == 0) {
                            ytVideoList[myVideoCode] = ytVideo;
                        }
                    }
                }
            }
            return ytVideoList;
        }
        return null;
    }

}
