import { FurnitureState, SerialMutCSet, ToArgs } from "../../common/state";
import { MyVector3 } from "../../common/util";
import { Globals } from "../util";
import { BoringFurniture } from "./furnitures";
import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import {
  BoringFurnitureState,
  FurnitureStateClasses,
} from "../../common/state/furniture_states";
import { Furniture } from "./furniture";

export class FurnitureSet {
  private readonly furnituresByState = new Map<FurnitureState, Furniture>();

  /**
   * Assumes the Collab state is already loaded. Further messages
   * are okay too.
   */
  constructor(
    readonly state: SerialMutCSet<
      FurnitureState,
      ToArgs<keyof typeof FurnitureStateClasses>
    >
  ) {
    for (const furnitureState of this.state) {
      this.onAdd(furnitureState);
    }
    this.state.on("Add", (e) => this.onAdd(e.value));
    this.state.on("Delete", (e) => this.onDelete(e.value));
  }

  private onAdd(furnitureState: FurnitureState) {
    let furniture: Furniture;

    if (furnitureState instanceof BoringFurnitureState) {
      const meshTemplatePromise = Globals().meshStore.getMesh(
        "furnitures/" + furnitureState.mesh,
        1
      );
      const meshCopyPromise = meshTemplatePromise.then(
        (meshTemplate) => <BABYLON.Mesh>meshTemplate.clone("mesh", null)!
      );
      furniture = new BoringFurniture(
        furnitureState,
        furnitureState.isGround,
        meshCopyPromise
      );
    } else {
      throw new Error(
        "Unknown furnitureState class: " + furnitureState.constructor.name
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
    isGround: boolean,
    mesh: string
  ) {
    this.state.add(
      "boring",
      MyVector3.from(position),
      MyVector3.from(rotation),
      isGround,
      mesh
    );
  }

  delete(furniture: Furniture) {
    this.state.delete(furniture.state);
  }
}
