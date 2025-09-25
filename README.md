# Adtell-react-app

## 🌍 Демо
[https://adtell-react-app.vercel.app](https://adtell-react-app.vercel.app)  
- **Frontend (Vercel):**

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
# Ads Integration (Prebid.js + GAM) — R&D
## Огляд
Навчальний проєкт з інтеграцією **Prebid.js** (header bidding) і fallback-режиму **Google Ad Manager (GAM)**.  
Рекламний аукціон винесено у **віртуальний модуль**, який можна вмикати/вимикати через `.env`.  
Є сторінка **`/ads-debug`** для логування подій аукціону та ручного `request/refresh`.

## Цілі
- Порівняти способи тригерити рендер: `getHighestCpmBids` vs `onEvent('bidResponse')`/`bidWon` vs `bidsBackHandler`.
- Перевірити інтеграцію з двома адаптерами: Adtelligent та Bidmatic.
- Забезпечити fallback на чистий Google Ad Manager (GAM) без Prebid.

## Архітектура
- **Prebid**: завантаження через `loadPrebid.ts`; конфіг `prebidConfig.ts`.
- **GAM**: завантаження через `loadGpt.ts`.
- **Вмикання/вимикання**: `virtual:ads-config` (`ENABLE_PREBID`, `ENABLE_GAM`, `ADS_DEBUG`).
- **Слоти**: `ad-top` (728x90/970x90), `ad-side` (300x250/300x600).
- **Логи**: сторінка `/ads-debug`, події `auctionInit/End, bidRequested, bidResponse, bidWon, noBid`.

## Стек

- **Vite + React + TS**
- **Prebid.js** (кастом/локальний білд з адаптерами → fallback на CDN)
- **Google Publisher Tag (GPT)**
- TailwindCSS (UI)
- Biome (літинг)

---

## Встановлення та запуск

```bash
npm i
npm run dev
# відкрийте http://localhost:5173
## Корисні скрипти:
```
```bash
npm run build    # прод-збірка
npm run preview  # перегляд прод-збірки
npm run test     # (за потреби)
npm run biome:fix # авто-лінинг/автофікси
```

## Файли/каталоги, що стосуються реклами
```bash
modules/
  prebid.auction.js   # JS-модуль з Prebid-аукціоном (автоінʼєкція слотів, івенти, render)
  google.only.js      # JS-модуль з чистим GPT (без Prebid)
```
```bash
public/
  prebid/
    prebid.js         # локальний Prebid build (fallback до CDN)
```
```bash
src/
  features/ads/AdsDebugPage.tsx  # /ads-debug — сторінка логів + кнопки Request/Refresh
  routes/AppRoutes.tsx           # маршрути; приховування /ads-debug, якщо ADS_DEBUG=false
  types/virtual-ads-module.d.ts  # типи для вірт. модуля (dev-зручність)
```
```bash
virtual:
  virtual:ads-module  # обирає prebid.auction.js або google.only.js на основі .env
  virtual:ads-config  # прокидує прапорці/значення з .env у рантайм
```

## .env — приклад і пояснення

Приклад .env:

## вибір модулю: prebid | google
VITE_ADS_MODULE=prebid

## прапорці
VITE_ENABLE_PREBID=true
VITE_ENABLE_GAM=false
VITE_ADS_DEBUG=true

## Bidmatic (опційно)
VITE_ENABLE_BIDMATIC=true
VITE_BIDMATIC_SOURCE=886409



## Таблиця змінних:

| Змінна                 | Значення             | За замовчуванням | Опис                                                                                                |
| ---------------------- | -------------------- | ---------------: | --------------------------------------------------------------------------------------------------- |
| `VITE_ADS_MODULE`      | `prebid` \| `google` |         `prebid` | Обирає віртуальний модуль: Prebid-аукціон або чистий GAM                                            |
| `VITE_ENABLE_PREBID`   | `true/false`         |           `true` | Вмикає роботу Prebid у модулі `prebid`                                                              |
| `VITE_ENABLE_GAM`      | `true/false`         |          `false` | Додає GPT (GAM). Якщо `true`, таргетинг із Prebid передається у GAM і робиться `pubads().refresh()` |
| `VITE_ADS_DEBUG`       | `true/false`         |           `true` | Вмикає сторінку `/ads-debug` і кнопки навігації; логування подій                                    |
| `VITE_ENABLE_BIDMATIC` | `true/false`         |           `true` | Підключення адаптера **bidmatic** (лише для юнітів з 300×250)                                       |
| `VITE_BIDMATIC_SOURCE` | number               |                — | Обовʼязкове для bidmatic: `params.source`                                                           |

## Як це працює

1. На старті застосунку імпортується virtual:ads-module і викликає initAds().

2. Модуль:

* інʼєктує два контейнери:

* ad-top — перед <main/>, авто-підбір ширини та росту, розміри: 970×90, 728×90, 468×60, 320×50;

* ad-side — fixed праворуч від контенту, розміри: 300×600, 300×250.

* додає плейсхолдери до рендера, логірує події у window.__adslog та диспатчить CustomEvent('ads:prebid');

* за потреби підвантажує Prebid (локальний білд → fallback на CDN) та GPT.

3. Рендер:

* без GAM (типово): після requestBids беремо переможців pbjs.getHighestCpmBids() і робимо pbjs.renderAd() у власний iframe (прямий рендер).

* з GAM: викликаємо pbjs.setTargetingForGPTAsync() і googletag.pubads().refresh() для слотів.

4. Refresh:

* Prebid: повторний requestBids → direct render або GPT refresh (залежно від прапорців);

* Google-only: просто googletag.pubads().refresh().

## Чому не на bidWon

bidWon приходить per-slot. Якщо слотів кілька, виникає гонка та часткове оновлення. Стабільніший підхід:

* дочекатися кінця аукціону (bidsBackHandler/auctionEnd);

* зробити один setTargetingForGPTAsync() і один pubads().refresh() на всі слоти.
Події bidResponse/bidWon ми все одно слухаємо — для метрик і дебагу.

## getHighestCpmBids vs onEvent('bidResponse')

* Без GAM (прямий рендер): брати переможців після аукціону через pbjs.getHighestCpmBids() і рендерити у свій iframe — найпростіше та керовано.

* З GAM: onEvent('bidResponse') корисний для логів/аналітики, але рендер виконуємо після bidsBackHandler → setTargetingForGPTAsync() → refresh().

## Адаптери

* adtelligent — завжди присутній (параметр aid: 350975).

* bidmatic — додається лише коли у юніті є розмір 300×250 (тобто ad-side) і вказано VITE_ENABLE_BIDMATIC=true та VITE_BIDMATIC_SOURCE.

* У дев-оточенні bidmatic інколи віддає timeout (це очікувано; у логах видно request timeout), але flow загалом коректний.

## Маршрути та UI

* / — головна (слоти інʼєктуються автоматично).

* /ads-debug — сторінка логів Prebid (працює лише коли VITE_ADS_DEBUG=true):

* Request & display — запустити аукціон і відрендерити.

* Refresh bids — оновити ставки/таргетинг (в обох інтеграціях).

Кнопка Ads test / Home в хедері автоматично змінює назву залежно від поточної сторінки й приховується, коли VITE_ADS_DEBUG=false.

## Відомі попередження

* Prebid WARNING: enableTIDs config denied 'transmitTid' — інформаційне; означає, що передачу TID вимкнено. На роботу демо не впливає.

## Відповідність тестовому завданню

* Розглянуто документацію Prebid і приклади адаптерів (див. Prebid репозиторій).

* Написано модуль рендера через Prebid.js (modules/prebid.auction.js).

* Підключення через віртуальний модуль (virtual:ads-module), керується через .env.

* Досліджено події Prebid і зроблено вивід логів на окремій сторінці /ads-debug.

* В коді прокоментовано, чому не рендеримо на bidWon.

* Порівняно getHighestCpmBids vs onEvent('bidResponse'), описано коли що застосовувати.

* Реклама рендериться на всіх сторінках (мінімум два блоки).

* Є два адаптери: Adtelligent і Bidmatic.

* Зроблено другий рекламний модуль — чистий GAM (modules/google.only.js).

* Зроблено refresh реклами для обох інтеграцій (кнопка на /ads-debug).

## Нотатки по верстці реклами

* ad-top вставляється перед основним контентом та не прилипає до краю екрана — має зовнішні відступи і максимальну ширину за обраним розміром.

* ad-side розміщується fixed праворуч від контейнера контенту з відступом; розміри підбираються автоматично (300×600 або 300×250).

## Траблшутінг

* Немає ставок від bidmatic: перевірте VITE_BIDMATIC_SOURCE і мережу; у дев-оточенні можливі timeouts — це нормально.

* GAM не показує рекламу: переконайтеся, що VITE_ENABLE_GAM=true і обраний модуль VITE_ADS_MODULE=google або prebid+GAM з правильними слотами.

## Корисні посилання

* Prebid.js: https://prebid.org/

* Репозиторій Prebid.js (адаптери): https://github.com/prebid/Prebid.js

Проєкт призначено для R&D/демо. У проді потрібні: власні плейсменти, реальні ад-юніти GAM, згода користувачів (TCF v2), перевірка приватності, білди з потрібними адаптерами та прод-конфігом Prebid.
