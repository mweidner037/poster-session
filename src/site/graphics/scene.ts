import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import { addTiledGround } from "./tiled_ground";

export function createScene(): [BABYLON.Scene, BABYLON.UniversalCamera] {
  const canvas = <HTMLCanvasElement>document.getElementById("renderCanvas");
  const engine = new BABYLON.Engine(canvas, true);
  const scene = new BABYLON.Scene(engine);

  const camera = new BABYLON.UniversalCamera(
    "camera",
    new BABYLON.Vector3(0, 0.9, 0),
    scene
  );

  new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

  addTiledGround(scene);

  // Register a render loop to repeatedly render the scene
  engine.runRenderLoop(function () {
    scene.render();
  });

  function onResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    engine.resize();
  }

  // Watch for browser/canvas resize events.
  onResize();
  window.addEventListener("resize", onResize);

  return [scene, camera];
}
