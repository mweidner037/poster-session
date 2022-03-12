import * as collabs from "@collabs/collabs";
import { PlayerState, SerialMutCSet } from "../../common/state";
import { MyVector3 } from "../../common/util/babylon_types";
import { Player } from "./player";
import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import { Globals } from "../util/globals";

export interface PlayerSetEventsRecord {
  Add: collabs.CSetEvent<Player>;
  Delete: collabs.CSetEvent<Player>;
  /**
   * Emitted whenever the set of display names changes.
   */
  NameSetChange: {};
}

export class PlayerSet extends collabs.EventEmitter<PlayerSetEventsRecord> {
  private readonly playersByState = new Map<PlayerState, Player>();

  /**
   * Assumes the Collab state is already loaded. Further messages
   * are okay too.
   */
  constructor(
    private readonly state: SerialMutCSet<
      PlayerState,
      [
        position: MyVector3,
        rotation: MyVector3,
        peerID: string,
        displayName: string,
        hue: number
      ]
    >,
    private readonly meshTemplate: BABYLON.AbstractMesh,
    private readonly globals: Globals
  ) {
    super();

    for (const playerState of this.state) {
      this.onAdd(playerState);
    }
    this.state.on("Add", (e) => this.onAdd(e.value, e.meta));
    this.state.on("Delete", (e) => this.onDelete(e.value, e.meta));
  }

  private onAdd(playerState: PlayerState, eventMeta?: collabs.MessageMeta) {
    const displayMesh = <BABYLON.Mesh>this.meshTemplate.clone("bear", null)!;
    displayMesh.setEnabled(true);
    const entity = new Player(
      playerState,
      displayMesh,
      this.globals.highlightLayer,
      this.globals.scene
    );
    this.playersByState.set(playerState, entity);

    playerState.displayName.on("Set", () => this.emit("NameSetChange", {}));

    if (eventMeta !== undefined) {
      this.emit("Add", { value: entity, meta: eventMeta });
      this.emit("NameSetChange", {});
    }
  }

  private onDelete(playerState: PlayerState, eventMeta: collabs.MessageMeta) {
    const entity = this.playersByState.get(playerState)!;
    this.playersByState.delete(playerState);
    entity.mesh.dispose();

    this.emit("Delete", { value: entity, meta: eventMeta });
    this.emit("NameSetChange", {});
  }

  add(
    peerID: string,
    position: MyVector3,
    rotation: MyVector3,
    displayName: string,
    hue: number
  ): Player {
    const playerState = this.state.add(
      position,
      rotation,
      peerID,
      displayName,
      hue
    )!;
    return this.playersByState.get(playerState)!;
  }

  delete(entity: Player) {
    this.state.delete(entity.state);
  }

  values(): IterableIterator<Player> {
    return this.playersByState.values();
  }

  [Symbol.iterator]() {
    return this.values();
  }
}
