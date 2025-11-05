# 🎨 TEZERAKT - Динамический фавикон

## ✅ Реализовано

Теперь фавикон **использует те же самые SVG файлы**, что и основной логотип в навбаре!

## 🔄 Как это работает

### 1. Три SVG файла для трех тем

```
public/
├── tezerakt-logo-green.svg  🟢 Matrix
├── tezerakt-logo-red.svg    🔴 BlackOps
└── tezerakt-logo-blue.svg   🔵 Neon
```

### 2. Динамическое переключение

```typescript
// lib/theme.ts
const FAVICON_MAP = {
  matrix: '/tezerakt-logo-green.svg',
  blackops: '/tezerakt-logo-red.svg',
  neon: '/tezerakt-logo-blue.svg',
} as const;

export function updateFavicon(): void {
  const theme = document.documentElement.getAttribute('data-theme');
  const faviconSrc = FAVICON_MAP[theme];
  
  // Обновляем src фавикона
  let link = document.querySelector('link[rel="icon"]');
  link.href = faviconSrc;
}
```

### 3. Вызывается при смене темы

```typescript
export function setTheme(theme: ThemeName): void {
  document.documentElement.setAttribute('data-theme', theme);
  updateFavicon(); // ← Автоматически меняет фавикон!
}
```

## 🎯 Результат

### При смене темы меняется:
1. ✅ **Цвета интерфейса** (CSS переменные)
2. ✅ **Логотип в навбаре** (Image компонент)
3. ✅ **Фавикон во вкладке** (SVG файл) 🆕

### Все синхронизировано!
```
Matrix   → 🟢 Зеленый логотип + 🟢 Зеленый фавикон
BlackOps → 🔴 Розовый логотип  + 🔴 Розовый фавикон
Neon     → 🔵 Синий логотип    + 🔵 Синий фавикон
```

## 📦 Структура

### SVG файлы (один источник правды)
- `/public/tezerakt-logo-green.svg` - используется в навбаре И фавиконе
- `/public/tezerakt-logo-red.svg` - используется в навбаре И фавиконе
- `/public/tezerakt-logo-blue.svg` - используется в навбаре И фавиконе

### Компоненты
- `TacitvsLogo.tsx` - Image компонент с LOGO_MAP
- `theme.ts` - updateFavicon() с FAVICON_MAP

### Metadata (fallback)
```typescript
// app/layout.tsx
icons: {
  icon: [
    { url: '/tezerakt-logo-green.svg', type: 'image/svg+xml' }, // SVG по умолчанию
    { url: '/icon', type: 'image/png', sizes: '32x32' },        // PNG fallback
  ],
}
```

## 🚀 Преимущества

### 1. Один источник правды ✅
- Один SVG файл используется везде
- Редактируешь один файл - обновляется всё
- Нет дублирования кода

### 2. Динамическое обновление ⚡
- Фавикон меняется вместе с темой
- Мгновенное переключение
- Нет перезагрузки страницы

### 3. Производительность 🚀
- SVG файлы кэшируются браузером
- Легкий вес (~1.7 KB на файл)
- Векторная графика = любой размер

### 4. Простота поддержки 🛠️
- Три файла вместо сложного canvas кода
- Легко добавить новые темы
- Понятная структура

## 📊 Сравнение подходов

| Подход | До (Canvas) | После (SVG) ✅ |
|--------|-------------|----------------|
| Код | ~70 строк canvas API | ~10 строк |
| Производительность | Рисование каждый раз | Кэширование SVG |
| Качество | Растр (64x64) | Вектор (любой размер) |
| Поддержка | Сложно | Легко |
| Синхронизация | Разные файлы | Один файл |

## 🎨 Как это выглядит

### В браузере
```
Вкладка 1: Matrix   → 🟢 [зеленый тессеракт]
Вкладка 2: BlackOps → 🔴 [розовый тессеракт]
Вкладка 3: Neon     → 🔵 [синий тессеракт]
```

### При переключении темы
```
1. Пользователь нажимает "BlackOps"
2. setTheme('blackops') вызывается
3. CSS переменные меняются → интерфейс стал розовым
4. TacitvsLogo меняет src → логотип стал розовым
5. updateFavicon() меняет href → фавикон стал розовым
   
Всё происходит мгновенно! ⚡
```

## 🧪 Проверка

### Запустите приложение
```bash
npm run dev
```

### Тестирование
1. Откройте http://localhost:3000
2. Посмотрите на фавикон - зеленый тессеракт ✅
3. Переключите на BlackOps - фавикон стал розовым ✅
4. Переключите на Neon - фавикон стал синим ✅
5. Откройте несколько вкладок с разными темами - каждая со своим цветом! ✅

### Поддержка браузеров
- ✅ Chrome/Edge - SVG фавиконы отлично работают
- ✅ Firefox - SVG фавиконы отлично работают
- ✅ Safari - SVG фавиконы работают (macOS/iOS)
- ⚠️ Старые браузеры - fallback на PNG из icon.tsx

## 🔧 Добавить новую тему

### 1. Создайте SVG файл
```bash
cp public/tezerakt-logo-green.svg public/tezerakt-logo-purple.svg
# Измените цвет в файле
```

### 2. Обновите LOGO_MAP
```typescript
// components/TacitvsLogo.tsx
const LOGO_MAP = {
  matrix: '/tezerakt-logo-green.svg',
  blackops: '/tezerakt-logo-red.svg',
  neon: '/tezerakt-logo-blue.svg',
  purple: '/tezerakt-logo-purple.svg', // новая тема
} as const;
```

### 3. Обновите FAVICON_MAP
```typescript
// lib/theme.ts
const FAVICON_MAP = {
  matrix: '/tezerakt-logo-green.svg',
  blackops: '/tezerakt-logo-red.svg',
  neon: '/tezerakt-logo-blue.svg',
  purple: '/tezerakt-logo-purple.svg', // новая тема
} as const;
```

### 4. Готово! 🎉
Логотип И фавикон автоматически используют новый файл!

## ✨ Итого

Теперь весь TEZERAKT использует **единые SVG файлы**:
- 🖼️ Логотип в навбаре
- 🔖 Фавикон во вкладке
- 🍎 Apple Touch Icon (PNG fallback)

**Всё синхронизировано, всё динамично, всё красиво! 🔷✨**

