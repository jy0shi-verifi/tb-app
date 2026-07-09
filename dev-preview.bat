@echo off
cd /d "C:\Users\Josh Birch\dev\tb-app"
set "PATH=C:\Program Files\nodejs;%PATH%"
call "C:\Program Files\nodejs\npm.cmd" run dev -- --port 5174 --strictPort
