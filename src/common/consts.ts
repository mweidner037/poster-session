/**
 * Translation speed in units/sec.
 */
export const TRANSLATION_SPEED = 3;
/**
 * Rotation speed in units/sec.
 */
export const ROTATION_SPEED = 3;

/**
 * Speed to move when following a target location
 * (usually "catching up" to a location sent over the network),
 * as a ratio with the actual speed.
 */
const FOLLOW_SPEED_RATIO = 1.1;
export const TRANSLATION_FOLLOW_SPEED = TRANSLATION_SPEED * FOLLOW_SPEED_RATIO;
export const ROTATION_FOLLOW_SPEED = ROTATION_SPEED * FOLLOW_SPEED_RATIO;

/**
 * If you are following a location and it would take >=
 * this many seconds to get there (due to lag), just jump there.
 */
export const FOLLOW_JUMP_TIME = 1;
