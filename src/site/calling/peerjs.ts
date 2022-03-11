// Based on https://github.com/Meshiest/demo-voice/blob/master/public/index.html

import Peer from "peerjs";
import { Entity } from "../state/entity";
import { EntitySet } from "../state/entity_set";
import { calcVolumes } from "./calc_volumes";
import { StreamSplit } from "./stream_split";

/**
 * Returns a PeerJS peer id that is likely to be globally unique
 * and that is a deterministic function of anyID.
 * This function's use is that peer ids have specific
 * requirements, while anyID can be any string.
 */
export function stringToPeerID(anyID: string): string {
  // Take each replicaID char as a number mod 26, then convert to a capital letter.
  const arr: number[] = [];
  for (let i = 0; i < anyID.length; i++) {
    arr[i] = 65 + (anyID.charCodeAt(i) % 26);
  }
  // Start with "meowser37_" to ensure global uniqueness.
  return "meowser37_" + String.fromCharCode(...arr);
}

// TODO: retries

export class PeerJSManager {
  readonly peer: Peer;
  private readonly videoDiv: HTMLDivElement;

  /**
   * Excludes us.
   */
  private readonly playersByPeerID = new Map<string, Entity>();
  /**
   * Streams that we have answered but don't yet associate
   * with a player, probably because we haven't received
   * their Add event yet.  Indexed by peerID.
   *
   * TODO: maybe we can get rid of this? Shouldn't happen
   * if this is constructed in the same thread as ourPlayer?
   */
  private readonly pendingReceivedStreams = new Map<string, MediaStream>();

  /**
   * Must be called after loading and after adding our
   * Entity.
   */
  constructor(
    private readonly ourPlayer: Entity,
    private readonly players: EntitySet,
    readonly ourAudioStream: MediaStream | null
  ) {
    // TODO: IRL we would need our own PeerJS server, STUN server,
    // and TURN server, all specified as options here.
    // For now we use PeerJS defaults, which are:
    // - PeerJS own PeerJS server
    // - Google STUN server
    // - No TURN server
    // These options are fine for testing, but rude & flaky
    // for a real deployment.
    this.peer = new Peer(this.ourPlayer.peerID);
    this.videoDiv = <HTMLDivElement>document.getElementById("videoDiv");

    // Logging info.
    console.log("Our peer id: " + this.ourPlayer.peerID);
    this.peer.on("open", () => console.log("open"));
    this.peer.on("disconnected", () => console.log("disconnected"));
    this.peer.on("error", (err) => {
      console.log("PeerJS error:");
      console.error(err);
    });

    // Answer calls.
    this.peer.on("call", (call) => {
      console.log("received call from " + call.peer);
      if (this.ourAudioStream !== null) {
        call.answer(this.ourAudioStream);
      }
      this.handleCall(call);
    });

    // Keep playersByPeerID up to date.
    for (const player of this.players) {
      if (player !== this.ourPlayer) {
        this.playersByPeerID.set(player.peerID, player);
        const pendingStream = this.pendingReceivedStreams.get(player.peerID);
        if (pendingStream !== undefined) {
          console.log("  pending player now known");
          this.pendingReceivedStreams.delete(player.peerID);
          this.playAudioStream(pendingStream, player);
        }
        // Existing peers call us, not vice-versa.
      }
    }
    this.players.on("Add", (e) => {
      const peerID = e.value.peerID;
      console.log("Got add: " + peerID);
      this.playersByPeerID.set(peerID, e.value);
      const pendingStream = this.pendingReceivedStreams.get(peerID);
      if (pendingStream !== undefined) {
        console.log("  pending player now known");
        this.pendingReceivedStreams.delete(peerID);
        this.playAudioStream(pendingStream, e.value);
      } else {
        // Call the new peer.
        if (this.ourAudioStream !== null) {
          console.log("Calling peer " + peerID);
          const call = this.peer.call(peerID, this.ourAudioStream);
          this.handleCall(call);
        }
      }
    });
    this.players.on("Delete", (e) => {
      this.playersByPeerID.delete(e.value.peerID);
      // TODO: also close original call?
      if (e.value.videoElem !== null) {
        e.value.videoElem.remove();
        e.value.videoElem = null;
        e.value.streamSplit!.close();
        e.value.streamSplit = null;
      }
    });
  }

  private handleCall(call: Peer.MediaConnection) {
    call.on("stream", (stream) => {
      console.log("received stream from " + call.peer);
      const player = this.playersByPeerID.get(call.peer);
      if (player !== undefined) {
        console.log("  player is known");
        this.playAudioStream(stream, player);
      } else {
        // TODO: ignore if from a past (deleted) user?
        // At least need some way to GC it eventually (timeout?).
        console.log("  player is unknown");
        this.pendingReceivedStreams.set(call.peer, stream);
        call.on("close", () => {
          this.pendingReceivedStreams.delete(call.peer);
        });
        // Don't play yet.
      }
    });
  }

  private playAudioStream(stream: MediaStream, player: Entity) {
    if (player.videoElem !== null) {
      if (player.streamSplit!.stream === stream) return;
      else player.videoElem.remove();
    }

    // Create StreamSplit.
    const volumes = calcVolumes(
      player.mesh.position,
      player.mesh.rotation,
      this.ourPlayer.mesh.position,
      this.ourPlayer.mesh.rotation
    );
    player.streamSplit = new StreamSplit(stream, {
      left: volumes[0],
      right: volumes[1],
    });

    // Play the stream in an HTMLVideoElement.
    const elem = <HTMLVideoElement>document.createElement("video");
    elem.srcObject = stream;
    elem.muted = true;
    elem.onloadedmetadata = () => elem.play();
    this.videoDiv.appendChild(elem);
    player.videoElem = elem;
  }
}
