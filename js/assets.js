var FOOTER_MAX = 60;
var FOOTER_MIN = 8;

function channelbox()
{
	return document.querySelector("div.ut_channelbox");
}

function footer()
{
	return document.querySelector("div.ut_footer");
}

function showFooter()
{
	channelbox().style.height = "calc(100% - " + (122 + FOOTER_MAX) + "px)";
	footer().style.height = FOOTER_MAX + "px";
}

function hideFooter()
{
	channelbox().style.height = "calc(100% - " + (122 + FOOTER_MIN) + "px)";
	footer().style.height = FOOTER_MIN + "px";
}

function addChannelByForm()
{
	var inputElem = document.getElementsByClassName("ut_addchannel_txt")[0];
	var err = utube.chan.add(inputElem.value);
	var oldErrs = document.querySelector(".ut_chanconf_item h6");
	for (var i = 0; i < oldErrs.length; i++) {
		oldErrs[i].remove();
	}
	if (err) {
		var errElem = document.createElement("h6");
		errElem.innerHTML = err;
		inputElem.parentNode.appendChild(errElem);
	} else {
		utube.updateChannels();
	}
}

function removeChannelByForm(name)
{
	utube.chan.remove(name);
	utube.updateChannels();
}
