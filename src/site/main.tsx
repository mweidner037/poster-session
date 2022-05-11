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
import { createScene, MeshStore, KeyTracker, startLogicLoop } from "./scene";
import { Globals, setGlobals } from "./util";
import { Room } from "./state";
import { ReactMain } from "./components";
import { connectToServer } from "./net";

(async function () {
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

  // Create scene.
  const renderCanvas = document.createElement("canvas");
  renderCanvas.className = "renderCanvas";
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
  Globals().meshStore.getMesh("furnitures/easel.gltf", 1);

  // Wait for Collabs state to load. We need to do this before creating
  // room and ourPlayer, since room needs to see the loaded state,
  // and ourPlayer modifies the Collabs state.
  await replica.nextEvent("Load");

  // Create room.
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

  // Render React components.
  ReactDOM.render(
    <ReactMain
      scene={scene}
      camera={camera}
      room={room}
      ourPlayer={ourPlayer}
    />,
    document.getElementById("reactRoot")
  );

  // Start game logic loop, which sends ourPlayer's position/etc. to the
  // server and bigTick's players.
  startLogicLoop(
    ourPlayer,
    room.players,
    new PlayerAudio(ourAudioStream, undefined, true)
  );

  // Setup WebRTC.
  new PeerJSManager(peerServer, ourPlayer, room.players, ourAudioStream);
})();
