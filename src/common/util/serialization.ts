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

/**
 * otherArgs serialized using BSON.
 */
export class PositionRotationOtherSerializer<O extends unknown[]>
  implements
    collabs.Serializer<
      [position: MyVector3, rotation: MyVector3, ...otherArgs: O]
    >
{
  serialize(
    value: [position: MyVector3, rotation: MyVector3, ...otherArgs: O]
  ): Uint8Array {
    const [p, r, ...otherArgs] = value;
    return BSON.serialize({
      px: p.x,
      py: p.y,
      pz: p.z,
      rx: r.x,
      ry: r.y,
      rz: r.z,
      o: otherArgs,
    });
  }

  deserialize(
    message: Uint8Array
  ): [position: MyVector3, rotation: MyVector3, ...otherArgs: O] {
    const decoded = BSON.deserialize(message);
    return [
      new MyVector3(decoded.px, decoded.py, decoded.pz),
      new MyVector3(decoded.rx, decoded.ry, decoded.rz),
      ...(<O>decoded.o),
    ];
  }
}
