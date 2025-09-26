# Ads: Prebid + Google Ad Manager (GAM)

Коротко: показ відбувається **через GPT (Google Publisher Tag)**. Prebid робить аукціон, пише `hb_*` у GPT, далі **тільки** `googletag.pubads().refresh()` виконує мережевий запит та рендер. Якщо інвентар порожній або мережа вимкнена — показуємо **плейсхолдер / house-креатив**, слот **не колапсить**.

---

## Quick start

```bash
# встановити залежності
npm i
```
# dev
```bash
npm run dev
```
# перевірка та авто-стіксування стилю коду
```bash
npm run biome
npm run biome:fix
.env (приклад)
dotenv
Копіювати код
```
# вибір модуля
```bash
VITE_ADS_MODULE=prebid          # prebid | google
```
# GAM
```bash
VITE_ENABLE_GAM=true            # вмикає GPT/Google
VITE_GAM_NETWORK=false          # false = локальна перевірка без мережі (без червоних CORS у консолі)
VITE_ADS_DEBUG=true
```
# Prebid / Bidmatic
```bash
VITE_ENABLE_BIDMATIC=true
VITE_BIDMATIC_SOURCE=886409
VITE_BIDMATIC_SPN=my-partner    # передається в bidmatic як params.spn
У проді замініть демо-юніти /1234567/ad-top|ad-side на реальні: /NETWORK_CODE/ad-top|ad-side.
```
| Режим                           | Налаштування                                                              | Очікувана поведінка                                                                                            |
| ------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Full path через GAM**         | `VITE_ADS_MODULE=prebid`, `VITE_ENABLE_GAM=true`, `VITE_GAM_NETWORK=true` | Prebid → `setTargetingForGPTAsync()` → GPT `refresh()` → рендер оголошення; або house при порожньому інвентарі |
| **Prebid + GPT (без мережі)**   | `VITE_ENABLE_GAM=true`, `VITE_GAM_NETWORK=false`                          | Мережі немає; плейсхолдер/house лишається; івенти логуються                                                    |
| **Prebid-only (прямий рендер)** | `VITE_ENABLE_GAM=false`                                                   | Виграшні креативи рендеряться напряму `pbjs.renderAd`                                                          |
| **Чистий GAM (demo)**           | `VITE_ADS_MODULE=google`, `VITE_ENABLE_GAM=true`, `VITE_GAM_NETWORK=true` | Лише GPT; при `isEmpty` — house/плейсхолдер; слот не колапсить                                                 |


## Що реалізовано
* modules/prebid.auction.js: аукціон, лог подій, setTargetingForGPTAsync(), googletag.pubads().refresh() (коли ввімкнено GAM), фолбек на прямий рендер, плейсхолдери, spn для Bidmatic.

* modules/google.only.js: ініціалізація GPT, слоти, slotRenderEnded, house/плейсхолдер, без collapseEmptyDivs() (слот не зникає), підтримка VITE_GAM_NETWORK=false.

* Сітковий таргетинг: page-level site, section, env, prebid + slot-level pos.

## QA-скрипт (як перевіряти)
1. Full GAM: переконайтесь, що після pbjs.requestBids викликається setTargetingForGPTAsync() і далі pubads().refresh(); при isEmpty бачимо house/плейсхолдер.

2. No-network: VITE_GAM_NETWORK=false — мережевих запитів до gampad/ads немає, плейсхолдер/house на місці.

3. Prebid-only: VITE_ENABLE_GAM=false — виграшні креативи рендеряться в iframe; без ставок — сірий банер лишається.

4. Чистий GAM: без Prebid — при isEmpty показуємо house/плейсхолдер.

У логах має бути послідовність:
pbjs.requestBids → setTargetingForGPTAsync → googletag.pubads().refresh() → slotRenderEnded.

## Необхідно в GAM (прод)
* Ad units: /NETWORK_CODE/ad-top (970×90, 728×90, 468×60, 320×50) та /NETWORK_CODE/ad-side (300×600, 300×250).

* KV під Prebid: дозволити hb_bidder, hb_pb, hb_adid, hb_size, hb_format, hb_source, hb_uuid (або відповідно до вашої версії Prebid).

* Line items з таргетингом на hb_*.

* Додати домен сайту у Sites (GAM).

## Типові повідомлення/помилки
* gampad/ads … 400 + CORS у деві — очікувано для демо-юнітів або без валідного сеансу. На UX не впливає: слот закриваємо house/плейсхолдером.

* isEmpty: true у slotRenderEnded — немає матчу в line item: показуємо house, слот не колапсить.

## Acceptance Criteria
* Показ з Prebid+GAM виконується лише через GPT (googletag.*), без власних fetch до gampad/ads.

* При відсутності інвентаря слот не зникає (house/плейсхолдер).

* Видно чіткий ланцюжок у логах: requestBids → setTargetingForGPTAsync → refresh → slotRenderEnded.

* Page/slot таргетинг застосовується (перевірка через GPT Debug/консоль).

## Примітки
* Для house-креативів покладіть зображення в /public/house/* або змініть шляхи в modules/google.only.js.

* Якщо лінтер лається на forEach з поверненням значення — замініть виклик на for..of або forEach(() => { ... }).