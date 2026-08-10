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
    const overrideKey = 'origin';
    const overrideValue = url.origin;

    console.log(`[Middleware] Match! Rewriting ${overrideKey} to ${overrideValue}`);

    return new Response(null, {
      headers: {
        'x-middleware-rewrite': url.toString(),
        [`x-middleware-request-${overrideKey}`]: overrideValue,
        'x-middleware-override-headers': overrideKey
      }
    });
  }

  console.log(`[Middleware] No match. Passing through.`);

  // If not a Tauri remote request, continue without modifications
  return new Response(null, {
    headers: {
      'x-middleware-next': '1'
    }
  });
}
