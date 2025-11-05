# 🔷 TEZERAKT - Favicon Fix

## Проблема
Фавикон не отображался, показывался дефолтный Next.js.

## Решение

### 1. Создали динамические фавиконы через Next.js API
Создали два файла:
- `apps/ui/app/icon.tsx` - основной фавикон 32x32
- `apps/ui/app/apple-icon.tsx` - Apple Touch Icon 180x180

Эти файлы используют `next/og` ImageResponse API для генерации PNG фавиконов с нашим TEZERAKT логотипом.

### 2. Обновили metadata в layout.tsx
```typescript
export const metadata: Metadata = {
  title: "TEZERAKT - Quant Terminal",
  description: "Professional quant trading terminal - EV-first, venue-agnostic",
  icons: {
    icon: [
      { url: '/icon', type: 'image/png', sizes: '32x32' },
    ],
    apple: [
      { url: '/apple-icon', type: 'image/png', sizes: '180x180' },
    ],
  },
};
```

### 3. Как это работает
- Next.js автоматически обрабатывает файлы `icon.tsx` и `apple-icon.tsx` в папке `app/`
- Они генерируют PNG изображения во время билда
- Браузер получает правильный фавикон с TEZERAKT логотипом (зеленый тессеракт)

### 4. После запуска приложения
Выполните:
```bash
npm run dev
# или
npm run build && npm start
```

Затем откройте в браузере и обновите страницу (Ctrl+F5 или Cmd+Shift+R) чтобы очистить кэш.

### 5. Проверка
- Откройте вкладку браузера - должен быть виден зеленый геометрический логотип (тессеракт)
- Если все еще старый - очистите кэш браузера полностью
- Можно проверить в инкогнито режиме

## Динамический фавикон (бонус)
Функция `updateFavicon()` в `lib/theme.ts` также обновляет фавикон при смене темы (но это работает не во всех браузерах). Статические фавиконы через `icon.tsx` - основное решение.

## Цвет фавикона
По умолчанию фавикон использует Matrix зеленый цвет (#00FF84). Если хотите изменить:
1. Откройте `app/icon.tsx`
2. Измените `stroke="#00FF84"` и `fill="#00FF84"` на нужный цвет
3. Пересоберите приложение

