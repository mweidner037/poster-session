import { BoringFurnitureState } from "./boring_furniture_state";
import { EaselState } from "./easel_state";

export { BoringFurnitureState, EaselState };

// Update this map as you add new furniture types, in addition
// to re-exporting them.
// Each type must extend FurnitureState, and each type's
// constructor must take collabs.InitToken as its first
// argument (the usual convention for Collabs).
export const FurnitureStateClasses = {
  boring: BoringFurnitureState,
  easel: EaselState,
} as const;
