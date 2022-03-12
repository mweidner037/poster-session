import Peer from "peerjs";
import { Player } from "../state/player";
import { PlayerSet } from "../state/player_set";
import { Globals } from "../util/globals";
import { calcVolumes } from "./calc_volumes";
import { PlayerAudio } from "./player_audio";

// Based on https://github.com/Meshiest/demo-voice/blob/master/public/index.html

/**
 * Returns a PeerJS peer id that is likely to be globally unique
 * and that is a deterministic function of anyID.
 * This function's use is that peer ids have specific
 * requirements, while anyID can be any string.
 */
export function peerIDFromString(anyID: string): string {
  // Take each replicaID char as a number mod 26, then convert to a capital letter.
  const arr: number[] = [];
  for (let i = 0; i < anyID.length; i++) {
    arr[i] = 65 + (anyID.charCodeAt(i) % 26);
  }
  // Start with "meowser37_" to ensure global uniqueness.
  return "meowser37_" + String.fromCharCode(...arr);
}

export class PeerJSConnection {
  constructor(
    readonly call: Peer.MediaConnection,
    readonly audio: PlayerAudio
  ) {}

  close() {
    this.audio.close();
    this.call.close();
  }
}

// TODO: reconnect to PeerJS server if disconnected?
// TODO: Call retries.

export class PeerJSManager {
  /**
   * Excludes us.
   */
  private readonly playersByPeerID = new Map<string, Player>();
  /**
   * Streams that we have answered but don't yet associate
   * with a player, probably because we haven't received
   * their Add event yet.  Indexed by peerID.
   *
   * TODO: maybe we can get rid of this? Shouldn't happen
   * if this is constructed in the same thread as ourPlayer?
   */
  private readonly pendingReceivedStreams = new Map<
    string,
    [call: Peer.MediaConnection, stream: MediaStream]
  >();

  /**
   * Must be constructed synchronously with creating ourPlayer.
   */
  constructor(
    private readonly peer: Peer,
    private readonly ourPlayer: Player,
    private readonly players: PlayerSet,
    private readonly ourAudioStream: MediaStream,
    private readonly globals: Globals
  ) {
    // Logging info.
    this.peer.on("disconnected", () => console.error("PeerJS disconnected"));
    this.peer.on("error", (err) => {
      console.log("PeerJS error:");
      console.error(err);
    });

    // Answer calls.
    this.peer.on("call", (call) => {
      console.log("received call from " + call.peer);
      call.answer(this.ourAudioStream);
      this.handleCall(call);
    });

    // Keep track of players, calling/closing as needed.
    for (const player of this.players) {
      this.onAdd(player);
    }
    this.players.on("Add", (e) => this.onAdd(e.value));
    this.players.on("Delete", (e) => {
      this.playersByPeerID.delete(e.value.state.peerID);
      if (e.value.audioConn !== null) {
        e.value.audioConn.close();
        e.value.audioConn = null;
      }
    });
  }

  private onAdd(player: Player): void {
    if (player === this.ourPlayer) return;

    const peerID = player.state.peerID;
    console.log("Got add or initial value: " + peerID);
    this.playersByPeerID.set(peerID, player);

    const pendingStream = this.pendingReceivedStreams.get(peerID);
    if (pendingStream !== undefined) {
      console.log("  pending player now known");
      this.pendingReceivedStreams.delete(peerID);
      this.setAudioConn(player, ...pendingStream);
    } else {
      // Call the new peer.
      // TODO: Could skip this if the peer is initial value,
      // letting them call us instead. That would avoid calling
      // both ways in that case (although not in the case of
      // concurrently added peers). However, it would also
      // increase connection latency.
      console.log("Calling peer " + peerID);
      const call = this.peer.call(peerID, this.ourAudioStream);
      this.handleCall(call);
    }
  }

  private handleCall(call: Peer.MediaConnection) {
    call.on("stream", (stream) => {
      console.log("received stream from " + call.peer);
      const player = this.playersByPeerID.get(call.peer);
      if (player !== undefined) {
        console.log("  player is known");
        this.setAudioConn(player, call, stream);
      } else {
        // TODO: ignore if from a past (deleted) user?
        // At least need some way to GC it eventually (timeout?).
        console.log("  player is unknown");
        this.pendingReceivedStreams.set(call.peer, [call, stream]);
        call.on("close", () => {
          this.pendingReceivedStreams.delete(call.peer);
        });
        // Don't play yet.
      }
    });
  }

  private setAudioConn(
    player: Player,
    call: Peer.MediaConnection,
    stream: MediaStream
  ) {
    if (player.audioConn !== null) {
      // TODO: in principle, this could be trying to overwrite
      // the existing call, in which case we should close
      // the existing call and proceed here. But I don't know
      // how to distinguish that case from the case of two
      // players who both call each other, in which we'd
      // rather just ignore the duplicate call.
      console.log("    duplicate call, skipping");
      return;
    }

    // Create PlayerAudio.
    const initialVolumes = calcVolumes(
      player.mesh.position,
      player.mesh.rotation,
      this.ourPlayer.mesh.position,
      this.ourPlayer.mesh.rotation
    );
    const audio = new PlayerAudio(stream, this.globals, {
      left: initialVolumes[0],
      right: initialVolumes[1],
    });

    // Set player.audioConn.
    player.audioConn = new PeerJSConnection(call, audio);
  }
}
