import * as BABYLON from "@babylonjs/core/Legacy/legacy";

export function addTiledGround(scene: BABYLON.Scene) {
  const grid = {
    h: 16,
    w: 16,
  };

  const tiledGround = BABYLON.MeshBuilder.CreateTiledGround("Tiled Ground", {
    xmin: -8,
    zmin: -8,
    xmax: 8,
    zmax: 8,
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
