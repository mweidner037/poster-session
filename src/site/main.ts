import { createScene } from "./graphics/scene";
import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import "@babylonjs/loaders/glTF"; // gltf file parser
import { EntityCollab, SerialMutCSet, SerialRuntime } from "../common/state";
import * as collabs from "@collabs/collabs";
import { PositionRotationSerializer } from "../common/util/serialization";
import ReconnectingWebSocket from "reconnecting-websocket";
import { MyVector3 } from "../common/util/babylon_types";
import { WebSocketMessage } from "../common/util/web_socket_message";
import { ROTATION_SPEED, TRANSLATION_SPEED } from "../common/consts";
import { PeerJSManager } from "./calling/peerjs";
import { EntitySet } from "./state/entity_set";

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
  replica.on("Send", (e) => {
    send({ type: "msg", msg: e.message });
  });

  ws.addEventListener("message", (e) => {
    const message = <WebSocketMessage>JSON.parse(e.data);
    if (message.type === "load") {
      replica.load(
        collabs.Optional.of(collabs.stringAsBytes(message.saveData))
      );
    } else if (message.type === "msg") {
      replica.receive(message.msg);
    }
  });

  // Request user audio permission.
  const ourAudioStreamPromise = navigator.mediaDevices.getUserMedia({
    audio: true,
  });

  // Create scene.
  const [scene, camera] = createScene();

  // Get player mesh.
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

  // Players as set of Entitys (instead of EntityCollabs).
  const players = new EntitySet(playerCollabs, bearMesh);

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

    // Move other players.
    for (const player of players.values()) {
      if (player !== ourPlayer) player.littleTick(deltaSec);
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

    // Big tick.
    for (const player of players.values()) {
      if (player !== ourPlayer) player.bigTick(ourPlayer);
    }
  }, 100);

  // Setup WebRTC.
  let ourAudioStream: MediaStream | null = null;
  try {
    ourAudioStream = await ourAudioStreamPromise;
  } catch (err) {
    console.log("User rejected audio permissions");
  }
  await (replica.isLoaded ? Promise.resolve() : replica.nextEvent("Load"));
  new PeerJSManager(ourPlayer, players, ourAudioStream);
})();
