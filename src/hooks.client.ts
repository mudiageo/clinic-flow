import { browser } from '$app/environment';

// Eagerly set up the interceptor before SvelteKit boots
if (browser) {
	// Helper to show errors on screen since Tauri has no visible console
	function showDebugOverlay(title: string, details: string) {
		const div = document.createElement('div');
		div.style.position = 'fixed';
		div.style.bottom = '10px';
		div.style.left = '10px';
		div.style.right = '10px';
		div.style.backgroundColor = '#450a0a'; // dark red
		div.style.color = '#fecaca'; // light red
		div.style.padding = '15px';
		div.style.borderRadius = '8px';
		div.style.zIndex = '999999';
		div.style.fontSize = '12px';
		div.style.fontFamily = 'monospace';
		div.style.overflow = 'auto';
		div.style.maxHeight = '50vh';
		div.style.border = '2px solid #ef4444';

		let html = '<h3 style="margin-top:0;font-weight:bold;color:white;">' + title + '</h3>';
		html += '<pre style="white-space:pre-wrap;margin:0;">' + details + '</pre>';
		html +=
			'<button onclick="this.parentElement.remove()" style="margin-top:10px;padding:5px 10px;background:#ef4444;color:white;border:none;border-radius:4px;cursor:pointer;">Dismiss</button>';

		div.innerHTML = html;
		document.body.appendChild(div);
	}

	const originalFetch = window.fetch;

	window.fetch = async function (...args) {
		const reqArg = args[0];
		let reqUrl =
			typeof reqArg === 'string'
				? reqArg
				: reqArg instanceof URL
					? reqArg.toString()
					: reqArg instanceof Request
						? reqArg.url
						: '';

		if (reqUrl && reqUrl.includes('/_app/remote/')) {
			const customUrlStr = localStorage.getItem('clinicflow_server_url');
			if (customUrlStr) {
				let debugStr = 'Original URL: ' + reqUrl + '\n';
				try {
					const customUrl = new URL(customUrlStr);
					const parsedReqUrl = new URL(reqUrl, window.location.origin);
					parsedReqUrl.protocol = customUrl.protocol;
					parsedReqUrl.host = customUrl.host;
					parsedReqUrl.port = customUrl.port;

					debugStr += 'Target URL: ' + parsedReqUrl.toString() + '\n';

					if (typeof args[0] === 'string' || args[0] instanceof URL) {
						args[0] = parsedReqUrl.toString();
					} else if (args[0] instanceof Request) {
						args[0] = new Request(parsedReqUrl.toString(), args[0]);
					}

					args[1] = args[1] || {};
					args[1].credentials = 'include';

					const headers = new Headers(
						args[1].headers || (args[0] instanceof Request ? args[0].headers : {})
					);
					headers.set('X-SvelteKit-Remote', 'true');

					// Try to inject Origin (Note: Browser fetch ignores this, but Tauri fetch respects it)
					headers.set('Origin', customUrl.origin);

					const newHeaders: Record<string, string> = {};
					headers.forEach((val, key) => {
						newHeaders[key] = val;
					});
					args[1].headers = newHeaders;

					debugStr += 'Headers: ' + JSON.stringify(newHeaders) + '\n';
					debugStr += 'Method: ' + (args[1].method || 'GET') + '\n';
					debugStr += 'Origin (window.location): ' + window.location.origin + '\n';

					// If we are in Tauri, intercept and use the Rust-native HTTP client!
					// This completely bypasses the browser's CORS and Origin restrictions.
					if ('__TAURI_INTERNALS__' in window) {
						try {
							debugStr += 'Using Tauri Rust HTTP Plugin...\n';
							// Dynamically import so we don't break the web build
							const { fetch: tauriFetch } = await import('@tauri-apps/plugin-http');
							const response = await tauriFetch(args[0], args[1]);

							if (!response.ok) {
								debugStr += 'Response Status: ' + response.status + ' ' + response.statusText + '\n';
							}
							// Return the native Tauri response
							return response as unknown as Response;
						} catch (tauriError) {
							debugStr += '\nTauri Fetch Error: ' + String(tauriError) + '\n';
							showDebugOverlay('Tauri HTTP Fetch Failed', debugStr);
							throw tauriError;
						}
					}

					// Fallback to standard web fetch (won't work for cross-origin remoteFunctions but fine for local)
					const response = await originalFetch.apply(this, args);
					if (!response.ok) {
						debugStr += 'Response Status: ' + response.status + ' ' + response.statusText + '\n';
					}
					return response;
				} catch (e) {
					debugStr += '\nERROR: ' + (e as Error).message + '\n' + (e as Error).stack;
					showDebugOverlay('Fetch Interceptor Failed', debugStr);
					console.error('ClinicFlow Fetch Interceptor Error:', e);
					throw e;
				}
			}
		}

		return originalFetch.apply(this, args);
	};
}
