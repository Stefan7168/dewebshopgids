// Answer for an embed that must not show: a 404 that still carries a transparent SVG. With a plain-text
// 404 the browser shows a broken-image icon and the alt text ("Vermeld op ..." or "Geverifieerd door
// ..."), which would keep a claim on the shop's site after removal or after the badge ended.
const EMPTY_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>';

export function hiddenEmbed(): Response {
  return new Response(EMPTY_SVG, {
    status: 404,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
