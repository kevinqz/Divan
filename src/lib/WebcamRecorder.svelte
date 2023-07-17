<script lang="ts">
  import { onMount } from "svelte";
  import { Badge } from "./components/ui/badge";

  let videoElement;
  let mediaRecorder;
  let recordedChunks = [];
  let stream;
  let isRecording = false;
  let recordingStartTime;
  let recordingDuration = "00:00:00";

  async function startCapture() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true });
      console.log("Stream obtained:", stream);
      videoElement.srcObject = stream;
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = (e) => {
        console.log("Data available:", e.data);
        if (e.data.size > 0) {
          recordedChunks.push(e.data);
        }
      };
    } catch (error) {
      console.error("Error obtaining stream:", error);
    }
  }

  function startRecording() {
    console.log("Starting recording");
    isRecording = true;
    recordedChunks = [];
    recordingStartTime = Date.now();
    updateRecordingDuration();
    mediaRecorder.start();
  }

  function stopRecording() {
    console.log("Stopping recording");
    isRecording = false;
    mediaRecorder.stop();
    downloadRecording();
  }

  function updateRecordingDuration() {
    if (!isRecording) return;
    const elapsedTime = Date.now() - recordingStartTime;
    const seconds = Math.floor((elapsedTime / 1000) % 60);
    const minutes = Math.floor((elapsedTime / (1000 * 60)) % 60);
    const hours = Math.floor((elapsedTime / (1000 * 60 * 60)) % 24);
    recordingDuration = `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    setTimeout(updateRecordingDuration, 1000);
  }

  function downloadRecording() {
    console.log("Downloading recording");
    console.log("Recorded chunks:", recordedChunks);
    const blob = new Blob(recordedChunks, {
      type: "video/webm;codecs=vp9",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    a.href = url;
    a.download = "test.webm";
    a.click();
    window.URL.revokeObjectURL(url);
  }

  onMount(startCapture);
</script>

<video bind:this={videoElement} autoplay playsinline />
<button on:click={startRecording}>Start Recording</button>
<button on:click={stopRecording}>Stop Recording</button>
{#if isRecording}
  <Badge variant="outline">Recording... {recordingDuration}</Badge>
{/if}
