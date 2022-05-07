import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import { KeyTracker } from "../scene/key_tracker";
import { MeshStore } from "../scene/mesh_store";

export interface Globals {
  renderCanvas: HTMLCanvasElement;
  highlightLayer: BABYLON.HighlightLayer;
  meshStore: MeshStore;
  keyTracker: KeyTracker;
  audioContext: AudioContext;
}

let globalsVar: Globals | null = null;

/**
 * Returns a collection of some global objects---usually handles on system
 * resources.
 *
 * Only objects that do not contain important parts of the mutable state
 * are included; ones that do should be passed to their users directly,
 * do make clear who can mutate what state.
 */
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
