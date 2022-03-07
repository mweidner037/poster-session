// Recreations of Babylon types that we need in the state,
// since NodeJS doesn't like Babylon.

import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { FOLLOW_JUMP_TIME } from "../../common/consts";

export class MyVector3 {
  readonly isMyVector3 = true;

  constructor(readonly x: number, readonly y: number, readonly z: number) {}

  equalsBabylon(other: Vector3) {
    return other.x === this.x && other.y === this.y && other.z === this.z;
  }

  syncTo(other: Vector3) {
    other.x = this.x;
    other.y = this.y;
    other.z = this.z;
  }

  /**
   * Change other to move towards this value (possibly
   * all the way), moving at most the given maxDist.
   */
  moveToThis(other: Vector3, maxSpeed: number, dt: number) {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    const dz = this.z - other.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    const maxDist = maxSpeed * dt;

    if (dist < maxDist || dist >= maxSpeed * FOLLOW_JUMP_TIME) {
      // Move it there exactly (avoiding floating point errors).
      this.syncTo(other);
    } else {
      // ratio * dv = norm(dv) * maxDist.
      const ratio = maxDist / dist;
      other.x += dx * ratio;
      other.y += dy * ratio;
      other.z += dz * ratio;
    }
  }

  static from(vec: Vector3) {
    return new MyVector3(vec.x, vec.y, vec.z);
  }
}
