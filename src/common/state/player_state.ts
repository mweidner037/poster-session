import * as collabs from "@collabs/collabs";
import { MyVector3 } from "../util/babylon_types";
import { MyVector3Serializer } from "../util/serialization";
import { SerialCRegister } from "./serial_register";

export class PlayerState extends collabs.CObject {
  readonly position: SerialCRegister<MyVector3>;
  readonly rotation: SerialCRegister<MyVector3>;
  readonly displayName: SerialCRegister<string>;
  /** As a hex string (including #). */
  readonly color: SerialCRegister<string>;

  constructor(
    initToken: collabs.InitToken,
    readonly peerID: string,
    initialPosition: MyVector3,
    initialRotation: MyVector3,
    initialDisplayName: string,
    initialColor: string
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
    this.color = this.addChild(
      "color",
      collabs.Pre(SerialCRegister)(initialColor, "local")
    );
  }
}
