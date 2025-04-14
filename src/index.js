(async function() {
  try {
    // Import the factory function from the ggwave library
    const factory = require('./lib/ggwave');
    
    // Wait for the factory to resolve and obtain the API
    const ggwave = await factory();

    // Retrieve default parameters and modify operating mode to include DSS
    const parameters = ggwave.getDefaultParameters();
    parameters.operatingMode |= ggwave.GGWAVE_OPERATING_MODE_USE_DSS;

    // Initialize the ggwave instance with the parameters
    const instance = ggwave.init(parameters);
    console.log('Initialized ggwave instance:', instance);

    // Define the payload to encode
    const payload = 'hello js';

    // Generate an audio waveform for the payload using the specified protocol and timeout
    const waveform = ggwave.encode(instance, payload, ggwave.ProtocolId.GGWAVE_PROTOCOL_AUDIBLE_FAST, 10);

    // Decode the generated waveform back into text
    const result = ggwave.decode(instance, waveform);
    const decoded = new TextDecoder("utf-8").decode(result);

    // Verify that the encoded and decoded payload match
    if (decoded !== payload) {
      console.error("Decoded payload does not match the original payload:", decoded);
      process.exit(1);
    } else {
      console.log("Successfully encoded and decoded the payload:", decoded);
    }
  } catch (err) {
    console.error("Error using ggwave:", err);
  }
})();