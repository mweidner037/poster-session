import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import "@babylonjs/loaders/glTF"; // Loads gltf file parser.
import "@babylonjs/loaders/OBJ"; // Loads obj file parser.
// import "@babylonjs/loaders/STL"; // Loads stl file parser.

export class MeshStore {
  private readonly loadedByPath = new Map<string, BABYLON.AbstractMesh>();
  private readonly loadingByPath = new Map<
    string,
    Promise<BABYLON.AbstractMesh>
  >();

  constructor(private readonly scene: BABYLON.Scene) {}

  /**
   * @param  filePath Within assets/
   */
  async getMesh(filePath: string): Promise<BABYLON.AbstractMesh> {
    let loaded = this.loadedByPath.get(filePath);
    if (loaded === undefined) {
      let loading = this.loadingByPath.get(filePath);
      if (loading === undefined) {
        loading = this.loadMesh(filePath);
        this.loadingByPath.set(filePath, loading);
      }
      loaded = await loading;
      this.loadingByPath.delete(filePath);
    }
    return loaded;
  }

  private async loadMesh(filePath: string): Promise<BABYLON.AbstractMesh> {
    const loadingResult = await BABYLON.SceneLoader.ImportMeshAsync(
      undefined,
      "/assets/" + filePath,
      undefined,
      this.scene
    );
    // BabylonJS creates a root node at index 0 that has all included meshes
    // as children; however, it behaves strangely (e.g., cannot re-enable
    // clones if the original is disabled). Instead, we use index 1 and hope
    // that it is the root mesh.
    const loaded = loadingResult.meshes[1];
    // Disable, eliminate root, and remove extraneous transforms.
    loaded.setEnabled(false);
    loaded.parent = null;
    loaded.rotationQuaternion = null;
    loaded.scaling = new BABYLON.Vector3(1, 1, 1);

    this.loadedByPath.set(filePath, loaded);
    return loaded;
  }
}
