import * as BABYLON from "@babylonjs/core/Legacy/legacy";

const MESH_SOURCE = Symbol();

interface MeshWithSource extends BABYLON.AbstractMesh {
  [MESH_SOURCE]: object | undefined;
}

/**
 * Call this to indicate mesh's source object within our own
 * state tree.
 */
export function setMeshSource(
  mesh: BABYLON.AbstractMesh,
  source: object
): void {
  (mesh as MeshWithSource)[MESH_SOURCE] = source;
}

/**
 * Return the source object set with setMeshSource, or undefined
 * if no source is set.
 */
export function getMeshSource(mesh: BABYLON.AbstractMesh): object | undefined {
  return (mesh as MeshWithSource)[MESH_SOURCE];
}
