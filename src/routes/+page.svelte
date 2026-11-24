<!-- src/routes/+page.svelte
     LICENCED DASL-1.0 (c) Clove Twilight
-->

<script lang="ts">
  import { displayName } from "#lib";
  import Avatar from "#lib/components/Avatar.svelte";
  import Meta from "#lib/components/Meta.svelte";

  let { data } = $props();
</script>

<Meta title={data.site.title} />

<div class="page">
  <h1>Users</h1>

  {#if data.users.length}
    <ul class="panel users">
      {#each data.users as user (user.slug)}
        {@const name = displayName(user)}
        <li>
          <a class="user" href="/{user.slug}">
            <Avatar profile={user} size="sm" />
            <span>{name}</span>
            {#if name !== user.slug}
              <span class="muted">@{user.slug}</span>
            {/if}
          </a>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="empty">No users yet.</p>
  {/if}
</div>

<style>
  .users {
    margin: 0;
    padding: 0;
    gap: 0;
    list-style: none;
  }

  li + li {
    border-top: 1px solid var(--line);
  }

  .user {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    overflow-wrap: anywhere;
  }
</style>
