chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'SET_PROXY') {
    const config = request.config;

    // Chrome Proxy API requires a specific config structure
    // https://developer.chrome.com/docs/extensions/reference/proxy/#type-ProxyConfig
    let proxyConfig = {};

    if (config.mode === 'direct') {
      proxyConfig = { mode: "direct" };
    } else if (config.mode === 'system') {
      proxyConfig = { mode: "system" };
    } else if (config.mode === 'fixed_servers') {
      proxyConfig = {
        mode: "fixed_servers",
        rules: {
          singleProxy: {
            scheme: config.scheme || 'socks5',
            host: config.host,
            port: parseInt(config.port)
          },
          bypassList: ["localhost", "127.0.0.1", "::1"]
        }
      };
    } else if (config.mode === 'pac_script') {
      proxyConfig = {
        mode: "pac_script",
        pacScript: {
          data: config.pacScript
        }
      };
    }

    chrome.proxy.settings.set(
      { value: proxyConfig, scope: 'regular' },
      () => {
        if (chrome.runtime.lastError) {
          console.error("Error setting proxy:", chrome.runtime.lastError);
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          console.log("Proxy settings updated to:", config.mode);
          sendResponse({ success: true });
        }
      }
    );

    return true; // Keep the message channel open for async response
  }

  if (request.type === 'GET_PROXY') {
    chrome.proxy.settings.get({ incognito: false }, (details) => {
      sendResponse({ details: details });
    });
    return true;
  }
});
