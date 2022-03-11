import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import { CAMERA_PERSPECTIVES } from "../run/handle_camera_perspective";
import { addTiledGround } from "./tiled_ground";

export function createScene(): [BABYLON.Scene, BABYLON.UniversalCamera] {
  const canvas = <HTMLCanvasElement>document.getElementById("renderCanvas");
  const engine = new BABYLON.Engine(canvas, true);
  const scene = new BABYLON.Scene(engine);

  // TODO: if we use Y in volume calcs and it can be pointing
  // in not the absolute Y dir, then we'd need to adjust
  // things so the camera is at (0, 0, 0).
  const camera = new BABYLON.UniversalCamera(
    "camera",
    CAMERA_PERSPECTIVES[0],
    scene
  );

  new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

  addTiledGround(scene);

  // Register a render loop to repeatedly render the scene
  engine.runRenderLoop(function () {
    scene.render();
  });

  function onResize() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    engine.resize();
  }

  // Resize the canvas to fit its CSS dimensions.
  onResize();
  const observer = new ResizeObserver(onResize);
  observer.observe(canvas);
  window.addEventListener("resize", onResize);

  return [scene, camera];
}
