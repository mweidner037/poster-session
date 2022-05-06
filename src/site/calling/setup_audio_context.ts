import { Globals } from "../util";

/**
 * Must be called after Globals is set, so that we can access Globals().scene.
 */
export function setupAudioContext(audioContext: AudioContext): void {
  // Chrome wants you to resume AudioContexts after the user
  // "interacts with the page".
  async function resumeAudioContext() {
    console.log("Resuming AudioContext...");
    try {
      await audioContext.resume();
      console.log("  Resumed.");
    } catch (err) {
      console.log("  Failed to resume.");
    }
  }

  window.addEventListener("click", resumeAudioContext, {
    once: true,
  });
  Globals().scene.onKeyboardObservable.add(
    resumeAudioContext,
    undefined,
    undefined,
    undefined,
    true
  );
}
