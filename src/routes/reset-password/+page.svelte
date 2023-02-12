<script lang="ts">
  import type { ActionResult } from "@sveltejs/kit";
  import axios from "axios";

  let newPass: string;
  let confirmPass: string;
  let err = "";
  let suc = "";

  const resetPassword = async () => {
    if (newPass !== confirmPass) return (err = "Passwords do not match");

    err = suc = "";

    try {
      const { data } = await axios.postForm<ActionResult>("", { newPass });
      if (data.type === "success") {
        suc = "Password changed successfully";
        window.location.href = "/signin";
      } else err = "Something went wrong";
    } catch (error) {
      console.log(error);
      err = error?.response?.data?.error?.message;
    }
  };

  $: if (newPass || confirmPass) err = suc = "";
</script>

<form on:submit|preventDefault={resetPassword}>
  <input
    class="input"
    type="password"
    autocomplete="new-password"
    placeholder="New Password"
    bind:value={newPass}
  />
  <input
    class="input"
    type="password"
    autocomplete="new-password"
    placeholder="Confirm Password"
    bind:value={confirmPass}
  />

  <button
    class="my-4 btn btn-primary"
    type="submit"
    disabled={!newPass || !confirmPass}
  >
    Reset Password
  </button>

  {#if err}
    <div class="text-error text-sm">{err}</div>
  {:else if suc}
    <div class="text-success text-sm">{suc}</div>
  {/if}
</form>
