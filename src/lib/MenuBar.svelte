<script>
  export let toggleWebcam;
  export let toggleVideoList;
</script>

<div
  id="menuBar"
  class="bg-gray-200"
  style="width: 340px; position: fixed; left: 0; top: 0; padding: 10px;"
>
  <button
    id="toggleVideoList"
    class="rounded-sm bg-green-600 text-white px-4 py-2"
    on:click={toggleVideoList}>Toggle Video List</button
  >
  <button
    id="toggleWebcam"
    class="rounded-sm bg-green-600 text-white px-4 py-2"
    on:click={toggleWebcam}>Toggle Webcam</button
  >
</div>
