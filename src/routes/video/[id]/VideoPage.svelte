<script lang="ts">
  import { writable } from "svelte/store";
  import { Button } from "../../../lib/components/ui/button";
  import { whisperAPIKey } from "../../../lib/stores/configStore.js";
  import { recordedVideos } from "../../../lib/stores/store.js";
  import { transcribeAudioWithWhisperApi } from "../../../lib/transcribeAudioWithWhisperApi.ts";
  import { onMount } from "svelte";
  import PromptingComponent from "../../../lib/PromptingComponent.svelte";

  import { promptTextWithChatGPT } from "../../../lib/promptTextWithChatGPT.ts";
  import { OpenAI } from "langchain/llms/openai";

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

  export let id;
  let isLoading = false;
  let transcribedText = "";
  let promptedText = "";

  let reversedId;
  let video;

  let previousId;

  onMount(() => {
    reversedId = $recordedVideos.length - id - 1;
    video = $recordedVideos[reversedId];
    transcribedText = video.transcription;
    promptedText = video.promptInput || "";
    prompt_answer = video.promptResult || "";
  });

  $: {
    if (id !== undefined && id !== previousId) {
      reversedId = $recordedVideos.length - id - 1;
      video = $recordedVideos[reversedId];
      previousId = id;
      transcribedText = video.transcription;
      promptedText = video.promptInput || "";
      prompt_answer = video.promptResult || "";
    }
  }

  let prompt_answer = "";
  let openPromptComponent = writable(false); // Convert to Svelte store

  function togglePromptingComponent() {
    openPromptComponent.update((value) => !value); // Toggle store value
  }

  function updateVideoTranscription(reversedId, transcribedText) {
    return new Promise((resolve, reject) => {
      let tx = db.transaction("videos", "readwrite");
      let store = tx.objectStore("videos");
      let videoTimestamp = $recordedVideos[reversedId].timestamp;
      let getRequest = store.get(videoTimestamp);

      getRequest.onsuccess = function () {
        let video = getRequest.result;
        if (!video) {
          reject("Video not found");
          return;
        }
        video.transcription = transcribedText;

        let putRequest = store.put(video);
        putRequest.onsuccess = function () {
          console.log("Video updated successfully");

          let updatedVideos = [...$recordedVideos];
          updatedVideos[reversedId] = video;
          recordedVideos.set(updatedVideos);

          resolve(video);
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

  // Refactor the update functions into a more generalized function
  function updateVideo(reversedId, updateData) {
    return new Promise((resolve, reject) => {
      let tx = db.transaction("videos", "readwrite");
      let store = tx.objectStore("videos");
      let videoTimestamp = $recordedVideos[reversedId].timestamp;
      let getRequest = store.get(videoTimestamp);

      getRequest.onsuccess = function () {
        let video = getRequest.result;
        if (!video) {
          reject("Video not found");
          return;
        }
        // Update the video object with the new data
        video = { ...video, ...updateData };

        let putRequest = store.put(video);
        putRequest.onsuccess = function () {
          console.log("Video updated successfully");

          let updatedVideos = [...$recordedVideos];
          updatedVideos[reversedId] = video;
          recordedVideos.set(updatedVideos);

          resolve(video);
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

  // Modify the handleTranscription function to store the transcript text
  const handleTranscription = async (event) => {
    event.preventDefault();
    isLoading = true;
    let WHISPER_API_KEY = $whisperAPIKey; // from the store
    try {
      transcribedText = await transcribeAudioWithWhisperApi(
        video.audioBlob,
        WHISPER_API_KEY
      );
      video = await updateVideo(reversedId, { transcription: transcribedText }); // Wait for updateVideo to complete and get the updated video
    } catch (error) {
      console.error("Error transcribing audio:", error);
    } finally {
      isLoading = false;
    }
  };

  function handlePrompting(event) {
    event.preventDefault();
    togglePromptingComponent();
  }

  // Modify the handlePrompting function to store both the prompted text and the prompt results
  // async function handlePrompting(event) {
  //   event.preventDefault();
  //   isLoading = true;
  //   video.promptResult = "";

  //   try {
  //     promptedText = await promptTextWithChatGPT(
  //       "English",
  //       "Portuguese-BR",
  //       transcribedText
  //     );
  //     let WHISPER_API_KEY = $whisperAPIKey;
  //     const model = new OpenAI({
  //       openAIApiKey: WHISPER_API_KEY,
  //       maxTokens: 250,
  //       streaming: true,
  //     });

  //     prompt_answer = "";
  //     const response = await model.call(promptedText, {
  //       callbacks: [
  //         {
  //           handleLLMNewToken(token: string) {
  //             console.log({ token });
  //             prompt_answer = prompt_answer + token;
  //           },
  //         },
  //       ],
  //     });

  //     video = await updateVideo(reversedId, {
  //       promptInput: promptedText,
  //       promptResult: prompt_answer,
  //     });
  //   } catch (error) {
  //     console.error("Error prompting text:", error);
  //   } finally {
  //     isLoading = false;
  //   }
  // }

  function formatDate(timestamp) {
    let date = new Date(timestamp);
    return `Video recorded at ${date.getDate()}, ${date.toLocaleString(
      "default",
      { month: "long" }
    )} ${date.getHours()}:${
      date.getMinutes() < 10 ? "0" : ""
    }${date.getMinutes()}`;
  }

  let copyStatus = writable({});
  function copyToClipboard(id, text) {
    navigator.clipboard.writeText(text.trim());
    copyStatus.update((s) => ({ ...s, [id]: true }));
    setTimeout(() => {
      copyStatus.update((s) => ({ ...s, [id]: false }));
    }, 2000);
  }
</script>

<!-- the rest of your script remains unchanged -->

<section class="main-container">
  {#if video}
    <div class="video-section">
      <h1 class="text-3xl text-foreground my-2">Video {Number(id) + 1}</h1>
      <p class="text-md text-foreground">{formatDate(video.timestamp)}</p>
      <div
        class="video-container full-width-on-mobile my-4 mb-2 rounded-sm align-middle"
      >
        <video
          src={URL.createObjectURL(video.blob)}
          autoplay={true}
          muted={true}
          controls
          width="100%"
          height="auto"
        />
      </div>
      <form
        class="my-3 align-middle full-width-on-mobile"
        method="POST"
        on:submit|preventDefault={handleTranscription}
      >
        <!-- Transcribe -->
        {#if isLoading}
          <Button variant="outline" disabled class="w-full">
            Transcribing...
          </Button>
        {:else}
          <Button variant="outline" type="submit" class="w-full">
            Transcribe
          </Button>
        {/if}
      </form>

      {#if video.transcription && video.transcription.trim() !== ""}
        <!-- Text -->
        <section
          class="transcription-container full-width-on-mobile p-5 text-background bg-foreground rounded-md align-middle text-left"
        >
          <div class="transcript-output">
            {video.transcription || "No transcription available"}
          </div>
          <div class="right-align">
            <Button
              variant="outline"
              type="button"
              on:click={() =>
                copyToClipboard("transcription", video.transcription)}
              class="copy-button"
            >
              {#if $copyStatus["transcription"]}
                Copied!
              {:else}
                Copy to clipboard
              {/if}
            </Button>
          </div>
        </section>

        <form class="my-3 align-middle full-width-on-mobile">
          <Button
    variant="outline"
    type="button"
    class="w-full"
    on:click={togglePromptingComponent}
>
    {#if $openPromptComponent} Close Prompting Component {:else} Open Prompting Component {/if}
</Button>

        </form>
      {/if}
    </div>

    {#if $openPromptComponent}
      <div class="prompting-section">
        <PromptingComponent {video} {promptedText} {prompt_answer} />
      </div>
    {/if}
  {/if}
</section>

<!-- the rest of your code remains unchanged -->
<style>
  .main-container {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    height: calc(100vh - 50px); /* Subtract the height of the menubar */
    overflow: hidden;
  }

  .video-section,
  .prompting-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    max-height: 100%; /* Add this line */
    overflow-y: auto; /* Add this line */
    padding-top: 50px;
  }

  .video-section::-webkit-scrollbar,
  .prompting-section::-webkit-scrollbar {
    display: none;
  }

  .video-section,
  .prompting-section {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .full-width-on-mobile {
    width: 100%;
    max-width: 90%;
  }

  @media (max-width: 768px) {
    .video-section,
    .prompting-section {
      margin-right: 0px;
      margin-left: 0px;
    }
    .main-container {
      flex-direction: column;
      height: auto;
    }
    .full-width-on-mobile {
      max-width: 100%;
    }
  }

  .full-width-button {
    width: 100%;
  }

    .copy-button {
    white-space: nowrap; /* Keep the button text on a single line */
  }

  .right-align {
    text-align: right;
  }

  .transcript-output {
    white-space: pre-wrap; /* Wrap long words to fit the container */
    word-wrap: break-word; /* Allow long words to wrap to the next line */
    max-width: 80%; /* Limit the width of the container */
    /* overflow-x: auto;  Add horizontal scrolling to the container */
    margin-bottom: 10px; /* Add some space between the transcript and the button */
  }
</style>
