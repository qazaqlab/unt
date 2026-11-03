@echo off
chcp 65001 >nul
title UNT 140 ACADEMY (Local + Wi-Fi + Online)
cd /d "C:\Users\user\.gemini\antigravity\scratch\ubt-140-platform"
echo =====================================================================
echo UNT 140 ACADEMY — ПЛАТФОРМА ІСКЕ ҚОСЫЛУДА...
echo Компьютер үшін: http://localhost:3140
echo Смартфон / Планшет үшін: Сайт ішіндегі "Құрылғылар мен QR" батырмасын басыңыз
echo Онлайн нұсқа: https://qazaqlab.github.io/unt/
echo =====================================================================
start http://localhost:3140
node server.js
pause
