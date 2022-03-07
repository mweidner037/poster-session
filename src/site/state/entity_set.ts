import * as collabs from "@collabs/collabs";
import { EntityCollab, SerialMutCSet } from "../../common/state";
import { MyVector3 } from "../../common/util/babylon_types";
import { Entity } from "./entity";
import * as BABYLON from "@babylonjs/core/Legacy/legacy";

export class EntitySet extends collabs.EventEmitter<
  collabs.CSetEventsRecord<Entity>
> {
  private readonly entitiesByCollab = new Map<EntityCollab, Entity>();

  constructor(
    private readonly entityCollabs: SerialMutCSet<
      EntityCollab,
      [position: MyVector3, rotation: MyVector3]
    >,
    private readonly meshTemplate: BABYLON.AbstractMesh
  ) {
    super();

    // TODO: only do if runtime is already loaded, once we add
    // Runtime.isLoaded field.
    for (const entityCollab of this.entityCollabs) {
      this.onAdd(entityCollab);
    }
    this.entityCollabs.runtime.on("Load", () => {
      for (const entityCollab of this.entityCollabs) {
        this.onAdd(entityCollab);
      }
    });
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

  add(position: MyVector3, rotation: MyVector3): Entity {
    const entityCollab = this.entityCollabs.add(position, rotation)!;
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
