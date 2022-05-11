import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import { BoringFurnitureState } from "../../../common/state";
import { MyVector3 } from "../../../common/util";
import { setMeshSource } from "../../scene";
import { Globals } from "../../util";
import { Furniture } from "../furniture";

/**
 * Non-interactive furniture, just a mesh.
 */
export class BoringFurniture extends Furniture<BoringFurnitureState> {
  private mesh: BABYLON.Mesh | null = null;

  constructor(state: BoringFurnitureState) {
    super(state);

    Globals()
      .meshStore.getMesh("furnitures/" + this.state.mesh, 1)
      .then((meshTemplate) => {
        if (this.disposed) return;
        // Setup this.mesh.
        this.mesh = <BABYLON.Mesh>meshTemplate.clone("mesh", null)!;
        this.mesh.setEnabled(true);
        MyVector3.syncTo(this.state.position, this.mesh.position);
        MyVector3.syncTo(this.state.rotation, this.mesh.rotation);
        setMeshSource(this.mesh, this);
      });
  }

  get isGround(): boolean {
    return this.state.isGround;
  }

  canEdit(): boolean {
    return false;
  }

  edit(): void {
    throw new Error("Cannot edit");
  }

  canInteract(): boolean {
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
