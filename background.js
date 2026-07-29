chrome.action.onClicked.addListener(async (tab) => {
    try {
        await chrome.sidePanel.open({
            windowId: tab.windowId
        });
    } catch (error) {
        console.error("Could not open side panel:", error);
    }
});