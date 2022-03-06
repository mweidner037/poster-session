import * as collabs from "@collabs/collabs";
import { MyVector3 } from "../util/babylon_types";
import { MyVector3Serializer } from "../util/serialization";
import { SerialCRegister } from "./serial_register";

export class EntityCollab extends collabs.CObject {
  readonly position: SerialCRegister<MyVector3>;
  readonly rotation: SerialCRegister<MyVector3>;

  constructor(
    initToken: collabs.InitToken,
    initialPosition: MyVector3,
    initialRotation: MyVector3 = new MyVector3(0, 0, 0)
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
  }
}
