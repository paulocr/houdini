<script lang="ts">
  import { friendsFragmentStore } from '$houdini';

  export let user: any;

  const friendList = (user: any) => new friendsFragmentStore().get(user);

  $: friends = friendList(user);
</script>

<div id="friends">
  {#if $friends}
    {#each $friends.friendsConnection.edges as friend}
      {#if friend.node}
        <div style="padding-left: 10px;">{friend.node.name}</div>
      {/if}
    {/each}
  {/if}
</div>
