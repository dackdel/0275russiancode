// Synthesized clock ticks. No samples.
// One soft-clipped bus, one noise buffer, short oscillators.

(function () {
  const MASTER_GAIN = 0.42;

  let ctx = null;
  let master = null;
  let noiseBuffer = null;
  let armed = false;
  let timer = null;
  let scheduledMark = null;
  let suppressUntil = 0;

  function clampFreq(freq) {
    const nyquist = ctx.sampleRate / 2 - 100;
    return Math.min(nyquist, Math.max(1, freq));
  }

  function jitter(amount) {
    return 1 + (Math.random() * 2 - 1) * amount;
  }

  function shaperCurve() {
    const n = 2048;
    const curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * 2 - 1;
      const ax = Math.abs(x);
      const y = ax < 0.7 ? ax : 0.7 + 0.3 * Math.tanh((ax - 0.7) / 0.3);
      curve[i] = Math.sign(x) * y;
    }
    return curve;
  }

  function build() {
    master = ctx.createGain();
    master.gain.value = MASTER_GAIN;

    const shaper = ctx.createWaveShaper();
    shaper.curve = shaperCurve();
    shaper.oversample = "2x";
    master.connect(shaper);
    shaper.connect(ctx.destination);

    const length = ctx.sampleRate;
    noiseBuffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  }

  function ensure() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return false;
      ctx = new AudioCtx({ latencyHint: "interactive" });
      build();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx.state !== "closed";
  }

  function env(t, peak, attack, release) {
    const gain = ctx.createGain();
    const level = Math.max(peak, 1e-4);
    const end = t + attack + release;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(level, t + attack);
    gain.gain.exponentialRampToValueAtTime(1e-4, end);
    gain.gain.setValueAtTime(0, end + 0.002);
    return gain;
  }

  function osc(type, freq, t, dur) {
    const node = ctx.createOscillator();
    node.type = type;
    node.frequency.setValueAtTime(clampFreq(freq), t);
    node.start(t);
    node.stop(t + dur + 0.02);
    return node;
  }

  function noise(t, dur) {
    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    source.start(t, Math.random() * 0.5, dur + 0.01);
    return source;
  }

  function biquad(type, freq, q) {
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = clampFreq(freq);
    filter.Q.value = q;
    return filter;
  }

  function chain(source, nodes) {
    let previous = source;
    for (let i = 0; i < nodes.length; i++) {
      previous.connect(nodes[i]);
      previous = nodes[i];
    }
    previous.connect(master);
    source.onended = () => {
      try { source.disconnect(); } catch (e) { /* already stopped */ }
      for (let i = 0; i < nodes.length; i++) {
        try { nodes[i].disconnect(); } catch (e) { /* already stopped */ }
      }
    };
  }

  function noiseTick(t, center, peak, length) {
    const dur = length * jitter(0.12);
    const freq = center * jitter(0.015);
    const source = noise(t, dur);
    chain(source, [
      biquad("bandpass", freq, 1.5),
      biquad("lowpass", Math.max(280, freq * 1.35), 0.707),
      env(t, peak * jitter(0.1), 0.0012, dur),
    ]);
  }

  function minuteTick(t) {
    const dur = 0.62 * jitter(0.05);
    const start = clampFreq(112 * jitter(0.015));
    const buzz = ctx.createOscillator();
    buzz.type = "sawtooth";
    buzz.frequency.setValueAtTime(start, t);
    buzz.frequency.exponentialRampToValueAtTime(clampFreq(start * 0.74), t + dur * 0.9);
    buzz.start(t);
    buzz.stop(t + dur + 0.02);

    const roll = ctx.createGain();
    roll.gain.setValueAtTime(0.7, t);
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(30 * jitter(0.04), t);
    const depth = ctx.createGain();
    depth.gain.value = 0.3;
    lfo.connect(depth);
    depth.connect(roll.gain);
    lfo.start(t);
    lfo.stop(t + dur + 0.02);

    const filter = biquad("lowpass", 340, 0.8);
    const level = env(t, 0.12 * jitter(0.08), 0.02, dur - 0.02);
    const rasp = noise(t, dur * 0.8);
    const raspFilter = biquad("bandpass", 680, 0.6);
    const raspLevel = env(t, 0.04 * jitter(0.1), 0.012, dur * 0.62);

    buzz.connect(filter);
    filter.connect(roll);
    rasp.connect(raspFilter);
    raspFilter.connect(raspLevel);
    raspLevel.connect(roll);
    roll.connect(level);
    level.connect(master);

    const nodes = [filter, roll, level, depth, raspFilter, raspLevel];
    const sources = [buzz, lfo, rasp];
    buzz.onended = () => {
      sources.forEach((node) => { try { node.disconnect(); } catch (e) { /* already stopped */ } });
      nodes.forEach((node) => { try { node.disconnect(); } catch (e) { /* already stopped */ } });
    };
  }

  function sinePartial(t, freq, peak, attack, release) {
    chain(osc("sine", freq, t, attack + release), [
      biquad("lowpass", 420, 0.707),
      env(t, peak * jitter(0.08), attack, release),
    ]);
  }

  function hourNote(t) {
    const fundamental = 73 * jitter(0.008);
    sinePartial(t, fundamental, 0.4, 0.008, 0.32);
    sinePartial(t, fundamental * 2, 0.22, 0.004, 0.16);
    sinePartial(t, fundamental * 1.5, 0.08, 0.004, 0.09);
    noiseTick(t, 2000, 0.09, 0.01);
  }

  function playPreview() {
    if (!ctx || Date.now() < suppressUntil) return;
    const t = ctx.currentTime + 0.05;
    minuteTick(t);
    hourNote(t + 0.78);
    suppressUntil = Date.now() + 1500;
    scheduledMark = null;
  }

  function fiveMinuteMark(now) {
    const date = new Date(now);
    const minutes = date.getMinutes();
    const into = date.getSeconds() * 1000 + date.getMilliseconds();
    const remainder = minutes % 5;
    const add = remainder === 0 && into <= 80 ? 0 : (5 - remainder) % 5 || 5;
    const mark = new Date(date.getTime());
    mark.setSeconds(0, 0);
    mark.setMinutes(minutes + add);
    return mark.getTime();
  }

  function scheduleAhead() {
    if (!ctx || ctx.state !== "running") return;

    const now = Date.now();
    if (now < suppressUntil) {
      scheduledMark = null;
      return;
    }

    const mark = fiveMinuteMark(now);
    if (scheduledMark === mark || mark - now > 200) return;

    const date = new Date(mark);
    const delay = Math.max(0.005, (mark - now) / 1000);
    const t = ctx.currentTime + delay;
    if (date.getMinutes() === 0) hourNote(t);
    else minuteTick(t);
    scheduledMark = mark;
  }

  function start() {
    if (timer != null || !armed) return;
    const loop = () => {
      timer = null;
      if (!armed || document.hidden) return;
      scheduleAhead();
      timer = setTimeout(loop, 40);
    };
    timer = setTimeout(loop, 40);
  }

  function stop() {
    if (timer != null) {
      clearTimeout(timer);
      timer = null;
    }
    scheduledMark = null;
  }

  function onPointerDown(event) {
    if (!ensure()) return;
    const target = event.target;
    const onFace = target instanceof Element && target.closest(".glass-clock-face");
    if (!armed) {
      armed = true;
      playPreview();
      start();
      return;
    }
    if (onFace) playPreview();
  }

  document.addEventListener("pointerdown", onPointerDown, true);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else if (armed) start();
  });

  window.DackdelSound = {
    setMode() {},
  };
})();
