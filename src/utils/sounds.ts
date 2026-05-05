let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function resumeCtx() {
  const c = getCtx();
  if (c.state === "suspended") c.resume();
  return c;
}

export function playCardSnap() {
  try {
    const c = resumeCtx();
    const buf = c.createBuffer(1, c.sampleRate * 0.06, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 4);
    }
    const src = c.createBufferSource();
    src.buffer = buf;
    const gain = c.createGain();
    gain.gain.setValueAtTime(0.35, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.06);
    src.connect(gain);
    gain.connect(c.destination);
    src.start();
  } catch {
    // audio not available
  }
}

export function playTrickWin() {
  try {
    const c = resumeCtx();
    const notes = [523.25, 659.25, 783.99]; // C5 E5 G5
    notes.forEach((freq, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const t = c.currentTime + i * 0.1;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.22, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(t);
      osc.stop(t + 0.35);
    });
  } catch {
    // audio not available
  }
}

export function playDealWhoosh() {
  try {
    const c = resumeCtx();
    const buf = c.createBuffer(1, c.sampleRate * 0.18, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / data.length) * Math.PI);
    }
    const src = c.createBufferSource();
    src.buffer = buf;
    const bpf = c.createBiquadFilter();
    bpf.type = "bandpass";
    bpf.frequency.setValueAtTime(1200, c.currentTime);
    bpf.frequency.exponentialRampToValueAtTime(300, c.currentTime + 0.18);
    bpf.Q.value = 0.8;
    const gain = c.createGain();
    gain.gain.setValueAtTime(0.18, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.18);
    src.connect(bpf);
    bpf.connect(gain);
    gain.connect(c.destination);
    src.start();
  } catch {
    // audio not available
  }
}

export function playIllegalCard() {
  try {
    const c = resumeCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(180, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, c.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + 0.15);
  } catch {
    // audio not available
  }
}
