import * as collabs from "@collabs/collabs";

export interface SendEvent {
  message: string;
}

export interface SerialRuntimeEventsRecord extends collabs.RuntimeEventsRecord {
  Send: SendEvent;
}

interface RuntimeMessage {
  message: string;
  sender: string;
}

// TODO: need to harden everything against bad messages - especially the server.

export class SerialRuntime extends collabs.AbstractRuntime<SerialRuntimeEventsRecord> {
  private _isLoaded = false;
  private readonly batchingLayer: collabs.BatchingLayer;
  private readonly registry: collabs.PublicCObject;
  readonly isServer: boolean;

  constructor(options?: {
    batchingStrategy?: collabs.BatchingStrategy;
    replicaId?: string;
    isServer?: boolean;
  }) {
    super(options?.replicaId ?? collabs.randomReplicaId());

    const batchingStrategy =
      options?.batchingStrategy ?? new collabs.ImmediateBatchingStrategy();
    this.isServer = options?.isServer ?? false;

    // Setup Collab tree.
    this.batchingLayer = this.setRootCollab(
      collabs.Pre(collabs.BatchingLayer)(batchingStrategy)
    );
    this.registry = this.batchingLayer.setChild(
      collabs.Pre(collabs.PublicCObject)()
    );
  }

  childSend(
    _child: collabs.Collab<collabs.CollabEventsRecord>,
    messagePath: collabs.Message[]
  ): void {
    const runtimeMessage: RuntimeMessage = {
      message: collabs.bytesAsString(<Uint8Array>messagePath[0]),
      sender: this.replicaID,
    };
    this.emit("Send", { message: JSON.stringify(runtimeMessage) });
  }

  getAddedContext(_key: symbol): unknown {
    return undefined;
  }

  registerCollab<C extends collabs.Collab>(
    name: string,
    preCollab: collabs.Pre<C>
  ): C {
    return this.registry.addChild(name, preCollab);
  }

  receive(message: string) {
    if (!this._isLoaded) {
      throw new Error("Not yet loaded");
    }

    const runtimeMessage = <RuntimeMessage>JSON.parse(message);
    this.batchingLayer.receive(
      [collabs.stringAsBytes(runtimeMessage.message)],
      {
        sender: runtimeMessage.sender,
        isLocalEcho: false,
      }
    );
  }

  save(): Uint8Array {
    if (!this._isLoaded) {
      throw new Error("Not yet loaded");
    }

    // Commit the pending batch, as required by [[BatchingLayer.save]].
    this.batchingLayer.commitBatch();

    return this.rootCollab.save();
  }

  load(saveData: collabs.Optional<Uint8Array>): void {
    if (this._isLoaded) {
      throw new Error("Already loaded");
    }

    this.rootCollab.load(saveData);
    this._isLoaded = true;

    this.emit("Load", {
      skipped: !saveData.isPresent,
    });
  }

  // ---Less common user-facing methods---

  setBatchingStrategy(batchingStrategy: collabs.BatchingStrategy): void {
    this.batchingLayer.setBatchingStrategy(batchingStrategy);
  }

  commitBatch(): void {
    this.batchingLayer.commitBatch();
  }

  get isLoaded(): boolean {
    return this._isLoaded;
  }
}
