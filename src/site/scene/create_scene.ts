import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import { CAMERA_PERSPECTIVES } from "./handle_camera_perspective";

export function createScene(
  renderCanvas: HTMLCanvasElement
): [BABYLON.Scene, BABYLON.UniversalCamera, BABYLON.HighlightLayer] {
  // stencil: true needed for HighlightLayer.
  const engine = new BABYLON.Engine(renderCanvas, true, { stencil: true });
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

  const highlightLayer = new BABYLON.HighlightLayer("highlight", scene);

  // Register a render loop to repeatedly render the scene
  engine.runRenderLoop(function () {
    scene.render();
  });

  function onResize() {
    renderCanvas.width = renderCanvas.offsetWidth;
    renderCanvas.height = renderCanvas.offsetHeight;
    engine.resize();
  }

  // Resize the renderCanvas to fit its CSS dimensions.
  onResize();
  const observer = new ResizeObserver(onResize);
  observer.observe(renderCanvas);
  window.addEventListener("resize", onResize);

  return [scene, camera, highlightLayer];
}
