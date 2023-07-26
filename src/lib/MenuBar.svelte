<script>
  export let toggleWebcam;
  export let toggleVideoList;
  
  import { navigate } from "svelte-routing";
  import { Button } from "./components/ui/button";

  import GoArchive from "svelte-icons/go/GoArchive.svelte";
  import GoDeviceCameraVideo from "svelte-icons/go/GoDeviceCameraVideo.svelte";
  import GoGear from "svelte-icons/go/GoGear.svelte";

  const openSettings = () => navigate("/settings");
</script>

<div
  id="menuBar"
  class="bg-background border-b w-full fixed left-0 top-0 p-2 flex items-center justify-between z-9999"
>
  <div class="flex">
    <Button
      variant="outline"
      id="toggleVideoList"
      class="menu-button rounded bg-primary-600 text-white px-2 md:px-4 md:py-2"
      on:click={toggleVideoList}
    >
      <GoArchive class="mr-1 w-2 h-2 inline-block menu-icon" />
      <span
        class="ml-2 hidden md:inline-block whitespace-nowrap text-sm md:text-base"
        >Previous Sessions</span
      >
    </Button>
    <Button
      variant="outline"
      id="toggleWebcam"
      class="menu-button rounded bg-primary-600 text-white px-2 md:px-4 md:py-2 mx-2"
      on:click={toggleWebcam}
    >
      <GoDeviceCameraVideo class="mr-1 w-2 h-2 inline-block menu-icon" />
      <span
        class="ml-2 hidden md:inline-block whitespace-nowrap text-sm md:text-base"
        >Record Session</span
      >
    </Button>
  </div>
  <div>
    <Button
      variant="outline"
      id="openSettings"
      class="menu-button rounded bg-primary-600 text-white px-2 md:px-4 md:py-2"
      on:click={openSettings}
    >
      <GoGear class="mr-1 w-2 h-2 inline-block menu-icon" />
      <span
        class="ml-2 hidden md:inline-block whitespace-nowrap text-sm md:text-base"
        >Settings</span
      >
    </Button>
  </div>
</div>

<style>
  @media (max-width: 600px) {
    #menuBar {
      flex-wrap: nowrap;
    }

    #toggleVideoList span,
    #toggleWebcam span,
    #openSettings span {
      display: none;
    }

    #toggleVideoList::after,
    #toggleWebcam::after,
    #openSettings::after {
      display: none;
    }

    .menu-button {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1px 1px; /* decrease padding */
      min-width: 0;
      margin-right: 0; /* remove right margin */
    }

    .menu-icon {
      width: 1rem;
      height: 1rem;
      margin-right: 0;
    }
  }
</style>
