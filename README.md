# AdTell React App

Сучасний новинний додаток з рекламою, аналітикою та віртуальними модулями.

## 🚀 Технології

- **React 18** - UI бібліотека
- **TypeScript** - строга типізація
- **Vite** - швидкий бандлер
- **Tailwind CSS 4** - стилізація
- **React Router** - маршрутизація
- **Zustand** - управління станом
- **TanStack Query** - кешування даних
- **React Hook Form + Zod** - форми та валідація
- **Sentry** - моніторинг помилок
- **Prebid.js** - рекламні аукціони

## 📁 Структура проекту

```
src/
├── main.tsx              # Точка входу
├── App.tsx              # Головний компонент
├── components/           # UI компоненти
│   ├── ads/             # Рекламні компоненти
│   ├── form/            # Форми
│   ├── ui/              # Базові UI компоненти
│   ├── Header.tsx       # Шапка
│   ├── Footer.tsx       # Підвал
│   └── Layout.tsx       # Основний layout
├── features/            # Функціональність
│   ├── auth/            # Авторизація
│   ├── news/            # Новини
│   ├── ads/             # Реклама
│   └── stats/           # Аналітика
├── lib/                 # Утиліти та сервіси
│   ├── ads/             # Рекламна логіка
│   ├── analytics/       # Аналітика
│   ├── api.ts           # API клієнт
│   └── sentry.ts        # Sentry конфігурація
├── store/               # Zustand стор
├── types/               # TypeScript типи
└── routes/              # Маршрути
```

## 🛠 Встановлення

```bash
# Встановлення залежностей
npm install

# Запуск в режимі розробки
npm run dev

# Збірка для продакшена
npm run build

# Прев'ю збірки
npm run preview
```

## 🔧 Налаштування

Створіть файл `.env`:

```env
# API
VITE_API_URL=http://localhost:3000

# Реклама
VITE_ENABLE_ADS=true
VITE_AD_STACK=prebid

# Аналітика
VITE_ENABLE_STATS=true

# Sentry (опціонально)
VITE_SENTRY_DSN=your-sentry-dsn
```

## 🚀 Запуск

### Локальна розробка

```bash
# Запуск dev сервера
npm run dev

# Запуск тестів
npm test

# Лінтинг
npm run lint

# Форматування
npm run format
```

### Production Build

```bash
# Збірка
npm run build

# Прев'ю збірки
npm run preview
```

## 🎨 UI/UX

### Tailwind CSS 4
- Сучасна система дизайну
- Mobile-first підхід
- Темна/світла тема
- Адаптивний дизайн

### Компоненти
- **Button** - кнопки з варіантами
- **Input** - поля вводу
- **Card** - картки контенту
- **Modal** - модальні вікна
- **Loader** - індикатори завантаження

## 📱 Сторінки

### Авторизація
- **Login** - вхід в систему
- **Register** - реєстрація
- **Profile** - профіль користувача

### Новини
- **Feed** - стрічка новин
- **Article** - повна стаття
- **Search** - пошук новин

### Реклама
- **Ad Slots** - рекламні слоти
- **Auction Logs** - логи аукціонів
- **Ad Demo** - демонстрація реклами

## 🎯 Рекламна система

### Віртуальні модулі
Проект використовує віртуальні модулі для ізоляції реклами:

- `virtual:ads-module` - завантаження Prebid.js
- `virtual:ads-config` - конфігурація адаптерів
- `modules/prebid.auction.js` - логіка аукціонів

### Рекламні провайдери
1. **Власна гарна реклама** - кастомні креативи
2. **Adtelligent** - зовнішній провайдер
3. **Bidmatic** - зовнішній провайдер

### Ad Slots
- `ad-top-adtelligent` - топ банер
- `ad-right-adtelligent` - права панель
- `ad-right-bidmatic` - права панель Bidmatic
- `ad-left-beautiful` - ліва панель (власна)
- `ad-mobile-bidmatic` - мобільна реклама

## 📊 Аналітика

### Події
- `pageLoad` - завантаження сторінки
- `auctionInit` - початок аукціону
- `auctionEnd` - завершення аукціону
- `bidRequested` - запит ставки
- `bidResponse` - відповідь ставки
- `bidWon` - виграна ставка

### Відправка даних
```typescript
// Надійна відправка через sendBeacon
function sendStat(payload: unknown) {
  const url = `${import.meta.env.VITE_API_URL}/api/stats/ingest`;
  const blob = new Blob([JSON.stringify(payload)], { 
    type: "application/json" 
  });
  
  if (!navigator.sendBeacon(url, blob)) {
    fetch(url, { 
      method: "POST", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify(payload) 
    }).catch(() => {});
  }
}
```

## 🔍 Моніторинг

### Sentry
- Відстеження помилок
- Performance моніторинг
- Session Replay
- User context

### Конфігурація
```typescript
// Відключення в dev режимі
if (import.meta.env.MODE === "development" && !import.meta.env.VITE_SENTRY_DSN) {
  console.log("🔍 Sentry disabled in development mode");
  return;
}
```

## 🧪 Тестування

```bash
# Запуск тестів
npm test

# Запуск з покриттям
npm run test:coverage

# Watch режим
npm run test:watch
```

### Структура тестів
- `App.test.tsx` - головний компонент
- `features/auth/LoginForm.test.tsx` - форма входу
- `features/news/Feed.test.tsx` - стрічка новин
- `components/ui/Button.test.tsx` - UI компоненти
- `store/auth.test.ts` - стор авторизації

## 🎨 Стилізація

### Tailwind CSS 4
```css
/* Кастомні стилі */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Темна тема */
@media (prefers-color-scheme: dark) {
  :root {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
  }
}
```

### Компоненти
```tsx
// Приклад використання
<Button 
  variant="primary" 
  size="lg" 
  className="w-full"
>
  Увійти
</Button>
```

## 🚀 Оптимізація

### Code Splitting
- Lazy loading компонентів
- Динамічні імпорти
- Route-based splitting

### Performance
- React.memo для компонентів
- useMemo для обчислень
- useCallback для функцій
- Віртуалізація списків

### Bundle Analysis
```bash
# Аналіз розміру бандлу
npm run build:analyze
```

## 🔒 Безпека

- **CSP** - Content Security Policy
- **HTTPS** - захищене з'єднання
- **XSS Protection** - захист від XSS
- **CSRF Protection** - захист від CSRF

## 📱 PWA

### Service Worker
- Кешування ресурсів
- Offline підтримка
- Background sync

### Manifest
- Іконки додатку
- Назва та опис
- Кольори теми

## 🚀 Деплой

### Vercel
```bash
# Встановлення Vercel CLI
npm i -g vercel

# Деплой
vercel --prod
```

### Environment Variables
```env
VITE_API_URL=https://api.yourapp.com
VITE_SENTRY_DSN=your-sentry-dsn
VITE_ENABLE_ADS=true
```

## 📝 Ліцензія

MIT License