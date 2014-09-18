µTube
=====

### What is µTube?
µTube is an alternative subscription manager for YouTube.

### Getting started
[Click here](http://polyfloyd.github.io/uTube/) for the latest stable live
version. You can also run µTube yourself by cloning it into the public
directory of a webserver.

To add a channel, click in the list-icon thinghy in the top-right (or left
depending on the theme) of the screen and gently input the channel.
Accepted inputs are:
 *  A channelname
 *  A channelID
 *  The URL of the channel

### YouTube API V3
The new V3 API requires all requests to be authorized using a key. Since no such
key is included by default, you will have to create one yourself from the
[Google Developers Console](https://console.developers.google.com/project).
You can change the key in the configuration menu. There is also an option to
change the root URL of the YouTube API should you desire so.
__Finding a creative way to circumvent this limitation is against YouTube's TOS
and should not be attempted.__

### Hotkeys
 *  R = Reload all channels
 *  C = Open the µTube configuration dialog
 *  I = Open the channel menu
 *  Q, Escape = Close a video or dialog
 *  O, Return = Open selected video
 *  H, Left = Move selector left
 *  J, Down = Move selector down
 *  K, Up = Move selector up
 *  L, Right = Move selector right

### Request Policy
µTube needs to get information from the following domains:
 *  ggpht.com (Channel images)
 *  googleapis.com (The YouTube API)
 *  googleusercontent.com (More channel images)
 *  googlevideo.com (Native videos)
 *  youtube-nocookie.com (Embedded videos)
 *  youtube.com (The old YouTube API)
 *  ytimg.com (Video thumbnails images)

### FAQ
 *  What about playlists?

    I have never used YouTube playlists myself, so I have no idea how to
    implement them in a sensible way. Contact me if you want to be the ideas
    guy.

 *  How do I pronounce the name?

    "mewtube"

 *  Will you be adding more stuff in the future?

    Probably, either if I or other people want something.

### Troubleshooting
If something doesn't work, try some of the following:
 *  Use another browser. I only tested this in Firefox and Chromium.
 *  Disable NoScript, Request Policy and whatnot.
 *  Hit the reset button in the config.
 *  Panic.

### License
µTube is available under the MIT license.
