<script lang="ts">
  import { browser } from '$app/environment';
  import { UsersListPCStore } from '$houdini';
  import { users } from './store';
  import FriendsList from './FriendsList.svelte';

  const usersStore = new UsersListPCStore();
  let originalUsersStore = new UsersListPCStore();

  $: browser && usersStore.fetch();
  $: browser && originalUsersStore.fetch();

  $: if ($usersStore.data) users.set($usersStore.data?.usersList);

  function cancel() {
    users.set($usersStore.data?.usersList);
  }

  function cancel2() {
    users.set([
      { id: 1, name: 'Name 1' },
      { id: 2, name: 'Name 2' },
      { id: 3, name: 'Name 3' },
      { id: 4, name: 'Name 4' }
    ]);
  }

  function cancel3() {
    users.set($originalUsersStore.data?.usersList);
  }
</script>

<h1>return to original</h1>

<!-- <pre>{JSON.stringify($users, null, 2)}</pre> -->

{#if $users}
  {#each $users as user}
    <div id="parent">
      <div>
        {user.name}
      </div>
      <div id="friends">
        <p>Friends:</p>
        <FriendsList {user} />
      </div>
    </div>
  {/each}
  <button on:click={cancel}>Cancel</button>
  <button on:click={cancel2}>Cancel 2</button>
  <button on:click={cancel3}>Cancel 3</button>
{/if}

<style>
  #parent {
    background-color: lightblue;
    color: black;
    border: solid 1px;
    width: 50%;
  }

  #friends {
    background-color: gray;
    width: 75%;
    margin-top: 20px;
    margin-bottom: 20px;
  }
</style>
