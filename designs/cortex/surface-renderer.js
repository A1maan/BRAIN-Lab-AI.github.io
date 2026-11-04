function createNeuralSurface() {
  function makeGrid(columns, rows) {
    const world = new Float32Array(columns * rows * 9);
    const screen = new Float32Array(columns * rows * 4);
    for (let row = 0; row < rows; row++) {
      const v = row / (rows - 1) * 3 - 1.45;
      for (let column = 0; column < columns; column++) {
        const u = column / (columns - 1) * 2.4 - 1.1;
        const fold = u + v * 0.43 - 0.12 * Math.sin(v * 2.1);
        const crest = Math.exp(-Math.pow((fold - 0.24) / 0.43, 2));
        const hollow = Math.exp(-Math.pow((fold + 0.56) / 0.39, 2));
        const slope = -2 * (fold - 0.24) / 0.1849 * crest * 0.96
          + 2 * (fold + 0.56) / 0.1521 * hollow * 0.23;
        const i = (row * columns + column) * 9;
        world[i] = u;
        world[i + 1] = v;
        world[i + 2] = crest * 0.96 - hollow * 0.23 + v * v * 0.035;
        world[i + 3] = slope;
        world[i + 4] = slope * (0.43 - 0.252 * Math.cos(v * 2.1)) + v * 0.07;
        world[i + 5] = Math.sin(u * 2 + v * 1.8);
        world[i + 6] = Math.cos(u * 2 + v * 1.8);
        world[i + 7] = Math.sin(u * 2.8 - v * 1.5);
        world[i + 8] = Math.cos(u * 2.8 - v * 1.5);
      }
    }
    return {columns, rows, world, screen};
  }

  const skin = makeGrid(112, 44);
  const texture = makeGrid(176, 72);
  const colors = new Array(96);
  let colorKey = '', threadColor;
  let materialLayer, materialContext;
  try {
    if (typeof OffscreenCanvas === 'function') {
      materialLayer = new OffscreenCanvas(1, 1);
      materialContext = materialLayer.getContext('2d');
    }
  } catch { /* Gradient patches remain available without an offscreen canvas. */ }

  function project(grid, width, height, sinA, cosA, sinB, cosB) {
    const world = grid.world, screen = grid.screen;
    for (let i = 0, j = 0; i < world.length; i += 9, j += 4) {
      const u = world[i], v = world[i + 1];
      const waveA = world[i + 5] * cosA - world[i + 6] * sinA;
      const waveB = world[i + 7] * cosB + world[i + 8] * sinB;
      const slopeA = world[i + 6] * cosA + world[i + 5] * sinA;
      const slopeB = world[i + 8] * cosB - world[i + 7] * sinB;
      const elevation = world[i + 2] + waveA * 0.055 + waveB * 0.035;
      const du = world[i + 3] + slopeA * 0.11 + slopeB * 0.098;
      const dv = world[i + 4] + slopeA * 0.099 - slopeB * 0.0525;
      const normal = Math.sqrt(du * du + dv * dv + 1);
      const diffuse = Math.max(0, (du * 0.52 + 0.78 + dv * 0.35) / normal);
      const specular = Math.pow(Math.max(0, (du * 0.34 + 0.93 - dv * 0.13) / normal), 24);
      const light = Math.min(1, 0.06 + diffuse * 0.38 + specular * 0.59);
      const perspective = 2.9 / (3.2 - v * 0.55);
      const x = 0.67 + (u * 0.59 + v * 0.075) * perspective;
      const y = 0.81 + (v * 0.44 - elevation * 0.55) * perspective;
      const clearCopy = Math.max(0, Math.min(1, (x - 0.4) / 0.24));
      const edge = Math.min(1, (v + 1.45) * 4, (1.3 - u) * 6);
      screen[j] = x * width;
      screen[j + 1] = y * height;
      screen[j + 2] = light;
      screen[j + 3] = clearCopy * clearCopy * (3 - 2 * clearCopy) * edge;
    }
  }

  return function draw(ctx, width, height, timeSeconds, palette) {
    if (!(width > 0 && height > 0) || !Number.isFinite(width + height)) return;
    const key = `${palette.dark}:${palette.ink}:${palette.accent}`;
    if (key !== colorKey) {
      for (let shade = 0; shade < colors.length; shade++) {
        const tone = shade / (colors.length - 1);
        const value = [];
        for (let channel = 0; channel < 3; channel++) {
          const shadow = palette.dark ? [7, 14, 26][channel] : palette.accent[channel] * 0.24;
          const middle = palette.accent[channel] * (palette.dark ? 0.48 : 0.75);
          const highlight = palette.dark ? palette.ink[channel] : [231, 238, 248][channel];
          value[channel] = Math.round(tone < 0.48
            ? shadow + (middle - shadow) * tone / 0.48
            : middle + (highlight - middle) * Math.pow((tone - 0.48) / 0.52, 0.8));
        }
        colors[shade] = `rgb(${value})`;
      }
      threadColor = `rgb(${palette.dark ? palette.ink : palette.accent})`;
      colorKey = key;
    }

    const time = Number.isFinite(timeSeconds) ? timeSeconds : 0;
    const sinA = Math.sin(time * 0.65), cosA = Math.cos(time * 0.65);
    const sinB = Math.sin(time * 0.47), cosB = Math.cos(time * 0.47);
    project(skin, width, height, sinA, cosA, sinB, cosB);
    project(texture, width, height, sinA, cosA, sinB, cosB);
    const s = skin.screen, stride = skin.columns * 4;
    ctx.save();
    const soften = materialContext && typeof ctx.drawImage === 'function' && 'filter' in ctx;
    const material = soften ? materialContext : ctx;
    if (soften) {
      const layerWidth = Math.ceil(width * 0.5), layerHeight = Math.ceil(height * 0.5);
      if (materialLayer.width !== layerWidth || materialLayer.height !== layerHeight) {
        materialLayer.width = layerWidth;
        materialLayer.height = layerHeight;
      }
      material.setTransform(layerWidth / width, 0, 0, layerHeight / height, 0, 0);
      material.clearRect(0, 0, width, height);
    }

    // Far-to-near opaque bands let the fold hide the material behind it.
    for (let row = 0; row < skin.rows - 1; row++) {
      for (let column = 0; column < skin.columns - 1; column++) {
        const a = row * stride + column * 4, b = a + 4;
        const c = b + stride, d = a + stride;
        const alpha = (s[a + 3] + s[b + 3] + s[c + 3] + s[d + 3]) * 0.25;
        if (alpha < 0.01 || Math.min(s[a], s[b], s[c], s[d]) > width
          || Math.max(s[a + 1], s[b + 1], s[c + 1], s[d + 1]) < 0
          || Math.min(s[a + 1], s[b + 1], s[c + 1], s[d + 1]) > height) continue;
        const light = (s[a + 2] + s[b + 2] + s[c + 2] + s[d + 2]) * 0.25;
        const cx = (s[a] + s[b] + s[c] + s[d]) * 0.25;
        const cy = (s[a + 1] + s[b + 1] + s[c + 1] + s[d + 1]) * 0.25;
        material.fillStyle = colors[Math.min(95, Math.floor(light * 95))];
        if (!soften && typeof material.createLinearGradient === 'function') {
          const gradient = material.createLinearGradient((s[a] + s[d]) * 0.5, (s[a + 1] + s[d + 1]) * 0.5,
            (s[b] + s[c]) * 0.5, (s[b + 1] + s[c + 1]) * 0.5);
          gradient.addColorStop(0, colors[Math.min(95, Math.floor((s[a + 2] + s[d + 2]) * 47.5))]);
          gradient.addColorStop(1, colors[Math.min(95, Math.floor((s[b + 2] + s[c + 2]) * 47.5))]);
          material.fillStyle = gradient;
        }
        material.globalAlpha = alpha;
        material.beginPath();
        // Half-pixel overlap closes antialias seams between adjacent patches.
        material.moveTo(s[a] + (s[a] < cx ? -0.5 : 0.5), s[a + 1] + (s[a + 1] < cy ? -0.5 : 0.5));
        material.lineTo(s[b] + (s[b] < cx ? -0.5 : 0.5), s[b + 1] + (s[b + 1] < cy ? -0.5 : 0.5));
        material.lineTo(s[c] + (s[c] < cx ? -0.5 : 0.5), s[c + 1] + (s[c + 1] < cy ? -0.5 : 0.5));
        material.lineTo(s[d] + (s[d] < cx ? -0.5 : 0.5), s[d + 1] + (s[d + 1] < cy ? -0.5 : 0.5));
        material.closePath();
        material.fill();
      }
    }
    if (soften) {
      // Soften lighting once, then keep the fine surface texture in focus.
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.filter = `blur(${Math.max(3, width / 230)}px)`;
      ctx.drawImage(materialLayer, 0, 0, width, height);
      ctx.restore();
    }

    const t = texture.screen;
    const scale = Math.max(0.55, Math.min(1.15, width / 1400));
    ctx.fillStyle = threadColor;
    for (let i = 0; i < t.length; i += 4) {
      if (t[i + 3] < 0.02 || t[i] < 0 || t[i] > width || t[i + 1] < 0 || t[i + 1] > height) continue;
      const light = t[i + 2];
      const radius = (0.48 + light * 0.25) * scale;
      ctx.globalAlpha = t[i + 3] * (0.1 + light * 0.34);
      ctx.beginPath();
      ctx.ellipse(t[i], t[i + 1], radius * 1.2, radius, -0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };
}
