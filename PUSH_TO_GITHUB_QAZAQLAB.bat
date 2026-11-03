@echo off
chcp 65001 >nul
title GitHub-қа жүктеу: qazaqlab/unt
cd /d "C:\Users\user\.gemini\antigravity\scratch\ubt-140-platform"

echo =====================================================================
echo UNT 140 ACADEMY — GITHUB-ҚА ЖҮКТЕУ (qazaqlab/unt)
echo =====================================================================
echo.
echo Репозиторий: https://github.com/qazaqlab/unt.git
echo Бұтақ (Branch): main
echo.
echo GitHub-қа жүктелуде (git push)...
git push -u origin main

if %errorlevel% neq 0 (
    echo.
    echo Жүктеу барысында қате шықты.
) else (
    echo.
    echo =====================================================================
    echo СӘТТІ ЖҮКТЕЛДІ!
    echo.
    echo Сайттың тікелей онлайн сілтемесі:
    echo    https://qazaqlab.github.io/unt/
    echo =====================================================================
)
echo.
pause
