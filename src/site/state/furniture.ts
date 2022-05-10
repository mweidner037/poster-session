import { FurnitureState } from "../../common/state";

export abstract class Furniture {
  constructor(readonly state: FurnitureState) {}

  /**
   * Whether you can add other furniture on top of this furniture.
   */
  abstract readonly isGround: boolean;

  abstract canInteract(): boolean;

  abstract interact(): void;

  abstract canEdit(): boolean;

  abstract edit(): void;

  /**
   * Remove this furniture from the scene.
   */
  abstract dispose(): void;
}
