import { FurnitureState } from "../../common/state";
import { Overlay } from "../components";

export abstract class Furniture<S extends FurnitureState = FurnitureState> {
  constructor(readonly state: S) {}

  /**
   * Whether you can add other furniture on top of this furniture.
   */
  abstract readonly isGround: boolean;

  abstract canInteract(): boolean;

  abstract interact(setOverlay: (overlay: Overlay) => void): void;

  abstract canEdit(): boolean;

  abstract edit(setOverlay: (overlay: Overlay) => void): void;

  /**
   * Remove this furniture from the scene.
   */
  abstract dispose(): void;
}
