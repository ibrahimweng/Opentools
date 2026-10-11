/*
 * The OpenTools wordmark, written in glitter.
 *
 * The word is the empty space, like glitter sprinkled over a stencil: flakes
 * lie thickest against the letters and thin out with distance, so the black
 * page shows around the band. Grab the word and drag it, and its edges plough
 * the flakes aside; let go and it glides back while they settle. A pointer
 * passing over the flakes brushes them away, and they drift back.
 */
(function () {
  'use strict';

  var WEIGHT = 800;
  var FAMILY = '"Inter", "Helvetica Neue", Arial, sans-serif';
  var PAD = 24; // margin around the letters in the word's own mask, in px
  var CELL = 2; // the push field is sampled every 2 px
  var GRID = 4; // the density map is sampled every 4 px
  var LEVELS = 6; // shades of silver, darkest first

  /* Helpers ---------------------------------------------------------------- */

  function boxBlur(src, w, h, r) {
    var tmp = new Float32Array(w * h);
    var out = new Float32Array(w * h);
    var x, y, acc, n = 2 * r + 1;
    for (y = 0; y < h; y++) {
      acc = 0;
      for (x = -r; x <= r; x++) acc += src[y * w + Math.min(w - 1, Math.max(0, x))];
      for (x = 0; x < w; x++) {
        tmp[y * w + x] = acc / n;
        acc += src[y * w + Math.min(w - 1, x + r + 1)] - src[y * w + Math.max(0, x - r)];
      }
    }
    for (x = 0; x < w; x++) {
      acc = 0;
      for (y = -r; y <= r; y++) acc += tmp[Math.min(h - 1, Math.max(0, y)) * w + x];
      for (y = 0; y < h; y++) {
        out[y * w + x] = acc / n;
        acc += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x];
      }
    }
    return out;
  }

  // Smooth value noise, so the edge of the glitter is ragged rather than a
  // clean blur.
  function noise(seed) {
    function hash(x, y) {
      var h = (x * 374761393 + y * 668265263 + seed * 2246822519) | 0;
      h = Math.imul(h ^ (h >>> 13), 1274126177);
      return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    }
    return function (x, y) {
      var xi = Math.floor(x);
      var yi = Math.floor(y);
      var xf = x - xi;
      var yf = y - yi;
      var u = xf * xf * (3 - 2 * xf);
      var v = yf * yf * (3 - 2 * yf);
      var a = hash(xi, yi);
      var b = hash(xi + 1, yi);
      var c = hash(xi, yi + 1);
      var d = hash(xi + 1, yi + 1);
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    };
  }

  /* The field --------------------------------------------------------------- */

  function Glitter(canvas, opts) {
    opts = opts || {};
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.text = opts.text || 'OpenTools';
    this.reducedQuery = opts.reduced || null;
    this.paused = false;
    this.visible = true;
    this.raf = 0;
    this.last = 0;
    this.t = 0;
    this.frame = 0;
    this.ready = false;
    this.fontReady = false;
    this.builtW = 0;
    this.ptr = { x: 0, y: 0, vx: 0, vy: 0, on: false, at: 0 };
    this.drag = null;
    this.loop = this.loop.bind(this);
    this.bind();

    var self = this;
    var go = function () {
      if (self.fontReady) return;
      self.fontReady = true;
      self.build(true);
    };
    // The letters are cut from the real typeface, so wait briefly for it,
    // and go ahead with the fallback face if it is slow.
    if (document.fonts && document.fonts.load) {
      document.fonts.load(WEIGHT + ' 100px Inter').then(go, go);
      setTimeout(go, 1200);
    } else {
      go();
    }
  }

  Glitter.prototype.reduced = function () {
    return !!(this.reducedQuery && this.reducedQuery.matches);
  };

  // Cut the word and lay the flakes around it. Runs again when the width
  // changes, and waits quietly if the canvas has no size yet.
  Glitter.prototype.build = function (intro) {
    if (!this.fontReady) return;
    var c = this.canvas;
    var W = c.clientWidth;
    var H = c.clientHeight;
    if (!W || !H) return;
    try {
      this.layout(W, H);
      this.seed(intro && !this.reduced());
      this.hideUnderWord();
      this.builtW = W;
      this.ready = true;
      this.draw();
      this.schedule();
    } catch (e) {
      if (window.console) console.error('OpenTools glitter:', e);
    }
  };

  Glitter.prototype.layout = function (W, H) {
    var c = this.canvas;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    this.W = W;
    this.H = H;
    this.dpr = dpr;
    c.width = Math.round(W * dpr);
    c.height = Math.round(H * dpr);

    // On a narrow screen the word stacks, at its first space or else where a
    // capital starts a new word, so the letters stay big enough to read as
    // gaps.
    var narrow = W < 640;
    var lines = narrow
      ? (/\s/.test(this.text) ? this.text.replace(/\s+/, '\n') : this.text.replace(/([a-z])([A-Z])/, '$1\n$2')).split('\n')
      : [this.text];

    var setFont = function (ctx, size) {
      ctx.font = WEIGHT + ' ' + size + 'px ' + FAMILY;
      if ('letterSpacing' in ctx) ctx.letterSpacing = (-0.025 * size).toFixed(2) + 'px';
    };
    var probe = document.createElement('canvas').getContext('2d');
    setFont(probe, 100);
    var widest = 0;
    lines.forEach(function (l) {
      var m = probe.measureText(l);
      widest = Math.max(widest, m.actualBoundingBoxLeft + m.actualBoundingBoxRight);
    });
    var size = Math.min(
      ((narrow ? W * 0.74 : Math.min(W * 0.78, 1500)) * 100) / widest,
      H * (narrow ? 0.26 : 0.3)
    );

    var mc = document.createElement('canvas');
    var mx = mc.getContext('2d');
    setFont(mx, size);
    var metrics = lines.map(function (l) {
      return mx.measureText(l);
    });
    var asc = 0;
    var desc = 0;
    var inkW = 0;
    metrics.forEach(function (m) {
      asc = Math.max(asc, m.actualBoundingBoxAscent);
      desc = Math.max(desc, m.actualBoundingBoxDescent);
      inkW = Math.max(inkW, m.actualBoundingBoxLeft + m.actualBoundingBoxRight);
    });
    var advance = asc + desc + size * 0.08;
    var mw = Math.ceil(inkW + PAD * 2);
    var mh = Math.ceil(asc + (lines.length - 1) * advance + desc + PAD * 2);
    mc.width = mw;
    mc.height = mh;
    setFont(mx, size);
    mx.fillStyle = '#fff';
    metrics.forEach(function (m, i) {
      var lineW = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
      mx.fillText(lines[i], (mw - lineW) / 2 + m.actualBoundingBoxLeft, PAD + asc + i * advance);
    });

    // The mask says which flakes the letters hide; the push field around it
    // says which way a moving edge shoves them.
    var px = mx.getImageData(0, 0, mw, mh).data;
    var mask = new Uint8Array(mw * mh);
    for (var i = 0; i < mw * mh; i++) mask[i] = px[i * 4 + 3] > 110 ? 1 : 0;
    var fw = Math.ceil(mw / CELL);
    var fh = Math.ceil(mh / CELL);
    var coarse = new Float32Array(fw * fh);
    for (var y = 0; y < mh; y++) {
      for (var x = 0; x < mw; x++) {
        if (mask[y * mw + x]) coarse[((y / CELL) | 0) * fw + ((x / CELL) | 0)] += 1 / (CELL * CELL);
      }
    }
    this.field = boxBlur(boxBlur(coarse, fw, fh, 3), fw, fh, 3);
    this.mask = mask;
    this.mw = mw;
    this.mh = mh;
    this.fw = fw;
    this.fh = fh;
    this.size = size;
    this.capH = asc;
    this.rx = Math.round((W - mw) / 2);
    this.ry = Math.round((H - mh) / 2);
    this.wx = this.rx;
    this.wy = this.ry;
    this.wvx = 0;
    this.wvy = 0;
    this.drag = null;
  };

  // Flakes gather against the letters, inside their counters and between
  // them, and thin out with distance into the black. Some lie under the
  // letters too, hidden as glitter under a stencil is, so moving the word
  // uncovers glitter rather than a hole.
  Glitter.prototype.seed = function (sprinkle) {
    var W = this.W;
    var H = this.H;
    var narrow = W < 640;
    var reach = this.capH * (narrow ? 0.62 : 0.55); // how far the band spreads past the letters
    var ox = this.rx - reach; // the density map's origin on the canvas
    var oy = this.ry - reach;
    var gw = Math.ceil((this.mw + reach * 2) / GRID);
    var gh = Math.ceil((this.mh + reach * 2) / GRID);
    var grid = new Float32Array(gw * gh);
    var x, y, i;
    for (y = 0; y < this.mh; y += 2) {
      for (x = 0; x < this.mw; x += 2) {
        if (this.mask[y * this.mw + x]) {
          var gx = ((x + reach) / GRID) | 0;
          var gy = ((y + reach) / GRID) | 0;
          grid[gy * gw + gx] += 1;
        }
      }
    }
    var r = Math.max(2, Math.round(reach / GRID / 2.2));
    var near = boxBlur(boxBlur(boxBlur(grid, gw, gh, r), gw, gh, r), gw, gh, r);
    var peak = 0;
    for (i = 0; i < near.length; i++) peak = Math.max(peak, near[i]);

    var n = narrow ? Math.round(Math.min(6400, Math.max(3000, W * 15))) : Math.round(Math.min(13500, Math.max(4200, this.mw * 8.8)));
    var noise1 = noise(7);
    var scale = 1 / (this.capH * 0.32);
    this.n = n;
    this.hx = new Float32Array(n);
    this.hy = new Float32Array(n);
    this.x = new Float32Array(n);
    this.y = new Float32Array(n);
    this.vx = new Float32Array(n);
    this.vy = new Float32Array(n);
    this.sz = new Float32Array(n);
    this.tone = new Uint8Array(n);
    this.phase = new Float32Array(n);
    this.rate = new Float32Array(n);
    this.hidden = new Uint8Array(n);
    var rnd = Math.random;
    var tries = 0;
    var k = 0;
    var limit = n * 60;
    while (k < n && tries < limit) {
      tries++;
      var gxr = rnd() * gw;
      var gyr = rnd() * gh;
      var d = near[(gyr | 0) * gw + (gxr | 0)] / peak;
      if (d < 0.02) continue;
      var p = Math.pow(d, 0.65) * (0.45 + 0.75 * noise1(gxr * GRID * scale, gyr * GRID * scale));
      if (rnd() > p) continue;
      x = ox + gxr * GRID;
      y = oy + gyr * GRID;
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      this.hx[k] = x;
      this.hy[k] = y;
      this.x[k] = sprinkle ? x + (rnd() - 0.5) * 30 : x;
      this.y[k] = sprinkle ? y - 20 - rnd() * 90 : y;
      this.sz[k] = 0.9 + Math.pow(rnd(), 2) * (narrow ? 1.4 : 1.7);
      var t = rnd();
      this.tone[k] = t < 0.18 ? 0 : t < 0.38 ? 1 : t < 0.6 ? 2 : t < 0.8 ? 3 : t < 0.94 ? 4 : 5;
      this.phase[k] = rnd() * Math.PI * 2;
      this.rate[k] = 0.4 + rnd() * 2;
      k++;
    }
    this.n = k;
    var glints = [];
    for (i = 0; i < k; i++) if (rnd() < 0.005) glints.push(i);
    this.glints = glints;
    this.buckets = [];
    for (i = 0; i < LEVELS; i++) this.buckets.push(new Int32Array(k));
    this.counts = new Int32Array(LEVELS);
    this.colors = [];
    for (i = 0; i < LEVELS; i++) {
      var g = Math.round(70 + (i / (LEVELS - 1)) * 175);
      this.colors.push('rgb(' + g + ',' + g + ',' + g + ')');
    }
  };

  /* Motion ----------------------------------------------------------------- */

  Glitter.prototype.hideUnderWord = function () {
    for (var i = 0; i < this.n; i++) {
      var cx = (this.x[i] + this.sz[i] * 0.5 - this.wx) | 0;
      var cy = (this.y[i] + this.sz[i] * 0.5 - this.wy) | 0;
      this.hidden[i] = cx >= 0 && cy >= 0 && cx < this.mw && cy < this.mh ? this.mask[cy * this.mw + cx] : 0;
    }
  };

  Glitter.prototype.overWord = function (p) {
    return (
      this.ready &&
      p.x > this.wx + PAD - 16 &&
      p.x < this.wx + this.mw - PAD + 16 &&
      p.y > this.wy + PAD - 16 &&
      p.y < this.wy + this.mh - PAD + 16
    );
  };

  Glitter.prototype.step = function (dt, now) {
    var f = dt * 60;

    // The word follows a held pointer with a little weight, and springs back
    // to the middle when let go.
    var ox = this.wx;
    var oy = this.wy;
    if (this.drag) {
      var tx = Math.max(-this.mw / 2, Math.min(this.W - this.mw / 2, this.ptr.x - this.drag.ox));
      var ty = Math.max(-this.mh / 2, Math.min(this.H - this.mh / 2, this.ptr.y - this.drag.oy));
      var follow = Math.min(1, 0.3 * f);
      this.wx += (tx - this.wx) * follow;
      this.wy += (ty - this.wy) * follow;
      this.wvx = (this.wx - ox) / Math.max(0.001, f);
      this.wvy = (this.wy - oy) / Math.max(0.001, f);
    } else {
      this.wvx += (this.rx - this.wx) * 0.045 * f;
      this.wvy += (this.ry - this.wy) * 0.045 * f;
      var keep = Math.pow(0.8, f);
      this.wvx *= keep;
      this.wvy *= keep;
      this.wx += this.wvx * f;
      this.wy += this.wvy * f;
      if (Math.abs(this.rx - this.wx) < 0.05 && Math.abs(this.ry - this.wy) < 0.05 && Math.abs(this.wvx) + Math.abs(this.wvy) < 0.02) {
        this.wx = this.rx;
        this.wy = this.ry;
        this.wvx = this.wvy = 0;
      }
    }
    var wspeed = Math.sqrt(this.wvx * this.wvx + this.wvy * this.wvy) * 60; // px a second
    var wordMoving = !!this.drag || wspeed > 4;
    var push = 0.45 + Math.min(1.4, wspeed / 500);

    // The pointer brushes flakes only while it is moving.
    var ptr = this.ptr;
    var brushing = ptr.on && !this.drag && now - ptr.at < 120;
    var R = this.W < 640 ? 56 : 80;
    var R2 = R * R;
    var pspeed = Math.sqrt(ptr.vx * ptr.vx + ptr.vy * ptr.vy);
    var pforce = 0.3 + Math.min(2, pspeed / 450);
    var pvx = (ptr.vx / 60) * 0.06;
    var pvy = (ptr.vy / 60) * 0.06;

    var spring = 0.022 * f;
    var damp = Math.pow(0.82, f);
    var mask = this.mask;
    var field = this.field;
    var mw = this.mw;
    var mh = this.mh;
    var fw = this.fw;
    var fh = this.fh;
    var wx = this.wx;
    var wy = this.wy;
    var X = this.x;
    var Y = this.y;
    var VX = this.vx;
    var VY = this.vy;
    var HX = this.hx;
    var HY = this.hy;
    var S = this.sz;
    var hidden = this.hidden;
    var moving = 0;

    for (var i = 0, n = this.n; i < n; i++) {
      var x = X[i];
      var y = Y[i];
      var vx = VX[i];
      var vy = VY[i];

      // A flake under a letter stays put, unseen, until the word moves off
      // it. Only flakes in the open are pushed.
      if (!hidden[i]) {
        if (wordMoving) {
          var gx = ((x - wx) / CELL) | 0;
          var gy = ((y - wy) / CELL) | 0;
          if (gx > 0 && gy > 0 && gx < fw - 1 && gy < fh - 1) {
            var k = gy * fw + gx;
            var fv = field[k];
            if (fv > 0.02) {
              var dxf = field[k + 1] - field[k - 1];
              var dyf = field[k + fw] - field[k - fw];
              var len = Math.sqrt(dxf * dxf + dyf * dyf) + 1e-6;
              var amt = push * fv * f;
              vx -= (dxf / len) * amt;
              vy -= (dyf / len) * amt;
            }
          }
        }
        if (brushing) {
          var bx = x - ptr.x;
          var by = y - ptr.y;
          var d2 = bx * bx + by * by;
          if (d2 < R2 && d2 > 0.01) {
            var d = Math.sqrt(d2);
            var s = (1 - d / R) * f;
            vx += (bx / d) * s * pforce + pvx * s;
            vy += (by / d) * s * pforce + pvy * s;
          }
        }
      }

      vx += (HX[i] - x) * spring;
      vy += (HY[i] - y) * spring;
      vx *= damp;
      vy *= damp;
      x += vx * f;
      y += vy * f;
      X[i] = x;
      Y[i] = y;
      VX[i] = vx;
      VY[i] = vy;
      if (vx > 0.02 || vx < -0.02 || vy > 0.02 || vy < -0.02) moving++;

      var cx = (x + S[i] * 0.5 - wx) | 0;
      var cy = (y + S[i] * 0.5 - wy) | 0;
      hidden[i] = cx >= 0 && cy >= 0 && cx < mw && cy < mh ? mask[cy * mw + cx] : 0;
    }

    ptr.vx *= Math.pow(0.8, f);
    ptr.vy *= Math.pow(0.8, f);
    return !!this.drag || wspeed > 0.5 || moving > 0 || brushing;
  };

  /* Drawing ---------------------------------------------------------------- */

  // Flakes are grouped into a few shades of silver, so each shade is one
  // fill. Now and then a flake catches the light and brightens.
  Glitter.prototype.draw = function () {
    var ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.W, this.H);
    var still = this.reduced();
    var t = this.t;
    var X = this.x;
    var Y = this.y;
    var S = this.sz;
    var buckets = this.buckets;
    var counts = this.counts;
    var i, j, b;
    for (b = 0; b < LEVELS; b++) counts[b] = 0;
    for (i = 0; i < this.n; i++) {
      if (this.hidden[i]) continue;
      b = this.tone[i];
      if (!still) {
        var s = Math.sin(t * this.rate[i] + this.phase[i]);
        if (s > 0.97) b = LEVELS - 1;
        else if (s > 0.9 && b < LEVELS - 2) b += 1;
      }
      buckets[b][counts[b]++] = i;
    }
    for (b = 0; b < LEVELS; b++) {
      if (!counts[b]) continue;
      ctx.fillStyle = this.colors[b];
      ctx.beginPath();
      var list = buckets[b];
      for (j = 0; j < counts[b]; j++) {
        i = list[j];
        ctx.rect(X[i], Y[i], S[i], S[i]);
      }
      ctx.fill();
    }

    // A few flakes flash as small four-pointed stars.
    if (still) return;
    for (j = 0; j < this.glints.length; j++) {
      i = this.glints[j];
      if (this.hidden[i]) continue;
      var a = Math.sin(t * this.rate[i] * 0.7 + this.phase[i]);
      if (a < 0.6) continue;
      a = Math.pow((a - 0.6) / 0.4, 2);
      var len = 3 + 4 * a;
      var gx = X[i] + S[i] / 2;
      var gy = Y[i] + S[i] / 2;
      ctx.fillStyle = 'rgba(255,255,255,' + a.toFixed(3) + ')';
      ctx.fillRect(gx - len, gy - 0.4, len * 2, 0.8);
      ctx.fillRect(gx - 0.4, gy - len, 0.8, len * 2);
      ctx.fillRect(gx - 1, gy - 1, 2, 2);
    }
  };

  Glitter.prototype.loop = function (now) {
    this.raf = 0;
    if (!this.ready) return;
    var dt = this.last ? Math.min(0.05, (now - this.last) / 1000) : 1 / 60;
    this.last = now;
    this.t += dt;
    this.frame++;
    var active = this.step(dt, now);
    // At rest the only change is the shimmer, which reads fine at 20 frames
    // a second.
    if (active || this.frame % 3 === 0) this.draw();
    if (this.reduced() && !active) {
      this.last = 0;
      return;
    }
    this.schedule();
  };

  Glitter.prototype.schedule = function () {
    if (this.raf || this.paused || !this.visible || document.hidden || !this.ready) {
      if (!this.raf) this.last = 0;
      return;
    }
    this.raf = requestAnimationFrame(this.loop);
  };

  // Write a different word, as when the studio renames the site.
  Glitter.prototype.setText = function (text) {
    text = String(text || '').trim();
    if (!text || text === this.text) return;
    this.text = text;
    this.build(true);
  };

  Glitter.prototype.pause = function () {
    this.paused = true;
  };

  Glitter.prototype.resume = function () {
    this.paused = false;
    this.schedule();
  };

  /* Input ------------------------------------------------------------------ */

  Glitter.prototype.bind = function () {
    var self = this;
    var c = this.canvas;

    function local(e) {
      var r = c.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    c.addEventListener('pointermove', function (e) {
      var p = local(e);
      var now = performance.now();
      var ptr = self.ptr;
      if (ptr.on) {
        var ms = Math.max(8, now - ptr.at);
        ptr.vx = ((p.x - ptr.x) / ms) * 1000;
        ptr.vy = ((p.y - ptr.y) / ms) * 1000;
      }
      ptr.x = p.x;
      ptr.y = p.y;
      ptr.on = true;
      ptr.at = now;
      if (!self.drag) c.style.cursor = self.overWord(p) ? 'grab' : '';
      self.schedule();
    });

    c.addEventListener('pointerleave', function () {
      if (!self.drag) self.ptr.on = false;
    });

    c.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      var p = local(e);
      if (!self.overWord(p)) return;
      self.ptr.x = p.x;
      self.ptr.y = p.y;
      self.ptr.on = true;
      self.drag = { ox: p.x - self.wx, oy: p.y - self.wy, id: e.pointerId };
      try {
        c.setPointerCapture(e.pointerId);
      } catch (err) {}
      c.style.cursor = 'grabbing';
      e.preventDefault();
      self.schedule();
    });

    function release(e) {
      if (!self.drag || e.pointerId !== self.drag.id) return;
      self.drag = null;
      c.style.cursor = self.overWord(local(e)) ? 'grab' : '';
      if (e.pointerType === 'touch') self.ptr.on = false;
      self.schedule();
    }
    c.addEventListener('pointerup', release);
    c.addEventListener('pointercancel', release);

    // A touch that lands on the word drags it; anywhere else it scrolls.
    c.addEventListener(
      'touchstart',
      function (e) {
        if (e.touches.length !== 1) return;
        if (self.overWord(local(e.touches[0]))) e.preventDefault();
      },
      { passive: false }
    );

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        self.visible = entries[0].isIntersecting;
        self.schedule();
      }).observe(c);
    }
    document.addEventListener('visibilitychange', function () {
      self.schedule();
    });

    // Build once the canvas has a size, and again when its width changes. A
    // phone's address bar changes only the height, which needs nothing.
    var timer = 0;
    var check = function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        if (c.clientWidth && c.clientWidth !== self.builtW) self.build(!self.ready);
      }, self.ready ? 150 : 0);
    };
    if ('ResizeObserver' in window) new ResizeObserver(check).observe(c);
    window.addEventListener('resize', check);
  };

  window.OpenToolsGlitter = Glitter;
})();
