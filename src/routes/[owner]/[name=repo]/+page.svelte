<!-- src/routes/[owner]/[name=repo]/+page.svelte
     LICENCED DASL-1.0 (c) Clove Twilight
-->

<script lang="ts">
  import type { Component } from "svelte";
  import IcArrowDownward from "~icons/ic/outline-arrow-downward";
  import IcArrowUpward from "~icons/ic/outline-arrow-upward";
  import IcCancel from "~icons/ic/outline-cancel";
  import IcCheckCircle from "~icons/ic/outline-check-circle";
  import IcDescription from "~icons/ic/outline-description";
  import IcDownload from "~icons/ic/outline-download";
  import IcHelpOutline from "~icons/ic/outline-help-outline";
  import IcHome from "~icons/ic/outline-home";
  import IcLock from "~icons/ic/outline-lock";
  import IcOpenInNew from "~icons/ic/outline-open-in-new";
  import IcPublic from "~icons/ic/outline-public";
  import IcStorage from "~icons/ic/outline-storage";
  import IcWarning from "~icons/ic/outline-warning";
  import Meta from "#lib/components/Meta.svelte";
  import RepoNav from "#lib/components/RepoNav.svelte";
  import RevPicker from "#lib/components/RevPicker.svelte";
  import Visibility from "#lib/components/Visibility.svelte";

  let { data } = $props();

  // The glyph names src/lib/server/mirrorview.ts hands out
  const MIRROR_GLYPHS: Record<string, Component> = {
    "check-circle": IcCheckCircle,
    "arrow-upward": IcArrowUpward,
    "arrow-downward": IcArrowDownward,
    warning: IcWarning,
    lock: IcLock,
    cancel: IcCancel,
    "help-outline": IcHelpOutline,
  };

  const title = $derived(`${data.owner}/${data.name}`);
</script>

<Meta
  {title}
  description={data.metaDescription}
  noindex={!data.isPublic}
  image={data.embedImage}
/>

<div class="page">
  <div class="page-head">
    <p class="eyebrow">repository</p>
    <h1 class="repo-title">
      {#if data.repoImage}
        <img class="repo-image" src={data.repoImage} alt="" width="48" height="48" />
      {/if}
      <span><a class="owner" href="/{data.owner}">{data.owner}</a>/{data.name}</span>
    </h1>
    <p class="muted meta">
      <Visibility isPublic={data.isPublic} />
      {#if data.canPush && !data.isOwner}
        <span class="badge accent"><IcOpenInNew class="icon" width="12" height="12" /> you can push</span>
      {/if}
    </p>
  </div>

  <RepoNav owner={data.owner} name={data.name} active="summary" query={data.query} canManage={data.canPush} />

  {#if data.rawDescription}
    <p class="muted">{data.rawDescription}</p>
  {/if}

  <RevPicker refs={data.refs} rev={data.rev} />

  <section class="panel">
    <span class="field-label with-icon"><IcDownload class="icon" width="16" height="16" />clone</span>
    <code>git clone {data.cloneUrl}</code>
  </section>

  {#if data.empty && data.canPush}
    <section class="panel">
      <p><strong>This repository is empty.</strong> Push to get started:</p>
      <pre class="code"><code>git remote add mirror {data.cloneUrl}
git push --mirror mirror</code></pre>
      <p class="muted">
        When prompted, the <strong>username</strong> is <code>{data.pusher}</code> and the
        <strong>password</strong> is a token from <a href="/settings/tokens">settings</a>.
      </p>
    </section>
  {:else if data.empty}
    <p class="panel empty">This repository is empty.</p>
  {/if}

  {#if data.mirrors.length > 0}
    <h2 class="section-title"><IcStorage class="icon" width="20" height="20" />External mirrors</h2>

    <section class="panel mirrors">
      {#each data.mirrors as mirror (mirror.kind)}
        {@const Glyph = MIRROR_GLYPHS[mirror.glyph] ?? IcHelpOutline}
        <div class="mirror-row">
          <a class="with-icon" href={mirror.url} rel="nofollow noopener noreferrer">
            <IcPublic class="icon" width="16" height="16" />{mirror.slug}
          </a>
          <span class="{mirror.cls} with-icon">
            <Glyph class="icon" width="16" height="16" />{mirror.label}
          </span>
          <span class="mono">{mirror.sha}</span>
          <span class="muted">{mirror.detail}</span>
        </div>
        {#if mirror.note}
          <p class={mirror.noteCls}>{mirror.note}</p>
        {/if}
      {/each}

      {#if data.localSha}
        <div class="mirror-row">
          <span class="with-icon"><IcHome class="icon" width="16" height="16" />local</span>
          <span class="empty">this repository</span>
          <span class="mono">{data.localSha.slice(0, 7)}</span>
          <span></span>
        </div>
      {/if}
    </section>
  {/if}

  {#if data.readme}
    <h2 class="section-title"><IcDescription class="icon" width="20" height="20" />{data.readme.path}</h2>
    <article class="readme">{@html data.readme.html}</article>
  {:else if !data.empty}
    <h2 class="section-title"><IcDescription class="icon" width="20" height="20" />Readme</h2>
    <p class="empty">No ReadMe was found, commit one to add a summary</p>
  {/if}
</div>

<style>
  .owner {
    color: var(--muted);
    text-decoration: none;
  }

  .repo-title {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }

  .repo-image {
    flex-shrink: 0;
    border-radius: 0.75rem;
    outline: 1px solid var(--line);
    object-fit: cover;
  }

  .repo-title span {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .mirrors {
    gap: 0.5rem;
  }

  .mirror-row {
    display: grid;
    grid-template-columns: minmax(10rem, 1.2fr) minmax(9rem, 1fr) 5rem 2fr;
    gap: 0.75rem;
    align-items: center;
  }

  .mirrors p {
    margin: 0;
  }

  @media (max-width: 40rem) {
    .mirror-row {
      grid-template-columns: 1fr 1fr;
    }
  }
</style>
