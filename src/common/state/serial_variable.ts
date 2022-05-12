import * as collabs from "@collabs/collabs";

export class SerialCVariable<T>
  extends collabs.CPrimitive<collabs.CVariableEventsRecord<T>>
  implements collabs.CVariable<T>
{
  private _value: T;
  private readonly processLocalEcho: boolean;
  private readonly processRemoteEcho: boolean;

  constructor(
    initToken: collabs.InitToken,
    initialValue: T,
    processEcho: "local" | "remote" | "both",
    private readonly serializer: collabs.Serializer<T> = collabs.DefaultSerializer.getInstance()
  ) {
    super(initToken);

    this._value = initialValue;
    this.processLocalEcho = processEcho === "local" || processEcho === "both";
    this.processRemoteEcho = processEcho === "remote" || processEcho === "both";
  }

  set(value: T): T | undefined {
    this.value = value;
    if (this.processLocalEcho) return this.value;
    else return undefined;
  }

  set value(value: T) {
    this.sendPrimitive(this.serializer.serialize(value));
  }

  get value(): T {
    return this._value;
  }

  protected receivePrimitive(
    message: collabs.Message,
    meta: collabs.MessageMeta
  ): void {
    if (!this.processLocalEcho && meta.isLocalEcho) return;
    if (
      !this.processRemoteEcho &&
      !meta.isLocalEcho &&
      meta.sender === this.runtime.replicaID
    )
      return;

    const previousValue = this.value;
    this._value = this.serializer.deserialize(<Uint8Array>message);
    this.emit("Set", { previousValue, meta });
  }

  save(): Uint8Array {
    return this.serializer.serialize(this._value);
  }

  load(saveData: collabs.Optional<Uint8Array>): void {
    if (saveData.isPresent) {
      this._value = this.serializer.deserialize(saveData.get());
    }
  }

  canGC(): boolean {
    return false;
  }
}
