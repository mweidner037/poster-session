import { Player } from "../state/player";

export function handleNameInput(
  ourPlayer: Player,
  mainCanvas: HTMLCanvasElement
) {
  const nameInput = <HTMLInputElement>document.getElementById("nameInput");
  const nameInputForm = <HTMLFormElement>(
    document.getElementById("nameInputForm")
  );
  nameInputForm.addEventListener("submit", (e) => {
    e.preventDefault();
    ourPlayer.state.displayName.value = nameInput.value;
    mainCanvas.focus();
  });
  nameInput.addEventListener("blur", () => {
    ourPlayer.state.displayName.value = nameInput.value;
  });
  nameInput.addEventListener("focus", () => {
    nameInput.select();
  });
}
