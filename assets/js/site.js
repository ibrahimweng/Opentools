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
    var slide = node.closest('.hero-slide');
    if (slide && !slide.classList.contains('is-active')) return false;
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

  /* Grid, index and the tool row of the navigation ---------------------- */

  var grid = $('[data-grid]');
  grid.innerHTML =
    tools
      .map(function (t, i) {
        return (
          '<a class="tile' + (i === 0 ? ' tile--wide' : '') + '" href="#' + esc(t.slug) + '" data-open="' + esc(t.slug) + '">' +
          '<span class="tile-media">' + media(t) + '</span>' +
          '<span class="caption"><span class="caption-name">' + esc(t.name) + '</span><span class="caption-tag">' + esc(t.tagline) + '</span></span>' +
          '</a>'
        );
      })
      .join('') +
    '<a class="tile tile--soon" href="' + esc(site.github) + '" target="_blank" rel="noopener">' +
    '<span class="tile-media"><span class="soon"><span class="soon-plus" aria-hidden="true"></span><span>In the workshop</span></span></span>' +
    '<span class="caption"><span class="caption-name">More</span><span class="caption-tag">New tools land here first.</span></span>' +
    '</a>';

  $('[data-index]').innerHTML = tools
    .map(function (t) {
      return (
        '<li><a class="person" href="#' + esc(t.slug) + '" data-open="' + esc(t.slug) + '">' +
        '<span class="person-name">' + esc(t.name) + '</span>' +
        '<span class="person-role">' + esc(t.category) + '</span>' +
        '</a></li>'
      );
    })
    .join('');

  $('[data-nav-tools]').innerHTML = tools
    .map(function (t) {
      return '<a class="nav-link" href="#' + esc(t.slug) + '" data-open="' + esc(t.slug) + '">' + esc(t.name) + '</a>';
    })
    .join('');

  track(grid);

  /* Hero ----------------------------------------------------------------
     A showreel when one is set, otherwise each tool in turn. */

  var hero = $('[data-hero]');
  var heroName = $('[data-hero-name]');
  var heroTag = $('[data-hero-tag]');
  var heroCount = $('[data-hero-count]');
  var heroLink = $('[data-hero-link]');
  var heroAt = 0;
  var heroTimer = null;
  var HERO_DWELL = 6000;

  if (site.reel) {
    hero.innerHTML = '<div class="hero-slide is-active"><video src="' + esc(site.reel) + '" muted loop playsinline autoplay preload="auto"></video></div>';
    heroName.textContent = site.name;
    heroTag.textContent = 'Focused tools for designers.';
    heroLink.addEventListener('click', function () {
      $('#tools').scrollIntoView();
    });
    hero.addEventListener('click', function () {
      $('#tools').scrollIntoView();
    });
  } else {
    hero.innerHTML = tools
      .map(function (t, i) {
        return '<div class="hero-slide' + (i === 0 ? ' is-active' : '') + '">' + media(t) + '</div>';
      })
      .join('');

    var showHero = function (i) {
      heroAt = (i + tools.length) % tools.length;
      $$('.hero-slide', hero).forEach(function (s, j) {
        s.classList.toggle('is-active', j === heroAt);
      });
      var t = tools[heroAt];
      heroName.textContent = t.name;
      heroTag.textContent = t.tagline;
      heroCount.textContent = pad(heroAt + 1) + ' / ' + pad(tools.length);
      heroLink.setAttribute('aria-label', 'Open ' + t.name);
      refresh();
    };

    var heroVisible = true;
    var scheduleHero = function () {
      clearTimeout(heroTimer);
      if (reduced.matches || tools.length < 2) return;
      heroTimer = setTimeout(function () {
        if (heroVisible && !modalOpen && !document.hidden) showHero(heroAt + 1);
        scheduleHero();
      }, HERO_DWELL);
    };

    if (io) {
      new IntersectionObserver(function (e) {
        heroVisible = e[0].isIntersecting;
      }).observe(hero);
    }

    var openHero = function () {
      open(heroAt);
    };
    hero.addEventListener('click', openHero);
    heroLink.addEventListener('click', openHero);

    // In a frame wider than a preview, fit the drawing to the height and let
    // its background run out to the sides, rather than blowing it up.
    var fitHero = function () {
      var wide = hero.clientWidth / Math.max(1, hero.clientHeight) > 1.6;
      $$('.pv-svg', hero).forEach(function (s) {
        s.setAttribute('preserveAspectRatio', wide ? 'xMidYMid meet' : 'xMidYMid slice');
      });
    };
    window.addEventListener('resize', fitHero);
    fitHero();

    showHero(0);
    scheduleHero();
  }

  track(hero);

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
    $$('[data-open]', $('[data-nav-tools]')).forEach(function (a, j) {
      a.classList.toggle('is-current', modalOpen && j === i);
    });
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
      $$('.is-current', $('[data-nav-tools]')).forEach(function (a) {
        a.classList.remove('is-current');
      });
      refresh();
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

  /* Section highlighting in the navigation ----------------------------- */

  var spyLinks = $$('[data-spy]');
  var spyTargets = [
    ['top', $('.hero')],
    ['tools', $('#tools')],
    ['index', $('#index')],
    ['about', $('#about')],
  ];
  var spyQueued = false;

  function spy() {
    spyQueued = false;
    var line = window.innerHeight * 0.45;
    var at = 'top';
    spyTargets.forEach(function (s) {
      if (s[1] && s[1].getBoundingClientRect().top <= line) at = s[0];
    });
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) at = 'about';
    spyLinks.forEach(function (a) {
      a.classList.toggle('is-current', a.getAttribute('data-spy') === at);
    });
  }

  window.addEventListener(
    'scroll',
    function () {
      if (!spyQueued) {
        spyQueued = true;
        requestAnimationFrame(spy);
      }
    },
    { passive: true }
  );
  window.addEventListener('resize', spy);
  spy();
})();
