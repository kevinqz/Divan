<!-- Config.svelte -->
<script>
  import { whisperAPIKey } from "../lib/stores/configStore.js";

  import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "./components/ui/card";
  import { Button } from "./components/ui/button";

  let key = "";

  // Subscribe to the whisperAPIKey store to get the current value
  // This will run whenever the whisperAPIKey store is updated
  whisperAPIKey.subscribe((value) => {
    key = value;
  });

  const updateKey = () => {
    whisperAPIKey.set(key);
  };
</script>

<section class="container mx-auto px-4 mt-28 text-black">
  <div class="w-full max-w-md mx-auto mt-4">
    <div class="shadow-md rounded px-8 pt-6 pb-8 mb-4 flex flex-col border">
      <div class="mb-4">
        <label
          class="block text-foreground mb-2"
          for="whisperKey"
        >
          Enter your Whisper API key:
        </label>
        <input
          class="shadow appearance-none border rounded w-full py-2 px-3 text-background leading-tight focus:outline-none focus:shadow-outline"
          id="whisperKey"
          type="text"
          bind:value={key}
        />
      </div>
      <div class="flex items-center justify-center">
        <!-- Added justify-center here -->
        <Button
          
          on:click={updateKey}
        >
          Update Key
        </Button>
      </div>
    </div>
  </div>
</section>
