<script lang="ts">
  import type { ActionResult } from "@sveltejs/kit";
  import axios from "axios";

  let email: string;
  let err = "";
  let suc = "";

  const forgotPassword = async () => {
    err = suc = "";

    try {
      const { data } = await axios.postForm<ActionResult>("", { email });

      if (data.type === "success")
        suc = "Check your email for a link to reset your password.";
      else err = "There was an error sending the email.";
    } catch (error) {
      console.log(error);
      // Convoluted way to get the error message from axios
      err = error?.response?.data?.error?.message;
    }
  };

  $: if (email) err = suc = "";
</script>

<form on:submit|preventDefault={forgotPassword}>
  <input
    class="input"
    type="email"
    autocomplete="email"
    placeholder="Email"
    bind:value={email}
  />

  <button class="my-4 btn btn-primary" type="submit" disabled={!email}>
    Send Password Reset Email
  </button>

  {#if err}
    <div class="text-error text-sm">{err}</div>
  {:else if suc}
    <div class="text-success text-sm">{suc}</div>
  {/if}
</form>
