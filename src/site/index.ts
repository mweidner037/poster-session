import * as BABYLON from "@babylonjs/core/Legacy/legacy";

let box: BABYLON.Mesh;
function createScene() {
  const scene = new BABYLON.Scene(engine);

  const camera = new BABYLON.UniversalCamera(
    "camera",
    new BABYLON.Vector3(0, 1, -2),
    scene
  );

  const light = new BABYLON.HemisphericLight(
    "light",
    new BABYLON.Vector3(0, 1, 0),
    scene
  );

  createTiledGround(scene);
  box = BABYLON.MeshBuilder.CreateBox("box", {});
  box.position.y = 0.5;

  camera.parent = box;

  return scene;
}

function createTiledGround(scene: BABYLON.Scene) {
  const grid = {
    h: 8,
    w: 8,
  };

  const tiledGround = BABYLON.MeshBuilder.CreateTiledGround("Tiled Ground", {
    xmin: -3,
    zmin: -3,
    xmax: 3,
    zmax: 3,
    subdivisions: grid,
  });

  //Create the multi material
  //Create differents materials
  const whiteMaterial = new BABYLON.StandardMaterial("White", scene);
  whiteMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1);

  const blackMaterial = new BABYLON.StandardMaterial("Black", scene);
  blackMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);

  // Create Multi Material
  const multimat = new BABYLON.MultiMaterial("multi", scene);
  multimat.subMaterials.push(whiteMaterial);
  multimat.subMaterials.push(blackMaterial);

  // Apply the multi material
  // Define multimat as material of the tiled ground
  tiledGround.material = multimat;

  // Needed variables to set subMeshes
  const verticesCount = tiledGround.getTotalVertices();
  const tileIndicesLength =
    tiledGround.getIndices()!.length / (grid.w * grid.h);

  // Set subMeshes of the tiled ground
  tiledGround.subMeshes = [];
  let base = 0;
  for (let row = 0; row < grid.h; row++) {
    for (let col = 0; col < grid.w; col++) {
      tiledGround.subMeshes.push(
        new BABYLON.SubMesh(
          row % 2 ^ col % 2,
          0,
          verticesCount,
          base,
          tileIndicesLength,
          tiledGround
        )
      );
      base += tileIndicesLength;
    }
  }
}

const canvas = <HTMLCanvasElement>document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

const scene = createScene();

const keysDown: { [char: string]: boolean | undefined } = {};
scene.onKeyboardObservable.add((e) => {
  if (e.event.type === "keydown") {
    keysDown[e.event.key] = true;
  } else if (e.event.type === "keyup") {
    keysDown[e.event.key] = false;
  }
});

scene.onBeforeRenderObservable.add(() => {
  if (keysDown["w"]) box.movePOV(0, 0, -0.01);
  else if (keysDown["s"]) box.movePOV(0, 0, 0.01);
  if (keysDown["a"] && !keysDown["d"]) box.rotatePOV(0, -0.01, 0);
  else if (keysDown["d"] && !keysDown["a"]) box.rotatePOV(0, 0.01, 0);
});

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
window.addEventListener("load", onResize);
window.addEventListener("resize", onResize);
