import { Vector3 } from "@babylonjs/core";

// Based on https://github.com/Meshiest/demo-proximity-voice/blob/f19b87893a9656c4f2b49523729cf698f3f9c086/public/app.js#L100
// which is CC0-1.0 licensed.

const SOUND_CUTOFF_RANGE = 10;
const SOUND_NEAR_RANGE = 1;

export function calcVolumes(
  soundPos: Vector3,
  soundRot: Vector3,
  ourPos: Vector3,
  ourRot: Vector3
): [left: number, right: number] {
  // console.log(
  //   JSON.stringify({
  //     soundPos: { x: soundPos.x, z: soundPos.z },
  //     ourPos: { x: ourPos.x, z: ourPos.z },
  //     ourRot: ourRot.y,
  //   })
  // );
  // calulate angle and distance from listener to sound
  // TODO: For now we assume everyone is in the same XZ-parallel
  // plane, so we ignore y and only consider yRot.
  const thetaAbs = Math.atan2(-(soundPos.x - ourPos.x), soundPos.z - ourPos.z);
  // TODO: use soundRot.y for scaling (reduce if they face away from us).
  const theta = thetaAbs + ourRot.y;
  const dist = Math.hypot(soundPos.x - ourPos.x, soundPos.z - ourPos.z);
  const scale =
    1 - (dist - SOUND_NEAR_RANGE) / (SOUND_CUTOFF_RANGE - SOUND_NEAR_RANGE);

  // target is too far away, no volume
  if (dist > SOUND_CUTOFF_RANGE) return [0, 0];

  // target is very close, max volume
  if (dist < SOUND_NEAR_RANGE) return [1, 1];

  const cos = Math.cos(theta);
  const sin = Math.sin(theta);

  // TODO: penalty for facing away? Currently it's symmetric
  // across our vertical/LR plane.
  const ans: [number, number] = [
    (Math.pow(sin > 0 ? sin : 0, 2) + Math.pow(cos, 2)) * scale,
    (Math.pow(sin < 0 ? sin : 0, 2) + Math.pow(cos, 2)) * scale,
  ];
  // console.log(ans);
  return ans;
}
