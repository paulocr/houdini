<script lang="ts">
  import { graphql } from '$houdini';
  import type { PageData } from './$houdini';
  import UserItem from './UserItem.svelte';

  export let data: PageData;
  $: ({ ListUsers } = data);

  const deleteMutation = graphql(`
    mutation DeleteUserFromFragmentList($id: ID!) {
      deleteUser(id: $id, snapshot: "users-list-fragment") {
        userID @User_delete
      }
    }
  `);

  const deleteNestedMutation = graphql(`
    mutation DeleteNestedUserFromFragmentList($id: ID!) {
      deleteUser(id: $id, snapshot: "users-list-fragment") {
        user {
          id @User_delete
        }
      }
    }
  `);
</script>

{#if $ListUsers.data}
  <button
    on:click={() =>
      deleteMutation.mutate({ id: $ListUsers.data?.usersConnection.edges[0].node?.id ?? '' })}
  >
    Delete User
  </button>
  <button
    on:click={() =>
      deleteNestedMutation.mutate({ id: $ListUsers.data?.usersConnection.edges[0].node?.id ?? '' })}
  >
    Delete Nested User
  </button>
  <div id="result">
    <ul>
      {#each $ListUsers.data.usersConnection.edges as userEdge}
        {@const user = userEdge.node}
        {#if user}
          <UserItem {user} />
        {/if}
      {/each}
    </ul>
  </div>
{/if}
