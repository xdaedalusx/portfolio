(() => {
  const canvas = document.getElementById('fractalCanvas');
  const frame = document.getElementById('canvasFrame');
  const ctx = canvas.getContext('2d', { alpha: false });
  const paletteSelect = document.getElementById('paletteSelect');
  const iterationRange = document.getElementById('iterationRange');
  const iterationValue = document.getElementById('iterationValue');
  const coordinateReadout = document.getElementById('coordinateReadout');
  const zoomReadout = document.getElementById('zoomReadout');
  const renderStatus = document.getElementById('renderStatus');
  const selectionBox = document.getElementById('selectionBox');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const view = { cx: -0.5, cy: 0, scale: 3.5, maxIter: 180, palette: 'magma' };
  const palettes = {
    mono: [[0,0,0],[245,245,245]],
    magma: [[0,0,4],[28,16,68],[79,18,123],[156,23,108],[221,81,58],[252,165,10],[252,253,191]],
    ocean: [[1,5,20],[7,27,68],[8,72,112],[10,130,145],[99,201,177],[224,250,220]],
    electric: [[0,0,0],[34,10,82],[20,79,180],[0,220,255],[240,255,255],[255,38,190]],
    ember: [[0,0,0],[55,12,7],[137,27,8],[222,73,12],[255,174,43],[255,244,185]]
  };
  let renderToken = 0;
  let resizeTimer = null;
  let pointerStart = null;
  let dragging = false;
  let lastPointer = null;

  function mixColor(stops, t) {
    t = Math.max(0, Math.min(0.999999, t));
    const scaled = t * (stops.length - 1);
    const idx = Math.floor(scaled);
    const f = scaled - idx;
    const a = stops[idx], b = stops[Math.min(idx + 1, stops.length - 1)];
    return [0,1,2].map(k => Math.round(a[k] + (b[k] - a[k]) * f));
  }
  function colorFor(iter, maxIter, palette) {
    if (iter >= maxIter) return palette === 'mono' ? [0,0,0] : [5,5,8];
    if (palette === 'mono') {
      const shade = Math.max(16, 245 - Math.floor(iter / maxIter * 210));
      return [shade, shade, shade];
    }
    const smooth = Math.max(0, Math.min(0.999, iter / maxIter));
    return mixColor(palettes[palette] || palettes.magma, smooth);
  }
  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height, cssX: event.clientX - rect.left, cssY: event.clientY - rect.top, rect };
  }
  function complexAt(x, y) {
    const aspect = canvas.width / canvas.height;
    return { re: view.cx + (x / canvas.width - .5) * view.scale * aspect, im: view.cy + (y / canvas.height - .5) * view.scale };
  }
  function formatNum(n) { return (n < 0 ? '−' : '+') + Math.abs(n).toFixed(4); }
  function updateReadouts(x = canvas.width / 2, y = canvas.height / 2) {
    const c = complexAt(x, y);
    coordinateReadout.textContent = `c = ${c.re.toFixed(4)} ${formatNum(c.im)}i`;
    zoomReadout.textContent = `ZOOM ${(3.5 / view.scale).toLocaleString(undefined,{maximumFractionDigits:2})}×`;
  }
  function render() {
    const token = ++renderToken;
    const maxWidth = Math.min(1000, Math.max(320, Math.floor(frame.clientWidth * Math.min(window.devicePixelRatio || 1, 1.5))));
    const maxHeight = Math.min(760, Math.max(300, Math.floor(frame.clientHeight * Math.min(window.devicePixelRatio || 1, 1.5))));
    canvas.width = maxWidth; canvas.height = maxHeight;
    renderStatus.textContent = 'RENDERING…';
    const width = canvas.width, height = canvas.height;
    const image = ctx.createImageData(width, height);
    const data = image.data;
    const aspect = width / height;
    const xStep = view.scale * aspect / width;
    const yStep = view.scale / height;
    const maxIter = view.maxIter;
    let row = 0;
    function drawChunk() {
      if (token !== renderToken) return;
      const stopRow = Math.min(height, row + 10);
      for (; row < stopRow; row++) {
        const ci = view.cy + (row / height - .5) * view.scale;
        for (let x = 0; x < width; x++) {
          const cr = view.cx + (x / width - .5) * view.scale * aspect;
          // Main-cardioid and period-2 bulb checks avoid many iteration loops.
          const q = (cr - .25) * (cr - .25) + ci * ci;
          let iter = maxIter;
          if (!(q * (q + cr - .25) <= .25 * ci * ci || (cr + 1) * (cr + 1) + ci * ci <= .0625)) {
            let zr = 0, zi = 0, zr2 = 0, zi2 = 0, n = 0;
            while (zr2 + zi2 <= 4 && n < maxIter) {
              zi = 2 * zr * zi + ci;
              zr = zr2 - zi2 + cr;
              zr2 = zr * zr; zi2 = zi * zi; n++;
            }
            if (n < maxIter) {
              const mag = Math.sqrt(zr2 + zi2);
              const smooth = n + 1 - Math.log(Math.max(1e-12, Math.log(Math.max(mag, 1.000001)))) / Math.log(2);
              iter = Math.max(0, Math.min(maxIter - .001, smooth));
            }
          }
          const color = colorFor(iter, maxIter, view.palette);
          const idx = (row * width + x) * 4;
          data[idx] = color[0]; data[idx + 1] = color[1]; data[idx + 2] = color[2]; data[idx + 3] = 255;
        }
      }
      ctx.putImageData(image, 0, 0);
      if (row < height) {
        if ('requestIdleCallback' in window) requestIdleCallback(drawChunk, { timeout: 80 });
        else setTimeout(drawChunk, 0);
      } else {
        renderStatus.textContent = 'RENDER COMPLETE';
        updateReadouts();
      }
    }
    if (reducedMotion) drawChunk();
    else requestAnimationFrame(drawChunk);
  }
  function zoomAt(x, y, factor) {
    const before = complexAt(x, y);
    view.scale *= factor;
    const after = complexAt(x, y);
    view.cx += before.re - after.re;
    view.cy += before.im - after.im;
    render();
  }
  function reset() { view.cx = -.5; view.cy = 0; view.scale = 3.5; render(); }

  canvas.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    pointerStart = canvasPoint(event);
    lastPointer = pointerStart;
    dragging = false;
    canvas.setPointerCapture?.(event.pointerId);
  });
  canvas.addEventListener('pointermove', event => {
    const p = canvasPoint(event);
    updateReadouts(p.x, p.y);
    if (!pointerStart) return;
    const dx = p.cssX - pointerStart.cssX, dy = p.cssY - pointerStart.cssY;
    if (!dragging && Math.hypot(dx, dy) > 8) dragging = true;
    if (dragging) {
      const left = Math.min(pointerStart.cssX, p.cssX), top = Math.min(pointerStart.cssY, p.cssY);
      selectionBox.style.display = 'block'; selectionBox.style.left = `${left}px`; selectionBox.style.top = `${top}px`;
      selectionBox.style.width = `${Math.abs(dx)}px`; selectionBox.style.height = `${Math.abs(dy)}px`;
    }
    lastPointer = p;
  });
  canvas.addEventListener('pointerup', event => {
    if (!pointerStart) return;
    const p = canvasPoint(event); const start = pointerStart;
    if (dragging) {
      const x1 = Math.min(start.x, p.x), x2 = Math.max(start.x, p.x);
      const y1 = Math.min(start.y, p.y), y2 = Math.max(start.y, p.y);
      const regionWidth = x2 - x1, regionHeight = y2 - y1;
      if (regionWidth > 8 && regionHeight > 8) {
        const center = complexAt((x1 + x2) / 2, (y1 + y2) / 2);
        const scaleX = view.scale * (regionWidth / canvas.width);
        const scaleY = view.scale * (regionHeight / canvas.height);
        view.cx = center.re; view.cy = center.im; view.scale = Math.max(scaleX, scaleY); render();
      }
    } else {
      zoomAt(p.x, p.y, event.shiftKey ? 2 : .5);
    }
    pointerStart = null; dragging = false; selectionBox.style.display = 'none';
  });
  canvas.addEventListener('pointercancel', () => { pointerStart = null; dragging = false; selectionBox.style.display = 'none'; });
  canvas.addEventListener('contextmenu', event => {
    event.preventDefault(); const p = canvasPoint(event); zoomAt(p.x, p.y, 2);
  });
  canvas.addEventListener('wheel', event => {
    event.preventDefault(); const p = canvasPoint(event); zoomAt(p.x, p.y, event.deltaY < 0 ? .78 : 1.28);
  }, { passive: false });
  canvas.addEventListener('keydown', event => {
    const factor = event.shiftKey ? 1.8 : .55;
    if (event.key === '+' || event.key === '=') { event.preventDefault(); zoomAt(canvas.width / 2, canvas.height / 2, .5); }
    else if (event.key === '-' || event.key === '_') { event.preventDefault(); zoomAt(canvas.width / 2, canvas.height / 2, 2); }
    else if (event.key.toLowerCase() === 'r') { event.preventDefault(); reset(); }
    else if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) {
      event.preventDefault(); const amount = view.scale * .12;
      if (event.key === 'ArrowLeft') view.cx -= amount;
      if (event.key === 'ArrowRight') view.cx += amount;
      if (event.key === 'ArrowUp') view.cy -= amount;
      if (event.key === 'ArrowDown') view.cy += amount;
      render();
    }
  });
  paletteSelect.addEventListener('change', () => { view.palette = paletteSelect.value; render(); });
  iterationRange.addEventListener('input', () => { view.maxIter = Number(iterationRange.value); iterationValue.value = String(view.maxIter); render(); });
  document.getElementById('zoomIn').addEventListener('click', () => zoomAt(canvas.width / 2, canvas.height / 2, .5));
  document.getElementById('zoomOut').addEventListener('click', () => zoomAt(canvas.width / 2, canvas.height / 2, 2));
  document.getElementById('resetView').addEventListener('click', reset);
  document.getElementById('saveImage').addEventListener('click', () => {
    const link = document.createElement('a'); link.download = 'mandelbrot-explorer.png'; link.href = canvas.toDataURL('image/png'); link.click();
  });
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(render, 140); });
  render();
})();
