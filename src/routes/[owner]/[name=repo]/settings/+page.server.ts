/* src/routes/[owner]/[name=repo]/settings/+page.server.ts
 * LICENCED DASL-1.0 (c) Clove Twilight
 */

import { redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { sessionSlug } from "#lib/server/auth.ts";
import { findUserBySlug } from "#lib/server/users.ts";
import { siteRole } from "#lib/server/roles.ts";
import { removeRepoImage, saveRepoImage } from "#lib/server/avatars.ts";
import { clearRepoMetadata } from "#lib/server/repometa.ts";
import { notifyRepoDeleted } from "#lib/server/notify.ts";
import {
  isLevel,
  listCollaborators,
  removeCollaborator,
  setCollaborator,
} from "#lib/server/access.ts";
import {
  MIRROR_KINDS,
  mirrorHost,
  mirrorSlug,
  mirrorUrl,
  type MirrorKind,
} from "#lib/server/urls.ts";
import { checkAllMirrors, dropMirrorStatusKind } from "#lib/server/mirror.ts";
import {
  description,
  isRepoPublic,
  readLinks,
  setDescription,
  setLinks,
  setRepoPublic,
  trashRepo,
  type MirrorLink,
  type RepoRef,
} from "#lib/server/git.ts";
import { fail, field, me, notAnImage, ownedRef, uploadedImage, writableRef } from "#lib/server/web.ts";

export const load: PageServerLoad = async (event) => {
  const ref = await writableRef(event);
  const isOwner = sessionSlug(me(event)) === ref.owner;
  const [rawDescription, isPublic, links] = await Promise.all([
    description(ref),
    isRepoPublic(ref),
    readLinks(ref),
  ]);

  return {
    owner: ref.owner,
    name: ref.name,
    isOwner,
    rawDescription,
    isPublic,
    collaborators: isOwner
      ? await Promise.all(
          (await listCollaborators(ref)).map(async (person) => ({
            ...person,
            role: await siteRole(person.slug),
          })),
        )
      : null,
    canCheckMirrors: links.some((l) => !l.isPrivate),
    mirrorFields: MIRROR_KINDS.map((kind) => {
      const existing = links.find((l) => l.kind === kind);
      return {
        kind,
        value: existing ? mirrorSlug(kind, existing.url) : "",
        isPrivate: existing?.isPrivate ?? false,
      };
    }),
    mirrorHosts: MIRROR_KINDS.map(mirrorHost).join(" or "),
  };
};

function back(ref: RepoRef): never {
  redirect(303, `/${ref.owner}/${ref.name}/settings`);
}

export const actions: Actions = {
  description: async (event) => {
    const ref = await writableRef(event);
    const form = await event.request.formData();
    await setDescription(ref, field(form, "description"));
    back(ref);
  },

  image: async (event) => {
    const ref = await ownedRef(event);
    if (!(await saveRepoImage(ref, await uploadedImage(event, "image")))) notAnImage();
    back(ref);
  },

  removeImage: async (event) => {
    const ref = await ownedRef(event);
    await removeRepoImage(ref);
    back(ref);
  },

  visibility: async (event) => {
    const ref = await ownedRef(event);
    const form = await event.request.formData();
    await setRepoPublic(ref, form.get("public") === "on");
    back(ref);
  },

  delete: async (event) => {
    const ref = await ownedRef(event);
    const slug = sessionSlug(me(event));
    const wasPublic = await isRepoPublic(ref);

    const result = await trashRepo(ref, {
      deletedAt: Math.floor(Date.now() / 1000),
      deletedBy: slug,
      grants: (await listCollaborators(ref)).map((g) => ({
        slug: g.slug,
        level: g.level,
      })),
    });
    if (!result.ok) fail("could not delete", result.error ?? "unknown error");

    await clearRepoMetadata(ref);
    notifyRepoDeleted(ref, slug, wasPublic);
    redirect(303, "/settings/deleted");
  },

  collaborator: async (event) => {
    const ref = await ownedRef(event);
    const form = await event.request.formData();
    const slug = field(form, "slug").trim().toLowerCase();
    const levelRaw = field(form, "level") || "read";
    const level = isLevel(levelRaw) ? levelRaw : "read";

    const invited = await findUserBySlug(slug);
    if (!invited) {
      fail(
        "no such user",
        `Nobody on this instance goes by "${slug}". They have to sign in ` +
          `to this instance once before they can be added.`,
      );
    }
    if (invited.slug === ref.owner) {
      fail("already the owner", "You can't add yourself as a collaborator on your own repo.");
    }

    await setCollaborator(ref, invited.slug, level);
    back(ref);
  },

  uncollaborate: async (event) => {
    const ref = await ownedRef(event);
    const form = await event.request.formData();
    await removeCollaborator(ref, field(form, "slug"));
    back(ref);
  },

  mirrors: async (event) => {
    const ref = await ownedRef(event);
    const form = await event.request.formData();

    const links: MirrorLink[] = [];
    const rejected: MirrorKind[] = [];
    for (const kind of MIRROR_KINDS) {
      const raw = field(form, kind).trim();
      if (!raw) continue;
      const url = mirrorUrl(kind, raw);
      if (!url) {
        rejected.push(kind);
        continue;
      }
      links.push({
        kind,
        url,
        isPrivate: form.get(`${kind}_private`) != null,
      });
    }

    if (rejected.length > 0) {
      fail(
        "that isn't a mirror URL",
        `The ${rejected.join(" and ")} link was refused. Give the repository as ` +
          `owner/repo — for example doughmination/dough-git — and it is looked up on ` +
          `${mirrorHost(rejected[0]!)}.`,
      );
    }

    const before = await readLinks(ref);
    await setLinks(ref, links);
    for (const old of before) {
      const still = links.find((l) => l.kind === old.kind && l.url === old.url);
      if (!still) await dropMirrorStatusKind(ref, old.kind);
    }
    back(ref);
  },

  check: async (event) => {
    const ref = await writableRef(event);
    await checkAllMirrors(ref, await readLinks(ref));
    back(ref);
  },
};
