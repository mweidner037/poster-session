import React from "react";
import { WhiteboardState } from "../../../common/state";
import { Globals } from "../../util";
import "./whiteboard_viewer.css";

const COLORS: readonly string[] = [
  "black",
  "white",
  "red",
  "orange",
  "yellow",
  "green",
  "blue",
  "purple",
  "brown",
] as const;

const GRAN = 2;

interface Props {
  whiteboardState: WhiteboardState;
}

interface State {
  selectedColor: number;
}

export class WhiteboardViewer extends React.Component<Props, State> {
  private canvas: React.RefObject<HTMLCanvasElement>;
  private ctx: CanvasRenderingContext2D | null = null;
  private removeListeners: (() => void) | null = null;
  // Mouse state. Not React state to avoid unnecessary re-renders.
  private isDown = false;
  private prevX = 0;
  private prevY = 0;

  constructor(props: Props) {
    super(props);

    let selectedColor = -1;
    let selectedColorName = Globals().localStorage.getWhiteboardColor();
    if (selectedColorName !== null) {
      selectedColor = COLORS.indexOf(selectedColorName);
    }
    if (selectedColor === -1) {
      selectedColor = 0;
      Globals().localStorage.setWhiteboardColor(COLORS[selectedColor]);
    }
    this.state = { selectedColor };

    this.canvas = React.createRef();
  }

  componentDidMount() {
    this.ctx = this.canvas.current!.getContext("2d")!;

    // Draw the initial board state on the canvas.
    for (const [[x, y], color] of this.props.whiteboardState.pixels) {
      this.ctx.fillStyle = color;
      this.ctx.fillRect(x, y, GRAN, GRAN);
    }

    // Subscribe to future updates.
    const toRemove: (() => void)[] = [];
    toRemove.push(
      this.props.whiteboardState.pixels.on("Set", (event) => {
        if (this.ctx === null) return;
        this.ctx.fillStyle = this.props.whiteboardState.pixels.get(event.key)!;
        this.ctx.fillRect(event.key[0], event.key[1], GRAN, GRAN);
      })
    );
    toRemove.push(
      this.props.whiteboardState.pixels.on("Delete", (event) => {
        if (this.ctx === null) return;
        this.ctx.clearRect(event.key[0], event.key[1], GRAN, GRAN);
      })
    );
    this.removeListeners = () => {
      toRemove.forEach((value) => value());
    };

    // Reset mouse state.
    this.isDown = false;
  }

  componentWillUnmount() {
    this.removeListeners!();
  }

  private setSelectedColor(selectedColor: number) {
    this.setState({ selectedColor });
    Globals().localStorage.setWhiteboardColor(COLORS[selectedColor]);
  }

  private roundGran(n: number): number {
    return Math.round(n / GRAN) * GRAN;
  }

  private interpolate(
    sX: number,
    sY: number,
    eX: number,
    eY: number
  ): [number, number][] {
    const pts: [number, number][] = [];

    // special case - line goes straight up/down
    if (sX == eX) {
      for (
        let i = this.roundGran(Math.min(sY, eY));
        i <= this.roundGran(Math.max(sY, eY));
        i += GRAN
      ) {
        pts.push([this.roundGran(sX), i]);
      }

      return pts;
    }

    const slope = (eY - sY) / (eX - sX);
    const intercept = sY - slope * sX;

    // Depending on slope, iterate by xs or ys
    if (slope <= 1 && slope >= -1) {
      for (
        let i = this.roundGran(Math.min(sX, eX));
        i <= this.roundGran(Math.max(sX, eX));
        i += GRAN
      ) {
        pts.push([i, this.roundGran(slope * i + intercept)]);
      }
    } else {
      for (
        let i = this.roundGran(Math.min(sY, eY));
        i <= this.roundGran(Math.max(sY, eY));
        i += GRAN
      ) {
        pts.push([this.roundGran((i - intercept) / slope), i]);
      }
    }

    return pts;
  }

  render() {
    // TODO: show which color is selected, like in toolbox.
    return (
      <>
        <p>
          {COLORS.map((color, index) => (
            <button
              key={index}
              className="colorButton"
              style={{ backgroundColor: color }}
              onMouseDown={() => this.setSelectedColor(index)}
            ></button>
          ))}
        </p>

        <canvas
          ref={this.canvas}
          className="whiteboard"
          width={GRAN * WhiteboardState.WIDTH}
          height={GRAN * WhiteboardState.HEIGHT}
          onMouseDown={(e) => {
            if ((e.buttons & 1) === 0) return;
            this.isDown = true;
            const rect = e.currentTarget.getBoundingClientRect();
            this.prevX = e.clientX - rect.left;
            this.prevY = e.clientY - rect.top;
          }}
          onMouseMove={(e) => {
            if ((e.buttons & 1) === 0) this.isDown = false;
            if (this.isDown !== false) {
              const rect = e.currentTarget.getBoundingClientRect();
              const canvasX = e.clientX - rect.left;
              const canvasY = e.clientY - rect.top;
              this.interpolate(
                this.prevX,
                this.prevY,
                canvasX,
                canvasY
              ).forEach((pt) => {
                this.props.whiteboardState.pixels.set(
                  pt,
                  COLORS[this.state.selectedColor]
                );
              });
              this.prevX = canvasX;
              this.prevY = canvasY;
            }
          }}
          onMouseLeave={() => {
            this.isDown = false;
          }}
        ></canvas>

        <p>
          <button
            className="clearButton"
            onMouseDown={() => {
              this.props.whiteboardState.pixels.clear();
            }}
          >
            Clear
          </button>
        </p>
      </>
    );
  }
}
