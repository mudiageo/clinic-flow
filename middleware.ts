function handleMiddlewareField(init: any, headers: Headers) {
  if (init?.request?.headers) {
    if (!(init.request.headers instanceof Headers)) {
      throw new Error("request.headers must be an instance of Headers");
    }
    const keys: string[] = [];
    for (const [key, value] of init.request.headers) {
      headers.set("x-middleware-request-" + key, value);
      keys.push(key);
    }
    headers.set("x-middleware-override-headers", keys.join(","));
  }
}

function next(init?: any) {
  const headers = new Headers(init?.headers ?? {});
  headers.set("x-middleware-next", "1");
  handleMiddlewareField(init, headers);
  return new Response(null, {
    ...init,
    headers
  });
}

export default async function middleware(request: Request) {
  const origin = request.headers.get('origin');
  const url = new URL(request.url);

  console.log(`[Middleware] Incoming Request: ${request.method} ${request.url}`);
  console.log(`[Middleware] Origin: ${origin}`);

  try {
    const bodyText = await request.clone().text();
    console.log(`[Middleware] Body Length: ${bodyText.length}, Preview: ${bodyText.substring(0, 100)}`);
  } catch (e) {
    console.log(`[Middleware] Body could not be read or is empty.`);
  }

  // Check if the request is for remote functions AND the origin is from our Tauri app
  if (
    url.pathname.startsWith('/_app/remote/') &&
    origin &&
    (origin.includes('tauri.localhost') || origin.startsWith('tauri://') || origin.includes('localhost'))
  ) {
    console.log(`[Middleware] Match! Rewriting origin to ${url.origin}`);

    // Clone the request headers
    const requestHeaders = new Headers(request.headers);
    
    // Modify the origin header to be the URL origin
    requestHeaders.set('origin', url.origin);
    
    // Continue the middleware chain with modified headers
    return next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  console.log(`[Middleware] No match. Passing through.`);
  
  // If not your remote client, continue without modifications
  return next();
}
