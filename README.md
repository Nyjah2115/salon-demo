# Studio Fryzur Ambra — projekt demonstracyjny

Jednostronicowa strona salonu fryzjerskiego. **Salon nie istnieje**: nazwa,
nazwisko, adres i numer telefonu są wymyślone, a strona ma `noindex`, żeby nie
trafiła do wyszukiwarek i nie została wzięta za ofertę prawdziwej firmy.
Projekt służy do pokazywania warsztatu.

## Pliki
```
index.html      cała treść strony
style.css       style (kremowa biel, espresso, karmel)
script.js       hero, menu mobilne, kursor-nożyczki, wejścia sekcji
media/hero/     wideo hero i klatki z niego wycięte
media/foto/     zdjęcia do galerii — puste, kafelki czekają na materiał
tools/          drobne narzędzia w Swifcie (patrz niżej)
```

## Podgląd
`python3 -m http.server 8913 --directory .` albo konfiguracja `salon-demo`
w `.claude/launch.json`.

## Co jest na stronie
Hero z wideo, sześć usług, cennik w czterech grupach, galeria czekająca na
zdjęcia, kontakt z godzinami i podświetleniem dzisiejszego dnia, stopka.

**Galeria** sama podstawi zdjęcia, gdy pojawią się pliki `media/foto/1.jpg`
… `6.jpg` — skrypt sprawdza, czy plik istnieje, i dopiero wtedy ustawia tło.

**Telefon** siedzi w dwóch zmiennych na górze [script.js](script.js) i równolegle
w `index.html`, żeby linki `tel:` działały nawet bez JavaScriptu.

## Hero
Wideo pochodzi z generatora (Kling v3.0): pasmo włosów odrzucone ruchem głowy,
kadr otwiera się na wnętrze salonu. Klip leci **raz, bez pętli** i kończy się
jasnym kadrem, więc przejście na statyczne tło (klatka z 4,2 s wycięta do
`salon.jpg`) jest niewidoczne. Potem tło bardzo powoli najeżdża i przepływa
przez nie ciepła poświata — obie animacje stają, gdy hero zjedzie z ekranu.

Na wąskich ekranach ładuje się lżejszy plik (`hero-mobile.mp4`, 0,6 MB zamiast
3,4) — wybiera go `plikWideo()` po szerokości okna i `navigator.connection`.

## Kursor
Na desktopie systemowy kursor zastępują nożyczki: płyną za myszką z interpolacją,
przy kliknięciu ostrza się schodzą, a nad elementem klikalnym rosną. Włącza się
wyłącznie przy `(hover: hover) and (pointer: fine)`.

## Skalowanie
Sprawdzone od **280 px do 3440 px szerokości** i od **320 px wysokości**.
Typografia siedzi w `rem`, a `html` ma `font-size: clamp(15.5px, 13.95px +
0.16vw, 19.5px)`. Siatki mają ustaloną liczbę kolumn (Usługi 1/2/3, Cennik
1/2/4, Galeria 1/2/3/4, Kontakt 1/2), dobraną tak, żeby liczba elementów
dzieliła się przez nią bez reszty i nie zostawała pusta komórka.

Hero pilnuje też wysokości: tytuł ma `min(10vw, 13vh)`, odstępy są liczone
w `vh`, a progi `max-height: 620/450/360px` ściskają pasek i odstępy, żeby na
telefonie trzymanym poziomo przyciski zostały nad zgięciem.

## Bez JavaScriptu
Wszystko, co chowa treść do animacji, jest podpięte pod klasę `js` dodawaną
przez skrypt do `<html>`. Bez JS strona jest po prostu widoczna, a nie pusta.
`prefers-reduced-motion` wyłącza ruch całkowicie.

## Narzędzia
| Plik | Do czego |
|---|---|
| `tools/podglad.swift` | ładuje stronę w WKWebView, przewija, wykonuje podane JS i drukuje wynik — do testów układu na wielu rozdzielczościach |
| `tools/klatki.swift` | wycina klatki z wideo do JPG |
| `tools/lekkie.swift` | przekodowuje wideo na niższy bitrate (macOS nie ma ffmpeg) |
| `tools/pingpong.swift` | montuje klip „tam i z powrotem", żeby zapętlał się bez szwu |
