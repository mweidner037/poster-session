import { createScene } from "./graphics/scene";
import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import "@babylonjs/loaders/glTF"; // gltf file parser
import { EntityCollab, SerialMutCSet, SerialRuntime } from "../common/state";
import * as collabs from "@collabs/collabs";
import { PositionRotationSerializer } from "../common/util/serialization";
import ReconnectingWebSocket from "reconnecting-websocket";
import { MyVector3 } from "../common/util/babylon_types";
import { WebSocketMessage } from "../common/util/web_socket_message";
import { Entity } from "./graphics/entity";
import { ROTATION_SPEED, TRANSLATION_SPEED } from "../common/consts";

(async function () {
  // Create replica.
  const replica = new SerialRuntime({
    batchingStrategy: new collabs.RateLimitBatchingStrategy(100),
  });
  const playerCollabs = replica.registerCollab(
    "players",
    collabs.Pre(SerialMutCSet)(
      collabs.ConstructorAsFunction(EntityCollab),
      "local",
      new PositionRotationSerializer()
    )
  );

  // Connect to server.
  // TODO: reconnecting helps us on open, but there will still
  // be problems if the connection is closed (will miss messages).
  const ws = new ReconnectingWebSocket(location.origin.replace(/^http/, "ws"));
  function send(message: WebSocketMessage) {
    ws.send(JSON.stringify(message));
  }
  send({ type: "id", replicaId: replica.replicaID });

  // First message is a load message.
  const saveData = await new Promise<string>((resolve) => {
    const listener = (e: MessageEvent<string>) => {
      const message = <WebSocketMessage>JSON.parse(e.data);
      if (message.type === "load") {
        ws.removeEventListener("message", listener);
        resolve(message.saveData);
      }
    };
    ws.addEventListener("message", listener);
  });
  replica.load(collabs.Optional.of(collabs.stringAsBytes(saveData)));

  // Future messages are replica messages.
  ws.addEventListener("message", (e) => {
    const message = <WebSocketMessage>JSON.parse(e.data);
    if (message.type === "msg") {
      replica.receive(message.msg);
    }
  });
  replica.on("Send", (e) => {
    send({ type: "msg", msg: e.message });
  });

  // Create scene.
  const [scene, camera] = createScene();

  // Get player mesh.
  // TODO: run concurrently with loading, using Promise.all.
  const result = await BABYLON.SceneLoader.ImportMeshAsync(
    undefined,
    "/assets/",
    "black_bear.gltf"
  );
  const bearMesh = result.meshes[1];
  bearMesh.setEnabled(false); // This is a reference copy, not shown.
  bearMesh.parent = null; // Clear rotation due to parent
  bearMesh.rotationQuaternion = null; // Ensure .rotation works
  bearMesh.rotation = new BABYLON.Vector3(-Math.PI / 2, Math.PI, 0);

  // Sync players from state to scene.
  function addPlayer(playerCollab: EntityCollab) {
    const innerMesh = bearMesh.clone("bear", null)!;
    innerMesh.setEnabled(true);
    const mesh = new BABYLON.AbstractMesh("mesh", scene);
    innerMesh.parent = mesh;
    playersByCollab.set(playerCollab, new Entity(playerCollab, mesh));
  }

  const playersByCollab = new Map<EntityCollab, Entity>();
  for (const playerCollab of playerCollabs) {
    addPlayer(playerCollab);
  }
  playerCollabs.on("Add", (e) => {
    addPlayer(e.value);
  });
  playerCollabs.on("Delete", (e) => {
    const player = playersByCollab.get(e.value)!;
    playersByCollab.delete(e.value);
    player.mesh.dispose();
  });

  // Create our player's entity and attach the camera.
  const ourPlayerCollab = playerCollabs.add(
    new MyVector3(0, 0.5, 0),
    new MyVector3(0, 0, 0)
  )!;
  const ourPlayer = playersByCollab.get(ourPlayerCollab)!;
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

  // Render loop. Note we do our own movements here,
  // but only update the server in the logic loop below.
  // This is okay because Entity doesn't sync local changes.
  let lastTime = -1;
  scene.onBeforeRenderObservable.add(() => {
    if (lastTime === -1) {
      lastTime = Date.now();
      return;
    }

    const newTime = Date.now();
    const deltaSec = (newTime - lastTime) / 1000;
    lastTime = newTime;

    // Move our player directly (w/o telling the server right away).
    if (keysDown["w"]) {
      ourPlayer.mesh.movePOV(0, 0, -deltaSec * TRANSLATION_SPEED);
    } else if (keysDown["s"]) {
      ourPlayer.mesh.movePOV(0, 0, deltaSec * TRANSLATION_SPEED);
    }

    if (keysDown["a"] && !keysDown["d"]) {
      ourPlayer.mesh.rotatePOV(0, -deltaSec * ROTATION_SPEED, 0);
    } else if (keysDown["d"] && !keysDown["a"]) {
      ourPlayer.mesh.rotatePOV(0, deltaSec * ROTATION_SPEED, 0);
    }

    // Move other players towards their collab state.
    for (const player of playersByCollab.values()) {
      if (player !== ourPlayer) player.moveMesh(deltaSec);
    }
  });

  // Logic loop.
  setInterval(() => {
    // Send actual position/rotation to the server.
    if (
      !ourPlayer.state.position.value.equalsBabylon(ourPlayer.mesh.position)
    ) {
      ourPlayer.state.position.value = MyVector3.from(ourPlayer.mesh.position);
    }
    if (
      !ourPlayer.state.rotation.value.equalsBabylon(ourPlayer.mesh.rotation)
    ) {
      ourPlayer.state.rotation.value = MyVector3.from(ourPlayer.mesh.rotation);
    }
  }, 100);
})();
