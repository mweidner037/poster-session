// Stream split and volume based on
// https://github.com/Meshiest/demo-proximity-voice/blob/f19b87893a9656c4f2b49523729cf698f3f9c086/public/app.js#L238
// which is CC0-1.0 licensed.

/**
 * Manages audio coming from a different player.
 *
 * - Splits audio into left and right outputs with settable volumes
 * and plays them.
 * - Lets you query the recent volume level.
 *
 * @param levelOnly If set, only lets you query the recent volume level.
 * Appropriate for the local user's audio.
 */
export class PlayerAudio {
  private readonly context: AudioContext;
  private readonly source: MediaStreamAudioSourceNode;
  private readonly channels?: { left: GainNode; right: GainNode };
  private readonly analyser: AnalyserNode;

  private readonly ansArray: Uint8Array;

  constructor(
    readonly stream: MediaStream,
    { left = 1, right = 1 } = {},
    levelOnly = false
  ) {
    // create audio context using the stream as a source
    this.context = new AudioContext();
    this.source = this.context.createMediaStreamSource(stream);

    // Create and connect the analyser.
    this.analyser = new AnalyserNode(this.context);
    // No idea what to put here, just copying
    // https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/smoothingTimeConstant#example
    // this.analyser.minDecibels = -90;
    // this.analyser.maxDecibels = -10;
    this.analyser.smoothingTimeConstant = 0.1;
    this.analyser.fftSize = 32; // min allowed
    this.ansArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.source.connect(this.analyser);

    if (!levelOnly) {
      // create a channel for each ear (left, right)
      this.channels = {
        left: this.context.createGain(),
        right: this.context.createGain(),
      };

      // connect the gains
      this.source.connect(this.channels.left);
      this.source.connect(this.channels.right);

      // create a merger to join the two gains
      const merger = this.context.createChannelMerger(2);
      this.channels.left.connect(merger, 0, 0);
      this.channels.right.connect(merger, 0, 1);

      // set the volume for each side
      this.setVolume(left, right);

      // connect the merger to the audio context
      merger.connect(this.context.destination);
    }
  }

  // set the volume
  setVolume(left = 0, right = 0) {
    if (this.channels === undefined) {
      throw new Error("levelOnly was true");
    }

    // clamp volumes between 0 and 1
    left = Math.max(Math.min(left, 1), 0);
    right = Math.max(Math.min(right, 1), 0);

    // set the volumes for each channel's gain
    this.channels.left.gain.value = left;
    this.channels.right.gain.value = right;
  }

  /**
   * @return The original input volume level, approximately.
   * Scale TODO.
   */
  getLevel(): number {
    // From https://stackoverflow.com/a/18255806
    this.analyser.getByteFrequencyData(this.ansArray);
    let sum = 0;
    for (let i = 0; i < this.ansArray.length; i++) {
      sum += this.ansArray[i];
    }
    return sum / this.ansArray.length;
  }

  // close the context, stop the audio
  close() {
    return this.context.close();
  }
}
