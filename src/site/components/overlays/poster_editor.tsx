import React from "react";
import { Easel } from "../../state";
import { Overlay } from "../react_main";

const WIDTH_MIN = 30;
const WIDTH_MAX = 200;

interface Props {
  easel: Easel;
  startWidth: number;
  setOverlay: (overlay: Overlay) => void;
}

interface State {
  widthStr: string;
}

export class PosterEditor extends React.Component<Props, State> {
  private readonly fileInput: React.RefObject<HTMLInputElement>;

  constructor(props: Props) {
    super(props);

    this.state = { widthStr: "" + this.props.startWidth };
    this.fileInput = React.createRef();
  }

  private onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const widthCM = Number.parseInt(this.state.widthStr);
    if (isNaN(widthCM) || widthCM < WIDTH_MIN || widthCM > WIDTH_MAX) return;

    const file = this.fileInput.current!.files![0];
    if (file !== undefined) {
      // TODO: mouse spinner while uploading and sizing.
      const imageBytes = new Uint8Array(await file.arrayBuffer());
      // Get height/width ratio from the image and use it to set the height.
      const image = new Image();
      const imageLoadedPromise = new Promise((resolve) => {
        image.onload = resolve;
      });
      image.src = URL.createObjectURL(
        new Blob([imageBytes], { type: "image/png" })
      );
      await imageLoadedPromise;
      if (image.width === 0) return;
      // TODO: really want to do these in a *local* transaction as well,
      // so events are not fired until all is set.
      this.props.easel.state.width.value = widthCM / 100;
      this.props.easel.state.heightRatio.value = image.height / image.width;
      this.props.easel.state.image.value = imageBytes;
    } else {
      // No new image, user is just changing the poster's width.
      this.props.easel.state.width.value = widthCM / 100;
    }

    // Exit overlay.
    this.props.setOverlay(null);
  };

  render() {
    return (
      <>
        <h1>Poster Editor</h1>
        <form onSubmit={this.onSubmit}>
          <label>Upload image:</label>
          <input type="file" ref={this.fileInput} accept=".png" />
          <br />
          <label>Width (cm):</label>
          <input
            type="number"
            min={WIDTH_MIN}
            max={WIDTH_MAX}
            value={this.state.widthStr}
            onChange={(e) => this.setState({ widthStr: e.target.value })}
          />
          <br />
          <input type="submit" value="Submit" />
        </form>
      </>
    );
  }
}
