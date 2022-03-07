// Based on https://github.com/Meshiest/demo-voice/blob/master/public/index.html

import Peer from "peerjs";
import { EntityCollab, SerialMutCSet } from "../../common/state";

/**
 * Returns a PeerJS peer id that is likely to be globally unique
 * and that is a deterministic function of anyID.
 * This function's use is that peer ids have specific
 * requirements, while anyID can be any string.
 */
function stringToPeerID(anyID: string): string {
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
  readonly id: string;
  readonly peer: Peer;

  /**
   * Excludes us.
   */
  private readonly playersByPeerID = new Map<string, EntityCollab>();
  private readonly videoElemsByPlayer = new Map<
    EntityCollab,
    [MediaStream, HTMLVideoElement]
  >();
  /**
   * Streams that we have answered but don't yet associate
   * with a player, probably because we haven't received
   * their Add event yet.  Indexed by peerID.
   */
  private readonly pendingReceivedStreams = new Map<string, MediaStream>();

  private constructor(
    private readonly ourPlayer: EntityCollab,
    private readonly players: SerialMutCSet<EntityCollab, unknown[]>,
    readonly ourAudioStream: MediaStream
  ) {
    this.id = this.getPeerID(ourPlayer);

    // TODO: IRL we would need our own PeerJS server, STUN server,
    // and TURN server, all specified as options here.
    // For now we use PeerJS defaults, which are:
    // - PeerJS own PeerJS server
    // - Google STUN server
    // - No TURN server
    // These options are fine for testing, but rude & flaky
    // for a real deployment.
    this.peer = new Peer(this.id);

    // Logging info.
    console.log("Our peer id: " + this.id);
    this.peer.on("open", () => console.log("open"));
    this.peer.on("disconnected", () => console.log("disconnected"));
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

    // Keep playersByPeerID up to date.
    for (const player of this.players) {
      if (player !== this.ourPlayer) {
        const peerID = this.getPeerID(player);
        this.playersByPeerID.set(peerID, player);
        // Let existing peers call us.
      }
    }
    this.players.on("Add", (e) => {
      const peerID = this.getPeerID(e.value);
      this.playersByPeerID.set(peerID, e.value);
      const pendingStream = this.pendingReceivedStreams.get(peerID);
      if (pendingStream !== undefined) {
        console.log("  pending player now known");
        this.pendingReceivedStreams.delete(peerID);
        this.playAudioStream(pendingStream, e.value);
      } else {
        // Call the new peer.
        console.log("Calling peer " + peerID);
        const call = this.peer.call(peerID, this.ourAudioStream);
        this.handleCall(call);
      }
    });
    this.players.on("Delete", (e) => {
      this.playersByPeerID.delete(this.getPeerID(e.value));
      const videoElem = this.videoElemsByPlayer.get(e.value);
      if (videoElem !== undefined) {
        videoElem[1].remove();
        this.videoElemsByPlayer.delete(e.value);
      }
    });
  }

  private getPeerID(playerCollab: EntityCollab) {
    return stringToPeerID(playerCollab.name);
  }

  private handleCall(call: Peer.MediaConnection) {
    call.on("stream", (stream) => {
      console.log("received stream from " + call.peer);
      const player = this.playersByPeerID.get(call.peer);
      if (player !== undefined) {
        console.log("  player is known");
        this.playAudioStream(stream, player);
      } else {
        console.log("  player is unknown");
        this.pendingReceivedStreams.set(call.peer, stream);
        call.on("close", () => {
          this.pendingReceivedStreams.delete(call.peer);
        });
        // Don't play yet.
      }
    });
  }

  private playAudioStream(stream: MediaStream, player: EntityCollab) {
    const existing = this.videoElemsByPlayer.get(player);
    if (existing !== undefined) {
      if (existing[0] === stream) return;
      else existing[1].remove();
    }
    const elem = <HTMLVideoElement>document.createElement("video");
    elem.srcObject = stream;
    elem.autoplay = true;
    elem.onloadedmetadata = () => elem.play();
    // TODO: own parent
    document.body.appendChild(elem);
    this.videoElemsByPlayer.set(player, [stream, elem]);
  }

  /**
   * Must be called after loading.
   */
  static async new(
    ourAudioStream: MediaStream,
    ourPlayer: EntityCollab,
    players: SerialMutCSet<EntityCollab, any[]>
  ): Promise<PeerJSManager> {
    return new PeerJSManager(ourPlayer, players, ourAudioStream);
  }
}
