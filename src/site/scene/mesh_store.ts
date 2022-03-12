import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import "@babylonjs/loaders/glTF"; // Loads gltf file parser.

export class MeshStore {
  private readonly loadedByPath = new Map<string, BABYLON.AbstractMesh[]>();
  private readonly loadingByPath = new Map<
    string,
    Promise<BABYLON.ISceneLoaderAsyncResult>
  >();

  constructor(private readonly scene: BABYLON.Scene) {}

  /**
   * @param  filePath Within assets/
   * @param  index    Index of the mesh in the file
   */
  async getMesh(
    filePath: string,
    index: number
  ): Promise<BABYLON.AbstractMesh> {
    let loaded = this.loadedByPath.get(filePath);
    if (loaded === undefined) {
      let loading = this.loadingByPath.get(filePath);
      if (loading === undefined) {
        loading = BABYLON.SceneLoader.ImportMeshAsync(
          undefined,
          "/assets/" + filePath,
          undefined,
          this.scene
        );
        this.loadingByPath.set(filePath, loading);
      }
      const loadingResult = await loading;
      this.loadingByPath.delete(filePath);
      loaded = loadingResult.meshes;
      this.loadedByPath.set(filePath, loaded);
    }
    if (index > loaded.length - 1) {
      throw new Error(`Index out of bounds: ${index}, ${loaded.length}`);
    }
    return loaded[index];
  }
}
