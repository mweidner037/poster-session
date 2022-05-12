import { MyVector3 } from "../../common/util";
import { TOOLS } from "../components/toolbox";

/**
 * Typed and named wrapper for window.localStorage.
 *
 * Each getter returns the requested value if it is present and well-formed,
 * else null.
 */
export class LocalStorage {
  setName(name: string) {
    this.safeSet("name", name);
  }
  getName(): string | null {
    return window.localStorage.getItem("name");
  }

  setPosition(position: MyVector3) {
    this.setMyVector3("position", position);
  }
  getPosition(): MyVector3 | null {
    return this.getMyVector3("position");
  }

  setRotation(rotation: MyVector3) {
    this.setMyVector3("rotation", rotation);
  }
  getRotation(): MyVector3 | null {
    return this.getMyVector3("rotation");
  }

  setHue(hue: number) {
    this.setFloat("hue", hue);
  }
  getHue() {
    return this.getFloat("hue");
  }

  setTool(tool: keyof typeof TOOLS) {
    this.safeSet("tool", tool);
  }
  getTool(): keyof typeof TOOLS | null {
    const tool = window.localStorage.getItem("tool");
    if (tool === null) return null;
    if (TOOLS[tool as keyof typeof TOOLS] === undefined) return null;
    return tool as keyof typeof TOOLS;
  }

  setWhiteboardColor(color: string) {
    this.safeSet("whiteboardColor", color);
  }
  getWhiteboardColor(): string | null {
    return window.localStorage.getItem("whiteboardColor");
  }

  clear() {
    window.localStorage.clear();
  }

  private safeSet(key: string, value: string): void {
    try {
      window.localStorage.setItem(key, value);
    } catch (err) {
      // Don't interrupt the caller, just print the error nicely.
      void new Promise(() => {
        throw err;
      });
    }
  }

  private setMyVector3(prefix: string, value: MyVector3) {
    this.safeSet(`${prefix}.x`, value.x + "");
    this.safeSet(`${prefix}.y`, value.y + "");
    this.safeSet(`${prefix}.z`, value.z + "");
  }
  private getMyVector3(prefix: string): MyVector3 | null {
    const xStr = window.localStorage.getItem(`${prefix}.x`);
    const yStr = window.localStorage.getItem(`${prefix}.y`);
    const zStr = window.localStorage.getItem(`${prefix}.z`);
    if (xStr === null || yStr === null || zStr === null) return null;
    const x = Number.parseFloat(xStr);
    const y = Number.parseFloat(yStr);
    const z = Number.parseFloat(zStr);
    if (isNaN(x) || isNaN(y) || isNaN(z)) return null;
    return MyVector3.new(x, y, z);
  }

  private setFloat(name: string, value: number) {
    this.safeSet(name, value + "");
  }
  private getFloat(name: string): number | null {
    const str = window.localStorage.getItem(name);
    if (str === null) return null;
    const value = Number.parseFloat(str);
    if (isNaN(value)) return null;
    return value;
  }
}
