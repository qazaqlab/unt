@echo off
chcp 65001 >nul
title GitHub-қа жүктеу: qazaqlab/unt
cd /d "C:\Users\user\.gemini\antigravity\scratch\ubt-140-platform"

echo =====================================================================
echo 🚀 ҰБТ 130/130 ПЛАТФОРМАСЫН GITHUB-ҚА ЖҮКТЕУ (qazaqlab/unt)
echo =====================================================================
echo.
echo Репозиторий: https://github.com/qazaqlab/unt.git
echo Бұтақ (Branch): main
echo.
echo ⏳ GitHub-қа жүктелуде (git push)...
git push -u origin main --force

if %errorlevel% neq 0 (
    echo.
    echo ❌ Жүктеу барысында қате шықты.
    echo Егер GitHub логин/пароль сұраса немесе браузер ашылса, растаңыз.
) else (
    echo.
    echo =====================================================================
    echo ✅ СӘТТІ ЖҮКТЕЛДІ!
    echo.
    echo Енді GitHub Pages арқылы сайтты қосу үшін (бар болғаны 2 қадам):
    echo 1. Браузерден ашыңыз: https://github.com/qazaqlab/unt/settings/pages
    echo 2. "Build and deployment" бөлімінен:
    echo    - Source: "Deploy from a branch"
    echo    - Branch: "main" және "/ (root)" таңдап, "Save" басыңыз.
    echo.
    echo 🌍 1 минуттан кейін сайтыңыз мына сілтемеде ашылады:
    echo    https://qazaqlab.github.io/unt/
    echo =====================================================================
)
echo.
pause
