<script lang="ts">
  import { Button } from "../lib/components/ui/button";
  import { whisperAPIKey } from "../lib/stores/configStore.js";
  import { promptTextWithChatGPT } from "../lib/promptTextWithChatGPT.ts";
  import { OpenAI } from "langchain/llms/openai";
  import { writable } from "svelte/store";

  export let video;
  export let promptedText = "";
  export let prompt_answer = "";
  let promptInputs = writable([{ id: 1, value: promptedText || "" }]);
  let promptOutputs = writable({});
  let copyStatus = writable({});
  let nextId = 2;

  function addPrompt() {
    promptInputs.update((p) => [...p, { id: nextId++, value: "" }]);
  }

  function handleClose(id) {
    promptInputs.update((p) => p.filter((prompt) => prompt.id !== id));
    promptOutputs.update((o) => {
      const { [id]: _, ...rest } = o;
      return rest;
    });
  }

  async function handlePrompting(id, event) {
    event.preventDefault();
    const promptInput = $promptInputs.find((p) => p.id === id);
    if (promptInput) {
      const promptOutput = await promptTextWithChatGPT(
        "English",
        "Portuguese-BR",
        promptInput.value
      );
      let WHISPER_API_KEY = $whisperAPIKey;
      const model = new OpenAI({
        openAIApiKey: WHISPER_API_KEY,
        maxTokens: 250,
        streaming: true,
      });

      let prompt_answer = "";
      const response = await model.call(promptOutput, {
        callbacks: [
          {
            handleLLMNewToken(token: string) {
              console.log({ token });
              prompt_answer = prompt_answer + token;
            },
          },
        ],
      });

      promptOutputs.update((o) => ({ ...o, [id]: prompt_answer }));
    }
  }

  function copyToClipboard(id, text) {
    navigator.clipboard.writeText(text.trim());
    copyStatus.update((s) => ({ ...s, [id]: true }));
    setTimeout(() => {
      copyStatus.update((s) => ({ ...s, [id]: false }));
    }, 2000);
  }
</script>

{#if video}
  <div class="prompt-results-section">
    <h2 class="text-3xl text-foreground my-2">Prompts</h2>

    {#each $promptInputs as promptInput (promptInput.id)}
      <div class="prompt-input-section">
        <div class="prompt-header full-width-on-mobile">
          <h2 class="text-xl text-foreground my-2">
            Prompt #{promptInput.id}
          </h2>
          <Button
            variant="outline"
            type="button"
            on:click={() => handleClose(promptInput.id)}
            class="close-button"
          >
            Close
          </Button>
        </div>
        <section
          class="transcription-container full-width-on-mobile p-5 text-background bg-white rounded-md align-middle text-left"
        >
          <div>
            <textarea bind:value={promptInput.value} class="my-2 w-full" />
          </div>
          <div class="right-align">
            <Button
              variant="outline"
              type="button"
              on:click={() =>
                copyToClipboard(promptInput.id, promptInput.value)}
              class="copy-button"
            >
              {#if $copyStatus[promptInput.id]}
                Copied!
              {:else}
                Copy to clipboard
              {/if}
            </Button>
          </div>
        </section>

        <form
          class="my-2 align-middle full-width-on-mobile rounded-none"
          method="POST"
          on:submit|preventDefault={(event) =>
            handlePrompting(promptInput.id, event)}
        >
          <Button type="submit" class="w-full">
            Run Prompt
          </Button>
        </form>

        {#if $promptOutputs[promptInput.id]}
          <section
            class="transcription-container full-width-on-mobile p-5 text-background bg-foreground rounded-md align-middle text-left"
          >
            <div class="prompt-output">
              {$promptOutputs[promptInput.id]}
            </div>
            <div class="right-align">
              <Button
                variant="outline"
                type="button"
                on:click={() =>
                  copyToClipboard(
                    promptInput.id,
                    $promptOutputs[promptInput.id]
                  )}
                class="copy-button"
              >
                {#if $copyStatus[promptInput.id]}
                  Copied!
                {:else}
                  Copy to clipboard
                {/if}
              </Button>
            </div>
          </section>
        {/if}
      </div>
    {/each}

    <form class="my-3 align-middle full-width-on-mobile">
      <Button
        variant="outline"
        type="button"
        on:click={addPrompt}
        class="w-full"
      >
        New Prompt
      </Button>
    </form>
  </div>
{/if}

<style>
  .prompt-results-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    margin-top: 2rem;
    width: 100%;
  }

  .prompt-input-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    margin-top: 2rem;
    width: 100%;
  }

  .prompt-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 90%;
  }

  .full-width-on-mobile {
    width: 100%;
    max-width: 90%;
  }

  @media (max-width: 768px) {
    .full-width-on-mobile {
      max-width: 100%;
    }
  }

  textarea,
  .prompt-output {
    min-height: 100px;
    resize: vertical;
    width: 100%;
    border: none;
    padding: 10px;

    outline: none; /* remove browser default outline */
    border-radius: 5px;
  }

  .prompt-output {
    min-height: 100px;
    padding: 10px;
    border-radius: 5px;

    color: black;
    width: 100%;
    margin-bottom: 10px;
  }

  .close-button {
    margin-left: auto;
    color: red;
  }

  .prompt-header {
    display: flex;
    justify-content: space-between;
    width: 100%;
    margin: 4px;
  }

  .flex-container {
    display: flex;
    justify-content: space-between;
    align-items: start; /* Align items to the start of the container */
  }

  .flex-grow {
    flex-grow: 1; /* Allow the textarea to take up the remaining space */
    margin-right: 1rem; /* Add some margin between the textarea and the button */
  }

  .copy-button {
    white-space: nowrap; /* Keep the button text on a single line */
  }

  .right-align {
    text-align: right;
  }
</style>
