export default function middleware(request: Request) {
  const origin = request.headers.get('origin');
  const url = new URL(request.url);

  // Check if the request is for remote functions AND the origin is from our Tauri app
  if (
    url.pathname.startsWith('/_app/remote/') &&
    origin &&
    (origin.includes('tauri.localhost') || origin.startsWith('tauri://') || origin.includes('localhost'))
  ) {
    // We want to override the 'origin' header sent to SvelteKit
    const overrideKey = 'origin';
    const overrideValue = url.origin;

    // Return a response that tells Vercel's Edge to forward the request with our modified headers
    return new Response(null, {
      headers: {
        'x-middleware-next': '1',
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

// Optionally, tell Vercel to only run this middleware on remote function paths to save compute!
export const config = {
  matcher: '/_app/remote/:path*',
};
