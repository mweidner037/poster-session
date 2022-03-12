import * as collabs from "@collabs/collabs";
import { MyVector3 } from "../util/babylon_types";
import { PositionRotationOtherSerializer } from "../util/serialization";
import { FurnitureState } from "./furnitures";
import { PlayerState } from "./player_state";
import { SerialMutCSet } from "./serial_mut_set";

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
    [
      position: MyVector3,
      rotation: MyVector3,
      type: string,
      ...otherArgs: unknown[]
    ]
  >;

  constructor(initToken: collabs.InitToken) {
    super(initToken);

    this.players = this.addChild(
      "p",
      collabs.Pre(SerialMutCSet)(
        collabs.ConstructorAsFunction(PlayerState),
        "local",
        new PositionRotationOtherSerializer()
      )
    );
    this.furniture = this.addChild(
      "f",
      collabs.Pre(SerialMutCSet)(
        (valueInitToken, position, rotation, type, ...otherArgs) => {
          switch (type) {
            // TODO: cases for other types of furniture.
            default:
              // Boring furniture (no activity).
              return new FurnitureState(
                valueInitToken,
                position,
                rotation,
                type
              );
          }
        },
        "remote",
        new PositionRotationOtherSerializer()
      )
    );
  }
}
