@echo off
title Task Dashboard Launcher
color 0A
cls

echo.
echo  ========================================
echo       TASK DASHBOARD STARTING...
echo  ========================================
echo.

:: ── Purane servers band karo (agar chal rahe hon) ──
echo  [1/4] Purane servers band kar rahe hain...
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| find ":5000" ^| find "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| find ":3000" ^| find "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>&1
)
timeout /t 1 /nobreak >nul

:: ── Backend start karo ──
echo  [2/4] Backend server start ho raha hai...
start "Task Dashboard - Backend" /min cmd /k "cd /d C:\Users\Microsoft\.gemini\antigravity\scratch\task-dashboard\backend && node server.js"
timeout /t 3 /nobreak >nul

:: ── Frontend start karo ──
echo  [3/4] Frontend server start ho raha hai...
start "Task Dashboard - Frontend" /min cmd /k "cd /d C:\Users\Microsoft\.gemini\antigravity\scratch\task-dashboard\frontend && npm run dev"
timeout /t 5 /nobreak >nul

:: ── Browser kholo ──
echo  [4/4] Browser mein app khul raha hai...
start "" "http://localhost:3000"

echo.
echo  ========================================
echo   APP CHAL RAHA HAI!
echo   Browser mein dekho: http://localhost:3000
echo  ========================================
echo.
echo  (Yeh window band mat karo — servers is window
echo   ke band hone ke baad bhi chalte rahenge)
echo.
timeout /t 4 /nobreak >nul
exit
