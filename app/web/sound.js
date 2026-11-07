/** Small synthesized sound effects. No external assets or autoplay. */
let context;
let enabled = localStorage.getItem("panic.sound") !== "off";

export function isSoundOn() { return enabled; }
export function toggleSound() {
  enabled = !enabled;
  localStorage.setItem("panic.sound", enabled ? "on" : "off");
  return enabled;
}

export function sound(kind = "tap") {
  if (!enabled) return;
  try {
    context ??= new (window.AudioContext || window.webkitAudioContext)();
    if (context.state === "suspended") context.resume();
    const now = context.currentTime;
    const settings = {
      tap: [330, 420, 0.045, "sine", 0.025],
      success: [430, 790, 0.18, "sine", 0.055],
      error: [170, 105, 0.20, "sawtooth", 0.036],
      swap: [280, 80, 0.58, "triangle", 0.070],
      win: [440, 880, 0.55, "sine", 0.065],
    };
    const [start, end, seconds, wave, volume] = settings[kind] || settings.tap;
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(start, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(end, 1), now + seconds);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
    osc.connect(gain); gain.connect(context.destination);
    // Release the audio graph after each short cue, including on long sessions.
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
    osc.start(now); osc.stop(now + seconds + 0.02);
  } catch { /* Browser audio unsupported: gameplay remains unaffected. */ }
}
