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

const BORDER_WIDTH = 2; // .whiteboardParent border width in pixels

interface Props {
  whiteboardState: WhiteboardState;
  canvas: HTMLCanvasElement;
}

interface State {
  selectedColor: number;
}

export class WhiteboardViewer extends React.Component<Props, State> {
  private removeListeners: (() => void) | null = null;
  private canvasParent: React.RefObject<HTMLDivElement>;
  // Mouse state. Not React state to avoid unnecessary re-renders.
  // -1 if the last position was invalid.
  private prevX = -1;
  private prevY = -1;

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

    this.canvasParent = React.createRef();
  }

  componentDidMount() {
    // Attach canvas and its listeners.
    this.canvasParent.current!.appendChild(this.props.canvas);

    this.props.canvas.onmousedown = this.onMouseEvent;
    this.props.canvas.onmouseup = this.onMouseEvent;
    this.props.canvas.onmousemove = this.onMouseEvent;
    this.props.canvas.onmouseleave = this.onMouseEvent;
    this.props.canvas.onmouseenter = (e) => {
      // Never draw on mouseenter.
      this.prevX = -1;
      this.onMouseEvent(e);
    };

    // Reset mouse state.
    this.prevX = -1;

    this.removeListeners = () => {
      this.canvasParent.current!.removeChild(this.props.canvas);
      this.props.canvas.onmousedown = null;
      this.props.canvas.onmouseup = null;
      this.props.canvas.onmousemove = null;
      this.props.canvas.onmouseleave = null;
      this.props.canvas.onmouseenter = null;
    };
  }

  // TODO: technically should also replace the canvas on props update?
  // Although I don't expect to go immediately from one whiteboard view to
  // another.

  componentWillUnmount() {
    this.removeListeners!();
    this.removeListeners = null;
  }

  private setSelectedColor(selectedColor: number) {
    this.setState({ selectedColor });
    Globals().localStorage.setWhiteboardColor(COLORS[selectedColor]);
  }

  private onMouseEvent = (e: MouseEvent) => {
    const isDown = (e.buttons & 1) !== 0;
    if (isDown) {
      const rect = this.props.canvas.getBoundingClientRect();
      const canvasX = e.clientX - rect.left;
      const canvasY = e.clientY - rect.top;
      if (this.prevX !== -1) {
        // Stroke was valid, draw.
        this.interpolate(this.prevX, this.prevY, canvasX, canvasY).forEach(
          (pt) => {
            // Brush size 3.
            for (
              let dx = -WhiteboardState.GRAN;
              dx <= WhiteboardState.GRAN;
              dx += WhiteboardState.GRAN
            ) {
              for (
                let dy = -WhiteboardState.GRAN;
                dy <= WhiteboardState.GRAN;
                dy += WhiteboardState.GRAN
              ) {
                if (pt[0] + dx >= 0 && pt[0] + dx < this.props.canvas.width) {
                  if (
                    pt[1] + dy >= 0 &&
                    pt[1] + dy < this.props.canvas.height
                  ) {
                    this.props.whiteboardState.pixels.set(
                      [pt[0] + dx, pt[1] + dy],
                      COLORS[this.state.selectedColor]
                    );
                  }
                }
              }
            }
          }
        );
      }
      this.prevX = canvasX;
      this.prevY = canvasY;
    } else {
      this.prevX = -1;
    }
  };

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
        i += WhiteboardState.GRAN
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
        i += WhiteboardState.GRAN
      ) {
        pts.push([i, this.roundGran(slope * i + intercept)]);
      }
    } else {
      for (
        let i = this.roundGran(Math.min(sY, eY));
        i <= this.roundGran(Math.max(sY, eY));
        i += WhiteboardState.GRAN
      ) {
        pts.push([this.roundGran((i - intercept) / slope), i]);
      }
    }

    return pts;
  }

  private roundGran(n: number): number {
    return Math.round(n / WhiteboardState.GRAN) * WhiteboardState.GRAN;
  }

  render() {
    // TODO: show which color is selected, like in toolbox.
    return (
      <>
        <p>
          {COLORS.map((color, index) => (
            <span
              className="colorSelectButton"
              key={index}
              style={{
                backgroundColor: color,
                borderStyle:
                  index === this.state.selectedColor ? "inset" : "outset",
              }}
              onMouseDown={() => this.setSelectedColor(index)}
            />
          ))}
        </p>

        <div
          ref={this.canvasParent}
          className="whiteboardParent"
          style={{
            width: `${
              WhiteboardState.GRAN * WhiteboardState.WIDTH + 2 * BORDER_WIDTH
            }px`,
            height: `${
              WhiteboardState.GRAN * WhiteboardState.HEIGHT + 2 * BORDER_WIDTH
            }px`,
          }}
        ></div>

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
