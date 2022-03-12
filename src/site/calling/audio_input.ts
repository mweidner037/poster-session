import { globalAudioContext } from "./audio_context";

/**
 * @return A MediaStream that is initially silent, then
 * becomes the local user's audio input if they allow it
 * (else stays silent).
 */
export function getAudioInput(): MediaStream {
  const output = globalAudioContext.createMediaStreamDestination();
  // Initially, output is silent (no input).
  // pipeUserInputTo(output) tries to await the user's
  // microphone input, then pipe it to output. If the user
  // denies permission, it does nothing, leaving output silent.
  pipeUserInputTo(output);
  return output.stream;
}

async function pipeUserInputTo(output: MediaStreamAudioDestinationNode) {
  try {
    const userInput = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    console.log("Got user audio permission");
    const asSource = globalAudioContext.createMediaStreamSource(userInput);
    asSource.connect(output);
  } catch (err) {
    console.log("User denied audio permissions");
  }
}
