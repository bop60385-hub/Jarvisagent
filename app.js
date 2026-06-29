const statusText = document.getElementById('statusText');

if (statusText) {
  const updateStatus = () => {
    const now = new Date();
    statusText.textContent = `Updated ${now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  };

  updateStatus();
  setInterval(updateStatus, 60000);
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('Service worker registration failed:', error);
    });
  });
}
