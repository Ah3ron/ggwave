<script>
    import ggwave_factory from 'ggwave';
    import { onMount } from 'svelte';
  
    // References to DOM elements
    let txData;
    let rxData;
    let captureStart;
    let captureStop;
  
    // Variables for audio processing and ggwave
    let context = null;
    let recorder = null;
    let mediaStream = null;
    let ggwave = null;
    let parameters = null;
    let instance = null;
  
    // Helper function to convert typed arrays
    function convertTypedArray(src, type) {
      const buffer = new ArrayBuffer(src.byteLength);
      new src.constructor(buffer).set(src);
      return new type(buffer);
    }
  
    // Initialize audio context and ggwave instance
    function init() {
      if (!context) {
        if (typeof window === 'undefined') {
          console.error("AudioContext is not available in SSR environment");
          return;
        }
        context = new AudioContext({ sampleRate: 48000 });
        if (!ggwave) {
          console.error("ggwave is not initialized");
          return;
        }
        parameters = ggwave.getDefaultParameters();
        parameters.sampleRateInp = context.sampleRate;
        parameters.sampleRateOut = context.sampleRate;
        instance = ggwave.init(parameters);
      }
    }
  
    // Function to send (Tx) audio encoded data
    function onSend() {
      init();
      if (captureStop && typeof captureStop.click === 'function') {
        captureStop.click();
      }
  
      const waveform = ggwave.encode(
        instance,
        txData.value,
        ggwave.ProtocolId.GGWAVE_PROTOCOL_AUDIBLE_FAST,
        10
      );
  
      const buf = convertTypedArray(waveform, Float32Array);
      const buffer = context.createBuffer(1, buf.length, context.sampleRate);
      buffer.getChannelData(0).set(buf);
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);
      source.start(0);
    }
  
    // Start capturing (Rx) audio from the microphone
    function startCapture() {
      init();
      // Check if mediaDevices and getUserMedia are available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error("getUserMedia is not supported in this browser.");
        return;
      }
  
      const constraints = {
        audio: {
          echoCancellation: false,
          autoGainControl: false,
          noiseSuppression: false
        }
      };
  
      navigator.mediaDevices.getUserMedia(constraints)
        .then(e => {
          mediaStream = context.createMediaStreamSource(e);
          const bufferSize = 1024;
          const numberOfInputChannels = 1;
          const numberOfOutputChannels = 1;
          if (context.createScriptProcessor) {
            recorder = context.createScriptProcessor(bufferSize, numberOfInputChannels, numberOfOutputChannels);
          } else {
            recorder = context.createJavaScriptNode(bufferSize, numberOfInputChannels, numberOfOutputChannels);
          }
  
          recorder.onaudioprocess = function(e) {
            const sourceBuffer = e.inputBuffer;
            let res = ggwave.decode(
              instance,
              convertTypedArray(new Float32Array(sourceBuffer.getChannelData(0)), Int8Array)
            );
  
            if (res && res.length > 0) {
              res = new TextDecoder('utf-8').decode(res);
              rxData.value = res;
            }
          };
  
          mediaStream.connect(recorder);
          recorder.connect(context.destination);
          rxData.value = 'Listening ...';
          captureStart.hidden = true;
          captureStop.hidden = false;
        })
        .catch(e => {
          console.error("Error capturing audio:", e);
        });
    }
  
    // Stop capturing audio
    function stopCapture() {
      if (recorder && mediaStream) {
        recorder.disconnect(context.destination);
        mediaStream.disconnect(recorder);
        recorder = null;
      }
      rxData.value = 'Audio capture is paused! Press the "Start capturing" button to analyze audio from the microphone';
      captureStart.hidden = false;
      captureStop.hidden = true;
    }
  
    // onMount: defer browser-only API usage until client side
    onMount(() => {
      if (typeof window !== 'undefined') {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        window.OfflineAudioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  
        // Initialize the ggwave module.
        ggwave_factory().then(obj => {
          ggwave = obj;
        }).catch(err => console.error("Error initializing ggwave:", err));
      }
      stopCapture();
    });
  </script>
  
  <div class="container mx-auto p-10">
    <div class="card shadow-2xl bg-base-200 p-8 rounded-lg">
      <h1 class="text-4xl font-extrabold mb-6">Minimal <b class="text-accent">ggwave</b> Example</h1>
      <p class="mb-6 text-xl">JavaScript bindings with DaisyUI & Tailwind CSS</p>
      
      <div class="form-control mb-6">
        <label for="txData" class="label">
          <span class="label-text font-semibold text-lg">Tx Data:</span>
        </label>
        <textarea id="txData" bind:this={txData} class="textarea textarea-bordered textarea-lg w-full" style="min-height:120px;">Hello javascript</textarea>
      </div>
      
      <button on:click={onSend} class="btn btn-primary btn-lg mb-8">Send</button>
      
      <div class="form-control mb-6">
        <label for="rxData" class="label">
          <span class="label-text font-semibold text-lg">Rx Data:</span>
        </label>
        <textarea id="rxData" bind:this={rxData} class="textarea textarea-bordered textarea-lg w-full" disabled style="min-height:120px;"></textarea>
      </div>
      
      <div class="flex space-x-6">
        <button bind:this={captureStart} on:click={startCapture} class="btn btn-secondary btn-lg">Start capturing</button>
        <button bind:this={captureStop} on:click={stopCapture} class="btn btn-warning btn-lg" hidden>Stop capturing</button>
      </div>
    </div>
  </div>
