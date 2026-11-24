<!-- src/routes/[owner]/[name=repo]/blob/[...path]/+page.svelte
     LICENCED DASL-1.0 (c) Clove Twilight
-->

<script lang="ts">
  import IcArrowBack from "~icons/ic/outline-arrow-back";
  import IcCode from "~icons/ic/outline-code";
  import IcDescription from "~icons/ic/outline-description";
  import { fmtBytes } from "#lib";
  import Meta from "#lib/components/Meta.svelte";
  import RepoNav from "#lib/components/RepoNav.svelte";
  import Tabs from "#lib/components/Tabs.svelte";

  let { data } = $props();

  const up = $derived(data.path.split("/").slice(0, -1).join("/"));
  const size = $derived(fmtBytes(data.bytes));
  const views = $derived([
    {
      id: "preview",
      label: "Preview",
      icon: IcDescription,
      href: data.query || "?",
    },
    {
      id: "source",
      label: "Source",
      icon: IcCode,
      href: data.query ? `${data.query}&view=source` : "?view=source",
    },
  ]);
</script>

<Meta
  title={data.path}
  description="{data.path} in {data.owner}/{data.name}."
  image={data.embedImage}
/>

<div class="page">
  <div class="page-head">
    <p class="eyebrow">{data.owner}/{data.name}</p>
    <h1 class="path">{data.path}</h1>
  </div>

  <RepoNav owner={data.owner} name={data.name} active="tree" query={data.query} canManage={data.canManage} />

  <p class="muted">
    <a class="with-icon" href="/{data.owner}/{data.name}/tree/{up}{data.query}">
      <IcArrowBack class="icon" width="16" height="16" />back to {up || "tree"}
    </a>
  </p>

  {#if data.binary}
    <p class="muted">binary file not shown ({size})</p>
  {:else}
    {#if data.truncated}
      <p class="muted">Showing the first part of a {size} file. Clone the repository to read all of it.</p>
    {/if}
    {#if data.isMarkdown}
      <Tabs active={data.preview === null ? "source" : "preview"} items={views} />
    {/if}

    {#if data.languages.length}
      <form class="language-picker" method="GET">
        {#if data.revision}
          <input type="hidden" name="h" value={data.revision} />
        {/if}
        {#if data.isMarkdown}
          <input type="hidden" name="view" value="source" />
        {/if}
        <label for="source-language">Language</label>
        <select id="source-language" name="language" value={data.language}>
          <option value="">Automatic</option>
          {#each data.languages as language (language)}
            <option value={language}>{language}</option>
          {/each}
        </select>
        <button class="btn small" type="submit">Apply</button>
      </form>
    {/if}

    {#if data.preview !== null}
      <article class="readme">{@html data.preview}</article>
    {:else if data.highlighted !== null}
      <pre class="code"><code>{@html data.highlighted}</code></pre>
    {:else}
      <pre class="code"><code>{data.text}</code></pre>
    {/if}
  {/if}
</div>

<style>
  .path {
    font-size: clamp(1.4rem, 4vw, 2rem);
    overflow-wrap: anywhere;
  }

  p {
    margin: 0;
  }

  .language-picker {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
</style>
