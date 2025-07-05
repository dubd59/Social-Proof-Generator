@echo off
REM Social Proof Generator - Quick Setup Script for Windows
REM This script helps you get the application running locally for testing

echo 🚀 Social Proof Generator - Quick Setup
echo ======================================

REM Check if Netlify CLI is installed
netlify --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 📦 Installing Netlify CLI...
    npm install -g netlify-cli
) else (
    echo ✅ Netlify CLI already installed
)

REM Install dependencies
echo 📦 Installing dependencies...
npm install

REM Create environment file for local testing
if not exist ".env" (
    echo 📝 Creating local environment file...
    copy .env.example .env
    echo.
    echo ⚠️  IMPORTANT: Edit .env file with your actual credentials before running!
    echo    - Supabase URL and keys
    echo    - Email service credentials
    echo.
)

echo 🔧 Setup complete! Next steps:
echo.
echo 1. Edit .env file with your credentials
echo 2. Run: netlify dev
echo 3. Visit:
echo    - Admin Panel: http://localhost:8888/admin
echo    - Public Form: http://localhost:8888/submit
echo.
echo 📚 See SETUP-CHECKLIST.md for detailed deployment instructions
pause
