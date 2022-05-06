import * as collabs from "@collabs/collabs";
import { MyVector3 } from "../util/babylon_types";
import { ConstructorParametersMinusInitToken } from "../util/types";
import { FurnitureStateClasses } from "./furniture_states";
import { FurnitureState } from "./furniture_state";
import { PlayerState } from "./player_state";
import { SerialMutCSet } from "./serial_mut_set";

export type ToArgs<K> = K extends keyof typeof FurnitureStateClasses
  ? [
      type: K,
      ...args: ConstructorParametersMinusInitToken<
        typeof FurnitureStateClasses[K]
      >
    ]
  : never;

export class RoomState extends collabs.CObject {
  readonly players: SerialMutCSet<
    PlayerState,
    [
      position: MyVector3,
      rotation: MyVector3,
      peerID: string,
      displayName: string,
      hue: number
    ]
  >;

  readonly furniture: SerialMutCSet<
    FurnitureState,
    ToArgs<keyof typeof FurnitureStateClasses>
  >;

  constructor(initToken: collabs.InitToken) {
    super(initToken);

    this.players = this.addChild(
      "p",
      collabs.Pre(SerialMutCSet)(
        collabs.ConstructorAsFunction(PlayerState),
        "local"
      )
    );
    this.furniture = this.addChild(
      "f",
      collabs.Pre(SerialMutCSet)((valueInitToken, type, ...args) => {
        return new FurnitureStateClasses[type](valueInitToken, ...args);
      }, "remote")
    );
  }
}
