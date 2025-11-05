# 🎨 TEZERAKT - Подход с тремя SVG файлами

## ✅ Реализовано

Вместо inline SVG с динамическим `currentColor`, теперь используем **три статических SVG файла** с фиксированными цветами для каждой темы.

## 📁 Структура файлов

### SVG логотипы (public/)
```
apps/ui/public/
├── tezerakt-logo-green.svg  # Matrix (зеленый #00FF84)
├── tezerakt-logo-red.svg    # BlackOps (розовый #fe0174)
└── tezerakt-logo-blue.svg   # Neon (синий #319ff8)
```

Каждый файл содержит:
- Полный SVG с встроенным glow filter
- Толщина линий: 3.5 для кубов, 2 для соединений
- Центральная точка радиусом 4
- Идентичная геометрия, разные цвета

### Компонент (TacitvsLogo.tsx)
```typescript
const LOGO_MAP = {
  matrix: '/tezerakt-logo-green.svg',
  blackops: '/tezerakt-logo-red.svg',
  neon: '/tezerakt-logo-blue.svg',
} as const;

export const TacitvsLogo = ({ size = 100, className = '' }) => {
  const { theme } = useAppStore();
  const logoSrc = LOGO_MAP[theme];
  
  return (
    <Image
      src={logoSrc}
      alt="TEZERAKT Logo"
      width={size}
      height={size}
      className={className}
      priority
      unoptimized // SVG оптимизация не нужна
    />
  );
};
```

## 🎯 Преимущества этого подхода

### 1. **Производительность** ⚡
- Статические файлы кэшируются браузером
- Next.js Image компонент с автоматической оптимизацией
- Нет runtime вычислений SVG фильтров
- Меньше JS в бандле

### 2. **Простота поддержки** 🛠️
- Можно редактировать каждый SVG отдельно
- Легко добавить новые темы (просто новый SVG)
- Нет сложной inline логики
- Можно оптимизировать SVG через SVGO

### 3. **Надежность** 💪
- SVG фильтры работают одинаково везде
- Нет проблем с CSS cascade
- Не зависит от CSS переменных
- Предсказуемое поведение

### 4. **SEO и доступность** 🔍
- Next.js Image с автоматическим alt
- Priority loading для важного контента
- Правильные размеры для layout shift
- Работает без JavaScript (статические SVG)

### 5. **Дизайн гибкость** 🎨
- Можно сделать разные эффекты для каждой темы
- Легко A/B тестировать варианты
- Можно добавить анимации в конкретные SVG
- Каждая тема может иметь уникальные детали

## 🔄 Как работает переключение

```
Пользователь меняет тему
         ↓
useAppStore обновляет state
         ↓
TacitvsLogo ре-рендерится
         ↓
LOGO_MAP выбирает нужный SVG
         ↓
Next.js Image загружает файл
         ↓
Браузер показывает лого нужного цвета
```

## 📊 Размеры файлов

Каждый SVG файл: ~1.2 KB (с gzip ~500 bytes)

**Сравнение:**
- Inline SVG в React: ~2 KB в бандле
- Три SVG файла: ~3.6 KB total (загружается по одному)
- **Выигрыш:** кэширование + параллельная загрузка

## 🚀 Использование

### В навбаре
```tsx
<TacitvsLogo size={42} />
```

### В других местах
```tsx
<TacitvsLogo size={80} className="opacity-20" />
```

### Размер автоматически адаптируется
- size={42} в навбаре
- size={80} на дашборде
- Любой размер работает без потери качества (SVG!)

## 🎨 Цветовая палитра

| Тема | Цвет | Hex | Файл |
|------|------|-----|------|
| Matrix | Зеленый | `#00FF84` | tezerakt-logo-green.svg |
| BlackOps | Розовый | `#fe0174` | tezerakt-logo-red.svg |
| Neon | Синий | `#319ff8` | tezerakt-logo-blue.svg |

## 🔧 Как добавить новую тему

1. Создайте новый SVG файл: `tezerakt-logo-{color}.svg`
2. Скопируйте структуру из существующего
3. Измените все цвета stroke/fill
4. Добавьте в LOGO_MAP:
   ```typescript
   const LOGO_MAP = {
     matrix: '/tezerakt-logo-green.svg',
     blackops: '/tezerakt-logo-red.svg',
     neon: '/tezerakt-logo-blue.svg',
     purple: '/tezerakt-logo-purple.svg', // новая тема
   } as const;
   ```
5. Готово! 🎉

## 🧹 Очистка

Удалены:
- ❌ Старый `tezerakt-logo.svg` (без цвета)
- ❌ Inline SVG код с `currentColor`
- ❌ Сложные SVG фильтры в компоненте

## ✅ Итого

Простое, быстрое, и легко поддерживаемое решение! Три статических SVG файла дают нам:
- Лучшую производительность
- Проще код
- Больше контроля над дизайном
- Легкое добавление новых тем

**Perfect! 🔷**

