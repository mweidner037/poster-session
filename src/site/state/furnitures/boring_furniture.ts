import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import { FurnitureState } from "../../../common/state";
import { MyVector3 } from "../../../common/util";
import { setMeshSource } from "../../scene";
import { Furniture } from "../furniture";

/**
 * Non-interactive furniture, just a mesh.
 */
export class BoringFurniture extends Furniture {
  private mesh: BABYLON.Mesh | null = null;

  constructor(
    state: FurnitureState,
    readonly isGround: boolean,
    meshPromise: Promise<BABYLON.Mesh>
  ) {
    super(state);

    meshPromise.then((mesh) => {
      this.mesh = mesh;
      if (this.disposed) this.mesh.dispose();
      else {
        // Setup this.mesh.
        this.mesh.setEnabled(true);
        MyVector3.syncTo(this.state.position, this.mesh.position);
        MyVector3.syncTo(this.state.rotation, this.mesh.rotation);
        setMeshSource(this.mesh, this);
      }
    });
  }

  canEdit(): boolean {
    // TODO: remove
    console.log("canEdit", this.state.position);
    return false;
  }

  edit(): void {
    throw new Error("Cannot edit");
  }

  canInteract(): boolean {
    // TODO: remove
    console.log("canInteract", this.state.position);
    return false;
  }

  interact(): void {
    throw new Error("Cannot interact");
  }

  private disposed = false;
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    if (this.mesh !== null) {
      // TODO: disposeMaterialsAndTextures (second param)?
      this.mesh.dispose();
    }
  }
}
