let lastActiveTabId = null;

chrome.tabs.onActivated.addListener(activeInfo => {
  lastActiveTabId = activeInfo.tabId;
});

chrome.tabs.onCreated.addListener(tab => {
  if (lastActiveTabId && tab.id) {
    chrome.storage.session.set({ [tab.id]: lastActiveTabId });
  }
});

chrome.tabs.onRemoved.addListener(tabId => {
  chrome.storage.session.remove(String(tabId));
});

chrome.runtime.onMessage.addListener(async (message, sender) => {
  if (message.action === "closeTab" && sender.tab?.id) {
    const closingTabId = sender.tab.id;
    let targetTabId = null;

    try {
      const data = await chrome.storage.session.get(String(closingTabId));
      targetTabId = data[closingTabId];

      if (!targetTabId) {
        const closingTab = await chrome.tabs.get(closingTabId);
        targetTabId = closingTab.openerTabId;
      }

      if (targetTabId) {
        await chrome.tabs.update(targetTabId, { active: true });
      }
    } catch (error) {
        // 元のタブが見つからない場合は何もしない
    } finally {
        await chrome.tabs.remove(closingTabId);
    }
  }
});