import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import "@babylonjs/loaders/glTF"; // gltf file parser
import { PlayerState, SerialMutCSet, SerialRuntime } from "../common/state";
import * as collabs from "@collabs/collabs";
import { PlayerStateArgsSerializer } from "../common/util/serialization";
import ReconnectingWebSocket from "reconnecting-websocket";
import { MyVector3 } from "../common/util/babylon_types";
import { WebSocketMessage } from "../common/util/web_socket_message";
import { PlayerSet } from "./state/player_set";
import Peer from "peerjs";
import { getAudioInput, peerIDFromString, PeerJSManager } from "./calling";
import { KeyTracker } from "./run/key_tracker";
import { handleNameInput } from "./run/handle_name_input";
import { handlePlayerMovement } from "./run/handle_player_movement";
import { runLogicLoop } from "./run/run_logic_loop";
import { createScene } from "./scene/create_scene";
import { handleColorInput } from "./run/handle_color_input";
import { handleCameraPerspective } from "./run/handle_camera_perspective";
import React from "react";
import ReactDOM from "react-dom";
import { PlayersList } from "./components/players_list";

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
    const message = JSON.parse(e.data) as WebSocketMessage;
    if (message.type === "load") {
      if (replica.isLoaded) {
        // TODO: if this happens, it means our connection dropped
        // temporarily. Need to back-fill missed data.
        return;
      }
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
  const renderCanvas = document.getElementById(
    "renderCanvas"
  ) as HTMLCanvasElement;
  const [scene, camera, highlightLayer] = createScene(renderCanvas);

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
  const players = new PlayerSet(playerCollabs, bearMesh, highlightLayer, scene);

  // Create our player's entity and attach the camera.
  const nameInput = document.getElementById("nameInput") as HTMLInputElement;
  const randomHue = 2 * Math.floor(Math.random() * 181);
  const ourPlayer = players.add(
    peerID,
    new MyVector3(0, 0.5, 0),
    new MyVector3(0, 0, 0),
    nameInput.value,
    randomHue
  );
  camera.parent = ourPlayer.mesh;

  // Render list of players.
  ReactDOM.render(
    <PlayersList players={players} ourPlayer={ourPlayer} />,
    document.getElementById("playersListRoot")
  );

  // Setup WebRTC. Do this synchronously with creating ourPlayer.
  new PeerJSManager(peerServer, ourPlayer, players, ourAudioStream);

  // -----------------------------------------------------
  // Run app
  // -----------------------------------------------------

  handleNameInput(ourPlayer, renderCanvas);

  handleColorInput(ourPlayer, renderCanvas);

  const keyTracker = new KeyTracker(scene);
  handlePlayerMovement(ourPlayer, players, keyTracker, scene);

  handleCameraPerspective(camera, scene);

  runLogicLoop(ourPlayer, players, ourAudioStream);

  // Keep-alive for Heroku server.
  setInterval(() => {
    send({ type: "ping" });
  }, 30000);
})();
