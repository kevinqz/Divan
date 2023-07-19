<script>
  import { Router, Route, navigate } from "svelte-routing";

  import logo from "./assets/svelte.png";

  import WebcamDois from "./lib/WebcamDois.svelte";
  import VideoList from "./lib/VideoList.svelte";
  import MenuBar from "./lib/MenuBar.svelte";
  import { onMount } from "svelte";

  import VideoPage from "./routes/video/[id]/VideoPage.svelte";

  let showWebcam = true;
  let showVideoList = true;

  function toggleWebcam() {
    showWebcam = !showWebcam;
    navigate(`/`);
  }

  function toggleVideoList() {
    showVideoList = !showVideoList;
  }

  onMount(() => {
    toggleVideoList();
  });
</script>

<main>
  <meta
    http-equiv="Content-Security-Policy"
    content="worker-src 'self' blob:"
  />

  <!-- <WebcamRecorder /> -->
  <!-- <Webcam /> -->
  <MenuBar {toggleWebcam} {toggleVideoList} />

  <!-- {#if showWebcam}
    <WebcamDois />
  {/if} -->

  {#if showVideoList}
    <VideoList />
  {/if}

  <Router>
    <Route path="/" component={WebcamDois} />
    <Route path="/video/:id" let:params>
      <VideoPage id={params.id} key={params.id} />
    </Route>
  </Router>
</main>

<style>
  :root {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
      Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  }

  main {
    text-align: center;
    padding: 1em;
    margin: 0 auto;
  }

  img {
    height: 16rem;
    width: 16rem;
  }

  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 4rem;
    font-weight: 100;
    line-height: 1.1;
    margin: 2rem auto;
    max-width: 14rem;
  }

  p {
    max-width: 14rem;
    margin: 1rem auto;
    line-height: 1.35;
  }

  @media (min-width: 480px) {
    h1 {
      max-width: none;
    }

    p {
      max-width: none;
    }
  }
</style>
