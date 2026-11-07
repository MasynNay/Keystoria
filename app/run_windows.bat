@echo off
REM Double-click to set up the local server on Windows.
cd /d "%~dp0"
if not exist ".venv\Scripts\python.exe" (
    py -3 -m venv .venv
    if errorlevel 1 exit /b 1
)
".venv\Scripts\python.exe" -m pip install -r requirements.txt
if errorlevel 1 exit /b 1
if "%PORT%"=="" set "PORT=8080"
start "" "http://localhost:%PORT%"
".venv\Scripts\python.exe" -m server.app
pause
