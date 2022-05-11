import * as BABYLON from "@babylonjs/core/Legacy/legacy";

export class KeyTracker {
  private readonly keysDown = new Set<string>();

  constructor(scene: BABYLON.Scene, renderCanvas: HTMLCanvasElement) {
    scene.onKeyboardObservable.add((e) => {
      if (e.event.type === "keydown") {
        this.keysDown.add(e.event.key);
      } else if (e.event.type === "keyup") {
        this.keysDown.delete(e.event.key);
      }
    });
    // Release all keys when the scene loses focus.
    renderCanvas.onblur = () => {
      this.keysDown.clear();
    };
  }

  get(char: string): boolean {
    return this.keysDown.has(char);
  }

  getIgnoreCase(char: string): boolean {
    return this.get(char.toLowerCase()) || this.get(char.toUpperCase());
  }
}
