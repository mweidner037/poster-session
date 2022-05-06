import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import { KeyTracker } from "../scene/key_tracker";
import { MeshStore } from "../scene/mesh_store";

export interface Globals {
  renderCanvas: HTMLCanvasElement;
  scene: BABYLON.Scene;
  highlightLayer: BABYLON.HighlightLayer;
  meshStore: MeshStore;
  keyTracker: KeyTracker;
  audioContext: AudioContext;
}

let globalsVar: Globals | null = null;

export function Globals(): Globals {
  if (globalsVar === null) {
    throw new Error(
      "Cannot call Globals() until after main.tsx calls setGlobals"
    );
  }
  return globalsVar;
}

/**
 * Only called from main.tsx.
 */
export function setGlobals(globals: Globals): void {
  if (globalsVar !== null) {
    throw new Error("setGlobals called twice");
  }
  globalsVar = globals;
}
