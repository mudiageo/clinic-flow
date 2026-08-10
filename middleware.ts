export default function middleware(request: Request) {
  const origin = request.headers.get('origin');
  const url = new URL(request.url);

  // Check if the request is for remote functions AND the origin is from our Tauri app
  if (
    url.pathname.startsWith('/_app/remote/') &&
    origin &&
    (origin.includes('tauri.localhost') || origin.startsWith('tauri://') || origin.includes('localhost'))
  ) {
    const overrideKey = 'origin';
    const overrideValue = url.origin;

    return new Response(null, {
      headers: {
        'x-middleware-rewrite': url.toString(),
        [`x-middleware-request-${overrideKey}`]: overrideValue,
        'x-middleware-override-headers': overrideKey
      }
    });
  }

  // If not a Tauri remote request, continue without modifications
  return new Response(null, {
    headers: {
      'x-middleware-next': '1'
    }
  });
}
