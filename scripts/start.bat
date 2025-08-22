@echo off
chcp 65001 >nul
echo Starting Emotion Management System...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed or not in PATH
    pause
    exit /b 1
)

echo Python and Node.js found. Starting services...
echo.

REM Create and activate virtual environment
if not exist "backend\venv" (
    echo Creating Python virtual environment...
    cd backend
    python -m venv venv
    cd ..
)

echo Activating virtual environment...
call backend\venv\Scripts\activate.bat

echo Installing Python dependencies...
cd backend

REM Try to install with main requirements first
echo Attempting to install main requirements...
pip install -r requirements.txt
if errorlevel 1 (
    echo Warning: Main requirements installation failed, trying minimal requirements...
    pip install -r requirements-minimal.txt
    if errorlevel 1 (
        echo Error: Failed to install even minimal requirements
        pause
        exit /b 1
    )
)

cd ..

echo Starting FastAPI backend server...
start "FastAPI Backend" cmd /k "call backend\venv\Scripts\activate.bat && cd backend && python main.py"

echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo Installing Node.js dependencies...
cd frontend
npm install
if errorlevel 1 (
    echo Error: Failed to install Node.js dependencies
    pause
    exit /b 1
)

echo Starting Next.js frontend server...
start "Next.js Frontend" cmd /k "cd frontend && npm run dev"

cd ..

echo.
echo Services are starting up...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo To stop services, close the command windows or press Ctrl+C in each
echo.
pause
