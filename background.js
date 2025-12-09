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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getSmartBackTarget" && sender.tab?.id) {
    const currentTabId = String(sender.tab.id);
    chrome.storage.session.get(currentTabId).then(data => {
      sendResponse({ targetTabId: data[currentTabId] || null });
    });
    return true; 
  }

  if (message.action === "closeTab" && sender.tab?.id) {
    (async () => {
      const closingTabId = sender.tab.id;
      let targetTabId = message.targetTabId;

      try {
        if (!targetTabId) {
          const data = await chrome.storage.session.get(String(closingTabId));
          targetTabId = data[closingTabId];

          if (!targetTabId) {
            const closingTab = await chrome.tabs.get(closingTabId);
            targetTabId = closingTab.openerTabId;
          }
        }

        if (targetTabId) {
          await chrome.tabs.update(targetTabId, { active: true });
        }
      } catch (error) {
        // エラー無視
      } finally {
        await chrome.tabs.remove(closingTabId);
      }
    })();
  }
});