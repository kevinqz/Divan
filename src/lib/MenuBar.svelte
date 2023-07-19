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
  class="bg-background border-b w-full fixed left-0 top-0 p-2 flex items-center flex-wrap z-9999 justify-between"
>
  <div class="flex">
    <Button
      variant="outline"
      id="toggleVideoList"
      class="flex-shrink-0 menu-button rounded bg-primary-600 text-white px-2 md:px-4 md:py-2 mr-2"
      on:click={toggleVideoList}
    >
      <GoArchive class="mr-1 w-2 h-2 inline-block" />
      <span
        class="ml-2 hidden md:inline-block whitespace-nowrap text-sm md:text-base"
        >Previous Sessions</span
      >
    </Button>
    <Button
      variant="outline"
      id="toggleWebcam"
      class="flex-shrink-0 menu-button rounded bg-primary-600 text-white px-2 md:px-4 md:py-2 mr-2"
      on:click={toggleWebcam}
    >
      <GoDeviceCameraVideo class="mr-1 w-2 h-2 inline-block" />
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
      class="flex-shrink-0 menu-button rounded bg-primary-600 text-white px-2 md:px-4 md:py-2"
      on:click={openSettings}
    >
      <GoGear class="mr-1 w-2 h-2 inline-block" />
      <span
        class="ml-2 hidden md:inline-block whitespace-nowrap text-sm md:text-base"
        >Settings</span
      >
    </Button>
  </div>
</div>

<style>
  @media (max-width: 600px) {
    #toggleVideoList span,
    #toggleWebcam span,
    #openSettings span {
      display: none;
    }

    #toggleVideoList::after {
      content: "Prev";
    }

    #toggleWebcam::after {
      content: "Record";
    }

    #openSettings::after {
      content: "Config";
    }
  }
</style>
