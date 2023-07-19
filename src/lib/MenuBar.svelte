<script>
  export let toggleWebcam;
  export let toggleVideoList;
  import { navigate } from "svelte-routing";
  import { Button } from "./components/ui/button";

  import GoArchive from "svelte-icons/go/GoArchive.svelte";
  import GoDeviceCameraVideo from "svelte-icons/go/GoDeviceCameraVideo.svelte";
  import GoGear from "svelte-icons/go/GoGear.svelte";

  const openConfig = () => navigate("/config");
</script>

<div
  id="menuBar"
  class="bg-surface-200"
  style="width: 100%; position: fixed; align-self: left; left: 0; top: 0; padding: 10px; display: flex; align-items: center; flex-direction: row;"
>
  <div>
    <Button
      variant="outline"
      id="toggleVideoList"
      class="menu-button rounded-sm bg-primary-600 text-white px-4 py-2 mr-2"
      on:click={toggleVideoList}
    >
      <GoArchive class="button-icon" />
      <span class="button-text">Previous Sessions</span>
    </Button>
    <Button
      variant="outline"
      id="toggleWebcam"
      class="menu-button rounded-sm bg-primary-600 text-white px-4 py-2 mr-2"
      on:click={toggleWebcam}
    >
      <GoDeviceCameraVideo class="button-icon" />
      <span class="button-text">Record Session</span>
    </Button>
  </div>
  <Button
    variant="outline"
    id="openConfig"
    class="menu-button rounded-sm bg-primary-600 text-white px-4 py-2"
    on:click={openConfig}
  >
    <GoGear class="button-icon" /> <span class="button-text">Settings</span>
  </Button>
</div>

<style>
  .button-text {
    display: flex;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: min-content;
    margin: 0.5em;
    flex: 7;
  }

  .button-icon {
    flex: 3;
  }

  .menu-button {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 100px;
    max-width: 300px;
  }

  #menuBar {
    justify-content: space-between;
  }

  @media (min-width: 600px) {
    .button-text {
      display: inline-block;
      max-width: 70%;
    }
  }
</style>
