import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import { PlayerAudio } from "../calling";
import { Player, Room } from "../state";
import { handleCameraPerspective } from "./handle_camera_perspective";
import { handlePlayerMovement } from "./handle_player_movement";
import { runLogicLoop } from "./run_logic_loop";
import { addTiledGround } from "./tiled_ground";

/**
 * Setup the scene: its starting contents, event handlers, run loop, etc.
 * I.e., do what you would do if creating the scene as a self-contained
 * component.
 *
 * This happens after createScene(), which merely constructs the Scene
 * object well enough to be used in other places' setup.
 */
export function setupScene(
  scene: BABYLON.Scene,
  camera: BABYLON.UniversalCamera,
  ourPlayer: Player,
  room: Room,
  ourPlayerAudio: PlayerAudio
) {
  addTiledGround(scene);

  handlePlayerMovement(ourPlayer, room.players, scene);

  handleCameraPerspective(camera, scene);

  runLogicLoop(ourPlayer, room.players, ourPlayerAudio);
}
