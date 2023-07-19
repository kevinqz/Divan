<script>
  export let toggleWebcam;
  export let toggleVideoList;
  import { Button } from "./components/ui/button";
</script>

<div
  id="menuBar"
  class="bg-gray-200"
  style="width: 100%; position: fixed; align-self: left; left: 0; top: 0; padding: 10px; display: flex; align-items: flex-start; flex-direction: row;"
>
  <Button
    variant="outline"
    id="toggleVideoList"
    class="rounded-sm bg-green-600 text-white px-4 py-2 mr-2"
    on:click={toggleVideoList}>Toggle Video List</Button
  >
  <Button
    variant="outline"
    id="toggleWebcam"
    class="rounded-sm bg-green-600 text-white px-4 py-2"
    on:click={toggleWebcam}>Toggle Webcam</Button
  >
</div>
