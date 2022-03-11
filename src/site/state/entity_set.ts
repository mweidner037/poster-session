import * as collabs from "@collabs/collabs";
import { EntityCollab, SerialMutCSet } from "../../common/state";
import { MyVector3 } from "../../common/util/babylon_types";
import { Entity } from "./entity";
import * as BABYLON from "@babylonjs/core/Legacy/legacy";

export class EntitySet extends collabs.EventEmitter<
  collabs.CSetEventsRecord<Entity>
> {
  private readonly entitiesByCollab = new Map<EntityCollab, Entity>();

  /**
   * Assumes the Collab state is already loaded. Further messages
   * are okay too.
   */
  constructor(
    private readonly entityCollabs: SerialMutCSet<
      EntityCollab,
      [peerID: string, position: MyVector3, rotation: MyVector3]
    >,
    private readonly meshTemplate: BABYLON.AbstractMesh
  ) {
    super();

    for (const entityCollab of this.entityCollabs) {
      this.onAdd(entityCollab);
    }
    this.entityCollabs.on("Add", (e) => this.onAdd(e.value, e.meta));
    this.entityCollabs.on("Delete", (e) => this.onDelete(e.value, e.meta));
  }

  private onAdd(entityCollab: EntityCollab, eventMeta?: collabs.MessageMeta) {
    const innerMesh = this.meshTemplate.clone("bear", null)!;
    innerMesh.setEnabled(true);
    const mesh = new BABYLON.AbstractMesh("mesh");
    innerMesh.parent = mesh;
    const entity = new Entity(entityCollab, mesh);
    this.entitiesByCollab.set(entityCollab, entity);

    if (eventMeta !== undefined) {
      this.emit("Add", { value: entity, meta: eventMeta });
    }
  }

  private onDelete(entityCollab: EntityCollab, eventMeta: collabs.MessageMeta) {
    const entity = this.entitiesByCollab.get(entityCollab)!;
    this.entitiesByCollab.delete(entityCollab);
    entity.mesh.dispose();

    this.emit("Delete", { value: entity, meta: eventMeta });
  }

  add(peerID: string, position: MyVector3, rotation: MyVector3): Entity {
    const entityCollab = this.entityCollabs.add(peerID, position, rotation)!;
    return this.entitiesByCollab.get(entityCollab)!;
  }

  delete(entity: Entity) {
    this.entityCollabs.delete(entity.state);
  }

  values(): IterableIterator<Entity> {
    return this.entitiesByCollab.values();
  }

  [Symbol.iterator]() {
    return this.values();
  }
}
