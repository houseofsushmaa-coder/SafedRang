@echo off
title SafedRang Admin - Dev Server
echo ============================================
echo   SAFED RANG - Admin Panel Running
echo ============================================
echo.

:: Go to repo root
cd /d "d:\safed rang"

:: Pull latest from GitHub first
echo [1/2] GitHub se latest code pull kar raha hoon...
powershell -ExecutionPolicy Bypass -File "d:\safed rang\scripts\auto-pull.ps1" -Once
echo.

:: Start dev server
echo [2/2] Dev server start kar raha hoon...
echo Admin Panel: http://localhost:5173/admin
echo.
powershell -ExecutionPolicy Bypass -Command "cd 'D:\safed rang'; npm --prefix frontend run dev"

pause
