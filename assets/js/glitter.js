/*
 * The OpenTools wordmark, written in glitter.
 *
 * The word is the empty space: a field of silver flakes with the letters kept
 * clear, like glitter sprinkled over a stencil. Grab the word and drag it, and
 * its edges plough the flakes aside; let go and it glides back to the middle
 * while they settle. A pointer passing over the field brushes flakes away, and
 * they drift back to where they lay.
 *
 * The flakes are drawn with WebGL, which keeps tens of thousands of them
 * smooth. Where WebGL is missing, a canvas fallback draws fewer.
 */
(function () {
  'use strict';

  var WEIGHT = 800;
  var FAMILY = '"Inter", "Helvetica Neue", Arial, sans-serif';
  var PAD = 28; // clear space kept around the letters in the mask, in px
  var CELL = 2; // the push field is sampled every 2 px

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

  function shader(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }

  function program(gl, vs, fs) {
    var p = gl.createProgram();
    gl.attachShader(p, shader(gl, gl.VERTEX_SHADER, vs));
    gl.attachShader(p, shader(gl, gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return p;
  }

  // Flakes are small squares.
  var FLAKE_VS =
    'attribute vec3 a_pos; attribute float a_shade;' +
    'uniform vec2 u_res; uniform float u_dpr; varying float v_shade;' +
    'void main(){' +
    ' vec2 c = a_pos.xy / u_res * 2.0 - 1.0;' +
    ' gl_Position = vec4(c.x, -c.y, 0.0, 1.0);' +
    ' gl_PointSize = a_pos.z * u_dpr;' +
    ' v_shade = a_shade;' +
    '}';
  var FLAKE_FS =
    'precision mediump float; varying float v_shade;' +
    'void main(){ gl_FragColor = vec4(vec3(v_shade), 1.0); }';

  // A glint is a four-pointed star, added on top of the flakes.
  var GLINT_VS =
    'attribute vec3 a_glint;' +
    'uniform vec2 u_res; uniform float u_dpr; varying float v_a;' +
    'void main(){' +
    ' vec2 c = a_glint.xy / u_res * 2.0 - 1.0;' +
    ' gl_Position = vec4(c.x, -c.y, 0.0, 1.0);' +
    ' gl_PointSize = 18.0 * u_dpr;' +
    ' v_a = a_glint.z;' +
    '}';
  var GLINT_FS =
    'precision mediump float; varying float v_a;' +
    'void main(){' +
    ' vec2 p = abs(gl_PointCoord - 0.5) * 2.0;' +
    ' float arms = max(exp(-p.y * 26.0) * (1.0 - p.x), exp(-p.x * 26.0) * (1.0 - p.y));' +
    ' float core = exp(-dot(p, p) * 30.0);' +
    ' float a = clamp(arms + core, 0.0, 1.0) * v_a;' +
    ' gl_FragColor = vec4(vec3(a), a);' +
    '}';

  /* The field --------------------------------------------------------------- */

  function Glitter(canvas, opts) {
    opts = opts || {};
    this.canvas = canvas;
    this.text = opts.text || 'OpenTools';
    this.reducedQuery = opts.reduced || null;
    this.paused = false;
    this.visible = true;
    this.raf = 0;
    this.last = 0;
    this.t = 0;
    this.odd = false;
    this.ready = false;
    this.ptr = { x: 0, y: 0, vx: 0, vy: 0, on: false, at: 0 };
    this.drag = null;
    this.loop = this.loop.bind(this);
    this.initRenderer();
    this.bind();

    var self = this;
    var started = false;
    var go = function () {
      if (started) return;
      started = true;
      self.build(true);
      self.schedule();
    };
    // The mask is cut from the real typeface, so wait briefly for it.
    if (document.fonts && document.fonts.load) {
      document.fonts.load(WEIGHT + ' 100px Inter').then(go, go);
      setTimeout(go, 1500);
    } else {
      go();
    }
  }

  Glitter.prototype.reduced = function () {
    return !!(this.reducedQuery && this.reducedQuery.matches);
  };

  Glitter.prototype.initRenderer = function () {
    var gl = null;
    try {
      gl = this.canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: true });
    } catch (e) {}
    if (gl) {
      try {
        this.gl = gl;
        this.flakeProg = program(gl, FLAKE_VS, FLAKE_FS);
        this.glintProg = program(gl, GLINT_VS, GLINT_FS);
        this.posBuf = gl.createBuffer();
        this.shadeBuf = gl.createBuffer();
        this.glintBuf = gl.createBuffer();
        gl.disable(gl.DEPTH_TEST);
        gl.clearColor(0, 0, 0, 0);
        return;
      } catch (e) {
        this.gl = null;
      }
    }
    this.ctx = this.canvas.getContext('2d');
  };

  Glitter.prototype.build = function (intro) {
    var c = this.canvas;
    var W = c.clientWidth;
    var H = c.clientHeight;
    if (!W || !H) return;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    this.W = W;
    this.H = H;
    this.dpr = dpr;
    c.width = Math.round(W * dpr);
    c.height = Math.round(H * dpr);

    // On a narrow screen the word stacks, so the letters stay big enough to
    // read as gaps in the glitter.
    var lines = W < 640 ? this.text.replace(/([a-z])([A-Z])/, '$1\n$2').split('\n') : [this.text];

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
    var size = Math.min((W * (lines.length > 1 ? 0.8 : 0.84) * 100) / widest, H * (lines.length > 1 ? 0.3 : 0.38));

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
    var advance = asc + desc + size * 0.06;
    var mw = Math.ceil(inkW + PAD * 2);
    var mh = Math.ceil(asc + (lines.length - 1) * advance + desc + PAD * 2);
    mc.width = mw;
    mc.height = mh;
    setFont(mx, size);
    mx.fillStyle = '#fff';
    mx.textBaseline = 'alphabetic';
    metrics.forEach(function (m, i) {
      var lineW = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
      mx.fillText(lines[i], (mw - lineW) / 2 + m.actualBoundingBoxLeft, PAD + asc + i * advance);
    });

    // A hard mask decides which flakes are hidden under the letters; a soft
    // field around it decides which way a moving edge pushes them.
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
    this.rx = (W - mw) / 2;
    this.ry = (H - mh) / 2;
    this.wx = this.rx;
    this.wy = this.ry;
    this.wvx = 0;
    this.wvy = 0;
    this.drag = null;

    this.seed(intro && !this.reduced());
    this.ready = true;
    this.hideUnderWord();
    this.draw(true);
  };

  // Flakes lie thickest through the middle of the band, thinning towards its
  // top and bottom and into the corners.
  Glitter.prototype.seed = function (sprinkle) {
    var W = this.W;
    var H = this.H;
    var narrow = W < 640;
    var density = this.gl ? (narrow ? 0.07 : 0.046) : narrow ? 0.04 : 0.016;
    var cap = this.gl ? 48000 : 14000;
    var n = Math.round(Math.max(3000, Math.min(cap, W * H * density)));
    this.n = n;
    this.hx = new Float32Array(n);
    this.hy = new Float32Array(n);
    this.x = new Float32Array(n);
    this.y = new Float32Array(n);
    this.vx = new Float32Array(n);
    this.vy = new Float32Array(n);
    this.size = new Float32Array(n);
    this.tone = new Float32Array(n);
    this.phase = new Float32Array(n);
    this.rate = new Float32Array(n);
    this.hidden = new Uint8Array(n);
    this.pos = new Float32Array(n * 3);
    this.shades = new Float32Array(n);
    var glints = [];
    var rnd = Math.random;

    for (var i = 0; i < n; i++) {
      var x, y, p;
      do {
        x = rnd() * W;
        y = rnd() * H;
        var dy = (y - H / 2) / (H * (narrow ? 0.48 : 0.4));
        var dx = Math.abs((x - W / 2) / (W / 2));
        p = 0.12 + 0.88 * Math.exp(-dy * dy) * (1 - 0.5 * dx * dx * dx * dx);
      } while (rnd() > p);
      this.hx[i] = x;
      this.hy[i] = y;
      this.x[i] = sprinkle ? x + (rnd() + rnd() + rnd() - 1.5) * 36 : x;
      this.y[i] = sprinkle ? y - 30 - rnd() * 140 : y;
      this.size[i] = 0.9 + Math.pow(rnd(), 1.8) * (narrow ? 1.5 : 1.9);
      // Mostly mid silvers, some dark, a few nearly white.
      var r = rnd();
      this.tone[i] = r < 0.2 ? 0.22 + rnd() * 0.12 : r < 0.85 ? 0.38 + rnd() * 0.36 : 0.78 + rnd() * 0.2;
      this.phase[i] = rnd() * Math.PI * 2;
      this.rate[i] = 0.5 + rnd() * 2.2;
      if (rnd() < (narrow ? 0.006 : 0.004)) glints.push(i);
    }
    this.glints = glints;
    this.glintData = new Float32Array(glints.length * 3);
  };

  /* Motion ----------------------------------------------------------------- */

  Glitter.prototype.inside = function (i) {
    var cx = (this.x[i] + this.size[i] * 0.5 - this.wx) | 0;
    var cy = (this.y[i] + this.size[i] * 0.5 - this.wy) | 0;
    return cx >= 0 && cy >= 0 && cx < this.mw && cy < this.mh ? this.mask[cy * this.mw + cx] : 0;
  };

  Glitter.prototype.hideUnderWord = function () {
    for (var i = 0; i < this.n; i++) this.hidden[i] = this.inside(i);
  };

  Glitter.prototype.overWord = function (p) {
    return (
      this.ready &&
      p.x > this.wx + PAD - 14 &&
      p.x < this.wx + this.mw - PAD + 14 &&
      p.y > this.wy + PAD - 14 &&
      p.y < this.wy + this.mh - PAD + 14
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
    var wordMoving = this.drag || wspeed > 4;
    var push = 0.45 + Math.min(1.4, wspeed / 500);

    // The pointer brushes flakes only while it is moving.
    var ptr = this.ptr;
    var brushing = ptr.on && !this.drag && now - ptr.at < 120;
    var R = this.W < 640 ? 60 : 88;
    var R2 = R * R;
    var pspeed = Math.sqrt(ptr.vx * ptr.vx + ptr.vy * ptr.vy);
    var pforce = 0.32 + Math.min(2, pspeed / 450);
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
    var S = this.size;
    var hidden = this.hidden;
    var moving = 0;

    for (var i = 0, n = this.n; i < n; i++) {
      var x = X[i];
      var y = Y[i];
      var vx = VX[i];
      var vy = VY[i];

      // A flake under a letter is under the stencil: it stays put, unseen,
      // until the word moves off it. Only flakes in the open are pushed.
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

  // Now and then a flake catches the light and brightens.
  Glitter.prototype.shimmer = function () {
    var still = this.reduced();
    var t = this.t;
    var tone = this.tone;
    var out = this.shades;
    for (var i = 0; i < this.n; i++) {
      var v = tone[i];
      if (!still) {
        var s = Math.sin(t * this.rate[i] + this.phase[i]);
        if (s > 0.97) v = 1;
        else if (s > 0.88) v = Math.min(1, v + 0.22);
      }
      out[i] = v;
    }
    var g = this.glintData;
    for (var j = 0; j < this.glints.length; j++) {
      var k = this.glints[j];
      var a = still || this.hidden[k] ? 0 : Math.sin(t * this.rate[k] * 0.7 + this.phase[k]);
      a = a > 0.6 ? Math.pow((a - 0.6) / 0.4, 2) : 0;
      g[j * 3] = this.x[k] + this.size[k] / 2;
      g[j * 3 + 1] = this.y[k] + this.size[k] / 2;
      g[j * 3 + 2] = a;
    }
  };

  // A hidden flake is moved off the canvas. Shrinking it to nothing is not
  // enough: WebGL draws a point no smaller than one pixel.
  Glitter.prototype.packPositions = function () {
    var pos = this.pos;
    for (var i = 0; i < this.n; i++) {
      var off = this.hidden[i];
      pos[i * 3] = off ? -1000 : this.x[i];
      pos[i * 3 + 1] = off ? -1000 : this.y[i];
      pos[i * 3 + 2] = this.size[i];
    }
  };

  Glitter.prototype.draw = function (moved) {
    this.shimmer();
    if (this.gl) this.drawGL(moved);
    else this.draw2D();
  };

  Glitter.prototype.drawGL = function (moved) {
    var gl = this.gl;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);

    var p = this.flakeProg;
    gl.useProgram(p);
    gl.uniform2f(gl.getUniformLocation(p, 'u_res'), this.W, this.H);
    gl.uniform1f(gl.getUniformLocation(p, 'u_dpr'), this.dpr);
    gl.disable(gl.BLEND);

    var aPos = gl.getAttribLocation(p, 'a_pos');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuf);
    if (moved) {
      this.packPositions();
      gl.bufferData(gl.ARRAY_BUFFER, this.pos, gl.DYNAMIC_DRAW);
    }
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);

    var aShade = gl.getAttribLocation(p, 'a_shade');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.shadeBuf);
    gl.bufferData(gl.ARRAY_BUFFER, this.shades, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(aShade);
    gl.vertexAttribPointer(aShade, 1, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.POINTS, 0, this.n);
    gl.disableVertexAttribArray(aShade);

    if (this.glints.length && !this.reduced()) {
      var g = this.glintProg;
      gl.useProgram(g);
      gl.uniform2f(gl.getUniformLocation(g, 'u_res'), this.W, this.H);
      gl.uniform1f(gl.getUniformLocation(g, 'u_dpr'), this.dpr);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      var aG = gl.getAttribLocation(g, 'a_glint');
      gl.bindBuffer(gl.ARRAY_BUFFER, this.glintBuf);
      gl.bufferData(gl.ARRAY_BUFFER, this.glintData, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(aG);
      gl.vertexAttribPointer(aG, 3, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.POINTS, 0, this.glints.length);
      gl.disableVertexAttribArray(aG);
      gl.disable(gl.BLEND);
    }
  };

  // The fallback groups flakes into a few greys, so each grey is one fill.
  Glitter.prototype.draw2D = function () {
    var ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.W, this.H);
    var LEVELS = 6;
    if (!this.buckets) this.buckets = [];
    for (var b = 0; b < LEVELS; b++) {
      if (!this.buckets[b] || this.buckets[b].length < this.n) this.buckets[b] = new Int32Array(this.n);
    }
    var counts = new Int32Array(LEVELS);
    var i, j;
    for (i = 0; i < this.n; i++) {
      if (this.hidden[i]) continue;
      b = Math.min(LEVELS - 1, (this.shades[i] * LEVELS) | 0);
      this.buckets[b][counts[b]++] = i;
    }
    for (b = 0; b < LEVELS; b++) {
      var g = Math.round(((b + 0.5) / LEVELS) * 255);
      ctx.fillStyle = 'rgb(' + g + ',' + g + ',' + g + ')';
      ctx.beginPath();
      for (j = 0; j < counts[b]; j++) {
        i = this.buckets[b][j];
        ctx.rect(this.x[i], this.y[i], this.size[i], this.size[i]);
      }
      ctx.fill();
    }
    var gd = this.glintData;
    for (j = 0; j < this.glints.length; j++) {
      var a = gd[j * 3 + 2];
      if (a < 0.02) continue;
      var len = 5 * (0.5 + a);
      ctx.fillStyle = 'rgba(255,255,255,' + a.toFixed(3) + ')';
      ctx.fillRect(gd[j * 3] - len, gd[j * 3 + 1] - 0.4, len * 2, 0.8);
      ctx.fillRect(gd[j * 3] - 0.4, gd[j * 3 + 1] - len, 0.8, len * 2);
    }
  };

  Glitter.prototype.loop = function (now) {
    this.raf = 0;
    if (!this.ready) return;
    var dt = this.last ? Math.min(0.05, (now - this.last) / 1000) : 1 / 60;
    this.last = now;
    this.t += dt;
    var active = this.step(dt, now);
    // At rest the only change is the shimmer, which reads fine at half rate.
    this.odd = !this.odd;
    if (active || this.odd) this.draw(active);
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

    var lastW = c.clientWidth;
    var timer = 0;
    window.addEventListener('resize', function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        // A phone's address bar changes the height, not the width; only a
        // new width needs the word cut again.
        if (c.clientWidth === lastW) return;
        lastW = c.clientWidth;
        self.build(false);
        self.schedule();
      }, 150);
    });
  };

  window.OpenToolsGlitter = Glitter;
})();
