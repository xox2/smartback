let lastBackClickTime = 0;
let flashTimeoutId = null;
let cachedTargetTabId = null; 

function updateTargetTabId() {
  chrome.runtime.sendMessage({ action: "getSmartBackTarget" }, (response) => {
    if (chrome.runtime.lastError) {
      return;
    }
    if (response && response.targetTabId) {
      cachedTargetTabId = response.targetTabId;
    }
  });
}

updateTargetTabId();

setInterval(updateTargetTabId, 5000);

function flashScreen() {
  const flashOverlay = document.createElement('div');
  
  Object.assign(flashOverlay.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100vw',
    height: '100vh',
    backgroundColor: 'white', 
    zIndex: '99999999',
    transition: 'opacity 2000ms ease-out',
    pointerEvents: 'none',
    opacity: '1',
  });

  document.body.appendChild(flashOverlay);

  requestAnimationFrame(() => {
    setTimeout(() => {
      flashOverlay.style.opacity = '0';
    }, 10);
  });

  setTimeout(() => {
    if (flashOverlay.parentNode) {
      flashOverlay.parentNode.removeChild(flashOverlay);
    }
  }, 2050);
}

function handleBackNavigation() {
  if (!navigation.canGoBack) {
    const now = new Date().getTime();
    
    if (now - lastBackClickTime < 400) {
      if (flashTimeoutId) {
        clearTimeout(flashTimeoutId);
        flashTimeoutId = null;
      }
      
      chrome.runtime.sendMessage({ 
        action: "closeTab", 
        targetTabId: cachedTargetTabId 
      });
      
      lastBackClickTime = 0;
    } else {
      lastBackClickTime = now;
      flashTimeoutId = setTimeout(flashScreen, 200);
    }
  }
}

document.addEventListener('mouseup', (e) => {
  if (e.button === 3) { 
    handleBackNavigation();
  }
}, true);

document.addEventListener('keydown', (e) => {
  if ((e.altKey && e.key === 'ArrowLeft') || e.key === 'BrowserBack') {
    handleBackNavigation();
  }
}, true);