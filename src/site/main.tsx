import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import * as collabs from "@collabs/collabs";
import ReconnectingWebSocket from "reconnecting-websocket";
import React from "react";
import ReactDOM from "react-dom";
import Peer from "peerjs";
import { RoomState, SerialRuntime } from "../common/state";
import { MyVector3, WebSocketMessage } from "../common/util";
import {
  getAudioInput,
  peerIDFromString,
  PeerJSManager,
  PlayerAudio,
  setupAudioContext,
} from "./calling";
import {
  createScene,
  handlePlayerMovement,
  MeshStore,
  KeyTracker,
  handleCameraPerspective,
  runLogicLoop,
} from "./scene";
import { Globals, setGlobals } from "./util";
import { Room } from "./state";
import { handleColorInput, handleNameInput } from "./run";
import { PlayersList, Toolbox, ToolboxState } from "./components";

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

  setGlobals({
    renderCanvas,
    scene,
    highlightLayer,
    meshStore: new MeshStore(scene),
    keyTracker: new KeyTracker(scene),
    audioContext,
  });

  // Finish setting up audioContext now that Globals() is set.
  setupAudioContext(audioContext);

  // Start getting player mesh.
  const bearMeshPromise = Globals().meshStore.getMesh("black_bear.gltf", 1);

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
  bearMesh.rotation = new BABYLON.Vector3(-Math.PI / 2, Math.PI, 0);
  const room = new Room(roomState, bearMesh);

  // Create our player's entity and attach the camera.
  const nameInput = document.getElementById("nameInput") as HTMLInputElement;
  const randomHue = 2 * Math.floor(Math.random() * 181);
  const ourPlayer = room.players.add(
    peerID,
    MyVector3.new(0, 0.5, 0),
    MyVector3.new(0, 0, 0),
    nameInput.value,
    randomHue
  );
  camera.parent = ourPlayer.mesh;

  // Setup WebRTC. Do this synchronously with creating ourPlayer.
  new PeerJSManager(peerServer, ourPlayer, room.players, ourAudioStream);

  // -----------------------------------------------------
  // Render React components.
  // -----------------------------------------------------

  ReactDOM.render(
    <PlayersList players={room.players} ourPlayer={ourPlayer} />,
    document.getElementById("playersListRoot")
  );

  // TODO: only shows this in editor mode.
  let toolboxState!: ToolboxState;
  ReactDOM.render(
    <Toolbox
      onChange={(state) => {
        toolboxState = state;
        scene.defaultCursor =
          toolboxState.selected === "Mouse" ? "default" : "pointer";
      }}
    />,
    document.getElementById("toolboxRoot")
  );
  // TODO: only change mouse cursor when it's over a valid location?
  scene.onPointerObservable.add((e) => {
    if (e.type == BABYLON.PointerEventTypes.POINTERDOWN) {
      if (e.pickInfo !== null && e.pickInfo.pickedMesh !== null) {
        // Place furniture.
        // TODO: only on ground, not on furniture
        if (e.pickInfo.distance < 5 && toolboxState.selected !== "Mouse") {
          // Determine rotation angle: face towards ray.
          const angle = Math.atan2(
            e.pickInfo.ray!.direction.x,
            e.pickInfo.ray!.direction.z
          );
          const rotation = new BABYLON.Vector3(0, angle, 0);
          // TODO: make tool do this
          switch (toolboxState.selected) {
            case "Bear":
              room.furnitures.addBoring(
                e.pickInfo.pickedPoint!,
                rotation,
                "black_bear.gltf"
              );
              break;
            case "Easel":
              room.furnitures.addBoring(
                e.pickInfo.pickedPoint!,
                rotation,
                "easel.gltf"
              );
              break;
          }
        }
      }
    }
  });

  // TODO: move into self-contained React component.
  handleNameInput(ourPlayer);

  // TODO: move into self-contained React component.
  handleColorInput(ourPlayer);

  // -----------------------------------------------------
  // Run scene.
  // -----------------------------------------------------

  handlePlayerMovement(ourPlayer, room.players);

  handleCameraPerspective(camera);

  runLogicLoop(
    ourPlayer,
    room.players,
    new PlayerAudio(ourAudioStream, undefined, true)
  );
})();
