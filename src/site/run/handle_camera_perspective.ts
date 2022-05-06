import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import { Globals } from "../util/globals";

export const CAMERA_PERSPECTIVES = [
  // First person
  new BABYLON.Vector3(0, 0.9, 0),
  // Third person
  new BABYLON.Vector3(0, 1.9, -5),
];

export function handleCameraPerspective(camera: BABYLON.UniversalCamera) {
  let index = 0;
  Globals().scene.onKeyboardObservable.add((e) => {
    if (e.event.type === "keydown" && e.event.key.toLowerCase() === "c") {
      // Toggle camera perspective.
      index = (index + 1) % CAMERA_PERSPECTIVES.length;
      camera.position = CAMERA_PERSPECTIVES[index];
    }
  });
}
