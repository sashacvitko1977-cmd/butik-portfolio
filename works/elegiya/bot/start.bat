@echo off
chcp 65001 >nul
cd /d "%~dp0"

if not exist "node_modules\" (
  echo Устанавливаю зависимости...
  call npm.cmd install
  if errorlevel 1 (
    echo Ошибка npm install
    pause
    exit /b 1
  )
)

if not exist ".env" (
  echo.
  echo Файл .env не найден. Копирую из .env.example
  copy /Y ".env.example" ".env" >nul
  echo.
  echo ========================================
  echo  Откройте bot\.env и вставьте BOT_TOKEN
  echo  от @BotFather, затем запустите снова.
  echo ========================================
  echo.
  notepad ".env"
  pause
  exit /b 0
)

echo Запуск бота Элегия...
node server.js
pause
