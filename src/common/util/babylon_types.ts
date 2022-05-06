// Recreations of Babylon types that we need in the state,
// since NodeJS doesn't like Babylon.

import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { FOLLOW_JUMP_TIME } from "../../common/consts";

// Make this a plain Object + static class instead of
// a normal class, so we can serialize it with
// DefaultSerializer.

export interface MyVector3 {
  isMyVector3: true; // Prevent Vector3 from being a MyVector3
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export const MyVector3 = {
  new(x: number, y: number, z: number): MyVector3 {
    return { isMyVector3: true, x, y, z };
  },

  from(vec: Vector3): MyVector3 {
    return MyVector3.new(vec.x, vec.y, vec.z);
  },

  equals(a: MyVector3 | Vector3, b: MyVector3 | Vector3) {
    return a.x === b.x && a.y === b.y && a.z === b.z;
  },

  syncTo(from: MyVector3, to: Vector3) {
    to.x = from.x;
    to.y = from.y;
    to.z = from.z;
  },

  /**
   * Change `target` to move towards `dest` (possibly
   * all the way), moving at most the given maxDist.
   */
  moveTowards(dest: MyVector3, target: Vector3, maxSpeed: number, dt: number) {
    const dx = dest.x - target.x;
    const dy = dest.y - target.y;
    const dz = dest.z - target.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    const maxDist = maxSpeed * dt;

    if (dist < maxDist || dist >= maxSpeed * FOLLOW_JUMP_TIME) {
      // Move it there exactly (avoiding floating point errors).
      MyVector3.syncTo(dest, target);
    } else {
      // ratio * dv = norm(dv) * maxDist.
      const ratio = maxDist / dist;
      target.x += dx * ratio;
      target.y += dy * ratio;
      target.z += dz * ratio;
    }
  },
} as const;
