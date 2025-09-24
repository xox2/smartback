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
      const now = details.timeStamp;
      const lastTimestamp = tabInfo.lastNavigationTimestamp || 0;
      const timeDiff = now - lastTimestamp;
      tabInfo.lastNavigationTimestamp = now;

      const isNewTabWithInitialNavigation =
        tabInfo.openerTabId !== undefined && tabInfo.history.length < 2;

      if (isNewTabWithInitialNavigation && timeDiff < 3000 && tabInfo.history.length > 0) {
        tabInfo.history[tabInfo.currentIndex] = details.url;
      } else {
        const existingIndex = tabInfo.history.indexOf(details.url);
        if (existingIndex !== -1) {
          tabInfo.currentIndex = existingIndex;
        } else {
          tabInfo.history = tabInfo.history.slice(0, tabInfo.currentIndex + 1);
          tabInfo.history.push(details.url);
          tabInfo.currentIndex = tabInfo.history.length - 1;
        }
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
    openerTabId: tab.openerTabId,
    lastNavigationTimestamp: 0
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