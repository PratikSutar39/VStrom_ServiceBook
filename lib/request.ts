export function isSameOrigin(request: Request) {
  // Browser writes must originate on this deployment. Requests without an Origin
  // can still be authorized by their verified Supabase session.
  const origin = request.headers.get('origin');
  return !origin || origin === new URL(request.url).origin;
}
export const json = (data: unknown, status = 200) => Response.json(data, {
  status,
  headers: { 'Cache-Control': 'private, no-store, max-age=0', 'Pragma': 'no-cache' },
});
export function safeReturnPath(value: string | null) {
  return value === '/update-password' ? '/update-password' : '/';
}
