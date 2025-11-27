document.addEventListener('DOMContentLoaded', () => {
    // Localization
    function localizeHtml() {
        const objects = document.querySelectorAll('[data-i18n]');
        for (let i = 0; i < objects.length; i++) {
            const obj = objects[i];
            const msg = chrome.i18n.getMessage(obj.getAttribute('data-i18n'));
            if (msg) {
                obj.innerText = msg;
            }
        }

        // Localize titles/placeholders if needed
        const copyBtn = document.getElementById('btn-copy-path');
        if (copyBtn) {
            copyBtn.title = chrome.i18n.getMessage('copyPathTitle');
        }
    }
    localizeHtml();

    const btnDirect = document.getElementById('btn-direct');
    const btnProxy = document.getElementById('btn-proxy');
    const proxySettings = document.getElementById('proxy-settings');
    const statusIndicator = document.getElementById('status-indicator');

    const inputHost = document.getElementById('proxy-host');
    const inputPort = document.getElementById('proxy-port');
    const inputScheme = document.getElementById('proxy-scheme');
    const btnSave = document.getElementById('btn-save');

    // Default Settings for Tor
    const DEFAULT_CONFIG = {
        mode: 'direct',
        host: '127.0.0.1',
        port: 9150,
        scheme: 'socks5'
    };

    // Load saved settings
    chrome.storage.local.get(['proxyConfig'], (result) => {
        const config = result.proxyConfig || DEFAULT_CONFIG;
        updateUI(config);
    });

    // Mode Selection
    btnDirect.addEventListener('click', () => {
        const config = { mode: 'direct' };
        saveAndApply(config);
    });

    btnProxy.addEventListener('click', () => {
        // When switching to Tor Proxy, load current input values or defaults
        const config = {
            mode: 'fixed_servers',
            host: inputHost.value || '127.0.0.1',
            port: parseInt(inputPort.value) || 9150,
            scheme: inputScheme.value || 'socks5'
        };
        saveAndApply(config);
    });

    // Save Settings Button
    btnSave.addEventListener('click', () => {
        const config = {
            mode: 'fixed_servers',
            host: inputHost.value,
            port: parseInt(inputPort.value),
            scheme: inputScheme.value
        };
        saveAndApply(config);
    });

    function saveAndApply(config) {
        // If switching to proxy mode, ensure we have valid defaults if inputs are empty
        if (config.mode === 'fixed_servers') {
            if (!config.host) config.host = '127.0.0.1';
            if (!config.port) config.port = 9150;
            if (!config.scheme) config.scheme = 'socks5';
        }

        chrome.storage.local.set({ proxyConfig: config }, () => {
            // Send message to background script to apply settings
            chrome.runtime.sendMessage({ type: 'SET_PROXY', config: config });
            updateUI(config);
        });
    }

    // Check Tor Status
    function checkTorStatus() {
        const statusLight = document.getElementById('tor-status-light');

        // Attempt to connect to Tor SOCKS port via HTTP
        fetch('http://127.0.0.1:9150', { mode: 'no-cors', cache: 'no-store' })
            .then(() => {
                setTorStatus(true);
            })
            .catch((error) => {
                if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                    setTorStatus(false);
                } else {
                    setTorStatus(true);
                }
            });
    }

    function setTorStatus(isOnline) {
        const statusLight = document.getElementById('tor-status-light');
        const statusText = document.getElementById('tor-status-text');

        if (isOnline) {
            statusLight.className = 'status-light green';
            statusLight.title = chrome.i18n.getMessage('torRunningTitle');
            statusText.textContent = chrome.i18n.getMessage('statusRunning');
        } else {
            statusLight.className = 'status-light red';
            statusLight.title = chrome.i18n.getMessage('torStoppedTitle');
            statusText.textContent = chrome.i18n.getMessage('statusStopped');
        }
    }

    // Initial check
    checkTorStatus();
    // Check every 5 seconds
    setInterval(checkTorStatus, 5000);

    // Copy Path Button
    const btnCopyPath = document.getElementById('btn-copy-path');
    if (btnCopyPath) {
        btnCopyPath.addEventListener('click', () => {
            const path = 'C:\\App\\Tor_Browser\\Browser\\firefox.exe';
            navigator.clipboard.writeText(path).then(() => {
                const originalText = btnCopyPath.textContent;
                btnCopyPath.textContent = chrome.i18n.getMessage('copied');
                setTimeout(() => {
                    btnCopyPath.textContent = originalText;
                }, 2000);
            });
        });
    }

    function updateUI(config) {
        // Update Mode Buttons
        btnDirect.classList.remove('active');
        btnProxy.classList.remove('active');

        if (config.mode === 'direct') {
            btnDirect.classList.add('active');
            proxySettings.classList.add('hidden');
            statusIndicator.textContent = chrome.i18n.getMessage('direct');
            statusIndicator.className = 'status-badge status-off';
        } else {
            btnProxy.classList.add('active');
            proxySettings.classList.remove('hidden');
            statusIndicator.textContent = chrome.i18n.getMessage('torProxy');
            statusIndicator.className = 'status-badge status-on';
        }

        // Update Inputs (only if they exist in config)
        if (config.host) inputHost.value = config.host;
        if (config.port) inputPort.value = config.port;
        if (config.scheme) inputScheme.value = config.scheme;
    }
});
