chrome.runtime.onMessage.addListener(async (message, sender) => {
  // content.jsから "closeTab" メッセージを受け取った場合
  if (message.action === "closeTab" && sender.tab?.id) {
    const currentTabId = sender.tab.id;
    const currentTab = await chrome.tabs.get(currentTabId);
    const openerId = currentTab.openerTabId;

    // このタブを開いた元のタブがあれば、そちらをアクティブにする
    if (openerId) {
      try {
        // 元のタブが存在するか確認
        const openerTab = await chrome.tabs.get(openerId);
        if (openerTab) {
          await chrome.tabs.update(openerId, { active: true });
        }
      } catch (error) {
        // 元のタブが見つからない場合は何もしない
      }
    }
    
    // 現在のタブを閉じる
    await chrome.tabs.remove(currentTabId);
  }
});