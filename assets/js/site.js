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

  function renderIndex() {
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
  }

  renderIndex();

  /* Hero -----------------------------------------------------------------
     The name in glitter. It stops while a pop-up covers it. */

  var glitterCanvas = $('[data-glitter]');
  var glitter =
    glitterCanvas && window.OpenToolsGlitter ? new window.OpenToolsGlitter(glitterCanvas, { text: site.name, reduced: reduced }) : null;

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
    if (glitter) glitter.pause();
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
      if (glitter) glitter.resume();
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

  /* Content from the studio ----------------------------------------------
     The title, bio and tools are edited in Sanity, at /studio. The page shows
     the copy in index.html and tools.js straight away and swaps in the
     studio's version when it arrives. Until something is published there,
     or if Sanity cannot be reached, the page keeps its own copy. */

  var STUDIO_API = 'https://hha7i7up.apicdn.sanity.io/v2025-02-19/data/query/production';
  var STUDIO_QUERY =
    '{"tools": *[_type == "tool" && !(_id in path("drafts.**")) && hidden != true && defined(slug.current)]' +
    ' | order(orderRank asc){name, "slug": slug.current, tagline, category, url,' +
    ' "video": video.asset->url, "poster": poster.asset->url, lead, description,' +
    ' "features": features[]{title, description}, runs, stack, source},' +
    ' "settings": *[_id == "siteSettings"][0]{title, bio}}';

  // The bio arrives as paragraphs of text runs, some of them links.
  function safeHref(href) {
    return /^(https?:|mailto:)/i.test(href || '') ? href : '';
  }

  function bioHTML(blocks) {
    return (blocks || [])
      .map(function (b) {
        if (!b || b._type !== 'block') return '';
        var links = {};
        (b.markDefs || []).forEach(function (d) {
          if (d && d._type === 'link') links[d._key] = safeHref(d.href);
        });
        var html = (b.children || [])
          .map(function (span) {
            var out = esc(span.text).replace(/\n/g, '<br>');
            (span.marks || []).forEach(function (m) {
              if (!links[m]) return;
              var external = !/^mailto:/i.test(links[m]);
              out =
                '<a href="' + esc(links[m]) + '"' + (external ? ' target="_blank" rel="noopener"' : '') + '>' + out + '</a>';
            });
            return out;
          })
          .join('');
        return /\S/.test(html) ? '<p>' + html + '</p>' : '';
      })
      .join('');
  }

  var siteName = $('#site-name');
  var bio = $('[data-bio]');
  var hero = $('.hero');

  function applySettings(s) {
    var title = String(s.title || '').trim();
    if (title) {
      siteName.textContent = title;
      document.title = title;
      if (hero) hero.setAttribute('aria-label', title);
      if (glitterCanvas) {
        glitterCanvas.setAttribute(
          'aria-label',
          'The word ' + title + ', written as a gap in a field of silver glitter. Drag the word to move it.'
        );
      }
      if (glitter) glitter.setText(title);
    }
    var html = bioHTML(s.bio);
    if (html) bio.innerHTML = html;
  }

  function fromStudio(d) {
    return {
      slug: d.slug,
      name: d.name || '',
      tagline: d.tagline || '',
      category: d.category || '',
      url: d.url || '',
      video: d.video || '',
      poster: d.poster || '',
      source: d.source || '',
      lead: d.lead || '',
      // Paragraphs are separated by an empty line in the studio.
      about: (d.description || '')
        .split(/\n\s*\n/)
        .map(function (p) {
          return p.trim();
        })
        .filter(Boolean),
      features: (d.features || []).map(function (f) {
        return [f.title || '', f.description || ''];
      }),
      runs: d.runs || '',
      stack: d.stack || '',
    };
  }

  if (window.fetch) {
    fetch(STUDIO_API + '?perspective=published&query=' + encodeURIComponent(STUDIO_QUERY))
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (res) {
        var r = res && res.result;
        if (!r) return;
        if (r.settings) applySettings(r.settings);
        var list = r.tools;
        if (!list || !list.length) return;
        var showing = modal.open && current >= 0 ? tools[current] : null;
        tools = list.map(fromStudio);
        renderIndex();
        if (showing) {
          // A pop-up opened before the studio answered: keep it on the same
          // tool, and refresh it only if the studio says something different.
          var j = indexOf(showing.slug);
          if (j < 0) close();
          else if (JSON.stringify(tools[j]) !== JSON.stringify(showing)) fill(j);
          else current = j;
        } else if (hashIndex() >= 0) {
          // A link to a tool that only the studio knows about.
          open(hashIndex(), { push: false });
        }
      })
      .catch(function () {});
  }
})();
