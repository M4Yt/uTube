µTube
=====

### What is µTube?
µTube is an application for managing subscriptions on YouTube without needing a Google+ account.

### Getting started
Set up a HTTP server, clone the repository and open it in a webbrowser.

If you have no idea what all of that means, then [click here](http://polyfloyd.github.io/uTube/) for a live version.

To add a channel, click in the list-icon thinghy in the top-right of the screen and mash the channelname in the textbox.
You need a channelname, e.g "LuminosityEvents". Stuff like "UCi4JeT_3WuhXKOqfcOp9-Sw" will not work (yet). You can find the channelname in the URL of the channel e.g. "https://www.youtube.com/user/LuminosityEvents".

### Keybindings
 *  R = Reload all channels
 *  C = Open the µTube configuration dialog
 *  I = Open the channel menu
 *  Q | Escape = Close a video or dialog
 *  O | Return = Open selected video
 *  H | Left = Move selector left
 *  J | Down = Move selector down
 *  K | Up = Move selector up
 *  L | Right = Move selector right

### HTML5 Video
To view videos in HTML5, µTube needs to access the youtube page of this video.
Since AJAX calls are denied, µTube proxies this information through [videoinfo.php](videoinfo.php).
Make this file accessible with a PHP server, and link to it in the µTube config.
This is set to `http://localhost/uTube/videoinfo.php?id=%ID` by default.
You can secure it with a password if you want. Just add `&passwd=PASSWORD` to the URL and update [videoinfo.php](videoinfo.php) accordingly.

### Request Policy
µTube needs to get information from the following domains:
 *  youtube.com (The YouTube data API)
 *  ytimg.com (Video preview images)
 *  youtube-nocookie.com (Embedded videos)
 *  googlevideo.com (HTML5 videos)

### Troubleshooting
If something doesn't work, try some of the following:

 *  Use another browser. I only tested this in Firefox and Chromium.
 *  Disable NoScript, Request Policy and whatnot.
 *  Hit the reset button in the config.

### License
µTube is available under the MIT license. EXCEPT the following files:

 *  [js/viewtube.js](js/viewtube.js)

    Which is copyrighted by Sebastian Luncan under GPLv3.

### TODO
 *  Playlists?
 *  Support for other streaming sites?
 *  Videobrowsing?
