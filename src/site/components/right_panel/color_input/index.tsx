import React from "react";
import { Player } from "../../../state/player";
import { Globals } from "../../../util";
import ColorsImage from "./colors_image.png";

interface Props {
  ourPlayer: Player;
}

export class ColorInput extends React.Component<Props> {
  private canvas: React.RefObject<HTMLCanvasElement>;
  private ctx: CanvasRenderingContext2D | null = null;

  constructor(props: Props) {
    super(props);

    this.canvas = React.createRef();
  }

  componentDidMount() {
    this.ctx = this.canvas.current!.getContext("2d")!;
    this.ctx.strokeStyle = "black";

    const colorInputImage = new Image();
    colorInputImage.onload = () => {
      this.ctx!.drawImage(colorInputImage, 10, 0);
    };
    colorInputImage.src = ColorsImage;

    this.redraw();
  }

  private redraw() {
    if (this.canvas.current === null || this.ctx === null) return;

    this.ctx.clearRect(
      0,
      30,
      this.canvas.current.width,
      this.canvas.current.height - 30
    );
    // Draw a triangle pointing to the current hue, filled with its color
    // but outlined in black.
    this.ctx.beginPath();
    const x = this.props.ourPlayer.state.hue.value / 2 + 10;
    this.ctx.moveTo(x, 30);
    this.ctx.lineTo(x - 10, 49);
    this.ctx.lineTo(x + 10, 49);
    this.ctx.closePath();
    this.ctx.fillStyle = `hsl(${this.props.ourPlayer.state.hue.value}, 100%, 50%)`;
    this.ctx.fill();
    this.ctx.stroke();
  }

  private onClickHandler = (
    e: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ) => {
    let hue = 2 * Math.round(e.nativeEvent.offsetX - 10);
    hue = Math.min(360, Math.max(0, hue));
    this.props.ourPlayer.state.hue.value = hue;
    this.redraw();
    Globals().renderCanvas.focus();
  };

  render() {
    return (
      <>
        <p>Color</p>
        <canvas
          ref={this.canvas}
          width="201"
          height="50"
          onClick={this.onClickHandler}
        ></canvas>
      </>
    );
  }
}
