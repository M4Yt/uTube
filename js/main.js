function channelBox()
{
	return document.querySelector("div.ut_channelbox");
}

function showFooter()
{
	channelBox().style.height = "calc(100% - 182px)";
}

function hideFooter()
{
	channelBox().style.height = "calc(100% - 124px)";
}
