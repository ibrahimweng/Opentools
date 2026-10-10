(function () {
  'use strict';

  var DATA = window.OPENTOOLS;
  var preview = window.OPENTOOLS_PREVIEW;
  if (!DATA || !preview) return;

  var site = DATA.site;
  var tools = DATA.tools;
  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  function $(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }

  function $$(sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function pad(n) {
    return (n < 10 ? '0' : '') + n;
  }

  function indexOf(slug) {
    for (var i = 0; i < tools.length; i++) if (tools[i].slug === slug) return i;
    return -1;
  }

  function hashIndex() {
    return indexOf(decodeURIComponent(location.hash.slice(1)));
  }

  // A tool's video when it has one, its animated preview when it does not.
  function media(tool, opts) {
    opts = opts || {};
    if (tool.video) {
      return (
        '<video src="' + esc(tool.video) + '"' +
        (tool.poster ? ' poster="' + esc(tool.poster) + '"' : '') +
        ' muted loop playsinline' +
        (opts.autoplay ? ' autoplay preload="auto"' : ' preload="none"') +
        '></video>'
      );
    }
    return preview(tool.slug);
  }

  if (site.github) {
    $$('[data-github]').forEach(function (a) {
      a.href = site.github;
    });
  }

  /* Playback ------------------------------------------------------------
     Previews and videos play only while they are on screen, and everything
     behind the pop-up stops while it is open. */

  var seen = new WeakMap();
  var tracked = [];
  var modalOpen = false;

  function shouldPlay(node) {
    if (!seen.get(node)) return false;
    if (document.hidden) return false;
    var inModal = !!node.closest('.modal');
    if (modalOpen !== inModal) return false;
    var card = node.closest('.card');
    if (card && card.getAttribute('data-front') !== '1') return false;
    if (reduced.matches && node.classList.contains('pv')) return false;
    return true;
  }

  function apply(node) {
    var on = shouldPlay(node);
    if (node.tagName === 'VIDEO') {
      if (on) {
        if (node.preload === 'none') node.preload = 'auto';
        var p = node.play();
        if (p && p.catch) p.catch(function () {});
      } else {
        node.pause();
      }
      return;
    }
    node.classList.toggle('is-paused', !on);
    $$('svg', node).forEach(function (s) {
      if (!s.pauseAnimations) return;
      if (on) s.unpauseAnimations();
      else s.pauseAnimations();
    });
  }

  function refresh() {
    tracked = tracked.filter(function (n) {
      return n.isConnected;
    });
    tracked.forEach(apply);
  }

  var io =
    'IntersectionObserver' in window
      ? new IntersectionObserver(
          function (entries) {
            entries.forEach(function (e) {
              seen.set(e.target, e.isIntersecting);
              apply(e.target);
            });
          },
          { rootMargin: '80px 0px' }
        )
      : null;

  function track(scope) {
    $$('.pv, video', scope).forEach(function (n) {
      if (tracked.indexOf(n) !== -1) return;
      tracked.push(n);
      if (io) io.observe(n);
      else {
        seen.set(n, true);
        apply(n);
      }
    });
  }

  document.addEventListener('visibilitychange', refresh);
  if (reduced.addEventListener) reduced.addEventListener('change', refresh);

  /* Index ---------------------------------------------------------------- */

  var index = $('[data-index]');
  index.style.setProperty('--rows', Math.ceil(tools.length / 2));
  index.innerHTML = tools
    .map(function (t) {
      return (
        '<li><a class="person" href="#' + esc(t.slug) + '" data-open="' + esc(t.slug) + '">' +
        '<span class="person-name">' + esc(t.name) + '</span>' +
        '<span class="person-role">' + esc(t.category) + '</span>' +
        '</a></li>'
      );
    })
    .join('');

  /* Spiral ---------------------------------------------------------------
     Every tool as a card on a helix. The cards climb it and turn as they
     go, fading out at the top as they come back in at the bottom. Hovering
     slows it, dragging spins it, and clicking a card opens it. */

  var spiral = $('[data-spiral]');
  var stage = $('[data-spiral-stage]');
  var label = $('[data-spiral-label]');
  var N = tools.length;
  var TURNS = 1.5;
  var STEP = (360 * TURNS) / N; // degrees between neighbours
  var SPEED = 1 / 3.2; // cards a second
  var geo = { R: 200, dy: 50, perCard: 280 };
  var t = N / 2; // the first tool starts facing the viewer
  var v = reduced.matches ? 0 : SPEED;
  var hovered = null;
  var drag = null;
  var dragged = false;
  var spiralVisible = true;
  var raf = 0;
  var last = 0;

  stage.innerHTML = tools
    .map(function (tool, i) {
      return (
        '<button type="button" class="card" data-i="' + i + '" data-open="' + esc(tool.slug) + '" aria-label="Open ' + esc(tool.name) + '">' +
        '<span class="card-face card-front"><span class="card-media">' + media(tool) + '</span><span class="card-shade"></span></span>' +
        '<span class="card-face card-back"><span>' + esc(tool.name) + '</span></span>' +
        '</button>'
      );
    })
    .join('');
  var cards = $$('.card', stage);
  var shades = cards.map(function (c) {
    return $('.card-shade', c);
  });

  // Sized to the space the reference gives its object: 420 px square, or
  // about three quarters of a phone's width. The radius is kept wide enough
  // that neighbouring cards never cut through one another.
  function measure() {
    var vw = document.documentElement.clientWidth;
    var S = Math.min(420, vw * 0.733);
    var k = (0.5 / Math.tan((STEP / 2) * (Math.PI / 180))) * 1.06;
    var cw = Math.min(S * 0.6, (vw - 24) / (1 + 2 * k));
    var ch = cw * 0.625;
    geo.R = Math.min(Math.max(S * 0.5, k * cw), (vw - 24 - cw) / 2);
    geo.dy = Math.min(S * 0.15, (spiral.clientHeight - ch - 40) / N);
    geo.perCard = Math.max(120, geo.R * STEP * (Math.PI / 180));
    spiral.style.setProperty('--cw', cw.toFixed(1) + 'px');
    spiral.style.setProperty('--ch', ch.toFixed(1) + 'px');
    spiral.style.setProperty('--persp', Math.round(S * 4.2) + 'px');
  }

  function place() {
    for (var i = 0; i < N; i++) {
      var s = (((i + t) % N) + N) % N;
      var a = (s - N / 2) * STEP;
      var y = (N / 2 - s) * geo.dy;
      var facing = Math.cos(a * (Math.PI / 180));
      var fade = Math.max(0, Math.min(1, Math.min(s, N - s) / 0.8));
      var c = cards[i];
      c.style.transform = 'translate3d(0,' + y.toFixed(2) + 'px,0) rotateY(' + a.toFixed(2) + 'deg) translateZ(' + geo.R.toFixed(1) + 'px)';
      c.style.setProperty('--fade', fade.toFixed(3));
      c.style.pointerEvents = fade < 0.35 ? 'none' : '';
      shades[i].style.opacity = Math.min(0.75, (1 - facing) * 0.55).toFixed(3);
      var front = facing > 0.05 && fade > 0.3 ? '1' : '0';
      if (c.getAttribute('data-front') !== front) {
        c.setAttribute('data-front', front);
        $$('.pv, video', c).forEach(apply);
      }
    }
  }

  function frame(now) {
    raf = 0;
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    if (!drag) {
      var target = reduced.matches ? 0 : hovered !== null ? SPEED * 0.12 : SPEED;
      // Ease back to cruising speed; a flick from a drag decays into it.
      v += (target - v) * Math.min(1, dt * (Math.abs(v) > SPEED * 1.5 ? 1.6 : 3));
      t += v * dt;
    }
    place();
    if (reduced.matches && !drag && Math.abs(v) < 0.002) {
      last = 0;
      return;
    }
    run();
  }

  function run() {
    if (raf || !spiralVisible || modalOpen || document.hidden) {
      if (!raf) last = 0;
      return;
    }
    raf = requestAnimationFrame(frame);
  }

  function showLabel(i) {
    hovered = i;
    if (i === null) {
      label.classList.remove('is-on');
      return;
    }
    $('[data-spiral-name]').textContent = tools[i].name;
    $('[data-spiral-tag]').textContent = tools[i].tagline;
    label.classList.add('is-on');
  }

  cards.forEach(function (c, i) {
    c.addEventListener('pointerenter', function (e) {
      if (e.pointerType !== 'touch') showLabel(i);
    });
    c.addEventListener('pointerleave', function () {
      if (hovered === i) showLabel(null);
    });
    c.addEventListener('focus', function () {
      showLabel(i);
    });
    c.addEventListener('blur', function () {
      if (hovered === i) showLabel(null);
    });
  });

  // Drag sideways to spin. Vertical moves are left to the page, so the
  // spiral never traps a scroll on a phone.
  spiral.addEventListener('pointerdown', function (e) {
    if (e.button !== 0) return;
    drag = { x: e.clientX, t: t, lastX: e.clientX, lastT: performance.now(), vel: 0, id: e.pointerId, moved: false };
    dragged = false;
  });

  window.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    var dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) > 6) {
      drag.moved = true;
      spiral.classList.add('is-dragging');
    }
    if (!drag.moved) return;
    t = drag.t + dx / geo.perCard;
    var now = performance.now();
    var dts = Math.max(1, now - drag.lastT) / 1000;
    drag.vel = ((e.clientX - drag.lastX) / geo.perCard) / dts;
    drag.lastX = e.clientX;
    drag.lastT = now;
    if (!raf) place();
  });

  function endDrag(e) {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    if (drag.moved) {
      dragged = true;
      v = Math.max(-4, Math.min(4, drag.vel));
      spiral.classList.remove('is-dragging');
    }
    drag = null;
    run();
  }
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);

  // A drag that ends over a card is not a click on it.
  stage.addEventListener(
    'click',
    function (e) {
      if (dragged) {
        dragged = false;
        e.preventDefault();
        e.stopPropagation();
      }
    },
    true
  );

  if (io) {
    new IntersectionObserver(function (e) {
      spiralVisible = e[0].isIntersecting;
      run();
    }).observe(spiral);
  }
  document.addEventListener('visibilitychange', run);
  window.addEventListener('resize', function () {
    measure();
    place();
  });

  measure();
  place();
  track(stage);
  run();

  /* Pop-up -------------------------------------------------------------- */

  var modal = $('[data-modal]');
  var F = {};
  $$('[data-m]', modal).forEach(function (n) {
    F[n.getAttribute('data-m')] = n;
  });
  var current = -1;
  var pushed = false;
  var closing = null;
  var swapping = null;
  var returnFocus = null;

  function fill(i) {
    var t = tools[i];
    current = i;
    F.name.textContent = t.name;
    F.tagline.textContent = t.tagline;
    F.count.textContent = pad(i + 1) + ' / ' + pad(tools.length);
    F.lead.textContent = t.lead || '';
    F.about.innerHTML = (t.about || [])
      .map(function (p) {
        return '<p>' + esc(p) + '</p>';
      })
      .join('');
    F.features.innerHTML = (t.features || [])
      .map(function (f) {
        return '<li><span class="person-name">' + esc(f[0]) + '</span><span class="person-role">' + esc(f[1]) + '</span></li>';
      })
      .join('');
    F.category.textContent = t.category || '';
    F.runs.textContent = t.runs || '';
    F.stack.textContent = t.stack || '';

    if (t.source) {
      F['source-row'].hidden = false;
      F.source.href = t.source;
    } else {
      F['source-row'].hidden = true;
    }

    if (t.url) {
      F.visit.href = t.url;
      F.visit.removeAttribute('aria-disabled');
      F.visit.innerHTML = 'Visit site <span aria-hidden="true">↗</span>';
      F.visit.setAttribute('aria-label', 'Visit ' + t.name + ' (opens in a new tab)');
    } else {
      F.visit.removeAttribute('href');
      F.visit.setAttribute('aria-disabled', 'true');
      F.visit.textContent = 'Live link soon';
      F.visit.removeAttribute('aria-label');
    }

    var prev = tools[(i - 1 + tools.length) % tools.length];
    var next = tools[(i + 1) % tools.length];
    F.prev.textContent = prev.name;
    F.next.textContent = next.name;
    F.prev.parentNode.setAttribute('aria-label', 'Previous: ' + prev.name);
    F.next.parentNode.setAttribute('aria-label', 'Next: ' + next.name);

    F.media.innerHTML = media(t, { autoplay: true });
    var video = $('video', F.media);
    if (video) {
      var ctrl = document.createElement('div');
      ctrl.className = 'm-media-ctrl';
      ctrl.innerHTML = '<button type="button" data-v="sound">Sound on</button><button type="button" data-v="play">Pause</button>';
      F.media.appendChild(ctrl);
      ctrl.addEventListener('click', function (e) {
        var b = e.target.closest('[data-v]');
        if (!b) return;
        if (b.getAttribute('data-v') === 'play') {
          if (video.paused) video.play();
          else video.pause();
          b.textContent = video.paused ? 'Play' : 'Pause';
        } else {
          video.muted = !video.muted;
          b.textContent = video.muted ? 'Sound on' : 'Sound off';
        }
      });
    }
    track(F.media);

    F.scroll.scrollTop = 0;
    $('.m-body', modal).scrollTop = 0;
  }

  function open(i, opts) {
    opts = opts || {};
    if (i < 0 || i >= tools.length) return;
    var slug = tools[i].slug;

    if (modal.open && !closing) {
      if (i !== current) swapTo(i);
      return;
    }
    if (closing) {
      clearTimeout(closing);
      closing = null;
      modal.classList.remove('is-closing');
    }

    returnFocus = document.activeElement;
    modalOpen = true;
    fill(i);
    if (!modal.open) modal.showModal();
    root.classList.add('is-locked');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        modal.classList.add('is-open');
      });
    });
    refresh();

    if (opts.push !== false) {
      history.pushState({ opentools: slug }, '', '#' + slug);
      pushed = true;
    }
  }

  function swapTo(i) {
    clearTimeout(swapping);
    history.replaceState(history.state, '', '#' + tools[i].slug);
    if (reduced.matches) {
      fill(i);
      return;
    }
    modal.classList.add('is-swapping');
    swapping = setTimeout(function () {
      fill(i);
      modal.classList.remove('is-swapping');
    }, 200);
  }

  function close(opts) {
    opts = opts || {};
    if (!modal.open || closing) return;
    modal.classList.remove('is-open');
    modal.classList.add('is-closing');
    var v = $('video', F.media);
    if (v) v.pause();

    closing = setTimeout(function () {
      closing = null;
      modal.classList.remove('is-closing', 'is-swapping');
      modal.close();
      root.classList.remove('is-locked');
      F.media.innerHTML = '';
      modalOpen = false;
      refresh();
      run();
      if (returnFocus && returnFocus.focus && returnFocus.isConnected) {
        returnFocus.focus({ preventScroll: true });
      }
    }, reduced.matches ? 0 : 320);

    if (!opts.fromHistory) {
      if (pushed) {
        pushed = false;
        history.back();
      } else {
        history.replaceState(null, '', location.pathname + location.search);
      }
    } else {
      pushed = false;
    }
  }

  function step(d) {
    if (current < 0) return;
    swapTo((current + d + tools.length) % tools.length);
  }

  // Anything carrying data-open opens that tool.
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-open]');
    if (!a) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
    e.preventDefault();
    open(indexOf(a.getAttribute('data-open')));
  });

  modal.addEventListener('click', function (e) {
    if (e.target.closest('[data-close]')) close();
    var s = e.target.closest('[data-step]');
    if (s) step(+s.getAttribute('data-step'));
  });

  modal.addEventListener('cancel', function (e) {
    e.preventDefault();
    close();
  });

  modal.addEventListener('keydown', function (e) {
    if (e.defaultPrevented || e.altKey || e.metaKey || e.ctrlKey) return;
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'video' || tag === 'input') return;
    if (e.key === 'ArrowRight') {
      step(1);
      e.preventDefault();
    } else if (e.key === 'ArrowLeft') {
      step(-1);
      e.preventDefault();
    }
  });

  window.addEventListener('popstate', function () {
    var i = hashIndex();
    if (i >= 0) {
      if (modal.open && !closing) {
        if (i !== current) fill(i);
      } else {
        open(i, { push: false });
      }
    } else if (modal.open) {
      close({ fromHistory: true });
    }
  });

  // A link straight to a tool, such as /#typeforge, opens it.
  if (hashIndex() >= 0) open(hashIndex(), { push: false });
})();
