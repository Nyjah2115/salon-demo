/* Studio Fryzur Ambra — logika strony (projekt demonstracyjny) */
(function () {
  'use strict';

  /* Znacznik dla CSS: dopiero z tą klasą wolno chować cokolwiek do animacji.
     Bez JavaScriptu (albo gdyby skrypt padł) strona ma być normalnie czytelna. */
  document.documentElement.classList.add('js');

  /* ——— telefon w jednym miejscu ———
     Wszystkie przyciski „Zadzwoń" i numer w sekcji Kontakt biorą się stąd.
     Zmiana numeru = zmiana tych dwóch linijek, nic więcej. */
  var TELEFON = '+48123456789';
  var TELEFON_LADNY = '123 456 789';

  if (TELEFON) {
    document.querySelectorAll('[data-telefon]').forEach(function (el) {
      el.href = 'tel:' + TELEFON;
      if (el.textContent.trim() === 'do uzupełnienia') el.textContent = TELEFON_LADNY;
    });
  } else {
    document.querySelectorAll('a[data-telefon]').forEach(function (el) {
      el.removeAttribute('href');
      el.style.cursor = 'default';
    });
  }

  /* ——— który plik wideo pobierać ———
     Na wąskim ekranie (i przy włączonej oszczędności danych) leci wersja
     o niższym bitrate: 0,6 MB zamiast 3,4. Rozdzielczość zostaje ta sama,
     więc obraz nadal jest ostry — spada tylko ilość danych, którą telefon
     musi zdążyć pobrać i zdekodować. */
  var polacz = navigator.connection || {};
  var LEKKIE = window.innerWidth < 860 || polacz.saveData === true ||
               /2g|slow-2g|3g/.test(polacz.effectiveType || '');

  function plikWideo(podstawa) {
    return LEKKIE ? podstawa.replace('.mp4', '-mobile.mp4') : podstawa;
  }

  /* ——— hero: wideo gra raz, potem zostaje jego ostatnia klatka ——— */
  var hero = document.querySelector('.hero');
  var media = document.getElementById('heroMedia');
  var video = document.getElementById('heroVideo');
  var nav = document.getElementById('nav');
  var otwarte = false;

  function otworz() {
    if (otwarte) return;
    otwarte = true;
    media.classList.add('jest-otwarte');
    nav.classList.add('jest-widoczny');
  }

  /* Napisy wchodzą, gdy kadr zdąży się rozjaśnić (ok. 3 s),
     a tło przejmuje obraz dopiero po końcu klipu. */
  setTimeout(function () { hero.classList.add('jest-gotowy'); }, 2600);

  if (video) {
    video.src = plikWideo('media/hero/hero.mp4');
    video.addEventListener('ended', otworz);
    var proba = video.play();
    if (proba && proba.catch) {
      proba.catch(function () { hero.classList.add('jest-gotowy'); otworz(); });
    }
  } else {
    otworz();
  }
  setTimeout(otworz, 9000);            // bezpiecznik, gdyby autoplay nie ruszył

  /* ——— menu na telefonie ——— */
  var burger = document.querySelector('.nav__burger');
  var linki = document.querySelector('.nav__linki');
  burger.addEventListener('click', function () {
    var otw = linki.classList.toggle('jest-otwarte');
    burger.setAttribute('aria-expanded', String(otw));
  });
  linki.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') {
      linki.classList.remove('jest-otwarte');
      burger.setAttribute('aria-expanded', 'false');
    }
  });

  /* ——— nawigacja pokazuje się też przy scrollu; przy okazji wyłączam
         animacje hero, gdy zjedzie z ekranu — inaczej telefon liczy je
         w kółko do końca wizyty ——— */
  window.addEventListener('scroll', function () {
    if (window.scrollY > 60) nav.classList.add('jest-widoczny');
    hero.classList.toggle('poza-ekranem', window.scrollY > window.innerHeight);
  }, { passive: true });

  /* ——— wejścia sekcji przy przewijaniu ———
     Każdy element dostaje opóźnienie zależne od tego, którym jest dzieckiem
     swojego rodzica (modulo 3). W siatkach daje to kaskadę rzędami, a w bloku
     nagłówka kolejność: etykieta → tytuł → akapit. Animacja gra raz. */
  var DO_ANIMACJI = [
    '.etykieta', '.naglowek', '.cennik__wstep', '.galeria__wstep',
    '.kontakt__zachęta', '.btn--duzy', '.kontakt__dane', '.karta',
    '.cennik__grupa', '.cennik__stopka', '.kafel', '.kontakt__prawa',
    '.stopka__logo', '.stopka__adres', '.stopka__prawa'
  ].join(', ');

  var KROK = 0.1;   // sekundy między sąsiadami w rzędzie

  var obserwator = new IntersectionObserver(function (wpisy) {
    wpisy.forEach(function (w) {
      if (!w.isIntersecting) return;
      w.target.classList.add('jest-widoczny');
      obserwator.unobserve(w.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -10% 0px' });

  document.querySelectorAll('section, footer').forEach(function (sekcja) {
    if (sekcja.classList.contains('hero')) return;   // hero ma własną animację
    sekcja.querySelectorAll(DO_ANIMACJI).forEach(function (el) {
      var rodzenstwo = Array.prototype.indexOf.call(el.parentElement.children, el);
      el.classList.add('anim');
      el.style.setProperty('--anim-zw', (rodzenstwo % 3) * KROK + 's');
      obserwator.observe(el);
    });
  });

  /* Pozycje w cenniku i wiersze godzin animują się wewnątrz swojego bloku —
     opóźnienie liczone po kolei, żeby lista „spływała" z góry na dół. */
  document.querySelectorAll('.cennik__grupa dl > div, .godziny tbody tr').forEach(function (el) {
    var i = Array.prototype.indexOf.call(el.parentElement.children, el);
    el.style.setProperty('--anim-zw', (0.18 + i * 0.06) + 's');
  });

  /* ——— kursor-nożyczki ———
     Nożyczki płyną za myszką z interpolacją, przy kliknięciu ostrza się schodzą,
     a nad elementem klikalnym rosną. Pętla `rysuj` zatrzymuje się, gdy kursor
     dogoni wskaźnik, więc nic nie mieli procesora w tle. */
  var kursor = document.getElementById('kursor');
  if (kursor && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.documentElement.classList.add('kursor-nozyczki');

    var KLIKALNE = 'a, button, summary, label, [role="button"], .btn, .kafel, .nav__burger';
    var celX = window.innerWidth / 2, celY = window.innerHeight / 2;
    var kx = celX, ky = celY, klatka = null, ruszony = false, ciachTimer = null;

    var rysuj = function () {
      kx += (celX - kx) * 0.35;
      ky += (celY - ky) * 0.35;
      kursor.style.transform = 'translate(' + kx.toFixed(1) + 'px, ' + ky.toFixed(1) + 'px) translate(-50%, -50%)';
      klatka = (Math.abs(celX - kx) > 0.3 || Math.abs(celY - ky) > 0.3)
        ? requestAnimationFrame(rysuj)
        : null;
    };

    window.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      celX = e.clientX;
      celY = e.clientY;

      if (!ruszony) {                       // pierwszy ruch — pojaw się na miejscu
        ruszony = true;
        kx = celX; ky = celY;
        kursor.style.transform = 'translate(' + kx + 'px, ' + ky + 'px) translate(-50%, -50%)';
        kursor.classList.add('jest-widoczny');
      }

      kursor.classList.toggle('nad-klikalnym', !!(e.target.closest && e.target.closest(KLIKALNE)));
      if (!klatka) klatka = requestAnimationFrame(rysuj);
    }, { passive: true });

    window.addEventListener('mousedown', function () {
      kursor.classList.add('ciach');
      clearTimeout(ciachTimer);
      ciachTimer = setTimeout(function () { kursor.classList.remove('ciach'); }, 110);
    });

    document.addEventListener('mouseleave', function () { kursor.classList.remove('jest-widoczny'); });
    document.addEventListener('mouseenter', function () { if (ruszony) kursor.classList.add('jest-widoczny'); });
  }

  /* ——— ciepła poświata za myszką ———
     Płynie wolniej niż nożyczki, więc ciągnie się za nimi jak miękki cień. */
  var poswiata = document.getElementById('poswiata');
  if (poswiata && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var pcelX = window.innerWidth / 2, pcelY = window.innerHeight / 2;
    var px = pcelX, py = pcelY, pklatka = null, pruszony = false;

    var plyn = function () {
      px += (pcelX - px) * 0.14;
      py += (pcelY - py) * 0.14;
      poswiata.style.transform = 'translate3d(' + px.toFixed(1) + 'px, ' + py.toFixed(1) + 'px, 0)';
      pklatka = (Math.abs(pcelX - px) > 0.4 || Math.abs(pcelY - py) > 0.4)
        ? requestAnimationFrame(plyn)
        : null;
    };

    window.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      pcelX = e.clientX;
      pcelY = e.clientY;
      if (!pruszony) {
        pruszony = true;
        px = pcelX; py = pcelY;
        poswiata.style.transform = 'translate3d(' + px + 'px, ' + py + 'px, 0)';
        poswiata.classList.add('jest-widoczny');
        return;
      }
      if (!pklatka) pklatka = requestAnimationFrame(plyn);
    }, { passive: true });

    document.addEventListener('mouseleave', function () { poswiata.classList.remove('jest-widoczny'); });
    document.addEventListener('mouseenter', function () { if (pruszony) poswiata.classList.add('jest-widoczny'); });
  }

  /* ——— galeria: podstaw zdjęcie, jeśli plik istnieje ———
     Dzięki temu wystarczy wrzucić 1.jpg…6.jpg do media/foto/ i nic nie zmieniać w kodzie. */
  document.querySelectorAll('.kafel[data-foto]').forEach(function (kafel) {
    var url = kafel.dataset.foto;
    var probny = new Image();
    probny.onload = function () {
      kafel.style.backgroundImage = 'url("' + url + '")';
      kafel.classList.add('ma-foto');
    };
    probny.src = url;
  });

  /* ——— podświetl dzisiejszy dzień w godzinach ——— */
  var wiersze = document.querySelectorAll('.godziny tbody tr');
  var dzis = (new Date().getDay() + 6) % 7;   // 0 = poniedziałek
  if (wiersze[dzis]) wiersze[dzis].classList.add('jest-dzis');

  document.getElementById('rok').textContent = new Date().getFullYear();

  /* ——— wariant hero z URL: ?hero=a ——— */
  var wariant = new URLSearchParams(location.search).get('hero');
  if (wariant === 'a' && video) {
    video.src = 'media/hero/hero-wariant-a.mp4';
    video.load();
    video.play().catch(function () {});
  }
})();
