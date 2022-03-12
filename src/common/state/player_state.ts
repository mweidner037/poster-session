import * as collabs from "@collabs/collabs";
import { MyVector3 } from "../util/babylon_types";
import { MyVector3Serializer } from "../util/serialization";
import { SerialCRegister } from "./serial_register";

export class PlayerState extends collabs.CObject {
  readonly position: SerialCRegister<MyVector3>;
  readonly rotation: SerialCRegister<MyVector3>;
  readonly displayName: SerialCRegister<string>;
  /** A number in [0, 360]. */
  readonly hue: SerialCRegister<number>;

  constructor(
    initToken: collabs.InitToken,
    initialPosition: MyVector3,
    initialRotation: MyVector3,
    readonly peerID: string,
    initialDisplayName: string,
    initialHue: number
  ) {
    super(initToken);

    this.position = this.addChild(
      "p",
      collabs.Pre(SerialCRegister)(
        initialPosition,
        "local",
        MyVector3Serializer.instance
      )
    );
    this.rotation = this.addChild(
      "r",
      collabs.Pre(SerialCRegister)(
        initialRotation,
        "local",
        MyVector3Serializer.instance
      )
    );
    this.displayName = this.addChild(
      "displayName",
      collabs.Pre(SerialCRegister)(initialDisplayName, "local")
    );
    this.hue = this.addChild(
      "hue",
      collabs.Pre(SerialCRegister)(initialHue, "local")
    );
  }
}
