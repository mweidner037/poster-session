// Recreations of Babylon types that we need in the state,
// since NodeJS doesn't like Babylon.

import { Vector3 } from "@babylonjs/core/Maths/math.vector";

export class MyVector3 {
  readonly isMyVector3 = true;

  constructor(readonly x: number, readonly y: number, readonly z: number) {}

  private _isZero = -1;
  get isZero(): boolean {
    if (this._isZero === -1) {
      const ans = this.x === 0 && this.y === 0 && this.z === 0;
      this._isZero = ans ? 1 : 0;
      return ans;
    } else return this._isZero === 1;
  }

  equalsBabylon(other: Vector3) {
    return other.x === this.x && other.y === this.y && other.z === this.z;
  }

  syncTo(other: Vector3) {
    other.x = this.x;
    other.y = this.y;
    other.z = this.z;
  }

  scale(scale: number): [x: number, y: number, z: number] {
    return [this.x * scale, this.y * scale, this.z * scale];
  }

  static from(vec: Vector3) {
    return new MyVector3(vec.x, vec.y, vec.z);
  }
}
