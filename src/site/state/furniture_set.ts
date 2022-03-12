import { FurnitureState, SerialMutCSet } from "../../common/state";
import { MyVector3 } from "../../common/util/babylon_types";
import { Globals } from "../util/globals";
import { BoringFurniture, Furniture } from "./furnitures";
import * as BABYLON from "@babylonjs/core/Legacy/legacy";

export class FurnitureSet {
  private readonly furnituresByState = new Map<FurnitureState, Furniture>();

  /**
   * Assumes the Collab state is already loaded. Further messages
   * are okay too.
   */
  constructor(
    readonly state: SerialMutCSet<
      FurnitureState,
      [
        position: MyVector3,
        rotation: MyVector3,
        type: string,
        ...otherArgs: unknown[]
      ]
    >,
    readonly globals: Globals
  ) {
    for (const furnitureState of this.state) {
      this.onAdd(furnitureState);
    }
    this.state.on("Add", (e) => this.onAdd(e.value));
    this.state.on("Delete", (e) => this.onDelete(e.value));
  }

  private onAdd(furnitureState: FurnitureState) {
    let furniture: Furniture;

    // TODO: cases for other kinds of furniture, with this as the
    // default case.
    {
      const meshTemplatePromise = this.globals.meshStore.getMesh(
        "furnitures/" + furnitureState.type,
        1
      );
      const meshCopyPromise = meshTemplatePromise.then((meshTemplate) => {
        const meshCopy = <BABYLON.Mesh>meshTemplate.clone("mesh", null)!;
        meshCopy.setEnabled(true);
        return meshCopy;
      });
      furniture = new BoringFurniture(
        furnitureState,
        meshCopyPromise,
        this.globals
      );
    }

    this.furnituresByState.set(furnitureState, furniture);
  }

  private onDelete(furnitureState: FurnitureState) {
    const furniture = this.furnituresByState.get(furnitureState)!;
    this.furnituresByState.delete(furnitureState);
    furniture.dispose();
  }

  addBoring(
    position: BABYLON.Vector3,
    rotation: BABYLON.Vector3,
    type: string
  ) {
    this.state.add(MyVector3.from(position), MyVector3.from(rotation), type);
  }

  delete(furniture: Furniture) {
    this.state.delete(furniture.state);
  }
}
