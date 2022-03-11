import * as collabs from "@collabs/collabs";
import * as BSON from "bson";
import { MyVector3 } from "./babylon_types";

export class MyVector3Serializer implements collabs.Serializer<MyVector3> {
  private constructor() {}

  serialize(value: MyVector3): Uint8Array {
    return BSON.serialize({ x: value.x, y: value.y, z: value.z });
  }

  deserialize(message: Uint8Array): MyVector3 {
    const decoded = BSON.deserialize(message);
    return new MyVector3(decoded.x, decoded.y, decoded.z);
  }

  static instance = new MyVector3Serializer();
}

export class PlayerStateArgsSerializer
  implements
    collabs.Serializer<
      [
        peerID: string,
        position: MyVector3,
        rotation: MyVector3,
        name: string,
        color: string
      ]
    >
{
  serialize(
    value: [
      peerID: string,
      position: MyVector3,
      rotation: MyVector3,
      name: string,
      color: string
    ]
  ): Uint8Array {
    const [peerID, p, r, name, color] = value;
    return BSON.serialize({
      peerID,
      px: p.x,
      py: p.y,
      pz: p.z,
      rx: r.x,
      ry: r.y,
      rz: r.z,
      name,
      color,
    });
  }

  deserialize(
    message: Uint8Array
  ): [
    peerID: string,
    position: MyVector3,
    rotation: MyVector3,
    name: string,
    color: string
  ] {
    const decoded = BSON.deserialize(message);
    return [
      decoded.peerID,
      new MyVector3(decoded.px, decoded.py, decoded.pz),
      new MyVector3(decoded.rx, decoded.ry, decoded.rz),
      decoded.name,
      decoded.color,
    ];
  }
}
