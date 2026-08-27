@echo off

cd /d "%~dp0"

echo ==============================
echo Starting Backend API...
echo ==============================

start "Backend API" cmd /k "node src/backend/server.js"

echo.
echo Waiting for Backend...
timeout /t 2 /nobreak > nul

echo.
echo ==============================
echo Starting Frontend...
echo ==============================

start "Frontend" cmd /k "npx http-server src/frontend -p 5500"

echo.
echo Waiting for Frontend...
timeout /t 2 /nobreak > nul


echo.
echo ==============================
echo Application started!
echo ==============================

pause