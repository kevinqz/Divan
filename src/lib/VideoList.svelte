<script lang="ts">
  import { recordedVideos } from "./stores/store.js";
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

  // Function to load saved videos from IndexedDB
  async function loadSavedVideos() {
    let dbRequest = indexedDB.open("videoDatabase", 1);
    dbRequest.onsuccess = function () {
      let db = dbRequest.result;
      let transaction = db.transaction("videos", "readonly");
      let store = transaction.objectStore("videos");
      let request = store.getAll();
      request.onsuccess = function () {
        let savedVideos = request.result;
        savedVideos.forEach((video) => {
          // Convert ArrayBuffer back into Blob
          video.blob = new Blob([video.blob], { type: "video/webm" });
          video.audioBlob = new Blob([video.audioBlob], {
            type: "audio/ogg; codecs=opus",
          });
        });
        recordedVideos.set(savedVideos);
      };
      request.onerror = function () {
        console.error("Error", request.error);
      };
    };
  }

  loadSavedVideos();

  // Reactive statement to keep track of flattenedVideos
  let flattenedVideos = [];
  $: {
    const totalVideos = $recordedVideos.length; // Get total number of videos

    flattenedVideos = $recordedVideos
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .map((video, index) => {
        const date = new Date(video.timestamp);
        const day = `${date.getDate().toString().padStart(2, "0")}/${(
          date.getMonth() + 1
        )
          .toString()
          .padStart(2, "0")}/${date.getFullYear()}`;

        // Subtract index from totalVideos to get descending IDs
        return { id: totalVideos - 1 - index, day: day, video: video };
      });

    videos = flattenedVideos.reduce((groups, item) => {
      if (!groups[item.day]) {
        groups[item.day] = [];
      }
      groups[item.day].push(item.video);
      return groups;
    }, {});
  }
</script>

<aside
  id="videoList"
  class="mt-4 bg-gray-100 align-center px-4"
  style="width: 340px; height: calc(100vh - 50px); position: fixed; left: 0; top: 44px; overflow-y: auto; display: block; z-index: 9999;"
>
  {#each Object.keys(videos) as day (day)}
    <h2 class="m-4">{day}</h2>
    {#each flattenedVideos
      .filter((v) => v.day === day)
      .sort((a, b) => b.id - a.id) as item (item.id)}
      <div class="bg-gray-200 p-2 my-2 rounded-md position-relative">
        <h3 class="mt-1" on:click={() => goToVideoPage(item.id)}>
          Video {item.id + 1}
        </h3>
        <p>
          {new Intl.DateTimeFormat("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date(item.video.timestamp))}
          (Duration: {formatTime(item.video.duration)})
        </p>
        <video
          class="mt-1 rounded-sm"
          src={URL.createObjectURL(item.video.blob)}
          controls
          width="320"
          height="240"
        />
        <button class="text-zync-500" on:click={() => downloadVideo(item.video)}
          >Download</button
        >
        <button
          on:click={() => deleteVideo(item.video.timestamp)}
          class="text-red-800 font-medium"
          style="position: block; right: 10px; top: 10px;"
        >
          Remove
        </button>
      </div>
    {/each}
  {/each}
</aside>
