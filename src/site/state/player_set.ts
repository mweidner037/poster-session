import * as collabs from "@collabs/collabs";
import { PlayerState, SerialMutCSet } from "../../common/state";
import { MyVector3 } from "../../common/util/babylon_types";
import { Player } from "./player";
import * as BABYLON from "@babylonjs/core/Legacy/legacy";

export class PlayerSet extends collabs.EventEmitter<
  collabs.CSetEventsRecord<Player>
> {
  private readonly entitiesByCollab = new Map<PlayerState, Player>();

  /**
   * Assumes the Collab state is already loaded. Further messages
   * are okay too.
   */
  constructor(
    private readonly entityCollabs: SerialMutCSet<
      PlayerState,
      [
        peerID: string,
        position: MyVector3,
        rotation: MyVector3,
        displayName: string,
        color: string
      ]
    >,
    private readonly meshTemplate: BABYLON.AbstractMesh,
    private readonly scene: BABYLON.Scene
  ) {
    super();

    for (const entityCollab of this.entityCollabs) {
      this.onAdd(entityCollab);
    }
    this.entityCollabs.on("Add", (e) => this.onAdd(e.value, e.meta));
    this.entityCollabs.on("Delete", (e) => this.onDelete(e.value, e.meta));
  }

  private onAdd(entityCollab: PlayerState, eventMeta?: collabs.MessageMeta) {
    const displayMesh = this.meshTemplate.clone("bear", null)!;
    displayMesh.setEnabled(true);
    const entity = new Player(entityCollab, displayMesh, this.scene);
    this.entitiesByCollab.set(entityCollab, entity);

    if (eventMeta !== undefined) {
      this.emit("Add", { value: entity, meta: eventMeta });
    }
  }

  private onDelete(entityCollab: PlayerState, eventMeta: collabs.MessageMeta) {
    const entity = this.entitiesByCollab.get(entityCollab)!;
    this.entitiesByCollab.delete(entityCollab);
    entity.mesh.dispose();

    this.emit("Delete", { value: entity, meta: eventMeta });
  }

  add(
    peerID: string,
    position: MyVector3,
    rotation: MyVector3,
    displayName: string,
    color: string
  ): Player {
    const entityCollab = this.entityCollabs.add(
      peerID,
      position,
      rotation,
      displayName,
      color
    )!;
    return this.entitiesByCollab.get(entityCollab)!;
  }

  delete(entity: Player) {
    this.entityCollabs.delete(entity.state);
  }

  values(): IterableIterator<Player> {
    return this.entitiesByCollab.values();
  }

  [Symbol.iterator]() {
    return this.values();
  }
}
