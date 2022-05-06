import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import { FurnitureState } from "../../../common/state";
import { MyVector3 } from "../../../common/util/babylon_types";
import { Globals } from "../../util/globals";
import { Furniture } from "./furniture";

/**
 * Non-interactive furniture, just a mesh.
 */
export class BoringFurniture extends Furniture {
  private mesh: BABYLON.Mesh | null = null;

  // TODO: texture
  constructor(
    state: FurnitureState,
    meshPromise: Promise<BABYLON.Mesh>,
    private readonly globals: Globals
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
      }
    });
  }

  private disposed = false;
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    if (this.mesh !== null) {
      this.mesh.dispose();
    }
  }

  canInteract(): boolean {
    return false;
  }

  interact(): void {
    throw new Error("Cannot interact");
  }
}
