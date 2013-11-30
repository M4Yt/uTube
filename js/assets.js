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
