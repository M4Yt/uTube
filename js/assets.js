var FOOTER_MAX = 60;
var FOOTER_MIN = 8;

function channelbox() {
	return document.querySelector("div.ut_channelbox");
}

function footer() {
	return document.querySelector("div.ut_footer");
}

function showFooter() {
	channelbox().style.height = "calc(100% - " + (122 + FOOTER_MAX) + "px)";
	footer().style.height = FOOTER_MAX + "px";
}

function hideFooter() {
	channelbox().style.height = "calc(100% - " + (122 + FOOTER_MIN) + "px)";
	footer().style.height = FOOTER_MIN + "px";
}

function updatetransitionConf(enable) {
	var style = document.getElementById("disabletransitions");
	if (!enable && !style) {
		style = document.createElement("style");
		style.id = "disabletransitions";
		style.setAttribute("type", "text/css");
		style.innerHTML = "*{transition:none !important;}";
		document.getElementsByTagName("head")[0].appendChild(style);
	} else if (style) {
		style.remove();
	}
}

function addChannelByForm() {
	var inputElem = document.getElementsByClassName("ut_addchannel_txt")[0];
	var err = utube.chan.add(inputElem.value);
	var oldErrs = document.getElementsByClassName("ut_chanconf_err");
	for (var i = 0; i < oldErrs.length; i++) {
		oldErrs[i].remove();
	}
	if (err) {
		var errElem = document.createElement("h6");
		errElem.classList.add("ut_chanconf_err");
		errElem.innerHTML = err;
		inputElem.parentNode.appendChild(errElem);
	} else {
		utube.updateChannels();
	}
}

function removeChannelByForm(name) {
	utube.chan.remove(name);
	utube.updateChannels();
}
