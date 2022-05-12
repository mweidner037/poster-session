import { FurnitureState, SerialMutCSet, ToArgs } from "../../common/state";
import { MyVector3 } from "../../common/util";
import { BoringFurniture, Easel } from "./furnitures";
import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import {
  BoringFurnitureState,
  EaselState,
  FurnitureStateClasses,
  WhiteboardState,
} from "../../common/state/furniture_states";
import { Furniture } from "./furniture";
import { Whiteboard } from "./furnitures/whiteboard";

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
    >,
    readonly scene: BABYLON.Scene
  ) {
    for (const furnitureState of this.state) {
      this.onAdd(furnitureState);
    }
    this.state.on("Add", (e) => this.onAdd(e.value));
    this.state.on("Delete", (e) => this.onDelete(e.value));
  }

  private onAdd(furnitureState: FurnitureState) {
    let furniture: Furniture;

    // TODO: automate this part.
    if (furnitureState instanceof BoringFurnitureState) {
      furniture = new BoringFurniture(furnitureState);
    } else if (furnitureState instanceof EaselState) {
      furniture = new Easel(furnitureState, this.scene);
    } else if (furnitureState instanceof WhiteboardState) {
      furniture = new Whiteboard(furnitureState, this.scene);
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

  // TODO: remove these, just manipulate state directly?
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

  addEasel(position: BABYLON.Vector3, rotation: BABYLON.Vector3) {
    this.state.add("easel", MyVector3.from(position), MyVector3.from(rotation));
  }

  addWhiteboard(position: BABYLON.Vector3, rotation: BABYLON.Vector3) {
    this.state.add(
      "whiteboard",
      MyVector3.from(position),
      MyVector3.from(rotation)
    );
  }

  delete(furniture: Furniture) {
    this.state.delete(furniture.state);
  }
}
