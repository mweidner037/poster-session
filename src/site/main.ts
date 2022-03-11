import { createScene } from "./graphics/scene";
import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import "@babylonjs/loaders/glTF"; // gltf file parser
import { PlayerState, SerialMutCSet, SerialRuntime } from "../common/state";
import * as collabs from "@collabs/collabs";
import { PlayerStateArgsSerializer } from "../common/util/serialization";
import ReconnectingWebSocket from "reconnecting-websocket";
import { MyVector3 } from "../common/util/babylon_types";
import { WebSocketMessage } from "../common/util/web_socket_message";
import { ROTATION_SPEED, TRANSLATION_SPEED } from "../common/consts";
import { PlayerSet } from "./state/player_set";
import Peer from "peerjs";
import { getAudioInput, peerIDFromString, PeerJSManager } from "./calling";
import hsl from "hsl-to-hex";

(async function () {
  // -----------------------------------------------------
  // Setup
  // -----------------------------------------------------

  // Create replica.
  const replica = new SerialRuntime({
    batchingStrategy: new collabs.RateLimitBatchingStrategy(100),
  });
  const playerCollabs = replica.registerCollab(
    "players",
    collabs.Pre(SerialMutCSet)(
      collabs.ConstructorAsFunction(PlayerState),
      "local",
      new PlayerStateArgsSerializer()
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

  // Get audio input. Do it now to start requesting user audio permission.
  const ourAudioStream = getAudioInput();

  // Start connecting to PeerJS server.
  // TODO: IRL we would need our own PeerJS server, STUN server,
  // and TURN server, all specified as options here.
  // For now we use PeerJS defaults, which are:
  // - PeerJS own PeerJS server
  // - Google STUN server
  // - No TURN server
  // These options are fine for testing, but rude & flaky
  // for a real deployment.
  const peerID = peerIDFromString(replica.replicaID);
  console.log("Our peer id: " + peerID);
  const peerServer = new Peer(peerID);
  const peerServerOpenPromise = new Promise<void>((resolve) => {
    peerServer.on("open", () => {
      console.log("Peer server connected");
      resolve();
    });
  });

  // Create scene.
  const [scene, camera] = createScene();

  // Start getting player mesh.
  const bearMeshImportPromise = BABYLON.SceneLoader.ImportMeshAsync(
    undefined,
    "/assets/",
    "black_bear.gltf"
  );

  // Wait for various things that need to happen before
  // we can create ourPlayer:
  // - PeerJS server connects.
  // - Player mesh loads.
  // - Collabs state loads. (Note that further messages might
  // also be received by now.)
  // TODO: audio-less fallback for if PeerJS server fails to connect?
  const [bearMeshImport] = await Promise.all([
    bearMeshImportPromise,
    peerServerOpenPromise,
    replica.nextEvent("Load"),
  ]);

  // Finish setting up player mesh and create players.
  const bearMesh = bearMeshImport.meshes[1];
  bearMesh.setEnabled(false); // This is a reference copy, not shown.
  bearMesh.parent = null; // Clear rotation due to parent
  bearMesh.rotationQuaternion = null; // Ensure .rotation works
  bearMesh.rotation = new BABYLON.Vector3(-Math.PI / 2, Math.PI, 0);
  const players = new PlayerSet(playerCollabs, bearMesh, scene);

  // Create our player's entity and attach the camera.
  const randomName = "Bear " + Math.floor(Math.random() * 10000);
  const randomColor = hsl(Math.floor(Math.random() * 361), 100, 50);
  const ourPlayer = players.add(
    peerID,
    new MyVector3(0, 0.5, 0),
    new MyVector3(0, 0, 0),
    randomName,
    randomColor
  );
  camera.parent = ourPlayer.mesh;

  // Setup WebRTC. Do this synchronously with creating ourPlayer.
  new PeerJSManager(peerServer, ourPlayer, players, ourAudioStream);

  // -----------------------------------------------------
  // Run app
  // -----------------------------------------------------

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
  // This is okay because Player doesn't sync local changes.
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
})();
