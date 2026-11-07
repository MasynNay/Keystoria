/** Countdown presentation. GameEngine owns the timing, threats and launch. */
export const DEPLOYMENT_SECONDS = 10;

export function deploymentDisplay(seconds) {
  const remaining = Math.max(0, Number(seconds) || 0);
  const digit = Math.ceil(remaining);
  if (remaining > 6) return {
    label: String(digit), instruction: 'READ THE STORY · THE MISSION TIMER IS PAUSED', preparing: true,
  };
  if (remaining > 3) return {
    label: String(digit), instruction: 'GET YOUR HANDS READY · FIND YOUR FIRST COMMAND', preparing: true,
  };
  return {
    label: digit > 0 ? String(digit) : 'GO',
    instruction: digit > 0 ? 'TYPE WHEN THE MISSION APPEARS' : 'BEGIN YOUR FIRST COMMAND',
    preparing: false,
  };
}
