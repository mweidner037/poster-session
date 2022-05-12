import * as collabs from "@collabs/collabs";
import { SerialCVariable } from "./serial_variable";

export class SerialCMap<K, V> extends collabs.AbstractCMapCObject<
  K,
  V,
  [V],
  collabs.CMapEventsRecord<K, V>
> {
  protected readonly internalMap: collabs.LazyMutCMap<
    K,
    SerialCVariable<collabs.Optional<V>>
  >;
  private readonly optionalValueSerializer: collabs.Serializer<
    collabs.Optional<V>
  >;

  constructor(
    initToken: collabs.InitToken,
    private readonly processEcho: "local" | "remote" | "both",
    keySerializer: collabs.Serializer<K> = collabs.DefaultSerializer.getInstance(),
    valueSerializer: collabs.Serializer<V> = collabs.DefaultSerializer.getInstance()
  ) {
    super(initToken);

    this.optionalValueSerializer =
      collabs.OptionalSerializer.getInstance(valueSerializer);

    this.internalMap = this.addChild(
      "",
      collabs.Pre(collabs.LazyMutCMap)(
        this.internalVariableConstructor.bind(this),
        keySerializer
      )
    );

    // Events emitters are added in internalVariableConstructor.
  }

  private internalVariableConstructor(
    variableInitToken: collabs.InitToken,
    key: K
  ): SerialCVariable<collabs.Optional<V>> {
    const variable = new SerialCVariable<collabs.Optional<V>>(
      variableInitToken,
      collabs.Optional.empty(),
      this.processEcho,
      this.optionalValueSerializer
    );
    variable.on("Set", (event) => {
      if (variable.value.isPresent) {
        // The value was set (possibly overwriting a
        // a previously set value), not deleted.
        this.emit("Set", {
          key,
          previousValue: event.previousValue,
          meta: event.meta,
        });
      } else if (event.previousValue.isPresent && !variable.value.isPresent) {
        // The value was deleted, deleting a previously
        // set value.
        this.emit("Delete", {
          key,
          deletedValue: event.previousValue.get(),
          meta: event.meta,
        });
      }
    });
    return variable;
  }

  set(key: K, value: V): V | undefined {
    this.internalMap.get(key).value = collabs.Optional.of(value);
    if (this.processEcho !== "remote") return value;
    else return undefined;
  }

  delete(key: K): void {
    const variable = this.internalMap.getIfPresent(key);
    if (variable !== undefined) variable.value = collabs.Optional.empty();
  }

  get(key: K): V | undefined {
    const variable = this.internalMap.getIfPresent(key);
    return variable === undefined ? undefined : variable.value.get();
  }

  has(key: K): boolean {
    return this.internalMap.has(key);
  }

  get size(): number {
    return this.internalMap.size;
  }

  *entries(): IterableIterator<[K, V]> {
    for (const [key, valueVariable] of this.internalMap) {
      yield [key, valueVariable.value.get()];
    }
  }
}
