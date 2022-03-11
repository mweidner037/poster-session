import { PlayerState } from "../../common/state";
import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import {
  ROTATION_FOLLOW_SPEED,
  TRANSLATION_FOLLOW_SPEED,
} from "../../common/consts";
import { calcVolumes } from "../calling/calc_volumes";
import { PeerJSConnection } from "../calling";

export class Player {
  audioConn: PeerJSConnection | null = null;

  constructor(
    readonly state: PlayerState,
    readonly mesh: BABYLON.AbstractMesh,
    readonly material: BABYLON.StandardMaterial
  ) {
    // Transfer the initial values to the mesh.
    this.state.position.value.syncTo(this.mesh.position);
    this.state.rotation.value.syncTo(this.mesh.rotation);
    this.material.diffuseColor = BABYLON.Color3.FromHexString(
      this.state.color.value
    );

    // Sync state to values, except those set during ticks.
    this.state.color.on("Set", () => {
      this.material.diffuseColor = BABYLON.Color3.FromHexString(
        this.state.color.value
      );
    });
  }

  /**
   * Only called on non-player entities.
   */
  littleTick(deltaSec: number): void {
    // Move this.mesh towards the intended state at
    // a bounded speed.
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

  /**
   * Only called on non-player entities.
   */
  bigTick(ourPlayer: Player): void {
    // Update volume levels by distance and angle.
    if (this.audioConn !== null) {
      this.audioConn.streamSplit.setVolume(
        ...calcVolumes(
          this.mesh.position,
          this.mesh.rotation,
          ourPlayer.mesh.position,
          ourPlayer.mesh.rotation
        )
      );
    }
  }
}
