import * as BABYLON from "@babylonjs/core/Legacy/legacy";

export function createAudioContext(scene: BABYLON.Scene): AudioContext {
  const audioContext = new AudioContext();
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
  scene.onKeyboardObservable.add(
    resumeAudioContext,
    undefined,
    undefined,
    undefined,
    true
  );

  return audioContext;
}
