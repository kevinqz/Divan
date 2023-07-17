<script>
  import { onMount } from "svelte";
  import { recordedVideos } from "./store.js";

  export let id;

  let video;
  let isLoading = false;
  let transcribedText = "";

  const handleTranscription = async () => {
    isLoading = true;

    const file = video.blob;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("model", "whisper-1");

    try {
      const response = await fetch(
        "https://api.openai.com/v1/audio/transcriptions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer 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`,
          },
          body: formData,
        }
      );

      if (response.ok) {
        const data = await response.json();
        transcribedText = data?.text || "Transcription could not be completed";
      } else {
        const errorData = await response.json();
        console.error("Transcription request failed. Error:", errorData);
        transcribedText = "Transcription request failed";
      }
    } catch (error) {
      console.error("Error during transcription:", error);
      transcribedText = "An error occurred during transcription";
    }

    isLoading = false;
  };

  $: {
    video = $recordedVideos[id];
  }

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
    <h1>Video {Number(id) + 1}</h1>
    <p>{formatDate(video.timestamp)}</p>
    <video
      class="mx-auto m-4 rounded-sm"
      src={URL.createObjectURL(video.blob)}
      autoplay={true}
      controls
      width="640"
      height="480"
    />

    <!-- Transcribe -->
    {#if isLoading}
      <button
        disabled
        class="w-1/2 opacity-50 rounded-md bg-indigo-600 py-2.5 px-3.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        Transcribing...
      </button>
    {:else}
      <button
        on:click={handleTranscription}
        type="submit"
        class="w-1/2 rounded-md bg-indigo-600 py-2.5 px-3.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        Transcribe
      </button>
    {/if}

    <!-- Text -->
    <section class="mt-5">{transcribedText}</section>
  {:else}
    <p>Select a video.</p>
  {/if}
</section>
