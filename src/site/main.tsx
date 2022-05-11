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
import { Globals, LocalStorage, setGlobals } from "./util";
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
    keyTracker: new KeyTracker(scene, renderCanvas),
    audioContext,
    localStorage: new LocalStorage(),
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
  // Try to get initial values from localStorage.
  let initialPosition = Globals().localStorage.getPosition();
  let initialRotation =
    Globals().localStorage.getRotation() || MyVector3.new(0, 0, 0);
  if (initialPosition === null) {
    [initialPosition, initialRotation] = getStartPositionRotation();
  }
  const ourPlayer = room.players.add(
    peerID,
    initialPosition,
    initialRotation,
    Globals().localStorage.getName() ||
      "Bear " + Math.floor(Math.random() * 10000),
    Globals().localStorage.getHue() || 2 * Math.floor(Math.random() * 181)
  );
  camera.parent = ourPlayer.mesh;
  // Sync future values to localStorage.
  ourPlayer.state.position.on("Set", () => {
    Globals().localStorage.setPosition(ourPlayer.state.position.value);
  });
  ourPlayer.state.rotation.on("Set", () => {
    Globals().localStorage.setRotation(ourPlayer.state.rotation.value);
  });
  ourPlayer.state.displayName.on("Set", () => {
    Globals().localStorage.setName(ourPlayer.state.displayName.value);
  });
  ourPlayer.state.hue.on("Set", () => {
    Globals().localStorage.setHue(ourPlayer.state.hue.value);
  });

  // Render React components.
  function returnToStart() {
    // The mesh is the source of the truth, so we have to set things there.
    const [position, rotation] = getStartPositionRotation();
    MyVector3.syncTo(position, ourPlayer.mesh.position);
    MyVector3.syncTo(rotation, ourPlayer.mesh.rotation);
  }

  function resetAndRefresh() {
    Globals().localStorage.clear();
    location.reload();
  }

  ReactDOM.render(
    <ReactMain
      scene={scene}
      camera={camera}
      room={room}
      ourPlayer={ourPlayer}
      returnToStart={returnToStart}
      resetAndRefresh={resetAndRefresh}
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

const START_CIRCLE_RADIUS = 3;

function getStartPositionRotation(): [
  position: MyVector3,
  rotation: MyVector3
] {
  // Randomly choose a position on a circle, facing inwards.
  const angle = Math.random() * 2 * Math.PI;
  const position = MyVector3.new(
    START_CIRCLE_RADIUS * Math.cos(angle),
    0.5,
    START_CIRCLE_RADIUS * Math.sin(angle)
  );
  const rotation = MyVector3.new(0, -angle - Math.PI / 2, 0);
  return [position, rotation];
}
