<script lang="ts">
  import { Badge } from "./components/ui/badge";

  let stream;
  let videoRef;
  let mediaRecorder;
  let recordedChunks = [];
  let recordedVideos = [];
  let db;
  let recordStartTime; // New variable to track record start time
  let recordTimer; // New variable for timer

  // Open a database
  let openRequest = indexedDB.open("videoDatabase", 1);

  openRequest.onupgradeneeded = function () {
    // The database did not previously exist, so create object stores and indexes.
    db = openRequest.result;
    let store = db.createObjectStore("videos", { keyPath: "timestamp" });
    let timestampIndex = store.createIndex("timestamp", "timestamp");
  };

  openRequest.onsuccess = function () {
    db = openRequest.result;
    loadVideos();
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

  function loadVideos() {
    let tx = db.transaction("videos", "readonly");
    let store = tx.objectStore("videos");
    let request = store.getAll();
    request.onsuccess = function () {
      recordedVideos = request.result;
      updateVideoList();
    };
  }

  async function getStream() {
    try {
      // Reset recordedChunks at the start of each new recording
      recordedChunks = [];

      stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      recordStartTime = new Date(); // Set record start time

      // Start timer to update badge every second
      recordTimer = setInterval(() => {
        let recordTime = (new Date() - recordStartTime) / 1000; // Calculate record time in seconds
        updateBadge(recordTime);
      }, 1000);

      document.getElementById("RecordingBadge").textContent = "00:00:00"; // Set badge to 00:00:00
      document.getElementById("RecordingBadge").style.display = "block"; // Show badge
      videoRef = document.getElementById("videoElement");
      videoRef.srcObject = stream;

      // Create a new media recorder
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };
      mediaRecorder.start(10); // collect 10ms of data

      // Update button visibility
      let startButton = document.getElementById("startButton");
      let stopButton = document.getElementById("stopButton");
      startButton.style.display = "none";
      stopButton.style.display = "inline-block";
    } catch (err) {
      console.error(err);
    }
  }

  async function stopStream() {
    clearInterval(recordTimer); // Stop timer
    document.getElementById("RecordingBadge").style.display = "none"; // Hide badge

    mediaRecorder.stop();

    let recordEndTime = new Date(); // Get record end time
    let recordTime = (recordEndTime - recordStartTime) / 1000; // Calculate record time in seconds

    // Format record time to hh:mm:ss
    let hours = Math.floor(recordTime / 3600);
    let minutes = Math.floor((recordTime - hours * 3600) / 60);
    let seconds = Math.floor(recordTime - hours * 3600 - minutes * 60);
    let formattedTime =
      hours.toString().padStart(2, "0") +
      ":" +
      minutes.toString().padStart(2, "0") +
      ":" +
      seconds.toString().padStart(2, "0");

    // Update Badge element to display record time
    document.getElementById("RecordingBadge").textContent = formattedTime;

    // Stop all tracks on the media stream
    stream.getTracks().forEach((track) => track.stop());
    videoRef.srcObject = null;

    let blob = new Blob(recordedChunks, {
      type: "video/webm",
    });

    stream.getTracks().forEach((track) => track.stop());
    videoRef.srcObject = null;

    // Create blobURL right before setting the source of video element
    let blobURL = URL.createObjectURL(blob);
    videoRef.src = blobURL;

    recordedChunks = [];

    // Update button visibility
    let stopButton = document.getElementById("stopButton");
    let downloadButton = document.getElementById("downloadButton");
    let startAnotherButton = document.getElementById("startAnotherButton");
    stopButton.style.display = "none";
    downloadButton.style.display = "inline-block";
    startAnotherButton.style.display = "inline-block";

    // Save recorded video
    let timestamp = new Date().toISOString();
    let video = {
      timestamp: timestamp,
      blob: blob,
    };
    recordedVideos.push(video);
    saveVideo(video);

    // Update video list
    updateVideoList();

    // Automatically download the video
    downloadVideo(blob, `test_${timestamp}.webm`);
  }

  function updateVideoList() {
    let videoList = document.getElementById("videoList");
    videoList.innerHTML = "";
    recordedVideos.forEach((video, index) => {
      let blobURL = URL.createObjectURL(video.blob); // Create a new blobURL for each video

      let videoElement = document.createElement("video");
      videoElement.src = blobURL;
      videoElement.controls = true;
      videoElement.width = 320;
      videoElement.height = 240;

      let videoNameElement = document.createElement("h2");
      videoNameElement.textContent = `Video ${index + 1}`;

      let timestampElement = document.createElement("p");
      timestampElement.textContent = video.timestamp;

      // Create a download button for each video
      let downloadButton = document.createElement("button");
      downloadButton.textContent = "Download";
      downloadButton.classList.add("download-button");
      downloadButton.onclick = function () {
        downloadVideo(video.blob, `test_${video.timestamp}.webm`);
      };

      let videoContainer = document.createElement("div");
      videoContainer.appendChild(videoNameElement);
      videoContainer.appendChild(timestampElement);
      videoContainer.appendChild(downloadButton);
      videoContainer.appendChild(videoElement);
      videoList.appendChild(videoContainer);
    });
  }

  function updateBadge(recordTime) {
    // Format record time to hh:mm:ss
    let hours = Math.floor(recordTime / 3600);
    let minutes = Math.floor((recordTime - hours * 3600) / 60);
    let seconds = Math.floor(recordTime - hours * 3600 - minutes * 60);
    let formattedTime =
      hours.toString().padStart(2, "0") +
      ":" +
      minutes.toString().padStart(2, "0") +
      ":" +
      seconds.toString().padStart(2, "0");

    // Update Badge element to display record time
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

    // Add event listener to revoke blobURL after initiating the download
    a.addEventListener("click", function () {
      // Delay revoking the blobURL to allow the download to start
      setTimeout(function () {
        URL.revokeObjectURL(blobURL);
        a.remove();
      }, 100);
    });
  }

  function startAnotherStream() {
    document.getElementById("RecordingBadge").style.display = "none"; // Hide badge
    // Reset video source
    videoRef.src = "";
    let startButton = document.getElementById("startButton");
    let downloadButton = document.getElementById("downloadButton");
    let startAnotherButton = document.getElementById("startAnotherButton");
    startButton.style.display = "inline-block";
    downloadButton.style.display = "none";
    startAnotherButton.style.display = "none";
  }

  function toggleVideoList() {
    let videoList = document.getElementById("videoList");
    if (videoList.style.display === "none") {
      videoList.style.display = "block";
    } else {
      videoList.style.display = "none";
    }
  }
</script>

<div
  id="menuBar"
  class="bg-gray-200"
  style="width: 320px; position: fixed; left: 0; top: 0; padding: 10px;"
>
  <button
    id="toggleButton"
    class="rounded-sm bg-green-600 text-white px-4 py-2"
    on:click={toggleVideoList}>Toggle Video List</button
  >
</div>

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
  <button
    id="downloadButton"
    class="rounded-sm bg-blue-600 text-white px-4 py-2"
    on:click={downloadVideo}
    style="display: none;">Download Video</button
  >

  <video
    id="videoElement"
    class="mt-4 rounded-sm mx-auto"
    width="640"
    height="480"
    autoplay={true}
    bind:this={videoRef}
  />

  <aside
    id="videoList"
    class="mt-4"
    style="width: 320px; height: calc(100vh - 50px); position: fixed; left: 0; top: 50px; overflow-y: auto;"
  />
</section>
