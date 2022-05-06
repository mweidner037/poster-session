import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import { RoomState } from "../../common/state";
import { FurnitureSet } from "./furniture_set";
import { PlayerSet } from "./player_set";

export class Room {
  readonly players: PlayerSet;
  readonly furnitures: FurnitureSet;

  constructor(readonly state: RoomState, playerMesh: BABYLON.AbstractMesh) {
    this.players = new PlayerSet(state.players, playerMesh);
    this.furnitures = new FurnitureSet(state.furniture);
  }
}
