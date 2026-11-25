/* src/routes/robots.txt/+server.ts
 * LICENCED DASL-1.0 (c) Clove Twilight
 */

import { safeSegment } from "#lib/server/gitref.ts";
import { crawlerOptIns } from "#lib/server/settings.ts";

const SITE_PATHS = new Set(["auth", "avatars", "new", "robots.txt", "settings", "tokens"]);

export async function GET(): Promise<Response> {
  const rules = ["User-agent: *", "Disallow: /"];
  const owners = (await crawlerOptIns()).filter((owner) =>
    safeSegment(owner) && !SITE_PATHS.has(owner)
  );

  for (const owner of owners) {
    rules.push(
      `Allow: /${owner}$`,
      `Allow: /${owner}?`,
      `Allow: /${owner}/`,
    );
  }

  return new Response(rules.join("\n") + "\n", {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
