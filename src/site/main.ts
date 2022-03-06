import { createScene } from "./graphics/scene";
import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import { SerialRuntime } from "../common/state/serial_runtime";
import * as collabs from "@collabs/collabs";
import { SerialMutCSet } from "../common/state/serial_mut_set";
import { Entity } from "../common/state/entity";
import { PositionRotationSerializer } from "../common/util/serialization";
import ReconnectingWebSocket from "reconnecting-websocket";
import { MyVector3 } from "../common/util/babylon_types";

(async function () {
  // Create replica.
  const replica = new SerialRuntime({
    batchingStrategy: new collabs.RateLimitBatchingStrategy(100),
  });
  const players = replica.registerCollab(
    "players",
    collabs.Pre(SerialMutCSet)(
      collabs.ConstructorAsFunction(Entity),
      "local",
      new PositionRotationSerializer()
    )
  );

  // Connect to server.
  // TODO: reconnecting helps us on open, but there will still
  // be problems if the connection is closed (will miss messages).
  const ws = new ReconnectingWebSocket(location.origin.replace(/^http/, "ws"));
  // First message is saved state.
  const saveData = await new Promise<string>((resolve) => {
    const listener = (e: MessageEvent<string>) => {
      ws.removeEventListener("message", listener);
      resolve(e.data);
    };
    ws.addEventListener("message", listener);
  });
  replica.load(collabs.Optional.of(collabs.stringAsBytes(saveData)));
  // Future messages are replica messages.
  ws.addEventListener("message", (e) => {
    replica.receive(e.data);
  });
  replica.on("Send", (e) => {
    ws.send(e.message);
  });

  // Create scene.
  const [scene, camera] = createScene();

  // Sync players from state to scene.
  for (const player of players) {
    player.setMesh(BABYLON.MeshBuilder.CreateBox("box", {}));
  }
  players.on("Add", (e) => {
    e.value.setMesh(BABYLON.MeshBuilder.CreateBox("box", {}));
  });
  players.on("Delete", (e) => {
    e.value.mesh.dispose();
  });

  // Create our player's entity and attach the camera.
  const ourPlayer = players.add(
    new MyVector3(0, 0.5, 0),
    new MyVector3(0, 0, 0)
  )!;
  camera.parent = ourPlayer.mesh;

  // Handle user inputs.
  const keysDown: { [char: string]: boolean | undefined } = {};
  scene.onKeyboardObservable.add((e) => {
    if (e.event.type === "keydown") {
      keysDown[e.event.key] = true;
    } else if (e.event.type === "keyup") {
      keysDown[e.event.key] = false;
    }
  });

  scene.onBeforeRenderObservable.add(() => {
    // Move the mesh itself, then update Entity to reflect
    // the movement. This lets us make use of the convenient
    // ...POV methods.
    if (keysDown["w"]) {
      ourPlayer.mesh.movePOV(0, 0, -0.01);
      ourPlayer.position.value = MyVector3.from(ourPlayer.mesh.position);
    } else if (keysDown["s"]) {
      ourPlayer.mesh.movePOV(0, 0, 0.01);
      ourPlayer.position.value = MyVector3.from(ourPlayer.mesh.position);
    }
    if (keysDown["a"] && !keysDown["d"]) {
      ourPlayer.mesh.rotatePOV(0, -0.01, 0);
      ourPlayer.rotation.value = MyVector3.from(ourPlayer.mesh.rotation);
    } else if (keysDown["d"] && !keysDown["a"]) {
      ourPlayer.mesh.rotatePOV(0, 0.01, 0);
      ourPlayer.rotation.value = MyVector3.from(ourPlayer.mesh.rotation);
    }
  });
})();
