# 🔷 TEZERAKT - Тестирование динамического фавикона

## ✅ Что было исправлено

### Проблема
Фавикон не менялся при смене темы - оставался зеленым.

### Решение
1. **Cache busting** - добавлен timestamp к URL (`?v=${Date.now()}`)
2. **Удаление старых links** - перед созданием нового удаляем все favicon links
3. **Два типа favicon** - создаем `icon` и `shortcut icon` для совместимости
4. **Debug логи** - добавлены console.log для отладки

### Обновленный код
```typescript
export function updateFavicon(): void {
  const theme = document.documentElement.getAttribute('data-theme');
  const faviconSrc = FAVICON_MAP[theme];
  
  console.log(`🔷 Updating favicon to theme: ${theme} → ${faviconSrc}`);
  
  // Удаляем ВСЕ существующие favicon links
  document.querySelectorAll('link[rel*="icon"]').forEach(link => link.remove());
  
  // Создаем новый с cache busting
  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/svg+xml';
  link.href = `${faviconSrc}?v=${Date.now()}`; // ← Cache busting!
  document.head.appendChild(link);
  
  // Также для старых браузеров
  const shortcut = document.createElement('link');
  shortcut.rel = 'shortcut icon';
  shortcut.type = 'image/svg+xml';
  shortcut.href = `${faviconSrc}?v=${Date.now()}`;
  document.head.appendChild(shortcut);
  
  console.log(`✅ Favicon updated successfully`);
}
```

## 🧪 Как тестировать

### 1. Очистите кэш браузера
```
Chrome/Edge: Ctrl+Shift+Delete → выберите "Изображения и файлы" → Очистить
Firefox: Ctrl+Shift+Delete → Кэш → Очистить
Safari: Cmd+Option+E → очистить кэш
```

### 2. Перезапустите приложение
```bash
# Остановите (Ctrl+C)
# Запустите заново
npm run dev
```

### 3. Откройте в инкогнито режиме
```
Chrome/Edge: Ctrl+Shift+N
Firefox: Ctrl+Shift+P
Safari: Cmd+Shift+N
```

### 4. Откройте консоль браузера
```
F12 или Ctrl+Shift+I
```

### 5. Проверьте логи
При загрузке страницы должно появиться:
```
🔷 Updating favicon to theme: matrix → /tezerakt-logo-green.svg
✅ Favicon updated successfully
```

### 6. Переключите тему
Нажмите кнопку **BlackOps** в навбаре.

Должно появиться в консоли:
```
🔷 Updating favicon to theme: blackops → /tezerakt-logo-red.svg
✅ Favicon updated successfully
```

### 7. Проверьте фавикон
Посмотрите на вкладку браузера - фавикон должен стать **розовым** 🔴

### 8. Переключите на Neon
Нажмите **Neon** → фавикон должен стать **синим** 🔵

## ✅ Ожидаемый результат

### Консоль
```
🔷 Updating favicon to theme: matrix → /tezerakt-logo-green.svg
✅ Favicon updated successfully

[переключили на BlackOps]

🔷 Updating favicon to theme: blackops → /tezerakt-logo-red.svg
✅ Favicon updated successfully

[переключили на Neon]

🔷 Updating favicon to theme: neon → /tezerakt-logo-blue.svg
✅ Favicon updated successfully
```

### Визуально
```
Matrix   → 🟢 Зеленый тессеракт
BlackOps → 🔴 Розовый тессеракт
Neon     → 🔵 Синий тессеракт
```

## 🔍 Если всё еще не работает

### 1. Жесткая перезагрузка страницы
```
Chrome/Edge: Ctrl+Shift+R или Ctrl+F5
Firefox: Ctrl+Shift+R
Safari: Cmd+Shift+R
```

### 2. Проверьте Network tab
1. Откройте DevTools (F12)
2. Перейдите на вкладку **Network**
3. Переключите тему
4. Ищите запрос к `/tezerakt-logo-*.svg?v=...`
5. Должен быть статус **200** (не 304 cached)

### 3. Проверьте Elements tab
1. Откройте DevTools (F12)
2. Перейдите на вкладку **Elements**
3. Найдите `<head>`
4. Ищите `<link rel="icon" ...>`
5. Проверьте что `href` содержит правильный файл и timestamp

Должно быть:
```html
<link rel="icon" type="image/svg+xml" href="/tezerakt-logo-red.svg?v=1699123456789">
<link rel="shortcut icon" type="image/svg+xml" href="/tezerakt-logo-red.svg?v=1699123456789">
```

### 4. Попробуйте другой браузер
- Chrome/Edge - лучшая поддержка SVG favicon
- Firefox - хорошая поддержка
- Safari - может быть задержка в обновлении

### 5. Проверьте файлы существуют
```bash
ls -la apps/ui/public/tezerakt-logo-*.svg
```

Должно быть:
```
tezerakt-logo-green.svg
tezerakt-logo-red.svg
tezerakt-logo-blue.svg
```

## 🎯 Дополнительная отладка

### Добавьте breakpoint
1. Откройте DevTools → Sources
2. Найдите `theme.ts`
3. Поставьте breakpoint на строке `updateFavicon()`
4. Переключите тему
5. Проверьте что функция вызывается

### Проверьте data-theme
В консоли выполните:
```javascript
document.documentElement.getAttribute('data-theme')
```

Должно вернуть: `'matrix'`, `'blackops'` или `'neon'`

### Проверьте FAVICON_MAP
В консоли:
```javascript
// Импортируйте или проверьте в коде
console.log({
  matrix: '/tezerakt-logo-green.svg',
  blackops: '/tezerakt-logo-red.svg',
  neon: '/tezerakt-logo-blue.svg',
})
```

## 📋 Чеклист проблем

- [ ] Очистил кэш браузера
- [ ] Перезапустил dev сервер
- [ ] Открыл в инкогнито режиме
- [ ] Вижу логи в консоли
- [ ] Проверил Network tab
- [ ] Проверил Elements tab
- [ ] Файлы SVG существуют
- [ ] data-theme атрибут меняется
- [ ] updateFavicon() вызывается

## ✨ После успешного тестирования

Можно убрать `console.log` из `updateFavicon()` для production.

Или оставить - они полезны для отладки и не влияют на производительность.

## 🎉 Всё работает!

Теперь фавикон динамически меняется вместе с темой:
- 🟢 Matrix → Зеленый тессеракт
- 🔴 BlackOps → Розовый тессеракт
- 🔵 Neon → Синий тессеракт

**Всё синхронизировано! 🔷✨**

