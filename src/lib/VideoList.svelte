<script lang="ts">
  import { recordedVideos } from "./stores/store.js";
  import { navigate } from "svelte-routing";

  import { fly } from "svelte/transition";

  let videos = [];

  function formatTime(time) {
    time = Math.floor(time); // Round down to nearest whole second
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time - hours * 3600) / 60);
    const seconds = time - hours * 3600 - minutes * 60;

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  // Function to download the video
  function downloadVideo(video) {
    let blobURL = URL.createObjectURL(video.blob);
    let a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    a.href = blobURL;
    a.download = `ConciRoom_${video.timestamp}.webm`;
    a.click();
    // Delay revoking the blobURL to allow the download to start
    setTimeout(function () {
      URL.revokeObjectURL(blobURL);
      a.remove();
    }, 100);
  }

  // Function to navigate to video page
  function goToVideoPage(id) {
    navigate(`/video/${id}`);
  }

  // Function to delete the video
  async function deleteVideo(timestamp) {
    // Delete from the store
    let updatedVideos = $recordedVideos.filter(
      (video) => video.timestamp !== timestamp
    );
    recordedVideos.set(updatedVideos);

    // Delete from IndexedDB
    let dbRequest = indexedDB.open("videoDatabase", 2);
    dbRequest.onsuccess = function () {
      let db = dbRequest.result;
      let transaction = db.transaction("videos", "readwrite");
      let store = transaction.objectStore("videos");
      let request = store.delete(timestamp);
      request.onsuccess = function () {
        console.log("Video deleted successfully");
      };
      request.onerror = function () {
        console.error("Error", request.error);
      };
    };
  }

  // Function to load saved videos from IndexedDB
  async function loadSavedVideos() {
    let dbRequest = indexedDB.open("videoDatabase", 2);
    dbRequest.onsuccess = function () {
      let db = dbRequest.result;
      let transaction = db.transaction("videos", "readonly");
      let store = transaction.objectStore("videos");
      let request = store.getAll();
      request.onsuccess = function () {
        let savedVideos = request.result;
        savedVideos.forEach((video) => {
          // Convert ArrayBuffer back into Blob
          video.blob = new Blob([video.blob], { type: "video/webm" });
          video.audioBlob = new Blob([video.audioBlob], {
            type: "audio/ogg; codecs=opus",
          });
        });
        recordedVideos.set(savedVideos);
      };
      request.onerror = function () {
        console.error("Error", request.error);
      };
    };
  }

  loadSavedVideos();

  // Reactive statement to keep track of flattenedVideos
  let flattenedVideos = [];
  $: {
    const totalVideos = $recordedVideos.length; // Get total number of videos

    flattenedVideos = $recordedVideos
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .map((video, index) => {
        const date = new Date(video.timestamp);
        const day = `${date.getDate().toString().padStart(2, "0")}/${(
          date.getMonth() + 1
        )
          .toString()
          .padStart(2, "0")}/${date.getFullYear()}`;

        // Subtract index from totalVideos to get descending IDs
        return { id: totalVideos - 1 - index, day: day, video: video };
      });

    videos = flattenedVideos.reduce((groups, item) => {
      if (!groups[item.day]) {
        groups[item.day] = [];
      }
      groups[item.day].push(item.video);
      return groups;
    }, {});
  }

  let selectedDay = null;

  function selectDay(day) {
    selectedDay = selectedDay === day ? null : day;
  }
  import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "./components/ui/card";
  import { Button } from "./components/ui/button";
    import { Separator } from "./components/ui/separator";
</script>

<aside
  id="videoList"
  class="mt-3 bg-background align-center px-4 border-r"
  style="width: 340px; height: calc(100vh - 200px); position: fixed; left: 0; top: 44px; overflow-y: auto; display: block; z-index: 9995;"
  transition:fly={{ x: -300, duration: 300 }}
>
  {#each Object.keys(videos) as day (day)}
    <div
      class="flex justify-between items-center m-3 p-2 hover:m-3 hover:border-b cursor-pointer"
      on:click={() => selectDay(day)}
    >
      <h4 class="scroll-m-20 text-md font-semibold tracking-tight text-left">
        {day}
      </h4>
      <span>{videos[day].length} videos</span>
    </div>
    {#if day === selectedDay}
      {#each flattenedVideos
        .filter((v) => v.day === day)
        .sort((a, b) => b.id - a.id) as item (item.id)}
        <Card
          class="mb-2 cursor-pointer"
          on:click={() => goToVideoPage(item.id)}
        >
          <CardHeader>
            <CardTitle>Video {item.id + 1}</CardTitle>
            <CardDescription>
              Recorded at: {new Intl.DateTimeFormat("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              }).format(new Date(item.video.timestamp))}
              (Duration: {formatTime(item.video.duration)})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <video
              class="rounded-sm"
              src={URL.createObjectURL(item.video.blob)}
              controls
              width="320"
              height="240"
            />
          </CardContent>
          <CardFooter style="display: flex;">
            <Button
              style="flex: 1;"
              on:click={(event) => {
                event.stopPropagation();
                downloadVideo(item.video);
              }}
            >
              Download
            </Button>
            <Button
              style="flex: 1;"
              class="text-red-800 font-medium ml-2"
              on:click={(event) => {
                event.stopPropagation();
                deleteVideo(item.video.timestamp);
              }}
            >
              Remove
            </Button>
          </CardFooter>
        </Card>
      {/each}
    {/if}
  {/each}
   </aside>
<div class="bg-background pt-6 bg-background align-center px-4 border-r"style="position: fixed; padding-bottom: 14px; bottom: 0; height: 150px; width: 340px; left: 0px; z-index: 9996;" transition:fly={{ x: -300, duration: 300 }}>
  <div class="space-y-1">
    <h4 class="text-sm font-medium leading-none">Conci Room</h4>
    <p class="text-sm text-muted-foreground">
      Video Journaling, Augmented by AI
    </p>
    <p class="text-sm text-muted-foreground">
      Build by Kevin Saltarelli
    </p>
  </div>
  <Separator class="my-4 mx-auto align-center" />
  <div class="flex h-5 items-center space-x-4 text-sm justify-center">
    <div>Blog</div>
    <Separator orientation="vertical" />
    <div>Docs</div>
    <Separator orientation="vertical" />
    <div>Source</div>
  </div>
</div>


<style>
  #videoList::-webkit-scrollbar {
    display: none;
  }

  #videoList {
    -ms-overflow-style: none; /* Internet Explorer and Edge */
    scrollbar-width: none; /* Firefox */
  }
</style>
