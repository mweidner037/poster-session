// Recreations of Babylon types that we need in the state,
// since NodeJS doesn't like Babylon.

import { Vector3 } from "@babylonjs/core/Maths/math.vector";

export class MyVector3 {
  readonly isMyVector3 = true;

  constructor(readonly x: number, readonly y: number, readonly z: number) {}

  static from(vec: Vector3) {
    return new MyVector3(vec.x, vec.y, vec.z);
  }
}
