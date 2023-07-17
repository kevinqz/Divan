<script lang="ts">
  import { recordedVideos } from "./store.js";
  import { navigate } from "svelte-routing";

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

  // Subscribe to the store to get updates
  recordedVideos.subscribe((value) => {
    videos = value
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
      .reduce((groups, video) => {
        const date = new Date(video.timestamp);
        const day = `${date.getDate().toString().padStart(2, "0")}/${(
          date.getMonth() + 1
        )
          .toString()
          .padStart(2, "0")}/${date.getFullYear()}`;
        if (!groups[day]) {
          groups[day] = [];
        }
        groups[day].push(video);
        return groups;
      }, {});
  });

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
    let dbRequest = indexedDB.open("videoDatabase", 1);
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
</script>

<aside
  id="videoList"
  class="mt-4 bg-gray-100 align-center px-4"
  style="width: 340px; height: calc(100vh - 50px); position: fixed; left: 0; top: 44px; overflow-y: auto; display: block;"
>
  {#each Object.keys(videos) as day}
    <h2 class="m-4">{day}</h2>
    {#each videos[day] as video (video.timestamp)}
      <div class="bg-gray-200 p-2 my-2 rounded-md position-relative">
        <h3
          class="mt-1"
          on:click={() => goToVideoPage(videos[day].indexOf(video))}
        >
          Video {videos[day].indexOf(video) + 1}
        </h3>
        <p>
          {new Intl.DateTimeFormat("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date(video.timestamp))}
          (Duration: {formatTime(video.duration)})
        </p>
        <button
          class="text-zync-500 font-medium"
          on:click={() => downloadVideo(video)}>Download</button
        >
        <button
          on:click={() => deleteVideo(video.timestamp)}
          class="text-red-800 font-medium"
          style="position: block; right: 10px; top: 10px;"
        >
          Remove
        </button>
        <video
          class="mt-1 rounded-sm"
          src={URL.createObjectURL(video.blob)}
          controls
          width="320"
          height="240"
        />
      </div>
    {/each}
  {/each}
</aside>
