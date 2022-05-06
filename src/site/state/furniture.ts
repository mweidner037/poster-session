import { FurnitureState } from "../../common/state";

export abstract class Furniture {
  constructor(readonly state: FurnitureState) {}

  abstract canInteract(): boolean;

  abstract interact(): void;

  /**
   * Remove this furniture from the scene.
   */
  abstract dispose(): void;
}
