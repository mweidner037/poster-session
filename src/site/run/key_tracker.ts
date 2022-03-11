import * as BABYLON from "@babylonjs/core/Legacy/legacy";

export class KeyTracker {
  private readonly keysDown: { [char: string]: boolean | undefined } = {};

  constructor(scene: BABYLON.Scene) {
    // TODO: release keys if the user leaves the scene.
    scene.onKeyboardObservable.add((e) => {
      if (e.event.type === "keydown") {
        this.keysDown[e.event.key] = true;
      } else if (e.event.type === "keyup") {
        this.keysDown[e.event.key] = false;
      }
    });
  }

  get(char: string): boolean {
    return this.keysDown[char] ?? false;
  }
}
