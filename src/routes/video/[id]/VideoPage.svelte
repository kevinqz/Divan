<script>
  import { Button } from "../../../lib/components/ui/button";

  import { whisperAPIKey } from "../../../lib/stores/configStore.js";

  let db;

  let openRequest = indexedDB.open("videoDatabase", 1);

  openRequest.onupgradeneeded = function () {
    db = openRequest.result;
    if (!db.objectStoreNames.contains("videos")) {
      db.createObjectStore("videos", { keyPath: "timestamp" });
    }
  };

  openRequest.onsuccess = function () {
    db = openRequest.result;
  };

  openRequest.onerror = function () {
    console.error("Error", openRequest.error);
  };

  import { recordedVideos } from "../../../lib/stores/store.js";
  import { transcribeAudioWithWhisperApi } from "../../../lib/transcribeAudioWithWhisperApi.ts";

  export let id;

  let isLoading = false;
  let transcribedText = "";
  import { onMount } from "svelte";

  let reversedId;
  let video;

  onMount(() => {
    reversedId = $recordedVideos.length - id - 1;
    video = $recordedVideos[reversedId];
  });

  let previousId;

  $: {
    if (id !== undefined && id !== previousId) {
      reversedId = $recordedVideos.length - id - 1;
      video = $recordedVideos[reversedId];
      previousId = id;
    }
  }

  function updateVideo(reversedId, transcribedText) {
    return new Promise((resolve, reject) => {
      let tx = db.transaction("videos", "readwrite");
      let store = tx.objectStore("videos");
      let videoTimestamp = $recordedVideos[reversedId].timestamp; // Get the timestamp of the video
      let getRequest = store.get(videoTimestamp);

      getRequest.onsuccess = function () {
        let video = getRequest.result; // Get the video object from the request result
        if (!video) {
          reject("Video not found");
          return;
        }
        video.transcription = transcribedText; // Update the transcription

        let putRequest = store.put(video); // Put the updated video back into the store
        putRequest.onsuccess = function () {
          console.log("Video updated successfully");

          // Also update the video in the Svelte store
          let updatedVideos = [...$recordedVideos];
          updatedVideos[reversedId] = video; // Use reversedId here
          recordedVideos.set(updatedVideos);

          resolve(video); // resolve the Promise with the updated video
        };
        putRequest.onerror = function () {
          console.error("Error", putRequest.error);
          reject(putRequest.error);
        };
      };

      getRequest.onerror = function () {
        console.error("Error", getRequest.error);
        reject(getRequest.error);
      };
    });
  }

  const handleTranscription = async (event) => {
    // Prevent the form from submitting and reloading the page
    event.preventDefault();

    isLoading = true;

    let WHISPER_API_KEY = $whisperAPIKey; // from the store
    try {
      transcribedText = await transcribeAudioWithWhisperApi(
        video.audioBlob,
        WHISPER_API_KEY
      );
      video = await updateVideo(reversedId, transcribedText); // Wait for updateVideo to complete and get the updated video

      return transcribedText;
    } catch (error) {
      console.error("Error transcribing audio:", error);
    } finally {
      isLoading = false;
    }
  };

  function formatDate(timestamp) {
    let date = new Date(timestamp);
    return `Video recorded at ${date.getDate()}, ${date.toLocaleString(
      "default",
      { month: "long" }
    )} ${date.getHours()}:${
      date.getMinutes() < 10 ? "0" : ""
    }${date.getMinutes()}`;
  }
</script>

<section class="align-middle p-4 mt-28">
  {#if video}
    <h1 class="text-3xl text-foreground my-2">Video {Number(id) + 1}</h1>
    <p class="text-md text-foreground">{formatDate(video.timestamp)}</p>
    <video
      class="mx-auto my-4 mb-2 rounded-sm w-1/2"
      src={URL.createObjectURL(video.blob)}
      autoplay={true}
      muted={true}
      controls
      width="640"
      height="480"
    />
    <!-- <audio
      class="mx-auto my-4 rounded-sm"
      src={URL.createObjectURL(video.audioBlob)}
      autoplay={false}
      controls
    /> -->
    <form
      class="my-3"
      method="POST"
      on:submit|preventDefault={handleTranscription}
    >
      <!-- Transcribe -->
      {#if isLoading}
        <Button
          variant="outline"
          disabled
          class="w-1/2"
        >
          Transcribing...
        </Button>
      {:else}
        <Button
          variant="outline"
          type="submit"
          class="w-1/2"
        >
          Transcribe
        </Button>
      {/if}
    </form>

    <!-- Text -->
    <section
      class="p-5 text-background bg-foreground w-1/2 rounded-md align-middle text-left mx-auto"
    >
      {video.transcription || "No transcription available"}
    </section>
  {:else}
    <p>Select a video.</p>
  {/if}
</section>
