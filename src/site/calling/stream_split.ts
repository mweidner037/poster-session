// From https://github.com/Meshiest/demo-proximity-voice/blob/f19b87893a9656c4f2b49523729cf698f3f9c086/public/app.js#L238
// which is CC0-1.0 licensed.

// split an audio stream into left and right channels
export class StreamSplit {
  private readonly context: AudioContext;
  private readonly source: MediaStreamAudioSourceNode;
  private readonly destination: MediaStreamAudioDestinationNode;
  private readonly channels: { left: GainNode; right: GainNode };

  constructor(readonly stream: MediaStream, { left = 1, right = 1 } = {}) {
    // create audio context using the stream as a source
    const track = stream.getAudioTracks()[0];
    this.context = new AudioContext();
    this.source = this.context.createMediaStreamSource(
      new MediaStream([track])
    );

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

    this.destination = this.context.createMediaStreamDestination();
  }

  // set the volume
  setVolume(left = 0, right = 0) {
    // clamp volumes between 0 and 1
    left = Math.max(Math.min(left, 1), 0);
    right = Math.max(Math.min(right, 1), 0);

    // set the volumes for each channel's gain
    this.channels.left.gain.value = left;
    this.channels.right.gain.value = right;
  }

  // close the context, stop the audio
  close() {
    return this.context.close();
  }
}
