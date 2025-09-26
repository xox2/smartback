async function getTabsData() {
  const result = await chrome.storage.session.get('tabsData');
  return result.tabsData || {};
}

async function setTabsData(data) {
  await chrome.storage.session.set({ tabsData: data });
}

async function updateHistory(details) {
  if (details.tabId && details.frameId === 0) {
    const tabsData = await getTabsData();
    const tabInfo = tabsData[details.tabId];

    if (tabInfo) {
      if (tabInfo.currentIndex > -1 && tabInfo.history[tabInfo.currentIndex] === details.url) {
        return;
      }

      const isRedirect = details.transitionQualifiers.includes("server_redirect") || details.transitionQualifiers.includes("client_redirect");
      const isInitialRedirect = tabInfo.openerTabId !== undefined && isRedirect && tabInfo.history.length <= 1;
      const isBackForward = details.transitionQualifiers.includes("forward_back");

      if (isInitialRedirect) {
        if (tabInfo.history.length === 0) {
          tabInfo.history.push(details.url);
        } else {
          tabInfo.history[0] = details.url;
        }
        tabInfo.currentIndex = 0;
      } else if (isBackForward) {
        const existingIndex = tabInfo.history.indexOf(details.url);
        if (existingIndex !== -1) {
          tabInfo.currentIndex = existingIndex;
        }
      } else {
        tabInfo.history = tabInfo.history.slice(0, tabInfo.currentIndex + 1);
        tabInfo.history.push(details.url);
        tabInfo.currentIndex = tabInfo.history.length - 1;
      }

      await setTabsData(tabsData);
    }
  }
}

chrome.tabs.onRemoved.addListener(async (tabId) => {
  const tabsData = await getTabsData();
  delete tabsData[tabId];
  await setTabsData(tabsData);
});

chrome.tabs.onCreated.addListener(async (tab) => {
  const tabsData = await getTabsData();
  tabsData[tab.id] = {
    history: [],
    currentIndex: -1,
    openerTabId: tab.openerTabId
  };
  await setTabsData(tabsData);
});

chrome.webNavigation.onCommitted.addListener(updateHistory);

chrome.webNavigation.onHistoryStateUpdated.addListener(updateHistory);

chrome.runtime.onMessage.addListener(async (message, sender) => {
  if (message.action === "checkAndCloseTab" && sender.tab?.id) {
    const currentTabId = sender.tab.id;
    const tabsData = await getTabsData();
    const tabInfo = tabsData[currentTabId];

    if (tabInfo && tabInfo.currentIndex <= 0) {
      const openerId = tabInfo.openerTabId;

      if (openerId) {
        try {
          const openerTab = await chrome.tabs.get(openerId);
          if (openerTab) {
            await chrome.tabs.update(openerId, { active: true });
            await chrome.tabs.remove(currentTabId);
          } else {
            await chrome.tabs.remove(currentTabId);
          }
        } catch (error) {
          await chrome.tabs.remove(currentTabId);
        }
      } else {
        await chrome.tabs.remove(currentTabId);
      }
    }
  }
});