<script lang="ts">
  import { Toggle } from "../lib/components/ui/toggle";
  import { Button } from "../lib/components/ui/button";
  import { whisperAPIKey } from "../lib/stores/configStore.js";
  import { promptTextWithChatGPT } from "../lib/promptTextWithChatGPT.ts";
  import { OpenAI } from "langchain/llms/openai";
  import { writable } from "svelte/store";

  import { Checkbox } from "../lib/components/ui/checkbox";
  import { Label } from "../lib/components/ui/label";

  export let video;
  export let promptedText = "";
  export let prompt_answer = "";
  let preFillTranscription = writable(true);
  let checked = true; // Intermediate variable
  let promptInputs = writable(
    JSON.parse(localStorage.getItem("promptInputs")) || [
      { id: 1, value: promptedText || "", preFillTranscription: true },
    ]
  );

  // let nextId = Math.max(...$promptInputs.map(p => p.id)) + 1;

  let promptOutputs = writable({});
  let copyStatus = writable({});

  let hiddenPrompts = writable(
    JSON.parse(localStorage.getItem("hiddenPrompts")) || []
  );

  // Save the state of the prompt inputs to localStorage every time they change
  $: {
    localStorage.setItem("promptInputs", JSON.stringify($promptInputs));
  }

  // Update the preFillTranscription store whenever `checked` is updated
  $: preFillTranscription.set(checked);

  // Save the state of the hidden prompts to localStorage every time they change
  $: {
    localStorage.setItem("hiddenPrompts", JSON.stringify($hiddenPrompts));
  }

  function togglePromptVisibility(id) {
    hiddenPrompts.update((hidden) => {
      if (hidden.includes(id)) {
        return hidden.filter((hiddenId) => hiddenId !== id);
      } else {
        return [...hidden, id];
      }
    });
  }

  let nextId =
    Number(localStorage.getItem("nextId")) ||
    Math.max(...$promptInputs.map((p) => p.id)) + 1;

  function addPrompt() {
    promptInputs.update((p) => [
      ...p,
      { id: nextId, value: "", preFillTranscription: true },
    ]);
    nextId++;
    localStorage.setItem("nextId", nextId.toString());
  }

  function checkboxHandler() {
    preFillTranscription.update((value) => !value);
  }

  function handleClose(id) {
    promptInputs.update((p) => p.filter((prompt) => prompt.id !== id));
    promptOutputs.update((o) => {
      const { [id]: _, ...rest } = o;
      return rest;
    });
    localStorage.removeItem("promptInputs");
  }

  function handleCheckboxUpdate(id, checked) {
    promptInputs.update((inputs) => {
      return inputs.map((input) => {
        if (input.id === id) {
          return { ...input, preFillTranscription: checked };
        } else {
          return input;
        }
      });
    });
  }

  async function handlePrompting(id, event) {
    event.preventDefault();
    const promptInput = $promptInputs.find((p) => p.id === id);
    if (promptInput) {
      let input = promptInput.value;
      if ($preFillTranscription) {
        input = `[${video.transcription}]\n\n` + input;
      }
      const promptOutput = await promptTextWithChatGPT(
        "English",
        "Portuguese-BR",
        input
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
              promptOutputs.update((o) => ({ ...o, [id]: prompt_answer })); // update the store with the new token
            },
          },
        ],
      });
    }
  }

  function copyToClipboard(id, text) {
    navigator.clipboard.writeText(text.trim());
    copyStatus.update((s) => ({ ...s, [id]: true }));
    setTimeout(() => {
      copyStatus.update((s) => ({ ...s, [id]: false }));
    }, 2000);
  }

  async function pasteFromClipboard(id) {
    const text = await navigator.clipboard.readText();
    promptInputs.update((inputs) => {
      return inputs.map((input) => {
        if (input.id === id) {
          return { ...input, value: input.value + text };
        } else {
          return input;
        }
      });
    });
    copyStatus.update((s) => ({ ...s, [id]: "Pasted!" }));
    setTimeout(() => {
      copyStatus.update((s) => ({ ...s, [id]: false }));
    }, 2000);
  }

  function toggleAllPromptVisibility() {
    hiddenPrompts.update(($hiddenPrompts) => {
      const allIds = $promptInputs.map((input) => input.id);
      let newHiddenIds;
      if ($hiddenPrompts.length === allIds.length) {
        newHiddenIds = [];
      } else {
        newHiddenIds = allIds;
      }
      return newHiddenIds;
    });
  }

  function closeAllPrompts() {
    promptInputs.set([]);
    promptOutputs.set({});
    localStorage.removeItem("promptInputs");
  }

  async function handlePromptingAll() {
  for (let promptInput of $promptInputs) {
    let input = promptInput.value;
    if (promptInput.preFillTranscription) {
      input = `[${video.transcription}]\n\n` + input;
    }
    const promptOutput = await promptTextWithChatGPT(
      "English",
      "Portuguese-BR",
      input
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
            promptOutputs.update((o) => ({ ...o, [promptInput.id]: prompt_answer })); // update the store with the new token
          },
        },
      ],
    });
  }
}

