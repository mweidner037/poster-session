import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import { KeyTracker } from "../run/key_tracker";
import { MeshStore } from "../scene/mesh_store";

export interface Globals {
  renderCanvas: HTMLCanvasElement;
  scene: BABYLON.Scene;
  highlightLayer: BABYLON.HighlightLayer;
  meshStore: MeshStore;
  keyTracker: KeyTracker;
  audioContext: AudioContext;
}
