import { Player } from "../state/player";
import { Globals } from "../util";

export function handleColorInput(ourPlayer: Player) {
  const canvas = <HTMLCanvasElement>document.getElementById("colorInput");
  const ctx = canvas.getContext("2d")!;

  const colorInputImage = <HTMLImageElement>(
    document.getElementById("colorInputImage")
  );
  ctx.drawImage(colorInputImage, 10, 0);
  ctx.strokeStyle = "black";

  function redraw() {
    ctx.clearRect(0, 30, canvas.width, canvas.height - 30);
    // Draw a triangle pointing to the current hue, filled with its color
    // but outlined in black.
    ctx.beginPath();
    const x = ourPlayer.state.hue.value / 2 + 10;
    ctx.moveTo(x, 30);
    ctx.lineTo(x - 10, 49);
    ctx.lineTo(x + 10, 49);
    ctx.closePath();
    ctx.fillStyle = `hsl(${ourPlayer.state.hue.value}, 100%, 50%)`;
    ctx.fill();
    ctx.stroke();
  }

  redraw();

  canvas.addEventListener("click", (e) => {
    let hue = 2 * Math.round(e.offsetX - 10);
    hue = Math.min(360, Math.max(0, hue));
    ourPlayer.state.hue.value = hue;
    redraw();
    Globals().renderCanvas.focus();
  });
}
