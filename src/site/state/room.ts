import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import { RoomState } from "../../common/state";
import { FurnitureSet } from "./furniture_set";
import { PlayerSet } from "./player_set";

export class Room {
  readonly players: PlayerSet;
  readonly furnitures: FurnitureSet;

  constructor(
    readonly state: RoomState,
    scene: BABYLON.Scene,
    highlightLayer: BABYLON.HighlightLayer
  ) {
    this.players = new PlayerSet(state.players, scene, highlightLayer);
    this.furnitures = new FurnitureSet(state.furniture, scene);
  }
}
