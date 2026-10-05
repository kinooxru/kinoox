@echo off
set "PATH=C:\Users\Admin\.cargo\bin;D:\KINOOX\.tools\node\node-v24.21.0-win-x64;%PATH%"
cd /d D:\KINOOX\apps\desktop
call node.exe "D:\KINOOX\.tools\node\node-v24.21.0-win-x64\node_modules\pnpm\bin\pnpm.cjs" exec tauri build --bundles nsis > "D:\KINOOX\.tools\tauri_build.log" 2>&1
echo EXIT_CODE=%ERRORLEVEL% >> "D:\KINOOX\.tools\tauri_build.log"
