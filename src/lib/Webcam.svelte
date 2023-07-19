<script lang="ts">
  import { Badge } from "./components/ui/badge";
  import { Button } from "./components/ui/button";
  import { recordedVideos } from "./stores/store.js";

  import { navigate } from "svelte-routing";

  let lastVideoId = 0; // Add this line to the top of your script

  let stream;
  let videoRef;
  let mediaRecorder;
  let recordedChunks = [];
  let audioMediaRecorder; // Declare a new MediaRecorder for audio
  let audioRecordedChunks = []; // Declare a new chunks array for audio
  let db;
  let recordStartTime;
  let recordTimer;

  window.onload = function () {
    // Open a transaction to the database
    let tx = db.transaction("videos", "readonly");

    // Retrieve the object store
    let store = tx.objectStore("videos");

    // Make a request to get all records from the store
    let request = store.getAll();

    request.onsuccess = function () {
      // The result of the request is an array of records
      let videos = request.result;

      videos.forEach((video) => {
        // Process each video record here

        // You can create new blob URLs for each video and audio blob
        let blobURL = URL.createObjectURL(video.blob);
        let audioBlobURL = URL.createObjectURL(video.audioBlob);

        // You can use these blob URLs to set the src of video or audio elements on the page
      });
    };

    request.onerror = function () {
      console.error("Error", request.error);
    };
  };

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
      audioRecordedChunks = []; // Clear the audio chunks

      stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      // Create a new MediaStream with only audio tracks
      let audioStream = new MediaStream(stream.getAudioTracks());

      // Initialize the audio MediaRecorder
      audioMediaRecorder = new MediaRecorder(audioStream);
      audioMediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioRecordedChunks.push(event.data);
        }
      };
      audioMediaRecorder.start(10);

      recordStartTime = new Date();

      recordTimer = setInterval(() => {
        let recordTime = (new Date() - recordStartTime) / 1000;
        updateBadge(recordTime);
      }, 1000);

      document.getElementById("RecordingBadge").textContent = "00:00:00";
      document.getElementById("RecordingBadge").style.display = "inline-block";
      videoRef = document.getElementById("videoElement");
      videoRef.srcObject = stream;
      videoRef.muted = true; // Mute the video while recording

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
    document.getElementById("goToVideoPageButton").style.display =
      "inline-block";
    mediaRecorder.stop();
    audioMediaRecorder.stop(); // Stop the audio MediaRecorder

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

    let audioBlob = new Blob(audioRecordedChunks, {
      type: "audio/ogg; codecs=opus",
    });

    let audioBlobURL = URL.createObjectURL(audioBlob);

    audioRecordedChunks = []; // Clear the audio chunks

    stream.getTracks().forEach((track) => track.stop());
    videoRef.srcObject = null;
    videoRef.muted = false; // Unmute the video after recording

    let blobURL = URL.createObjectURL(blob);
    videoRef.src = blobURL;

    recordedChunks = [];

    document.getElementById("stopButton").style.display = "none";
    document.getElementById("startAnotherButton").style.display =
      "inline-block";
    document.getElementById("goToVideoPageButton").style.display =
      "inline-block"; // Show the "Go To Video Page" button

    let timestamp = new Date().toISOString();
    let video = {
      id: $recordedVideos.length, // Assign the next ID based on the length of the recordedVideos store
      timestamp: timestamp,
      blob: blob,
      audioBlob: audioBlob,
      duration: recordTime,
      transcription: "", // Initialize transcription as an empty string
    };
    lastVideoId = video.id; // set the lastVideoId to the id of the newly created video
    recordedVideos.set([...$recordedVideos, video]); // Push the new video to the store
    saveVideo(video);

    // downloadVideo(blob, `ConciRoom_${timestamp}.webm`);
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
    document.getElementById("goToVideoPageButton").style.display = "none";
  }
</script>

<section class="container mx-auto px-4 mt-28">
  <h1 class="text-4xl text-zync-700 font-bold my-4">Conci Room</h1>
  <Button id="startButton" on:click={getStream}>Start Stream</Button>
  <Button
    id="stopButton"
    variant="destructive"
    on:click={stopStream}
    style="display: none;">Stop Stream</Button
  >
  <Badge
    id="RecordingBadge"
    variant="destructive"
    style="display: none; bg-red-600 text-white px-4 py-2">00:00:00</Badge
  >
  <Button
    id="startAnotherButton"
    variant="secondary"
    on:click={startAnotherStream}
    style="display: none;">Start Another Stream</Button
  >
  <Button
    id="goToVideoPageButton"
    on:click={() => navigate(`/video/${lastVideoId}`)}
    style="display: none;">Go to Video Page</Button
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
