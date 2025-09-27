# Research: показ реклами через Prebid + Google, використовуючи **лише Google API**

## TL;DR
Єдиний офіційний клієнтський спосіб показати оголошення з Google Ad Manager (GAM) — **через GPT (Google Publisher Tag)**.  
Схема: **Prebid** робить аукціон → записує `hb_*` ключі в GPT → **GPT** виконує мережевий запит і рендерить.  
Будь-які REST/HTTP звернення напряму до `gampad/ads` без GPT непідтримувані (CORS/куки/політики).

---

## Ціль
Підтвердити, що ми можемо показувати рекламу в режимі **Prebid + GAM**, викликаючи **тільки методи Google** для запиту/рендеру, і зафіксувати мінімальний робочий код/потік.

---

## Висновки дослідження
- **Показ → тільки GPT**: методи `googletag.*` (ініціалізація бібліотеки, визначення слотів, `pubads().refresh()`).
- **Ad Manager API / AdSense API** — для конфігів/звітності, але **не** повертають креативи для фронтенд-рендеру.
- **Прямі fetch до `gampad/ads`** офіційно не для клієнтів (CORS + відсутність потрібних куків/підписів).
- Тому **правильний потік**:
  1) `googletag.defineSlot(...)`, `pubads.disableInitialLoad()` (коли з Prebid), `enableSingleRequest()`.
  2) `pbjs.requestBids(...)`.
  3) `pbjs.setTargetingForGPTAsync()` → записує `hb_*` у GPT.
  4) `googletag.pubads().refresh()` → **єдиний виклик, який робить мережевий запит і рендер**.

---

## Мінімальний код (сутність для демонстрації)

> Цей фрагмент слугує демо/документацією. У проді цей потік у нас уже реалізований у модулях.

```html
<div id="ad-top" style="min-height:50px"></div>
<div id="ad-side" style="width:300px;height:600px"></div>
<script>
  // 1) Google Publisher Tag — ЄДИНИЙ спосіб показу з боку Google
  window.googletag = window.googletag || { cmd: [] };
  (function loadGPT() {
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://securepubads.g.doubleclick.net/tag/js/gpt.js';
    document.head.appendChild(s);
  })();

  // 2) Оголошуємо слоти тільки через GPT
  googletag.cmd.push(() => {
    const pubads = googletag.pubads();
    pubads.disableInitialLoad();        // важливо з Prebid (чекаємо hb-таргетингу)
    pubads.enableSingleRequest();
    pubads.setCentering(true);

    // Page-level таргетинг (приклад)
    pubads.setTargeting('site', location.hostname);
    pubads.setTargeting('section', location.pathname.replace(/\//g, '_') || 'home');

    // Слоти
    googletag.defineSlot('/1234567/ad-top',
      [[970,90],[728,90],[468,60],[320,50]],
      'ad-top'
    )?.addService(pubads).setTargeting('pos','top');

    googletag.defineSlot('/1234567/ad-side',
      [[300,600],[300,250]],
      'ad-side'
    )?.addService(pubads).setTargeting('pos','side');

    // Лог події рендеру (для дебагу/фолбеку)
    pubads.addEventListener('slotRenderEnded', (ev) => {
      console.log('[GAM] slotRenderEnded', ev.slot.getSlotElementId(), ev);
      // якщо ev.isEmpty === true — показуємо house/сірий банер (у нас реалізовано модулем)
    });

    googletag.enableServices();
    googletag.display('ad-top');
    googletag.display('ad-side');
  });

  // 3) Prebid: аукціон → таргетинг → refresh у GPT
  window.pbjs = window.pbjs || { que: [] };
  pbjs.que.push(() => {
    pbjs.addAdUnits([
      { code:'ad-top',  mediaTypes:{banner:{sizes:[[970,90],[728,90],[468,60],[320,50]]}}, bids:[/* bidders */] },
      { code:'ad-side', mediaTypes:{banner:{sizes:[[300,600],[300,250]]}},                bids:[/* bidders */] },
    ]);

    pbjs.requestBids({
      adUnitCodes: ['ad-top','ad-side'],
      timeout: 2000,
      bidsBackHandler() {
        pbjs.setTargetingForGPTAsync();                 // записує hb_* у GPT
        googletag.cmd.push(() => googletag.pubads().refresh()); // запит/рендер робить ТІЛЬКИ GPT
      },
    });
  });
</script>