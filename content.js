document.addEventListener('mouseup', (e) => {
  if (e.button === 3) { 
    handleBackNavigationAttempt();
  }
});

document.addEventListener('keydown', (e) => {
  if ((e.altKey && e.key === 'ArrowLeft') || e.key === 'BrowserBack') {
    handleBackNavigationAttempt();
  }
});

function handleBackNavigationAttempt() {
  chrome.runtime.sendMessage({ action: "checkAndCloseTab" });
}