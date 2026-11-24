/* src/routes/[owner]/[name=repo]/+page.server.ts
 * LICENCED DASL-1.0 (c) Clove Twilight
 */

import type { PageServerLoad } from "./$types";
import { background } from "#lib/server/background.ts";
import { config } from "#lib/server/config.ts";
import { sessionSlug } from "#lib/server/auth.ts";
import { getSettings } from "#lib/server/settings.ts";
import { renderMarkdown, plainSummary, repositoryLinks } from "#lib/server/markdown.ts";
import { describeMirror } from "#lib/server/mirrorview.ts";
import { checkAllMirrors, getStatuses, needsCheck } from "#lib/server/mirror.ts";
import { description, localMirrorRefs, log, readLinks, readme, refSlug } from "#lib/server/git.ts";
import { revQuery, viewable } from "#lib/server/web.ts";

export const load: PageServerLoad = async (event) => {
  const { ref, isPublic, access, refs, rev } = await viewable(event);

  const [commits, rawDescription, links] = await Promise.all([
    log(ref, rev, 1),
    description(ref),
    readLinks(ref),
  ]);
  const readmeFile = commits.length ? await readme(ref, rev) : null;

  const user = event.locals.user;
  const viewer = user ? sessionSlug(user) : null;
  const isOwner = viewer === ref.owner;
  const canPush = access === "write";

  const statuses = await getStatuses(ref);
  let localSha: string | null = null;
  if (links.length > 0) {
    const localRefs = await localMirrorRefs(ref);
    localSha = localRefs.get(`refs/heads/${refs.head}`) ?? null;

    if (canPush && (await getSettings(ref.owner)).mirrorAuto) {
      const due = links.filter((l) => !l.isPrivate && needsCheck(statuses.get(l.kind)));
      if (due.length > 0) {
        background(
          checkAllMirrors(ref, due).catch((err) => {
            console.warn(`[mirror] background check failed for ${refSlug(ref)}:`, err);
          }),
        );
      }
    }
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const query = revQuery(rev, refs.head);
  const summary = readmeFile ? plainSummary(readmeFile.text) : "";

  return {
    owner: ref.owner,
    name: ref.name,
    isPublic,
    empty: refs.branches.length === 0,
    refs,
    rev,
    query,
    cloneUrl: `${config.baseUrl}/${ref.owner}/${ref.name}.git`,
    pusher: viewer ?? ref.owner,
    rawDescription,
    metaDescription:
      rawDescription.trim() || summary || `${ref.owner}/${ref.name} — a git repository on ${config.title}.`,
    readme: readmeFile
      ? {
          path: readmeFile.path,
          html: renderMarkdown(
            readmeFile.text,
            repositoryLinks(ref.owner, ref.name, query),
          ),
        }
      : null,
    canPush,
    isOwner,
    mirrors: links.map((link) => describeMirror(link, statuses.get(link.kind) ?? null, nowSec)),
    localSha,
  };
};
