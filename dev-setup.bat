@echo off
echo ========================================
echo Chatsy Desktop - Development Setup
echo ========================================
echo.

echo Installing dependencies...
npm install

echo.
echo Starting development mode...
echo The application will open in a new window.
echo Press Ctrl+C to stop the development server.
echo.

npm run dev

pause
