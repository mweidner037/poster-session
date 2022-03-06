import { EntityCollab } from "../../common/state";
import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import { MyVector3 } from "../../common/util/babylon_types";

export class Entity {
  constructor(readonly state: EntityCollab, readonly mesh: BABYLON.Mesh) {
    this.state.position.on("Set", (e) => {
      if (!e.meta.isLocalEcho) {
        this.state.position.value.syncTo(this.mesh.position);
        this.lastPosTime = Date.now();
      }
    });
    this.state.rotation.on("Set", (e) => {
      if (!e.meta.isLocalEcho) {
        this.state.rotation.value.syncTo(this.mesh.rotation);
        this.lastRotTime = Date.now();
      }
    });

    this.state.posVelocity.on("Set", (e) => {
      if (!e.meta.isLocalEcho) {
        this.lastPosTime = Date.now();
      }
    });
    this.state.rotVelocity.on("Set", (e) => {
      if (!e.meta.isLocalEcho) {
        this.lastRotTime = Date.now();
      }
    });
  }

  private lastPosTime = -1;
  private lastRotTime = -1;
  /**
   * Moves this.mesh using velocities.
   */
  moveMesh(time = Date.now()): void {
    // console.log("moveMesh");
    // console.log(this.state.posVelocity.value);
    if (this.lastPosTime !== -1 && !this.state.posVelocity.value.isZero) {
      const deltaSec = (time - this.lastPosTime) / 1000;
      // TODO: use actual sent velocity instead (more accurate, faster)
      this.mesh.movePOV(...this.state.posVelocity.value.scale(deltaSec));
    }
    this.lastPosTime = time;

    if (this.lastRotTime !== -1 && !this.state.rotVelocity.value.isZero) {
      const deltaSec = (time - this.lastRotTime) / 1000;
      // TODO: use actual sent velocity instead (more accurate, faster)
      this.mesh.rotatePOV(...this.state.rotVelocity.value.scale(deltaSec));
    }
    this.lastRotTime = time;
  }
}
