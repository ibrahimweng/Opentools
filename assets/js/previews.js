/*
 * Animated previews, one per tool.
 *
 * Each preview stands in for a tool's video until one is set in tools.js.
 * They are drawn on a 640 × 400 canvas that is cropped to fit its frame, so the
 * important part of each one sits inside the middle 400 × 400, which is what a
 * square tile shows. The motion itself lives in site.css, under "Previews".
 */
(function () {
  var count = 0;

  function svg(body) {
    return (
      '<svg class="pv-svg" viewBox="0 0 640 400" preserveAspectRatio="xMidYMid slice" overflow="visible" aria-hidden="true" focusable="false">' +
      body +
      '</svg>'
    );
  }

  function range(n) {
    var out = [];
    for (var i = 0; i < n; i++) out.push(i);
    return out;
  }

  // Deterministic noise, so a preview looks the same on every visit.
  function seeded(seed) {
    return function () {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
  }

  var P = {};

  /* Typeforge — a variable specimen moving through its weights, set against
     the metric lines a type designer works to. */
  P.typeforge = function () {
    var lines = [
      ['Ascender', 86],
      ['Cap height', 104],
      ['x-height', 164],
      ['Baseline', 268],
      ['Descender', 326],
    ];
    var drawn = lines
      .map(function (l) {
        var base = l[0] === 'Baseline';
        return (
          '<line x1="-640" x2="1280" y1="' + l[1] + '" y2="' + l[1] + '" class="tf-line' + (base ? ' tf-line--base' : '') + '"/>' +
          '<text x="134" y="' + (l[1] - 5) + '" class="tf-label">' + l[0] + '</text>'
        );
      })
      .join('');
    return (
      svg(
        '<rect x="-640" width="1920" height="400" fill="#EAE6DD"/>' +
          drawn +
          '<text x="320" y="268" class="tf-spec" text-anchor="middle">Ag</text>'
      ) + '<div class="pv-readout tf-readout"><span>wght</span> <span class="tf-num"></span></div>'
    );
  };

  /* Ideation Board — a board of cards, one being dragged, one connected to
     another, a sound playing and a set of versions arriving. */
  P['ideation-board'] = function (u) {
    var bars = range(22)
      .map(function (i) {
        var h = 6 + Math.round(Math.abs(Math.sin(i * 1.7)) * 18);
        return '<rect x="' + (346 + i * 4.6) + '" y="' + (275 - h / 2) + '" width="2.4" height="' + h + '" rx="1.2" class="ib-bar" style="animation-delay:' + (-(i % 7) * 0.13).toFixed(2) + 's"/>';
      })
      .join('');
    var versions = range(6)
      .map(function (i) {
        var x = 528 + (i % 3) * 32;
        var y = 96 + Math.floor(i / 3) * 32;
        return '<rect x="' + x + '" y="' + y + '" width="28" height="28" rx="4" fill="url(#' + u + '-v' + (i % 3) + ')" class="ib-ver" style="animation-delay:' + (i * 0.35).toFixed(2) + 's"/>';
      })
      .join('');
    return svg(
      '<defs>' +
        '<pattern id="' + u + '-dots" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="rgba(255,255,255,0.09)"/></pattern>' +
        '<linearGradient id="' + u + '-a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F6B26B"/><stop offset=".55" stop-color="#E0505E"/><stop offset="1" stop-color="#5A2B8A"/></linearGradient>' +
        '<linearGradient id="' + u + '-b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#47C9B4"/><stop offset="1" stop-color="#16466B"/></linearGradient>' +
        '<linearGradient id="' + u + '-v0" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F6B26B"/><stop offset="1" stop-color="#E0505E"/></linearGradient>' +
        '<linearGradient id="' + u + '-v1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E0505E"/><stop offset="1" stop-color="#5A2B8A"/></linearGradient>' +
        '<linearGradient id="' + u + '-v2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#47C9B4"/><stop offset="1" stop-color="#F6B26B"/></linearGradient>' +
      '</defs>' +
      '<rect x="-640" width="1920" height="400" fill="#17181B"/>' +
      '<rect x="-640" width="1920" height="400" fill="url(#' + u + '-dots)"/>' +
      '<g class="ib-pan">' +
        // A section, labelled, holding two pictures.
        '<text x="150" y="64" class="ib-label">Moodboard</text>' +
        '<rect x="148" y="72" width="214" height="146" rx="10" class="ib-section"/>' +
        '<rect x="162" y="86" width="116" height="84" rx="5" fill="url(#' + u + '-a)"/>' +
        '<rect x="286" y="86" width="62" height="84" rx="5" fill="url(#' + u + '-b)"/>' +
        '<rect x="162" y="182" width="84" height="5" rx="2.5" class="ib-text"/>' +
        '<rect x="162" y="193" width="52" height="5" rx="2.5" class="ib-text ib-text--dim"/>' +
        // A note with a checklist.
        '<g class="ib-note">' +
          '<rect x="384" y="84" width="118" height="104" rx="6" fill="#F3EFE6"/>' +
          '<rect x="396" y="98" width="62" height="7" rx="2" fill="#1A1A1A"/>' +
          '<rect x="396" y="118" width="9" height="9" rx="2" fill="#1A1A1A"/><path d="M398.2 122.6l1.8 1.8 3-3.4" class="ib-tick"/>' +
          '<rect x="411" y="120" width="66" height="5" rx="2.5" fill="#B9B3A8"/>' +
          '<rect x="396" y="136" width="9" height="9" rx="2" fill="#1A1A1A"/><path d="M398.2 140.6l1.8 1.8 3-3.4" class="ib-tick"/>' +
          '<rect x="411" y="138" width="48" height="5" rx="2.5" fill="#B9B3A8"/>' +
          '<rect x="396.6" y="154.6" width="7.8" height="7.8" rx="2" class="ib-box"/>' +
          '<rect x="411" y="156" width="58" height="5" rx="2.5" fill="#D6D0C5"/>' +
        '</g>' +
        // A connection from the note to the video.
        '<path d="M384 170 C 352 186, 366 262, 312 274" class="ib-link"/>' +
        '<circle cx="384" cy="170" r="3" class="ib-node"/><circle cx="312" cy="274" r="3" class="ib-node"/>' +
        // A video card.
        '<rect x="176" y="238" width="136" height="86" rx="6" fill="#0B0B0C" class="ib-card"/>' +
        '<path d="M236 270 l16 11 -16 11z" fill="#fff" opacity=".9"/>' +
        '<rect x="186" y="312" width="116" height="3" rx="1.5" fill="rgba(255,255,255,.18)"/>' +
        '<rect x="186" y="312" width="116" height="3" rx="1.5" fill="#fff" class="ib-progress"/>' +
        // A sound card, being dragged.
        '<g class="ib-drag">' +
          '<rect x="336" y="250" width="124" height="50" rx="6" fill="#26272B" class="ib-card"/>' +
          bars +
          '<path d="M452 288 l0 18 4.6 -4.4 3.6 7.6 2.6 -1.2 -3.6 -7.4 6.4 -.4z" fill="#fff" stroke="#000" stroke-width="1" stroke-linejoin="round"/>' +
        '</g>' +
        // Off to the sides, seen in the wider frame.
        '<g class="ib-model">' +
          '<rect x="28" y="120" width="92" height="92" rx="6" fill="#222327" class="ib-card"/>' +
          '<g class="ib-cube" transform="translate(74 166)">' +
            '<path d="M0 -24 L22 -12 L22 12 L0 24 L-22 12 L-22 -12Z M0 -24 L0 0 M22 -12 L0 0 L-22 -12 M0 0 L0 24" class="ib-wire"/>' +
          '</g>' +
        '</g>' +
        '<text x="528" y="88" class="ib-label">12 versions</text>' +
        versions +
        '<rect x="522" y="236" width="102" height="64" rx="6" fill="#222327" class="ib-card"/>' +
        '<circle cx="538" cy="254" r="6" fill="#E0505E"/>' +
        '<rect x="550" y="251" width="58" height="5" rx="2.5" class="ib-text"/>' +
        '<rect x="534" y="270" width="78" height="4" rx="2" class="ib-text ib-text--dim"/>' +
        '<rect x="534" y="280" width="56" height="4" rx="2" class="ib-text ib-text--dim"/>' +
      '</g>'
    );
  };

  /* Mockup Studio — a phone on a turntable under studio light. Drawn as a
     stack of layers in CSS 3D, so it has a real edge as it turns. */
  P['mockup-studio'] = function () {
    var layers = range(10)
      .map(function (i) {
        return '<div class="ms-layer" style="--i:' + i + '"></div>';
      })
      .join('');
    return (
      '<div class="ms-stage">' +
        '<div class="ms-shadow"></div>' +
        '<div class="ms-phone">' +
          layers +
          '<div class="ms-face ms-back"><div class="ms-cam"><i></i><i></i><i></i></div></div>' +
          '<div class="ms-face ms-front">' +
            '<div class="ms-screen">' +
              '<div class="ms-island"></div>' +
              '<div class="ms-ui">' +
                '<div class="ms-row"><b style="width:38%"></b><b class="ms-dot"></b></div>' +
                '<div class="ms-hero"></div>' +
                '<div class="ms-row"><b style="width:56%"></b></div>' +
                '<div class="ms-row ms-row--dim"><b style="width:72%"></b></div>' +
                '<div class="ms-tiles"><span></span><span></span><span></span><span></span></div>' +
                '<div class="ms-tab"><i></i><i></i><i></i><i></i></div>' +
              '</div>' +
              '<div class="ms-glare"></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="pv-readout ms-readout">Turntable · 50 mm</div>'
    );
  };

  /* Glyphs — a library redrawn as one stroke slider moves. */
  var ICONS = [
    'M4 11L12 4l8 7v9H4zM10 20v-6h4v6',
    'M11 5a6 6 0 1 0 0 12a6 6 0 1 0 0-12zM15.5 15.5L20 20',
    'M6 17v-6a6 6 0 0 1 12 0v6M4.5 17h15M10.5 20h3',
    'M12 4a4 4 0 1 0 0 8a4 4 0 1 0 0-8zM4.5 20c.6-3.6 3.6-6 7.5-6s6.9 2.4 7.5 6',
    'M12 19.5C6 15.4 3.5 12.2 3.5 9A4.3 4.3 0 0 1 12 7.4A4.3 4.3 0 0 1 20.5 9c0 3.2-2.5 6.4-8.5 10.5z',
    'M12 3.5l2.6 5.4 5.9.7-4.4 4 1.2 5.9L12 16.6l-5.3 2.9 1.2-5.9-4.4-4 5.9-.7z',
    'M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8zM12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8',
    'M6 7.5h2l1.5-2.5h5L16 7.5h2a3 3 0 0 1 3 3V17a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-6.5a3 3 0 0 1 3-3zM12 10a3.5 3.5 0 1 0 0 7a3.5 3.5 0 1 0 0-7z',
    'M6 6h12a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3zM21 11h-4a2 2 0 0 0 0 4h4',
    'M5.5 5h13A2.5 2.5 0 0 1 21 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 16.5v-9A2.5 2.5 0 0 1 5.5 5zM3 10h18M7 15h4',
    'M21 3L10 14M21 3l-7 18-4-7-7-4z',
    'M7.5 11h9a2.5 2.5 0 0 1 2.5 2.5v5a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 18.5v-5A2.5 2.5 0 0 1 7.5 11zM8 11V8a4 4 0 0 1 8 0v3',
    'M6 4.5h12a2.5 2.5 0 0 1 2.5 2.5v7a2.5 2.5 0 0 1-2.5 2.5h-6l-5 4v-4H6A2.5 2.5 0 0 1 3.5 14V7A2.5 2.5 0 0 1 6 4.5z',
    'M5.5 5h13A2.5 2.5 0 0 1 21 7.5v11a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 18.5v-11A2.5 2.5 0 0 1 5.5 5zM3 10h18M8 3v4M16 3v4',
    'M7 18.5h10a4 4 0 0 0 .6-8A6 6 0 0 0 6.2 11 3.8 3.8 0 0 0 7 18.5z',
    'M13 3L5 14h7l-1 7 8-11h-7z',
    'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM12 8v8M8 12h8',
    'M7 17L17 7M8 7h9v9',
    'M5.5 4h3A1.5 1.5 0 0 1 10 5.5v3A1.5 1.5 0 0 1 8.5 10h-3A1.5 1.5 0 0 1 4 8.5v-3A1.5 1.5 0 0 1 5.5 4zM15.5 4h3A1.5 1.5 0 0 1 20 5.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 14 8.5v-3A1.5 1.5 0 0 1 15.5 4zM5.5 14h3a1.5 1.5 0 0 1 1.5 1.5v3A1.5 1.5 0 0 1 8.5 20h-3A1.5 1.5 0 0 1 4 18.5v-3A1.5 1.5 0 0 1 5.5 14zM15.5 14h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3a1.5 1.5 0 0 1-1.5-1.5v-3a1.5 1.5 0 0 1 1.5-1.5z',
    'M5.5 4h13A2.5 2.5 0 0 1 21 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5v-11A2.5 2.5 0 0 1 5.5 4zM8.5 8a1.6 1.6 0 1 0 0 3.2a1.6 1.6 0 1 0 0-3.2zM21 15.5l-5.5-5.5L5 20',
    'M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21',
    'M8.5 2.5h7A2.5 2.5 0 0 1 18 5v14a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 6 19V5a2.5 2.5 0 0 1 2.5-2.5zM10.5 18.5h3',
    'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM12 3c-2.4 2.4-3.6 5.4-3.6 9s1.2 6.6 3.6 9M12 3c2.4 2.4 3.6 5.4 3.6 9s-1.2 6.6-3.6 9M3 12h18',
    'M12 3l7 3v5c0 4.6-3 8.2-7 10-4-1.8-7-5.4-7-10V6zM9 12l2 2 4-4',
  ];
  P.glyphs = function () {
    var icons = ICONS.map(function (d, i) {
      var cx = 170 + (i % 6) * 60;
      var cy = 82 + Math.floor(i / 6) * 60;
      return '<path transform="translate(' + (cx - 19.2) + ' ' + (cy - 19.2) + ') scale(1.6)" d="' + d + '"/>';
    }).join('');
    var ticks = range(25)
      .map(function (i) {
        var x = 236 + i * 7.5;
        return '<line x1="' + x + '" x2="' + x + '" y1="' + (i % 4 === 0 ? 324 : 326) + '" y2="' + (i % 4 === 0 ? 336 : 334) + '"/>';
      })
      .join('');
    return svg(
      '<rect x="-640" width="1920" height="400" fill="#1F3BD0"/>' +
      '<rect x="0" y="0" width="56" height="56" rx="14" class="gl-focus"/>' +
      '<g class="gl-icons">' + icons + '</g>' +
      '<text x="176" y="334" class="gl-label">Stroke</text>' +
      '<g class="gl-ticks">' + ticks + '</g>' +
      '<rect x="0" y="321" width="26" height="18" rx="9" class="gl-thumb"/>' +
      '<text x="464" y="334" class="gl-label gl-label--end">1–4</text>'
    );
  };

  /* Pattern Gen — one mark, read three ways, each pattern drifting by exactly
     one repeat so the loop never shows a seam. */
  P['pattern-gen'] = function (u) {
    var A = '#D9542B', B = '#0F4C4A', C = '#E8B23A', CREAM = '#F2EADB';
    function prism(x, y, s, rot) {
      var t = 'translate(' + x + ' ' + y + ') rotate(' + (rot || 0) + ') scale(' + s + ')';
      return (
        '<g transform="' + t + '">' +
        '<path d="M0 -1L-.866 .5L0 0z" fill="' + A + '"/>' +
        '<path d="M0 -1L.866 .5L0 0z" fill="' + B + '"/>' +
        '<path d="M-.866 .5L.866 .5L0 0z" fill="' + C + '"/>' +
        '</g>'
      );
    }
    // Truchet: a 4 × 4 block of cells, each turned one of two ways.
    var rnd = seeded(7);
    var truchet = '';
    for (var r = 0; r < 4; r++) {
      for (var c = 0; c < 4; c++) {
        var x = c * 24, y = r * 24;
        var flip = rnd() > 0.5;
        truchet += flip
          ? '<path d="M' + (x + 12) + ' ' + y + 'a12 12 0 0 1 -12 12M' + (x + 24) + ' ' + (y + 12) + 'a12 12 0 0 0 -12 12"/>'
          : '<path d="M' + (x + 12) + ' ' + y + 'a12 12 0 0 0 12 12M' + x + ' ' + (y + 12) + 'a12 12 0 0 1 12 12"/>';
      }
    }
    return svg(
      '<defs>' +
        '<pattern id="' + u + '-lat" width="64" height="56" patternUnits="userSpaceOnUse">' +
          '<rect width="64" height="56" fill="' + CREAM + '"/>' +
          prism(16, 16, 13) + prism(48, 44, 13, 180) +
          '<animateTransform attributeName="patternTransform" type="translate" from="0 0" to="64 56" dur="9s" repeatCount="indefinite"/>' +
        '</pattern>' +
        '<pattern id="' + u + '-str" width="48" height="48" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">' +
          '<rect width="48" height="48" fill="' + CREAM + '"/>' +
          '<rect width="12" height="48" fill="' + B + '"/>' +
          '<rect x="18" width="6" height="48" fill="' + A + '"/>' +
          '<rect x="30" width="12" height="48" fill="' + C + '"/>' +
          '<animateTransform attributeName="patternTransform" type="translate" from="0 0" to="48 0" dur="6s" additive="sum" repeatCount="indefinite"/>' +
        '</pattern>' +
        '<pattern id="' + u + '-tru" width="96" height="96" patternUnits="userSpaceOnUse">' +
          '<rect width="96" height="96" fill="' + B + '"/>' +
          '<g fill="none" stroke="' + C + '" stroke-width="5">' + truchet + '</g>' +
          '<animateTransform attributeName="patternTransform" type="translate" from="0 0" to="0 96" dur="10s" repeatCount="indefinite"/>' +
        '</pattern>' +
        '<filter id="' + u + '-sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="6" stdDeviation="10" flood-opacity=".18"/></filter>' +
      '</defs>' +
      '<rect x="-640" width="1920" height="400" fill="url(#' + u + '-lat)" class="pg-layer pg-layer--1"/>' +
      '<rect x="-640" width="1920" height="400" fill="url(#' + u + '-str)" class="pg-layer pg-layer--2"/>' +
      '<rect x="-640" width="1920" height="400" fill="url(#' + u + '-tru)" class="pg-layer pg-layer--3"/>' +
      '<g filter="url(#' + u + '-sh)">' +
        '<rect x="246" y="118" width="148" height="164" rx="10" fill="#FFFDF8"/>' +
      '</g>' +
      prism(320, 196, 44) +
      '<text x="260" y="140" class="pg-file">prism.svg</text>' +
      '<g class="pg-names">' +
        '<text x="320" y="266" class="pg-name pg-name--1">Motif lattice</text>' +
        '<text x="320" y="266" class="pg-name pg-name--2">Stripe system</text>' +
        '<text x="320" y="266" class="pg-name pg-name--3">Truchet tiles</text>' +
      '</g>'
    );
  };

  /* Beat Studio — a clip on a timeline, sounds placed on its cuts, and a
     playhead that lights each one as it passes. */
  P['beat-studio'] = function (u) {
    var LOOP = 6, START = 92, END = 572;
    function delay(x) {
      return (-(LOOP - ((x - START) / (END - START)) * LOOP)).toFixed(2) + 's';
    }
    var hues = ['#3B2F5E', '#6A3A4F', '#A4553A', '#C98A3E', '#3E6B6A', '#24485F', '#2E2E3A', '#7A3B33', '#B66C3C', '#40566E'];
    var frames = range(30)
      .map(function (k) {
        var i = k - 10, h = hues[k % hues.length];
        return '<rect x="' + (i * 64 + 1) + '" y="64" width="62" height="58" rx="3" fill="' + h + '"/>' +
          '<rect x="' + (i * 64 + 1) + '" y="64" width="62" height="58" rx="3" fill="url(#' + u + '-shade)"/>';
      })
      .join('');
    var ruler = range(121)
      .map(function (k) {
        var i = k - 40, x = i * 16;
        return '<line x1="' + x + '" x2="' + x + '" y1="' + (((i % 8) + 8) % 8 === 0 ? 134 : 138) + '" y2="142"/>';
      })
      .join('');
    var times = [1, 2, 3, 4]
      .map(function (s, i) {
        return '<text x="' + (128 + i * 128 + 3) + '" y="140" class="bs-time">00:0' + s + '</text>';
      })
      .join('');
    function wave(x, y, w, seed, shape) {
      var r = seeded(seed), d = '';
      for (var i = 0; i <= w; i += 3) {
        var t = i / w;
        var env = shape === 'ramp' ? t : shape === 'hit' ? Math.exp(-t * 4) : 0.6;
        var a = (4 + r() * 10) * env + 1;
        d += 'M' + (x + i) + ' ' + (y - a) + 'v' + (a * 2);
      }
      return '<path d="' + d + '" class="bs-wave"/>';
    }
    function clip(x, lane, w, cls, label, seed, shape) {
      var y = 156 + lane * 46;
      return (
        '<g class="bs-clip ' + cls + '" style="animation-delay:' + delay(x) + '">' +
        '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="36" rx="5"/>' +
        wave(x + 6, y + 21, w - 12, seed, shape) +
        '<text x="' + (x + 6) + '" y="' + (y + 10) + '" class="bs-clip-label">' + label + '</text>' +
        '</g>'
      );
    }
    var kicks = range(31)
      .map(function (k) {
        var i = k - 9;
        return clip(104 + i * 36, 1, 26, 'bs-clip--kick', ((i % 4) + 4) % 4 === 0 ? 'Kick' : '', 30 + i, 'hit');
      })
      .join('');
    var cuts = [148, 330, 470];
    return svg(
      '<defs><linearGradient id="' + u + '-shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></linearGradient></defs>' +
      '<rect x="-640" width="1920" height="400" fill="#101010"/>' +
      frames +
      '<g class="bs-ruler">' + ruler + '</g>' + times +
      '<rect x="-640" y="156" width="1920" height="36" rx="5" class="bs-lane"/>' +
      '<rect x="-640" y="202" width="1920" height="36" rx="5" class="bs-lane"/>' +
      '<rect x="-640" y="248" width="1920" height="36" rx="5" class="bs-lane"/>' +
      cuts.map(function (x) { return '<line x1="' + x + '" x2="' + x + '" y1="58" y2="292" class="bs-cut"/><path d="M' + x + ' 52l4 4-4 4-4-4z" class="bs-cut-mark"/>'; }).join('') +
      clip(148, 0, 52, 'bs-clip--hit', 'Crash', 3, 'hit') +
      clip(330, 0, 44, 'bs-clip--hit', 'Impact', 5, 'hit') +
      clip(470, 0, 60, 'bs-clip--hit', 'Crash', 9, 'hit') +
      kicks +
      clip(196, 2, 134, 'bs-clip--rise', 'Riser', 11, 'ramp') +
      clip(386, 2, 84, 'bs-clip--rise', 'Whoosh', 13, 'ramp') +
      '<g class="bs-head"><line x1="0" x2="0" y1="52" y2="292"/><path d="M-5 50h10v6l-5 5-5-5z"/></g>' +
      '<g class="bs-export">' +
        ['WAV', 'MP3', 'MIDI', 'Markers'].map(function (t, i) {
          var x = 210 + [0, 50, 100, 154][i];
          var w = [40, 40, 44, 66][i];
          return '<rect x="' + x + '" y="318" width="' + w + '" height="22" rx="11"/><text x="' + (x + w / 2) + '" y="332.5">' + t + '</text>';
        }).join('') +
      '</g>'
    );
  };

  /* Brand Handover — the master mark changes weight, and every document drawn
     from it changes at the same moment. */
  P['brand-handover'] = function (u) {
    function mark(x, y, s, ink) {
      return (
        '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
        '<circle r="26" fill="none" stroke="' + ink + '" class="bh-ring"/>' +
        '<circle r="6" fill="' + ink + '" class="bh-dot"/>' +
        '</g>'
      );
    }
    function bars(x, y, ws, fill) {
      return ws.map(function (w, i) {
        return '<rect x="' + x + '" y="' + (y + i * 8) + '" width="' + w + '" height="4" rx="2" fill="' + fill + '"/>';
      }).join('');
    }
    var INK = '#161616', BRAND = '#E5532D';
    return svg(
      '<defs><filter id="' + u + '-sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="3" stdDeviation="5" flood-opacity=".12"/></filter></defs>' +
      '<rect x="-640" width="1920" height="400" fill="#DCDAD4"/>' +
      '<g class="bh-wires">' +
        '<path d="M270 180 C 240 170, 236 140, 228 128"/>' +
        '<path d="M370 176 C 392 160, 398 120, 410 112"/>' +
        '<path d="M276 230 C 240 246, 214 250, 196 250"/>' +
        '<path d="M368 228 C 392 238, 404 240, 420 242"/>' +
        '<path d="M320 240 L 320 290"/>' +
      '</g>' +
      '<g filter="url(#' + u + '-sh)">' +
        // The master.
        '<rect x="266" y="134" width="108" height="108" rx="10" fill="#fff"/>' +
        // The manual, a page.
        '<rect x="148" y="68" width="80" height="106" rx="3" fill="#fff"/>' +
        // The deck, a slide.
        '<rect x="410" y="78" width="104" height="58" rx="3" fill="' + INK + '"/>' +
        // A favicon.
        '<rect x="156" y="232" width="40" height="40" rx="9" fill="' + INK + '"/>' +
        // A social crop.
        '<rect x="420" y="196" width="92" height="92" rx="4" fill="' + BRAND + '"/>' +
        // A lockup.
        '<rect x="226" y="290" width="188" height="48" rx="3" fill="#fff"/>' +
        // Files, seen in the wider frame.
        '<rect x="24" y="96" width="96" height="176" rx="6" fill="#fff"/>' +
        '<rect x="532" y="92" width="88" height="112" rx="6" fill="#1E1E1E"/>' +
      '</g>' +
      '<text x="270" y="128" class="bh-file">mark.svg</text>' +
      mark(320, 188, 1, INK) +
      mark(166, 86, 0.22, INK) + bars(158, 104, [44, 60, 52, 58, 36], '#D7D3CB') +
      '<rect x="158" y="150" width="14" height="14" rx="2" fill="' + INK + '"/><rect x="176" y="150" width="14" height="14" rx="2" fill="' + BRAND + '"/><rect x="194" y="150" width="14" height="14" rx="2" fill="#DCDAD4"/>' +
      mark(432, 107, 0.36, '#fff') + bars(452, 96, [44, 32, 38], 'rgba(255,255,255,.4)') +
      mark(176, 252, 0.4, '#fff') +
      mark(466, 242, 0.92, '#fff') +
      mark(250, 314, 0.4, INK) + '<text x="268" y="319.5" class="bh-word">Northline</text>' +
      ['.svg', '.pdf', '.ai', '.png', '.zip'].map(function (t, i) {
        return '<rect x="36" y="' + (110 + i * 31) + '" width="72" height="22" rx="4" fill="#EEECE7"/><text x="46" y="' + (124.5 + i * 31) + '" class="bh-ext">lockup' + t + '</text>';
      }).join('') +
      '<text x="544" y="110" class="bh-code">brand.json</text>' +
      bars(544, 122, [52, 40, 60, 34, 48, 56, 28, 44, 38], 'rgba(255,255,255,.18)')
    );
  };

  window.OPENTOOLS_PREVIEW = function (slug) {
    var u = 'pv' + ++count;
    var draw = P[slug];
    return '<div class="pv pv--' + slug + '">' + (draw ? draw(u) : '') + '</div>';
  };
})();
