<!-- src/routes/[owner]/[name=repo]/settings/+page.svelte
     LICENCED DASL-1.0 (c) Clove Twilight
-->

<script lang="ts">
  import IcDelete from "~icons/ic/outline-delete";
  import IcImage from "~icons/ic/outline-image";
  import IcLock from "~icons/ic/outline-lock";
  import IcLockOpen from "~icons/ic/outline-lock-open";
  import IcPeople from "~icons/ic/outline-people";
  import IcPerson from "~icons/ic/outline-person";
  import IcPersonAdd from "~icons/ic/outline-person-add";
  import IcPersonRemove from "~icons/ic/outline-person-remove";
  import IcPublic from "~icons/ic/outline-public";
  import IcRefresh from "~icons/ic/outline-refresh";
  import IcSave from "~icons/ic/outline-save";
  import IcUpload from "~icons/ic/outline-upload";
  import IcStickyNote2 from "~icons/ic/outline-sticky-note-2";
  import IcStorage from "~icons/ic/outline-storage";
  import IcWarning from "~icons/ic/outline-warning";
  import { fmtDate } from "#lib";
  import Meta from "#lib/components/Meta.svelte";
  import RepoNav from "#lib/components/RepoNav.svelte";
  import Visibility from "#lib/components/Visibility.svelte";
  import ConfirmForm from "#lib/components/ConfirmForm.svelte";
  import RoleBadge from "#lib/components/RoleBadge.svelte";

  let { data } = $props();

  const title = $derived(`${data.owner}/${data.name}`);
</script>

<Meta title={`Settings · ${title}`} noindex />

<div class="page">
  <div class="page-head">
    <p class="eyebrow">{title}</p>
    <h1>Repository settings</h1>
  </div>

  <RepoNav owner={data.owner} name={data.name} active="settings" query="" canManage />

  <h2 class="section-title"><IcStickyNote2 class="icon" width="20" height="20" />Description</h2>
  <form method="post" action="?/description" class="panel row">
    <label class="field-label with-icon" for="repo-description">
      <IcStickyNote2 class="icon" width="16" height="16" />description
    </label>
    <input
      id="repo-description"
      type="text"
      name="description"
      maxlength="300"
      value={data.rawDescription}
      placeholder="what this repository is for"
    />
    <button type="submit"><IcSave class="icon" width="16" height="16" />save</button>
  </form>

  {#if data.isOwner || data.canCheckMirrors}
    <h2 class="section-title"><IcStorage class="icon" width="20" height="20" />External mirrors</h2>
    {#if data.isOwner}
      <form method="post" action="?/mirrors" class="panel">
        {#each data.mirrorFields as mirror (mirror.kind)}
          <div class="row">
            <label class="field-label with-icon" for="mirror-{mirror.kind}">
              <IcPublic class="icon" width="16" height="16" />{mirror.kind}
            </label>
            <input
              id="mirror-{mirror.kind}"
              type="text"
              name={mirror.kind}
              value={mirror.value}
              placeholder="user/repo"
              pattern={"[^\\s/]+/[^\\s/]+/?"}
              autocapitalize="off"
              spellcheck="false"
            />
            <label class="check">
              <input type="checkbox" name="{mirror.kind}_private" checked={mirror.isPrivate} /> private
            </label>
          </div>
        {/each}
        <p class="muted small">
          Give the <code>user/repo</code> on {data.mirrorHosts} — not a full URL. Mark a mirror <em>private</em> to
          skip status checks — they are anonymous, so a private mirror would otherwise always look unreachable.
          Clear a field to remove it.
        </p>
        <div>
          <button type="submit"><IcSave class="icon" width="16" height="16" />save mirrors</button>
        </div>
      </form>
    {/if}
    {#if data.canCheckMirrors}
      <form method="post" action="?/check" class="buttons">
        <button type="submit"><IcRefresh class="icon" width="16" height="16" />check mirror status</button>
      </form>
    {/if}
  {/if}

  {#if data.isOwner && data.collaborators}
    <h2 class="section-title"><IcLock class="icon" width="20" height="20" />Visibility</h2>
    <div class="buttons">
      <Visibility isPublic={data.isPublic} />
      <form method="post" action="?/visibility">
        <input type="hidden" name="public" value={data.isPublic ? "" : "on"} />
        <button type="submit">
          {#if data.isPublic}
            <IcLock class="icon" width="16" height="16" />
          {:else}
            <IcLockOpen class="icon" width="16" height="16" />
          {/if}
          make {data.isPublic ? "private" : "public"}
        </button>
      </form>
    </div>

    <h2 class="section-title"><IcImage class="icon" width="20" height="20" />Image</h2>
    <p class="muted">
      Shown beside the name and in link embeds, in place of your avatar. Private repositories keep your avatar in
      embeds, since Discord can't fetch their image.
    </p>
    <section class="panel">
      <form method="post" action="?/image" enctype="multipart/form-data" class="row">
        <input type="file" name="image" accept="image/png,image/jpeg,image/gif,image/webp" aria-label="repository image" required />
        <button type="submit" class="primary"><IcUpload class="icon" width="16" height="16" />upload</button>
      </form>
      {#if data.repoImage}
        <ConfirmForm action="?/removeImage" prompt="Remove the image from {title}?">
          <button type="submit" class="danger"><IcDelete class="icon" width="16" height="16" />remove image</button>
        </ConfirmForm>
      {/if}
    </section>

    <h2 class="section-title"><IcPeople class="icon" width="20" height="20" />Collaborators</h2>
    <p class="muted">
      People here can see this repository even while it is private. <code>write</code> also lets them push to it.
    </p>
    <form method="post" action="?/collaborator" class="panel row">
      <label class="field-label with-icon" for="collab-slug"><IcPerson class="icon" width="16" height="16" />username</label>
      <input id="collab-slug" type="text" name="slug" placeholder="their handle" pattern="[A-Za-z0-9._\-]+" required />
      <select name="level" aria-label="access level">
        <option value="read">read</option>
        <option value="write">write</option>
      </select>
      <button type="submit"><IcPersonAdd class="icon" width="16" height="16" />add</button>
    </form>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>user</th>
            <th>access</th>
            <th>added</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {#each data.collaborators as person (person.slug)}
            <tr>
              <td><IcPerson class="icon" width="14" height="14" /> <a href="/{person.slug}">{person.slug}</a> <RoleBadge role={person.role} /></td>
              <td class="mono">{person.level}</td>
              <td class="mono">{fmtDate(person.added_at)}</td>
              <td>
                <form method="post" action="?/uncollaborate">
                  <input type="hidden" name="slug" value={person.slug} />
                  <button type="submit" class="small"><IcPersonRemove class="icon" width="14" height="14" />remove</button>
                </form>
              </td>
            </tr>
          {:else}
            <tr><td colspan="4" class="empty">nobody else has access</td></tr>
          {/each}
        </tbody>
      </table>
    </div>

    <h2 class="section-title"><IcWarning class="icon" width="20" height="20" />Delete repository</h2>
    <div class="buttons">
      <ConfirmForm action="?/delete" prompt="Delete {title}? It moves to Recently Deleted.">
        <button type="submit" class="danger"><IcDelete class="icon" width="16" height="16" />delete repository</button>
      </ConfirmForm>
    </div>
  {/if}
</div>