</script>

<div class="prompt-results-section">
  <div class="prompt-header full-width-on-mobile flex justify-between">
    <h2 class="text-3xl text-foreground my-2">Prompts</h2>
    <div class="flex space-x-2">
      <Button
        variant="destructive"
        type="button"
        on:click={closeAllPrompts}
        class="close-button"
      >
        Close All
      </Button>
      <Button
        variant="secondary"
        type="button"
        on:click={toggleAllPromptVisibility}
        class="hide-button"
      >
        {#if $hiddenPrompts.length === $promptInputs.length}
          Show All
        {:else}
          Hide All
        {/if}
      </Button>
      <Button
  type="button"
  on:click={handlePromptingAll}
  class="run-all-button"
>
  Run All Prompts
</Button>

    </div>
  </div>

  {#if video}
    <div class="prompt-results-section">
      {#each $promptInputs as promptInput, index (index)}
        <div class="prompt-input-section">
          <div class="prompt-header full-width-on-mobile flex justify-between">
            <h2 class="text-xl text-foreground my-2">
              Prompt #{promptInput.id}
            </h2>
            <div class="flex space-x-2">
              <div class="flex items-center space-x-2">
                <Checkbox
                  id={"preFillTranscription" + promptInput.id}
                  bind:checked={promptInput.preFillTranscription}
                />
                <Label for={"preFillTranscription" + promptInput.id}
                  >Pre-fill with transcription</Label
                >
                
              </div>
              <Button
                variant="destructive"
                type="button"
                on:click={() => handleClose(promptInput.id)}
                class="close-button"
              >
                Close
              </Button>
              <Button
                variant="secondary"
                type="button"
                on:click={() => togglePromptVisibility(promptInput.id)}
                class="hide-button"
              >
                {#if $hiddenPrompts.includes(promptInput.id)}
                  Show Prompt Input
                {:else}
                  Hide Prompt Input
                {/if}
              </Button>
            </div>
          </div>

          {#if !$hiddenPrompts.includes(promptInput.id)}
            <section
              class="transcription-container full-width-on-mobile p-5 text-background bg-white rounded-md align-middle text-left"
              class:hidden={$hiddenPrompts.includes(promptInput.id)}
            >
              <div>
                <textarea bind:value={promptInput.value} class="my-2 w-full" />

              </div>
              <div class="right-align flex items-center justify-between">
                <div class="flex items-center space-x-4" />

                <div>
                  <Button
                    variant="outline"
                    type="button"
                    on:click={() => pasteFromClipboard(promptInput.id)}
                    class="copy-button"
                  >
                    {#if $copyStatus[promptInput.id] === "Pasted!"}
                      Pasted!
                    {:else}
                      Paste from clipboard
                    {/if}
                  </Button>

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
              </div>
            </section>
          {/if}

          <form
            class="my-2 align-middle full-width-on-mobile rounded-none"
            method="POST"
            on:submit|preventDefault={(event) =>
              handlePrompting(promptInput.id, event)}
          >
            <Button type="submit" class="w-full">Run Prompt</Button>
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
</div>

<style>

  textarea:focus,
  textarea:active {
    outline: none;
  }

  textarea {
                  height: 250px;
    width: 100%;
    border: none;
    padding: 10px;
    border-radius: 5px;
    overflow: auto;
    resize: none;
  }
                  
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

  .hidden {
    display: none;
  }
</style>
