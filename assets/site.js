/* ============================================================
   Shared behaviour for the portfolio (index.html + project.html)
   Everything is guarded so it no-ops on pages missing an element.
   ============================================================ */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hover = window.matchMedia('(hover: hover)').matches;

  /* ── i18n (English ⇄ Indonesian) ───────────────────────────
     Text lives inline on each element as data-en / data-id.
     Add `data-html` when the value contains markup.            */
  function getLang() {
    try { return localStorage.getItem('lang') || 'en'; } catch (e) { return 'en'; }
  }
  function applyLang(lang) {
    document.querySelectorAll('[data-en]').forEach(function (el) {
      var val = el.getAttribute('data-' + lang);
      if (val == null) return;
      if (el.hasAttribute('data-html')) el.innerHTML = val;
      else el.textContent = val;
    });
    // translatable attributes: data-en-attr="aria-label|...;title|..." style — kept simple here
    document.querySelectorAll('[data-en-aria]').forEach(function (el) {
      var v = el.getAttribute('data-' + lang + '-aria');
      if (v != null) el.setAttribute('aria-label', v);
    });
    document.documentElement.setAttribute('lang', lang);
    var t = document.getElementById('langToggle');
    if (t) {
      t.querySelectorAll('[data-lang]').forEach(function (s) {
        s.classList.toggle('on', s.getAttribute('data-lang') === lang);
      });
    }
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: lang } }));
  }
  var lang = getLang();
  applyLang(lang);
  var langToggle = document.getElementById('langToggle');
  if (langToggle) {
    langToggle.addEventListener('click', function () {
      lang = (getLang() === 'en') ? 'id' : 'en';
      try { localStorage.setItem('lang', lang); } catch (e) {}
      applyLang(lang);
    });
  }

  /* ── Theme toggle (dark ⇄ light) ───────────────────────────── */
  var themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var cur = document.documentElement.getAttribute('data-theme');
      var next = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', next === 'dark' ? '#060611' : '#e9ecfb');
    });
  }

  /* ── Scroll progress bar ───────────────────────────────────── */
  var bar = document.getElementById('progress');
  if (bar) {
    var onScroll = function () {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
    };
    document.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── Scroll reveal ─────────────────────────────────────────── */
  var reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    if ('IntersectionObserver' in window && !reduce) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
        });
      }, { threshold: 0.12 });
      reveals.forEach(function (el) { io.observe(el); });
      reveals.forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('visible');
      });
    } else {
      reveals.forEach(function (el) { el.classList.add('visible'); });
    }
  }

  /* ── Cursor-tracked glass glow + 3D tilt ───────────────────── */
  if (!reduce && hover) {
    document.querySelectorAll('.glass-card').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
    document.querySelectorAll('[data-tilt]').forEach(function (el) {
      var max = 7;
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'perspective(900px) rotateX(' + (-py * max) + 'deg) rotateY(' + (px * max) + 'deg) translateY(-4px)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  }

  /* ── Count-up stats ────────────────────────────────────────── */
  var counters = document.querySelectorAll('[data-count]');
  function runCount(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    if (reduce) { el.textContent = target; return; }
    var start = performance.now(), dur = 1400;
    function step(now) {
      var p = Math.min((now - start) / dur, 1);
      el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if (counters.length) {
    if ('IntersectionObserver' in window) {
      var co = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { runCount(e.target); co.unobserve(e.target); } });
      }, { threshold: 0.5 });
      counters.forEach(function (el) { co.observe(el); });
    } else { counters.forEach(runCount); }
  }

  /* ── Scrollspy nav ─────────────────────────────────────────── */
  var navLinks = {};
  document.querySelectorAll('.nav-links a[href^="#"]').forEach(function (a) {
    navLinks[a.getAttribute('href').slice(1)] = a;
  });
  var spyIds = Object.keys(navLinks);
  if (spyIds.length && 'IntersectionObserver' in window) {
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          spyIds.forEach(function (id) { navLinks[id].classList.remove('active'); });
          var id = e.target.getAttribute('id');
          if (navLinks[id]) navLinks[id].classList.add('active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    spyIds.forEach(function (id) { var s = document.getElementById(id); if (s) so.observe(s); });
  }

  /* ── Toast helper ──────────────────────────────────────────── */
  function toast(msg) {
    var t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('show'); });
    setTimeout(function () {
      t.classList.remove('show');
      setTimeout(function () { t.remove(); }, 500);
    }, 4200);
  }

  /* ── Easter egg: the Konami code summons the rain ──────────── *
   * A nod to Atmosfer (weather) & Naufragus (the ocean).        */
  var seq = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  var pos = 0, raining = false;
  document.addEventListener('keydown', function (e) {
    var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    pos = (k === seq[pos]) ? pos + 1 : (k === seq[0] ? 1 : 0);
    if (pos === seq.length) { pos = 0; makeItRain(); }
  });
  function makeItRain() {
    if (raining) return;
    raining = true;
    var layer = document.createElement('div');
    layer.className = 'rain-layer';
    var n = reduce ? 0 : 60;
    for (var i = 0; i < n; i++) {
      var d = document.createElement('span');
      d.className = 'raindrop';
      d.style.left = Math.random() * 100 + 'vw';
      d.style.animationDuration = (0.6 + Math.random() * 0.8) + 's';
      d.style.animationDelay = (Math.random() * 1.2) + 's';
      d.style.opacity = (0.3 + Math.random() * 0.5).toString();
      layer.appendChild(d);
    }
    document.body.appendChild(layer);
    toast(getLang() === 'id' ? '🌧️  Kamu menemukan hujannya — persis seperti Atmosfer.' : '🌧️  You found the rain — just like Atmosfer.');
    setTimeout(function () {
      layer.style.opacity = '0';
      setTimeout(function () { layer.remove(); raining = false; }, 1200);
    }, 8000);
  }

  /* ── Console greeting (for the curious dev) ────────────────── */
  try {
    var s1 = 'color:#8b7ef8;font-size:20px;font-weight:bold';
    var s2 = 'color:#22d3ee;font-size:12px';
    console.log('%cFadhiil Akmal Hamizan', s1);
    console.log('%cThanks for opening the console 👀  Try the Konami code: ↑ ↑ ↓ ↓ ← → ← → B A\nLet\'s build something → fadhiilhamizan2004@gmail.com', s2);
  } catch (e) {}
})();
