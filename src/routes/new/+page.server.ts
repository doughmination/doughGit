/* src/routes/new/+page.server.ts
 * LICENCED DASL-1.0 (c) Clove Twilight
 */

import { redirect, type RequestEvent } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { sessionSlug } from "#lib/server/auth.ts";
import { clearRepoMetadata } from "#lib/server/repometa.ts";
import { notifyRepoCreated } from "#lib/server/notify.ts";
import { getSettings } from "#lib/server/settings.ts";
import {
  createRepo,
  importRepo,
  setRepoPublic,
  type CreateResult,
} from "#lib/server/git.ts";
import { fail, field, me } from "#lib/server/web.ts";

export const load: PageServerLoad = async (event) => {
  const owner = sessionSlug(me(event));
  const settings = await getSettings(owner);
  return {
    owner,
    defaultVisibility: settings.defaultPrivate ? "private" : "public",
  };
};

function publicVisibility(form: FormData): boolean {
  const visibility = field(form, "visibility");
  if (visibility !== "public" && visibility !== "private") {
    fail("choose repository visibility", "Select Public or Private.");
  }
  return visibility === "public";
}

// Shared tail of "create empty" and "import": metadata, visibility, notify
async function finishCreate(
  event: RequestEvent,
  result: CreateResult,
  verb: string,
  startsPublic: boolean,
): Promise<never> {
  if (!result.ok || !result.ref) {
    const title = result.reserved ? "that name is still reserved" : `could not ${verb} repo`;
    fail(title, result.error ?? "unknown error", result.reserved ? 409 : 400);
  }

  const owner = sessionSlug(me(event));
  await clearRepoMetadata(result.ref);
  if (startsPublic) await setRepoPublic(result.ref, true);
  notifyRepoCreated(result.ref, owner, startsPublic);
  redirect(303, `/${result.ref.owner}/${result.ref.name}`);
}

export const actions: Actions = {
  create: async (event) => {
    const owner = sessionSlug(me(event));
    const form = await event.request.formData();
    const startsPublic = publicVisibility(form);
    const result = await createRepo(owner, field(form, "name"));
    return finishCreate(event, result, "create", startsPublic);
  },

  import: async (event) => {
    const owner = sessionSlug(me(event));
    const form = await event.request.formData();
    const startsPublic = publicVisibility(form);
    const credentials = {
      username: field(form, "username"),
      token: field(form, "token"),
    };
    const result = await importRepo(owner, field(form, "name"), field(form, "url"), credentials);
    return finishCreate(event, result, "import", startsPublic);
  },
};
