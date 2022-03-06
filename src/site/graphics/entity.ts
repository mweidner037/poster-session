import { EntityCollab } from "../../common/state";
import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import { ROTATION_FOLLOW_SPEED, TRANSLATION_FOLLOW_SPEED } from "../consts";

export class Entity {
  constructor(readonly state: EntityCollab, readonly mesh: BABYLON.Mesh) {
    // Transfer the initial position/rotation to the mesh.
    this.state.position.value.syncTo(this.mesh.position);
    this.state.rotation.value.syncTo(this.mesh.rotation);
  }

  /**
   * Moves this.mesh towards the intended state at
   * a bounded speed.
   */
  moveMesh(deltaSec: number): void {
    this.state.position.value.moveToThis(
      this.mesh.position,
      TRANSLATION_FOLLOW_SPEED,
      deltaSec
    );
    this.state.rotation.value.moveToThis(
      this.mesh.rotation,
      ROTATION_FOLLOW_SPEED,
      deltaSec
    );
  }
}
