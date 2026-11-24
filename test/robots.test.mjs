/* test/robots.test.mjs
 * LICENCED DASL-1.0 (c) Clove Twilight
 */

import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = await mkdtemp(join(tmpdir(), "dough-robots-"));
Deno.env.set("MINIGIT_REPOS_ROOT", root);
Deno.env.set("MINIGIT_DB_PATH", ":memory:");

const { initBareRepo, setRepoPublic } = await import("../src/lib/server/git.ts");
const { getSettings, setCrawlerOptIn, setPrefs } = await import("../src/lib/server/settings.ts");
const { GET } = await import("../src/routes/robots.txt/+server.ts");

const publicRepo = { owner: "clove", name: "shared" };
const privateRepo = { owner: "clove", name: "secret" };
const otherRepo = { owner: "another", name: "public" };
const denyAll = "User-agent: *\nDisallow: /\n";

try {
  for (const ref of [publicRepo, privateRepo, otherRepo]) await initBareRepo(ref);
  await setRepoPublic(publicRepo, true);
  await setRepoPublic(otherRepo, true);

  assert.equal((await getSettings("another")).allowCrawlers, false);
  await setPrefs("clove", {
    discordPrivate: false,
    defaultPrivate: true,
    mirrorAuto: true,
  });
  assert.equal((await getSettings("clove")).allowCrawlers, false);
  assert.equal(await (await GET()).text(), denyAll);

  await setCrawlerOptIn("clove", true);
  const response = await GET();
  assert.equal(response.headers.get("content-type"), "text/plain; charset=utf-8");
  assert.equal(response.headers.get("cache-control"), "no-store");
  const rules = await response.text();
  assert.ok(rules.startsWith(denyAll));
  assert.ok(rules.includes("Allow: /clove$\n"));
  assert.ok(rules.includes("Allow: /clove/+repos$\n"));
  assert.ok(rules.includes("Allow: /clove/shared$\n"));
  assert.ok(rules.includes("Allow: /clove/shared/blob/\n"));
  assert.doesNotMatch(rules, /secret|another|settings|git-upload-pack|Allow: \/clove\/\n/);

  await setRepoPublic(publicRepo, false);
  assert.ok(!(await (await GET()).text()).includes("/clove/shared"));

  await setCrawlerOptIn("clove", false);
  assert.equal(await (await GET()).text(), denyAll);
} finally {
  await rm(root, {
    recursive: true,
    force: true,
  });
}
