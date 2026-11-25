/* test/robots.test.mjs
 * LICENCED DASL-1.0 (c) Clove Twilight
 */

import assert from "node:assert/strict";

Deno.env.set("MINIGIT_DB_PATH", ":memory:");

const { getSettings, setCrawlerOptIn, setPrefs } = await import("../src/lib/server/settings.ts");
const { GET } = await import("../src/routes/robots.txt/+server.ts");
const denyAll = "User-agent: *\nDisallow: /\n";

assert.equal((await getSettings("another")).allowCrawlers, false);
await setPrefs("clove", {
  discordPrivate: false,
  defaultPrivate: true,
  mirrorAuto: true,
});
assert.equal((await getSettings("clove")).allowCrawlers, false);
assert.equal(await (await GET()).text(), denyAll);

await setCrawlerOptIn("clove", true);
await setCrawlerOptIn("settings", true);
const response = await GET();
assert.equal(response.headers.get("content-type"), "text/plain; charset=utf-8");
assert.equal(response.headers.get("cache-control"), "no-store");
assert.equal(
  await response.text(),
  denyAll + "Allow: /clove$\nAllow: /clove?\nAllow: /clove/\n",
);

await setCrawlerOptIn("clove", false);
assert.equal(await (await GET()).text(), denyAll);
