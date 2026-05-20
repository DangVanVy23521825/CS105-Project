const MAX_SAMPLES = 120;

export function createVelocityGraph(canvas) {
  const ctx = canvas.getContext("2d");
  const samples = [];

  function push(time, velocity) {
    samples.push({ t: time, v: velocity });
    if (samples.length > MAX_SAMPLES) samples.shift();
  }

  function clear() {
    samples.length = 0;
  }

  function draw() {
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(12,18,32,0.95)";
    ctx.fillRect(0, 0, w, h);

    if (samples.length < 2) {
      ctx.fillStyle = "#64748b";
      ctx.font = "11px monospace";
      ctx.fillText("v-t (chon vat dong)", 8, h / 2);
      return;
    }

    const t0 = samples[0].t;
    const t1 = samples[samples.length - 1].t;
    const dt = Math.max(t1 - t0, 0.001);
    let vmax = 0.1;
    for (const s of samples) vmax = Math.max(vmax, Math.abs(s.v));

    ctx.strokeStyle = "rgba(56,189,248,0.25)";
    ctx.beginPath();
    ctx.moveTo(0, h - 4);
    ctx.lineTo(w, h - 4);
    ctx.stroke();

    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < samples.length; i++) {
      const x = ((samples[i].t - t0) / dt) * (w - 8) + 4;
      const y = h - 4 - (Math.abs(samples[i].v) / vmax) * (h - 12);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.fillStyle = "#94a3b8";
    ctx.font = "10px monospace";
    ctx.fillText("v (m/s)", 4, 10);
  }

  return { push, clear, draw };
}
