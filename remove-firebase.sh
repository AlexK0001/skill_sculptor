#!/bin/bash

echo "🧹 Очищення Next.js проекту від Firebase Studio..."

# Видалення Firebase конфігураційних файлів
echo "Видалення Firebase конфігураційних файлів..."
rm -f .firebaserc
rm -f firebase.json
rm -f firestore.rules
rm -f firestore.indexes.json
rm -f storage.rules
rm -rf .firebase/

# Видалення Firebase Studio специфічних файлів
rm -f .env.local.example
rm -f src/lib/firebase.ts
rm -f src/lib/firebase.js
rm -f firebase-debug.log
rm -f ui-debug.log

# Резервне копіювання package.json
cp package.json package.json.backup

# Видалення Firebase залежностей з package.json
echo "Видалення Firebase залежностей..."
npm uninstall firebase @firebase/app @firebase/auth @firebase/firestore @firebase/storage firebase-tools firebase-admin firebase-functions firebase/app firebase/auth firebase/firestore

# Пошук і видалення Firebase імпортів у файлах
echo "Очищення Firebase імпортів з коду..."
find . -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" | grep -v node_modules | while read file; do
    # Створення резервної копії файлу
    cp "$file" "$file.backup"
    
    # Видалення Firebase імпортів
    sed -i '/import.*firebase/d' "$file"
    sed -i '/import.*@firebase/d' "$file"
    sed -i '/from ['"'"'"]firebase/d' "$file"
    sed -i '/from ['"'"'"]@firebase/d' "$file"
    sed -i '/from ['"'"'"]\.\./g' "$file"
    
    # Видалення Firebase конфігурації
    sed -i '/const firebaseConfig/,/};/d' "$file"
    sed -i '/initializeApp/d' "$file"
    sed -i '/getFirestore/d' "$file"
    sed -i '/getAuth/d' "$file"
    sed -i '/getStorage/d' "$file"
    
    # Видалення Firebase Studio специфічного коду
    sed -i '/firebase\/app/d' "$file"
    sed -i '/firebase\/auth/d' "$file"
    sed -i '/firebase\/firestore/d' "$file"
done

# Створення нового package.json для Next.js
echo "Створення нового package.json..."
cat > package.json << 'EOF'
{
  "name": "skill-sculptor",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "export": "next export"
  },
  "dependencies": {
    "next": "14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "axios": "^1.6.0",
    "@next/font": "^14.1.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "eslint": "^8.56.0",
    "eslint-config-next": "14.1.0",
    "typescript": "^5.3.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
EOF

# Встановлення нових залежностей
echo "Встановлення залежностей..."
npm install

# Створення базової структури Next.js проекту
echo "Створення базової структури..."
mkdir -p src/app
mkdir -p src/components
mkdir -p src/lib
mkdir -p src/utils
mkdir -p public
mkdir -p styles

# Створення next.config.js
cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost'],
  },
}

module.exports = nextConfig
EOF

# Створення базового layout.tsx
cat > src/app/layout.tsx << 'EOF'
import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Skill Sculptor',
  description: 'Веб-додаток для розвитку навичок',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="uk">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
EOF

# Створення базового page.tsx
cat > src/app/page.tsx << 'EOF'
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold">Skill Sculptor</h1>
        <p className="text-xl">Ласкаво просимо до вашого додатку для розвитку навичок!</p>
      </div>
    </main>
  )
}
EOF

# Створення globals.css
cat > src/app/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 214, 219, 220;
  --background-end-rgb: 255, 255, 255;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-start-rgb: 0, 0, 0;
    --background-end-rgb: 0, 0, 0;
  }
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
}
EOF

# Створення базового README
cat > README.md << 'EOF'
# Skill Sculptor

Веб-додаток для розвитку навичок.

## Запуск проекту

```bash
# Встановлення залежностей
npm install

# Запуск у режимі розробки
npm start

# Збірка для продакшену
npm run build
```

## Docker

```bash
# Запуск через Docker Compose
docker-compose up -d
```
EOF

echo "✅ Очищення завершено!"
echo "📁 Резервні копії збережено з розширенням .backup"
echo "🚀 Проект готовий до запуску як повноцінний веб-додаток"