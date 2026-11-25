/* src/routes/[owner]/[name=repo]/blob/[...path]/+page.server.ts
 * LICENCED DASL-1.0 (c) Clove Twilight
 */

import type { PageServerLoad } from "./$types";
import { blob } from "#lib/server/git.ts";
import { fileLanguage, highlightCode } from "#lib/server/highlight.ts";
import { renderMarkdown, repositoryLinks } from "#lib/server/markdown.ts";
import { notFound, revQuery, viewable } from "#lib/server/web.ts";

export const load: PageServerLoad = async (event) => {
  const { ref, access, refs, rev } = await viewable(event);
  const path = event.params.path;

  const file = await blob(ref, rev, path);
  if (!file) notFound();

  const query = revQuery(rev, refs.head);
  const isMarkdown = !file.binary && /\.(?:md|markdown|mdown|mkd|mkdn)$/i.test(path);
  const showSource = event.url.searchParams.get("view") === "source";
  const preview = isMarkdown && !showSource
    ? renderMarkdown(file.text, repositoryLinks(ref.owner, ref.name, query, path))
    : null;

  return {
    owner: ref.owner,
    name: ref.name,
    canManage: access === "write",
    path,
    query,
    isMarkdown,
    preview,
    highlighted: !file.binary && preview === null
      ? highlightCode(file.text, fileLanguage(path, file.text))
      : null,
    ...file,
  };
};
