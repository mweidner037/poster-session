import { KeyTracker } from "./key_tracker";
import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import { ROTATION_SPEED, TRANSLATION_SPEED } from "../../common/consts";
import { Player } from "../state/player";
import { PlayerSet } from "../state/player_set";

export function handlePlayerMovement(
  ourPlayer: Player,
  players: PlayerSet,
  keyTracker: KeyTracker,
  scene: BABYLON.Scene
) {
  // Render loop. Note we do our own movements here,
  // but only update the server in the logic loop below.
  // This is okay because Player doesn't sync local changes.
  let lastTime = -1;
  scene.onBeforeRenderObservable.add(() => {
    if (lastTime === -1) {
      lastTime = Date.now();
      return;
    }

    const newTime = Date.now();
    const deltaSec = (newTime - lastTime) / 1000;
    lastTime = newTime;

    // Move our player directly (w/o telling the server right away).
    if (keyTracker.getIgnoreCase("w")) {
      ourPlayer.mesh.movePOV(0, 0, -deltaSec * TRANSLATION_SPEED);
    } else if (keyTracker.getIgnoreCase("s")) {
      ourPlayer.mesh.movePOV(0, 0, deltaSec * TRANSLATION_SPEED);
    }

    if (keyTracker.getIgnoreCase("a") && !keyTracker.getIgnoreCase("d")) {
      ourPlayer.mesh.rotatePOV(0, -deltaSec * ROTATION_SPEED, 0);
    } else if (
      keyTracker.getIgnoreCase("d") &&
      !keyTracker.getIgnoreCase("a")
    ) {
      ourPlayer.mesh.rotatePOV(0, deltaSec * ROTATION_SPEED, 0);
    }

    // Move other players.
    for (const player of players.values()) {
      if (player !== ourPlayer) player.littleTick(deltaSec);
    }
  });
}
