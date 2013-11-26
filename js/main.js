Storage.prototype.setObject = function(key, value) {
    this.setItem(key, JSON.stringify(value));
}
 
Storage.prototype.getObject = function(key) {
    return JSON.parse(this.getItem(key));
}

var ut = utube || {}

ut.getChannels = function()
{
	return localstorage.getObject("channels") || [];
}

ut.storeChannels = function(channels)
{
	return localstorage.setObject("channels", channels);
}

ut.addChannel = function(channelName)
{
	var channels = utube.getChannels();
	channels.push(channelName);
	utube.storeChannels(channels);
}

ut.removeChannel = function(channelName)
{
	var channels = utube.getChannels();
	delete channels["channelName"]
	utube.storeChannels(channels);
}