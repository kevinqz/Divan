<script lang="ts">
  import { recordedVideos } from "./store.js";

  let videos = [];

  // Subscribe to the store to get updates
  recordedVideos.subscribe((value) => {
    videos = value;
  });

  // Function to download the video
  function downloadVideo(video) {
    let blobURL = URL.createObjectURL(video.blob);
    let a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    a.href = blobURL;
    a.download = `test_${video.timestamp}.webm`;
    a.click();
    // Delay revoking the blobURL to allow the download to start
    setTimeout(function () {
      URL.revokeObjectURL(blobURL);
      a.remove();
    }, 100);
  }
</script>

<aside
  id="videoList"
  class="mt-4 bg-gray-100 align-center px-4"
  style="width: 340px; height: calc(100vh - 50px); position: fixed; left: 0; top: 44px; overflow-y: auto; display: block;"
>
  {#each videos as video (video.timestamp)}
    <div>
      <h2>Video {videos.indexOf(video) + 1}</h2>
      <p>{video.timestamp}</p>
      <button on:click={() => downloadVideo(video)}>Download</button>
      <video
        src={URL.createObjectURL(video.blob)}
        controls
        width="320"
        height="240"
      />
    </div>
  {/each}
</aside>
