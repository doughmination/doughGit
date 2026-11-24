<!-- src/routes/new/+page.svelte
     LICENCED DASL-1.0 (c) Clove Twilight
-->

<script lang="ts">
  import IcAdd from "~icons/ic/outline-add";
  import IcCreateNewFolder from "~icons/ic/outline-create-new-folder";
  import IcDownload from "~icons/ic/outline-download";
  import IcLink from "~icons/ic/outline-link";
  import IcLocalOffer from "~icons/ic/outline-local-offer";
  import Meta from "#lib/components/Meta.svelte";

  let { data } = $props();
</script>

<Meta title="new repository" noindex />

<div class="page">
  <div class="page-head">
    <p class="eyebrow">git mirror</p>
    <h1>New repository</h1>
  </div>

  <h2 class="section-title"><IcCreateNewFolder class="icon" width="20" height="20" />Empty repository</h2>
  <form method="post" action="?/create" class="panel row">
    <span class="mono">{data.owner}/</span>
    <input type="text" name="name" placeholder="my-project" pattern="[A-Za-z0-9._\-]+" required />
    <label for="create-visibility">Visibility</label>
    <select id="create-visibility" name="visibility" value={data.defaultVisibility}>
      <option value="private">Private</option>
      <option value="public">Public</option>
    </select>
    <button type="submit" class="primary"><IcAdd class="icon" width="16" height="16" />create</button>
  </form>

  <h2 class="section-title">
    <IcDownload class="icon" width="20" height="20" />Import from another forge
  </h2>
  <p class="muted">
    Make a one-time copy of every branch and tag from an HTTPS repository.
  </p>
  <form method="post" action="?/import" class="panel stack">
    <div class="row">
      <label class="field-label with-icon" for="import-url">
        <IcLink class="icon" width="16" height="16" />clone url
      </label>
      <input
        id="import-url"
        type="url"
        name="url"
        required
        placeholder="https://codeberg.org/owner/repo.git"
        autocapitalize="off"
        spellcheck="false"
      />
    </div>
    <div class="row">
      <label class="field-label with-icon" for="import-name">
        <IcLocalOffer class="icon" width="16" height="16" />name
      </label>
      <span class="mono">{data.owner}/</span>
      <input
        id="import-name"
        type="text"
        name="name"
        pattern="[A-Za-z0-9._\-]+"
        placeholder="leave blank to use the source name"
      />
    </div>
    <div class="row">
      <label class="field-label" for="import-visibility">Visibility</label>
      <select id="import-visibility" name="visibility">
        <option value="private">Private</option>
        <option value="public">Public</option>
      </select>
    </div>
    <div class="row">
      <label class="field-label" for="import-token">Access token</label>
      <input
        id="import-token"
        type="password"
        name="token"
        autocomplete="off"
        maxlength="4096"
        placeholder="Read-access token for a private source"
      />
    </div>
    <div class="row">
      <label class="field-label" for="import-username">Source username</label>
      <input
        id="import-username"
        type="text"
        name="username"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        maxlength="255"
        placeholder="If required by the source forge"
      />
    </div>
    <div>
      <button type="submit" class="primary">
        <IcDownload class="icon" width="16" height="16" />import
      </button>
    </div>
  </form>
</div>
