function checkForValidUrl(tabId, changeInfo, tab) {
	if (tab.url.match(/^https?:\/\/bgtorrent(z\.net|s\.info)/)) {
		chrome.pageAction.show(tabId);
	}
};

// Listen for any changes to the URL of any tab.
chrome.tabs.onUpdated.addListener(checkForValidUrl);

/**
 * Message listener
 *
 * @param {any} message
 * @param {MessageSender} sender
 * @param {function} sendResponse: callback function
 * @private
 */
 function onMessage_ (message, sender, sendResponse) {
	console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
	if (sender.tab && message.method === 'get_tab') {
		sendResponse(sender.tab);
	}
}
chrome.runtime.onMessage.addListener(onMessage_);