Skill Sculptor

Skill Sculptor — веб-додаток для персоналізованого навчання з AI-генерованими планами навчання. Дозволяє створювати навички, відстежувати прогрес, генерувати плани навчання на базі AI, зберігати й управляти навчальним календарем та завданнями.

Ключові можливості

🎯 Персоналізовані плани навчання на базі AI (через Genkit / Google AI)

📊 Візуальна аналітика прогресу (Recharts)

📅 Інтерактивний календар (react-day-picker)

✅ Система завдань / чекбоксів

🔍 Пошук ресурсів для навчання

🌙 Підтримка світлої/темної тем

🧩 Аутентифікація, JWT токени для захищених API

🐳 Docker + docker-compose для швидкого запуску в контейнерах

Технологічний стек

Frontend / Framework: Next.js 14 (app router), React 18, TypeScript

UI / Styling: Tailwind CSS, Radix UI, lucide-react, class-variance-authority

Charts / UI components: Recharts, react-day-picker, embla-carousel

Backend (вбудований у Next.js): API Routes у src/app/api (Next server functions)

DB: MongoDB (офіційний драйвер mongodb)

AI: genkit + @genkit-ai/googleai (конфігурація у src/ai)

Auth: JWT (jsonwebtoken), bcryptjs

Tooling: TypeScript, ESLint, Prettier (за потреби), Docker

Важливі залежності знаходяться у package.json. У разі проблем зі збіркою проєкту зверни увагу на overrides у package.json (там є Git-override для ansi-color).

Структура репозиторію (скорочено)
/src
  /app
    /api
      /auth
        - login, register, verify
      /skills
        - route.ts
        - [id]/route.ts
      /learning-plans
        - route.ts
    page.tsx
    layout.tsx
  /components
  /lib
    - mongodb.ts
    - auth.ts
    - api.tsx
    - types.ts
  /ai
    - flows, genkit config
scripts/
  - init-db.js
Dockerfile
docker-compose.yml
package.json
tsconfig.json
README.md

Необхідні змінні середовища

Створіть .env.local (або .env) в корені проєкту з такими змінними:

# MongoDB
MONGODB_URI=<твій MongoDB URI, напр., mongodb+srv://...>
MONGODB_DB_NAME=skill_sculptor

# JWT
JWT_SECRET=your_jwt_secret_here

# AI (опціонально — для функціоналу генерації планів)
GOOGLE_API_KEY=<якщо використовуєте Google API>
GOOGLE_GENAI_API_KEY=<альтернативний ключ, якщо потрібен>

# Frontend (якщо треба)
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Node environment
NODE_ENV=development

Локальний розвиток — швидкий старт
1. Встановлення
git clone <repo-url>
cd skill-sculptor
npm install

2. Ініціалізація бази даних (опціонально)

Скрипт scripts/init-db.js створює початкові колекції/дані (використовує MONGODB_URI з .env.local):

npm run db:init

3. Режим розробки (Next.js)
npm run dev
# або
npm start   # за умови, що скрипт "start" налаштований для production

4. Типи і перевірки

Перевірити TypeScript типи / помилки:

npx tsc --noEmit


Lint:

npm run lint


Збірка для production:

npm run build
npm run start

Docker

Запуск через Docker Compose (локальна розробка/тестування):

docker-compose up --build


Dockerfile і docker-compose.yml вже включені в корінь проєкту.

API — найважливіші кінцеві точки

Усі API знаходяться під /api (Next.js server routes, src/app/api/...).

Auth

POST /api/auth/register — реєстрація

Тіло (JSON): { "email": string, "name": string, "password": string }

Повертає: { token, user } (JWT)

POST /api/auth/login — логін

Тіло: { "email": string, "password": string }

Повертає: { token, user }

GET /api/auth/verify — перевірка токена

Заголовок: Authorization: Bearer <token>

Повертає: { user } або помилку 401

Skills

GET /api/skills — список навичок поточного користувача (JWT required)

POST /api/skills — створити навичку

Тіло: { name, description?, category?, progress? }

GET /api/skills/[id] — отримати навичку

PUT /api/skills/[id] — оновити навичку

DELETE /api/skills/[id] — видалити навичку

Learning plans (AI)

POST /api/learning-plans — згенерувати / отримати плани навчання

Заголовок: Authorization: Bearer <token>

Тіло: залежить від UI (онбординг/параметри), API використовує Genkit/Google AI плагін

Детальний контракт (з точними полями) можна подивитися у файлах src/app/api/*/route.ts і у зонах src/lib/types.ts (має Zod схеми Onboarding і типи).

Корисні файли та місця для правок

src/lib/mongodb.ts — ініціалізація підключення до MongoDB і helper-и

src/lib/auth.ts — функції для валідації JWT і контекст аутентифікації (AuthProvider / useAuth)

src/lib/api.tsx — клієнтські хелпери API (fetch wrapper)

src/ai/* — конфіг та flows для AI (genkit)

src/components/* — UI компоненти (графіки, календар, панелі)

scripts/init-db.js — допоміжний скрипт для ініціалізації БД

Розробницькі підказки і відомі питання

Помилка Legacy octal escape is not permitted in strict mode
Якщо під час npm run dev бачите помилку із ansi-color, зверніть увагу, що в package.json вже є overrides для ansi-color. Можна:

Очистити node_modules і перевстановити: rm -rf node_modules package-lock.json && npm install

Якщо проблема лишається — додати/оновити залежність або вручну патчити пакет (використовуйте overrides/resolutions).

Помилки типів типу payload / label в Recharts
У деяких версіях recharts типи не містять payload у декларації Tooltip. У коді вжито локальні захисти (Array.isArray(payload) і any у компоненті тултіпа), щоб уникнути збою компіляції. Якщо оновлюєте recharts, перевірте відповідність типів.

Radix / UI packages missing
Якщо під час запуску зʼявляються помилки про модулі @radix-ui/*, переконайтесь, що встановлені відповідні пакети:

npm install @radix-ui/react-alert-dialog @radix-ui/react-popover @radix-ui/react-dropdown-menu @radix-ui/react-toast ...


AI keys (GenKit / Google AI)
Для функціоналу генерації планів необхідно задати GOOGLE_API_KEY або GOOGLE_GENAI_API_KEY. Якщо ключі не задані, відповідні AI-ендпоінти повернуть помилку/порожній результат.

TypeScript checks
Перевірка типів: npx tsc --noEmit. Якщо бачите помилки у компонентах, швидкий хак — тимчасово локально додати as any там, де типи сторонніх бібліотек не узгоджуються, а потім привести до коректних типів.

Тестування і lint

Лінт: npm run lint

Юніт-тести: в проєкті немає готових тестів; додавайте vitest / jest за потреби.

Деплой

Vercel: Next.js добре деплоїться на Vercel — додайте змінні оточення на сайті Vercel (MONGODB_URI, JWT_SECRET, GOOGLE_API_KEY та ін.)

Render / Heroku / DigitalOcean: аналогічно — потрібно встановити env vars і налаштувати build command npm run build та start npm start

Docker: використайте docker-compose up --build — сервіс nextjs уже налаштований у docker-compose.yml.

CONTRIBUTING

Відкрий issue або пул-реквест.

Дотримуйтесь стилю коду (Prettier / ESLint).

Пишіть тести для нової логіки (опціонально).

Далі (ідеї для розвитку)

Інтеграція з зовнішніми LMS / API курсів (Coursera, YouTube, MDN)

Персональні рекомендації на основі результатів (ML)

Розширена аналітика прогресу та прогнозування часу досягнення мети

Міжнародні локалізації (i18n)