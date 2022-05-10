import * as collabs from "@collabs/collabs";
import * as BSON from "bson";
import { SerialRuntime } from "./serial_runtime";

// TODO: use Collabs version once it's exported.
function makeUID(replicaID: string, replicaUniqueNumber: number): string {
  // OPT: shorten (base128 instead of base36)
  return `${replicaUniqueNumber.toString(36)} ${replicaID}`;
}

interface ChildSave {
  name: string;
  saveData: BSON.Binary;
  args: BSON.Binary;
}

export class SerialMutCSet<C extends collabs.Collab, Args extends any[]>
  extends collabs.AbstractCSetCollab<C, Args>
  implements collabs.CSet<C, Args>, collabs.ICollabParent
{
  private readonly processLocalEcho: boolean;
  private readonly processRemoteEcho: boolean;

  private readonly children = new Map<string, C>();
  private readonly constructorArgs = new Map<string, Uint8Array>();

  /**
   * Options only apply to our own messages, not child messages.
   */
  constructor(
    initToken: collabs.InitToken,
    private readonly valueConstructor: (
      valueInitToken: collabs.InitToken,
      ...args: Args
    ) => C,
    processEcho: "local" | "remote",
    private readonly argsSerializer: collabs.Serializer<Args> = collabs.DefaultSerializer.getInstance(
      initToken.runtime
    )
  ) {
    super(initToken);

    this.processLocalEcho = processEcho === "local";
    this.processRemoteEcho = processEcho === "remote";
  }

  childSend(
    child: collabs.Collab<collabs.CollabEventsRecord>,
    messagePath: collabs.Message[]
  ): void {
    messagePath.push(child.name);
    this.send(messagePath);
  }

  getAddedContext(_key: symbol): unknown {
    return undefined;
  }

  /**
   * Returns undefined if processLocalEcho is false.
   */
  // @ts-ignore need to change supertype to allow undefined.
  add(...args: Args): C | undefined {
    const message = {
      op: "add",
      add: {
        replicaUniqueNumber: this.runtime.getReplicaUniqueNumber(),
        args: new BSON.Binary(this.argsSerializer.serialize(args)),
      },
    };
    this.send([BSON.serialize(message)]);

    if (this.processLocalEcho) {
      const created = this.ourCreatedValue;
      this.ourCreatedValue = undefined;
      return created!;
    } else return undefined;
  }

  delete(value: C): void {
    if (this.has(value)) {
      const message = {
        op: "delete",
        delete: value.name,
      };
      this.send([BSON.serialize(message)]);
    }
  }

  has(value: C): boolean {
    return this.children.has(value.name);
  }

  private ourCreatedValue?: C = undefined;
  protected receiveInternal(
    messagePath: collabs.Message[],
    meta: collabs.MessageMeta
  ): void {
    const lastMessage = messagePath[messagePath.length - 1];
    if (typeof lastMessage === "string") {
      // Message for an existing child.  Proceed as in
      // CObject.
      const child = this.children.get(lastMessage);
      if (child === undefined) {
        // Assume it's a message for a deleted child; ignore.
        return;
      }
      messagePath.length--;
      child.receive(messagePath, meta);
    } else {
      if (
        !this.processLocalEcho &&
        meta.isLocalEcho &&
        !(<SerialRuntime>this.runtime).isServer
      )
        return;
      if (
        !this.processRemoteEcho &&
        !meta.isLocalEcho &&
        meta.sender === this.runtime.replicaID
      )
        return;

      const decoded = BSON.deserialize(<Uint8Array>lastMessage);
      switch (decoded.op) {
        case "add": {
          const name = makeUID(meta.sender, decoded.add.replicaUniqueNumber);

          const newChild = this.addChild(name, decoded.add.args.buffer);

          if (meta.isLocalEcho) {
            this.ourCreatedValue = newChild;
          }

          this.emit("Add", {
            value: newChild,
            meta,
          });
          break;
        }
        case "delete": {
          const child = this.children.get(decoded.delete);
          if (child !== undefined) {
            this.children.delete(decoded.delete);

            this.emit("Delete", {
              value: child,
              meta,
            });
          }
          break;
        }
      }
    }
  }

  private addChild(name: string, argsSerialized: Uint8Array): C {
    const newChild = this.valueConstructor(
      new collabs.InitToken(name, this),
      ...this.argsSerializer.deserialize(argsSerialized)
    );
    this.children.set(name, newChild);
    this.constructorArgs.set(name, argsSerialized);

    return newChild;
  }

  values(): IterableIterator<C> {
    return this.children.values();
  }

  get size(): number {
    return this.children.size;
  }

  getDescendant(
    namePath: string[]
  ): collabs.Collab<collabs.CollabEventsRecord> {
    if (namePath.length === 0) return this;

    const childName = namePath[namePath.length - 1];
    const child = this.children.get(childName);
    if (child === undefined) {
      throw new Error("child does not exist or was deleted: " + childName);
    }

    namePath.length--;
    return child.getDescendant(namePath);
  }

  save(): Uint8Array {
    const childSaves: ChildSave[] = [];
    for (const [name, child] of this.children) {
      childSaves.push({
        name,
        saveData: new BSON.Binary(child.save()),
        args: new BSON.Binary(this.constructorArgs.get(name)!),
      });
    }
    return BSON.serialize({ "": childSaves });
  }

  load(saveData: collabs.Optional<Uint8Array>): void {
    if (!saveData.isPresent) return;

    const decoded = <ChildSave[]>BSON.deserialize(saveData.get())[""];
    for (const childSave of decoded) {
      const child = this.addChild(childSave.name, childSave.args.buffer);
      child.load(collabs.Optional.of(childSave.saveData.buffer));
    }
  }

  canGC(): boolean {
    return false;
  }
}
