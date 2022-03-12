import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import { RoomState, SerialRuntime } from "../common/state";
import * as collabs from "@collabs/collabs";
import ReconnectingWebSocket from "reconnecting-websocket";
import { MyVector3 } from "../common/util/babylon_types";
import { WebSocketMessage } from "../common/util/web_socket_message";
import Peer from "peerjs";
import {
  getAudioInput,
  peerIDFromString,
  PeerJSManager,
  PlayerAudio,
} from "./calling";
import { createScene } from "./scene/create_scene";
import React from "react";
import ReactDOM from "react-dom";
import { PlayersList } from "./components/players_list";
import { Globals } from "./util/globals";
import { Room } from "./state";
import {
  handleCameraPerspective,
  handleColorInput,
  handleNameInput,
  KeyTracker,
  runLogicLoop,
} from "./run";
import { handlePlayerMovement } from "./run/handle_player_movement";
import { MeshStore } from "./scene/mesh_store";

(async function () {
  // -----------------------------------------------------
  // Setup
  // -----------------------------------------------------

  // Create replica.
  const replica = new SerialRuntime({
    batchingStrategy: new collabs.RateLimitBatchingStrategy(100),
  });
  const roomState = replica.registerCollab("room", collabs.Pre(RoomState)());

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
  const audioContext = new AudioContext();
  const ourAudioStream = getAudioInput(audioContext);

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

  const globals: Globals = {
    renderCanvas,
    scene,
    highlightLayer,
    meshStore: new MeshStore(scene),
    keyTracker: new KeyTracker(scene),
    audioContext,
  };

  // Start getting player mesh.
  const bearMeshPromise = globals.meshStore.getMesh("black_bear.gltf", 1);

  // Wait for various things that need to happen before
  // we can create ourPlayer:
  // - PeerJS server connects.
  // - Player mesh loads.
  // - Collabs state loads. (Note that further messages might
  // also be received by now.)
  // TODO: audio-less fallback for if PeerJS server fails to connect?
  const [bearMesh] = await Promise.all([
    bearMeshPromise,
    peerServerOpenPromise,
    replica.nextEvent("Load"),
  ]);

  // Finish setting up player mesh and create room.
  bearMesh.setEnabled(false); // This is a reference copy, not shown.
  bearMesh.parent = null; // Clear rotation due to parent
  bearMesh.rotationQuaternion = null; // Ensure .rotation works
  bearMesh.rotation = new BABYLON.Vector3(-Math.PI / 2, Math.PI, 0);

  const room = new Room(roomState, bearMesh, globals);

  // Create our player's entity and attach the camera.
  const nameInput = document.getElementById("nameInput") as HTMLInputElement;
  const randomHue = 2 * Math.floor(Math.random() * 181);
  const ourPlayer = room.players.add(
    peerID,
    new MyVector3(0, 0.5, 0),
    new MyVector3(0, 0, 0),
    nameInput.value,
    randomHue
  );
  camera.parent = ourPlayer.mesh;

  // Render list of players.
  ReactDOM.render(
    <PlayersList players={room.players} ourPlayer={ourPlayer} />,
    document.getElementById("playersListRoot")
  );

  // Setup WebRTC. Do this synchronously with creating ourPlayer.
  new PeerJSManager(
    peerServer,
    ourPlayer,
    room.players,
    ourAudioStream,
    globals
  );

  // -----------------------------------------------------
  // Run app
  // -----------------------------------------------------

  handleNameInput(ourPlayer, globals);

  handleColorInput(ourPlayer, globals);

  handlePlayerMovement(ourPlayer, room.players, globals);

  handleCameraPerspective(camera, globals);

  const ourPlayerAudio = new PlayerAudio(
    ourAudioStream,
    globals,
    undefined,
    true
  );
  runLogicLoop(ourPlayer, room.players, ourPlayerAudio);

  // // TODO: remove. Furniture test.
  // globals.scene.onKeyboardObservable.add((e) => {
  //   if (e.event.type === "keydown" && e.event.key.toLowerCase() === "f") {
  //     // Add bear furniture at a random position and rotation.
  //     const position = new BABYLON.Vector3(
  //       -10 + 20 * Math.random(),
  //       0.5,
  //       -10 + 20 * Math.random()
  //     );
  //     const rotation = new BABYLON.Vector3(0, 2 * Math.PI * Math.random(), 0);
  //     room.furnitures.addBoring(position, rotation, "black_bear.gltf");
  //   }
  // });

  // Keep-alive for Heroku server.
  setInterval(() => {
    send({ type: "ping" });
  }, 30000);

  // Chrome wants you to resume AudioContext's after the user "interacts with the page".
  window.addEventListener(
    "click",
    async () => {
      console.log("Resuming global AudioContext...");
      try {
        await globals.audioContext.resume();
        // globalAudioVideoElem.play();
        console.log("  Resumed.");
      } catch (err) {
        console.log("  Failed to resume.");
      }
    },
    { once: true }
  );
})();
