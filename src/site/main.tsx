import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import * as collabs from "@collabs/collabs";
import React from "react";
import ReactDOM from "react-dom";
import Peer from "peerjs";
import { RoomState, SerialRuntime } from "../common/state";
import { MyVector3 } from "../common/util";
import {
  createAudioContext,
  getAudioInput,
  peerIDFromString,
  PeerJSManager,
  PlayerAudio,
} from "./calling";
import { createScene, MeshStore, KeyTracker, setupScene } from "./scene";
import { Globals, setGlobals } from "./util";
import { Room } from "./state";
import { RightPanel, Toolbox, ToolboxState } from "./components";
import { connectToServer } from "./net";

(async function () {
  // -----------------------------------------------------
  // Setup
  // -----------------------------------------------------

  // Create replica and connect it to the server (server/main.ts).
  const replica = new SerialRuntime({
    batchingStrategy: new collabs.RateLimitBatchingStrategy(100),
  });
  const roomState = replica.registerCollab("room", collabs.Pre(RoomState)());
  connectToServer(replica);

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

  // Get audio input. Do it now to start requesting user audio permission.
  const audioContext = createAudioContext(scene);
  const ourAudioStream = getAudioInput(audioContext);

  // Store Globals().
  setGlobals({
    renderCanvas,
    highlightLayer,
    meshStore: new MeshStore(scene),
    keyTracker: new KeyTracker(scene),
    audioContext,
  });

  // Start loading important meshes. Also clean some of them.
  Globals()
    .meshStore.getMesh("black_bear.gltf", 1)
    .then((mesh) => {
      mesh.rotation = new BABYLON.Vector3(-Math.PI / 2, Math.PI, 0);
    });

  // Wait for various things that need to happen before
  // we can create ourPlayer:
  // - PeerJS server connects.
  // - Collabs state loads. (Note that further messages might
  // also be received by now.)
  // TODO: audio-less fallback for if PeerJS server fails to connect?
  await Promise.all([peerServerOpenPromise, replica.nextEvent("Load")]);

  // Finish setting up player mesh and create room.
  const room = new Room(roomState, scene, highlightLayer);

  // Create our player's entity and attach the camera.
  const randomHue = 2 * Math.floor(Math.random() * 181);
  const ourPlayer = room.players.add(
    peerID,
    MyVector3.new(0, 0.5, 0),
    MyVector3.new(0, 0, 0),
    "Bear " + Math.floor(Math.random() * 10000),
    randomHue
  );
  camera.parent = ourPlayer.mesh;

  // Setup WebRTC. Need to do this synchronously with creating ourPlayer.
  new PeerJSManager(peerServer, ourPlayer, room.players, ourAudioStream);

  // -----------------------------------------------------
  // Create components.
  // -----------------------------------------------------

  // Right panel.
  ReactDOM.render(
    <RightPanel players={room.players} ourPlayer={ourPlayer} />,
    document.getElementById("rightPanelRoot")
  );

  // Toolbox (left panel).
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

  // Scene (center).
  setupScene(
    scene,
    camera,
    ourPlayer,
    room,
    new PlayerAudio(ourAudioStream, undefined, true)
  );
})();
