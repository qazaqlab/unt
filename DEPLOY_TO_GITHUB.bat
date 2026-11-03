@echo off
chcp 65001 >nul
title GitHub & Vercel-ге сайтты жүктеу (130/130 ҰБТ)
cd /d "C:\Users\user\.gemini\antigravity\scratch\ubt-140-platform"

echo =====================================================================
echo 🚀 ҰБТ 130/130 ПЛАТФОРМАСЫН GITHUB PAGES НЕ VERCEL-ГЕ ЖҮКТЕУ
echo =====================================================================
echo.
echo 1-қадам: GitHub.com сайтында жаңа репозиторий ашыңыз (мысалы: ubt-140)
echo.
set /p REPO_URL="GitHub репозиторийіңіздің сілтемесін қойыңыз (мысалы: https://github.com/login/ubt-140.git): "

if "%REPO_URL%"=="" (
    echo.
    echo ❌ Сілтеме енгізілмеді! Бағдарлама тоқтатылды.
    pause
    exit /b
)

echo.
echo ⏳ GitHub-қа жүктелуде...
git remote remove origin >nul 2>&1
git remote add origin %REPO_URL%
git branch -M main
git push -u origin main --force

echo.
echo =====================================================================
echo ✅ СӘТТІ ЖҮКТЕЛДІ!
echo.
echo Енді репозиторийіңіздің:
echo 1) "Settings" (Баптаулар) -> "Pages" бөліміне өтіңіз.
echo 2) "Branch: main", папканы "/ (root)" етіп "Save" басыңыз.
echo 3) 1 минуттан соң сайтыңыз кез келген телефон мен ноутбуктен ашылады:
echo    https://<логиніңіз>.github.io/<репозиторий>/
echo.
echo Немесе Vercel.com сайтында "Add New Project" басып, осы репозиторийді таңдаңыз!
echo =====================================================================
pause
