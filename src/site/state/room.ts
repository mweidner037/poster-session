import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import { RoomState } from "../../common/state";
import { Globals } from "../util/globals";
import { FurnitureSet } from "./furniture_set";
import { PlayerSet } from "./player_set";

export class Room {
  readonly players: PlayerSet;
  readonly furnitures: FurnitureSet;

  constructor(
    readonly state: RoomState,
    playerMesh: BABYLON.AbstractMesh,
    globals: Globals
  ) {
    this.players = new PlayerSet(state.players, playerMesh, globals);
    this.furnitures = new FurnitureSet(state.furniture, globals);
  }
}
