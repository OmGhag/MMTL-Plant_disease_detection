@echo off
echo ========================================
echo Plant Disease Classifier - Startup
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8 or higher
    pause
    exit /b
)

echo [1/3] Starting Flask Backend...
echo.

REM Start Flask backend in new window
start "Flask Backend" cmd /k "cd Backend && python app.py"

echo Waiting for Flask to start...
timeout /t 5 /nobreak >nul

echo.
echo [2/3] Starting Frontend Server...
echo.

REM Start frontend server in new window  
start "Frontend Server" cmd /k "cd frontend && python -m http.server 8000"

echo Waiting for frontend to start...
timeout /t 3 /nobreak >nul

echo.
echo [3/3] Opening Browser...
echo.

REM Wait a moment then open browser
timeout /t 2 /nobreak >nul
start http://localhost:8000

echo.
echo ========================================
echo ✓ Application Started!
echo ========================================
echo.
echo Backend API: http://127.0.0.1:5000
echo Frontend:    http://localhost:8000
echo.
echo Press any key to stop all servers...
pause >nul

REM Kill the servers when user presses a key
taskkill /FI "WindowTitle eq Flask Backend*" /T /F
taskkill /FI "WindowTitle eq Frontend Server*" /T /F

echo.
echo Servers stopped.
pause