let lastBackClickTime = 0;

function handleBackNavigation() {
  const now = new Date().getTime();
  
  // 前回のクリックから0.5秒以内であればダブルクリックと見なす
  if (now - lastBackClickTime < 500) {
    chrome.runtime.sendMessage({ action: "closeTab" });
  } else {
    // シングルクリックなので、今回のクリック時刻を記録
    lastBackClickTime = now;
  }
}

// マウスの「戻る」ボタンに対応
document.addEventListener('mouseup', (e) => {
  if (e.button === 3) { 
    handleBackNavigation();
  }
});

// キーボードの「戻る」操作に対応
document.addEventListener('keydown', (e) => {
  if ((e.altKey && e.key === 'ArrowLeft') || e.key === 'BrowserBack') {
    handleBackNavigation();
  }
});