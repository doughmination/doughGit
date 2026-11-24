/* src/routes/robots.txt/+server.ts
 * LICENCED DASL-1.0 (c) Clove Twilight
 */

import { listPublicRepoRefs } from "#lib/server/git.ts";
import { PROFILE_REPOS_PATH, safeSegment } from "#lib/server/gitref.ts";
import { crawlerOptIns } from "#lib/server/settings.ts";

const SITE_PATHS = new Set(["auth", "avatars", "new", "robots.txt", "settings", "tokens"]);
const REPO_PAGES = ["image", "log", "tree"];
const REPO_SUBTREES = ["blob", "commit", "tree"];

function allowPage(rules: string[], path: string): void {
  rules.push(`Allow: ${path}$`, `Allow: ${path}?`);
}

export async function GET(): Promise<Response> {
  const rules = ["User-agent: *", "Disallow: /"];
  const owners = (await crawlerOptIns()).filter((owner) =>
    safeSegment(owner) && !SITE_PATHS.has(owner)
  );

  for (const owner of owners) {
    allowPage(rules, `/${owner}`);
    allowPage(rules, `/${owner}/${PROFILE_REPOS_PATH}`);
  }

  const repos = await listPublicRepoRefs(owners);
  for (const { owner, name } of repos) {
    const path = `/${owner}/${name}`;
    allowPage(rules, path);

    for (const page of REPO_PAGES) allowPage(rules, `${path}/${page}`);
    for (const subtree of REPO_SUBTREES) rules.push(`Allow: ${path}/${subtree}/`);
  }

  return new Response(rules.join("\n") + "\n", {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
