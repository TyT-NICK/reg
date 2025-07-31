# GasLine Client

Минимальная инструкция по запуску проекта на Next.js с TypeScript.

## Установка зависимостей

```bash
npm install
```

## Переменные окружения

Создать в корне файл .env.local с нужными переменными

```env
WSDL_URL=
WSDL_LOGIN=
WSDL_PASSWORD= // если пароль содержит символ #, то нужно его обернуть в кавычки ""
```

## Запуск в разработке

```bash
npm run dev
```

Открыть http://localhost:3000

## Сборка и запуск продакшена

```bash
npm run build
npm run start
```
