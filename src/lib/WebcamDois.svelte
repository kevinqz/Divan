<script lang="ts">
  import { Badge } from "./components/ui/badge";
  import { recordedVideos } from "./store.js";

  let stream;
  let videoRef;
  let mediaRecorder;
  let recordedChunks = [];
  let db;
  let recordStartTime;
  let recordTimer;

  // Open a database
  let openRequest = indexedDB.open("videoDatabase", 1);

  openRequest.onupgradeneeded = function () {
    db = openRequest.result;
    let store = db.createObjectStore("videos", { keyPath: "timestamp" });
    let timestampIndex = store.createIndex("timestamp", "timestamp");
  };

  openRequest.onsuccess = function () {
    db = openRequest.result;
  };

  openRequest.onerror = function () {
    console.error("Error", openRequest.error);
  };

  function saveVideo(video) {
    let tx = db.transaction("videos", "readwrite");
    let store = tx.objectStore("videos");
    let request = store.put(video);
    request.onsuccess = function () {
      console.log("Video saved successfully");
    };
    request.onerror = function () {
      console.error("Error", request.error);
    };
  }

  async function getStream() {
    try {
      recordedChunks = [];

      stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      recordStartTime = new Date();

      recordTimer = setInterval(() => {
        let recordTime = (new Date() - recordStartTime) / 1000;
        updateBadge(recordTime);
      }, 1000);

      document.getElementById("RecordingBadge").textContent = "00:00:00";
      document.getElementById("RecordingBadge").style.display = "block";
      videoRef = document.getElementById("videoElement");
      videoRef.srcObject = stream;

      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };
      mediaRecorder.start(10);

      document.getElementById("startButton").style.display = "none";
      document.getElementById("stopButton").style.display = "inline-block";
    } catch (err) {
      console.error(err);
    }
  }

  async function stopStream() {
    clearInterval(recordTimer);
    document.getElementById("RecordingBadge").style.display = "none";
    mediaRecorder.stop();

    let recordEndTime = new Date();
    let recordTime = (recordEndTime - recordStartTime) / 1000;
    let hours = Math.floor(recordTime / 3600);
    let minutes = Math.floor((recordTime - hours * 3600) / 60);
    let seconds = Math.floor(recordTime - hours * 3600 - minutes * 60);
    let formattedTime =
      hours.toString().padStart(2, "0") +
      ":" +
      minutes.toString().padStart(2, "0") +
      ":" +
      seconds.toString().padStart(2, "0");

    document.getElementById("RecordingBadge").textContent = formattedTime;

    stream.getTracks().forEach((track) => track.stop());
    videoRef.srcObject = null;

    let blob = new Blob(recordedChunks, {
      type: "video/webm",
    });

    stream.getTracks().forEach((track) => track.stop());
    videoRef.srcObject = null;

    let blobURL = URL.createObjectURL(blob);
    videoRef.src = blobURL;

    recordedChunks = [];

    document.getElementById("stopButton").style.display = "none";
    document.getElementById("startAnotherButton").style.display =
      "inline-block";

    let timestamp = new Date().toISOString();
    let video = {
      timestamp: timestamp,
      blob: blob,
    };
    recordedVideos.set([...$recordedVideos, video]); // Push the new video to the store
    saveVideo(video);

    downloadVideo(blob, `test_${timestamp}.webm`);
  }

  function updateBadge(recordTime) {
    let hours = Math.floor(recordTime / 3600);
    let minutes = Math.floor((recordTime - hours * 3600) / 60);
    let seconds = Math.floor(recordTime - hours * 3600 - minutes * 60);
    let formattedTime =
      hours.toString().padStart(2, "0") +
      ":" +
      minutes.toString().padStart(2, "0") +
      ":" +
      seconds.toString().padStart(2, "0");

    document.getElementById("RecordingBadge").textContent = formattedTime;
  }

  function downloadVideo(blob, filename) {
    let blobURL = URL.createObjectURL(blob);
    let a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    a.href = blobURL;
    a.download = filename;
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(blobURL);
      a.remove();
    }, 100);
  }

  function startAnotherStream() {
    document.getElementById("RecordingBadge").style.display = "none";
    videoRef.src = "";
    document.getElementById("startButton").style.display = "inline-block";
    document.getElementById("startAnotherButton").style.display = "none";
  }
</script>

<section class="container mx-auto px-4">
  <h1 class="text-4xl text-zync-700 font-bold my-4">Conci Room</h1>
  <button
    id="startButton"
    class="rounded-sm bg-slate-600 text-white px-4 py-2"
    on:click={getStream}>Start Stream</button
  >
  <button
    id="stopButton"
    class="rounded-sm bg-red-600 text-white px-4 py-2"
    on:click={stopStream}
    style="display: none;">Stop Stream</button
  >
  <Badge id="RecordingBadge" variant="outline" style="display: none;"
    >00:00:00</Badge
  >
  <button
    id="startAnotherButton"
    class="rounded-sm bg-yellow-600 text-white px-4 py-2"
    on:click={startAnotherStream}
    style="display: none;">Start Another Stream</button
  >

  <video
    id="videoElement"
    class="mt-4 rounded-sm mx-auto"
    width="640"
    height="480"
    autoplay={true}
    bind:this={videoRef}
  />
</section>
