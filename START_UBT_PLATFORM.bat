@echo off
chcp 65001 >nul
title UBT 130/130 FizMat Platform (Local + Wi-Fi + Online HTTPS)
cd /d "C:\Users\user\.gemini\antigravity\scratch\ubt-140-platform"
echo =====================================================================
echo 🚀 ҰБТ 130/130 ФИЗМАТ ПЛАТФОРМАСЫ ІСКЕ ҚОСЫЛУДА...
echo 💻 Ноутбук үшін: http://localhost:3140
echo 📱 Телефон / Планшет үшін: Сайт ішіндегі "Телефоннан кіру (QR)" батырмасын бас!
echo =====================================================================
start http://localhost:3140
node server.js
pause
