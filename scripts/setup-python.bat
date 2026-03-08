@echo off
setlocal enabledelayedexpansion

REM Setup script for Python + Excel integration (Windows)

echo ======================================
echo Trade Republic Python Setup (Windows)
echo ======================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('python --version') do set PYTHON_VERSION=%%i
echo Python version: %PYTHON_VERSION%

REM Create virtual environment
echo.
echo Creating virtual environment...
if exist venv (
    echo Virtual environment already exists
) else (
    python -m venv venv
)

REM Activate virtual environment
echo.
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Upgrade pip
echo Upgrading pip...
python -m pip install --upgrade pip setuptools wheel

REM Install dependencies
echo.
echo Installing dependencies...
pip install requests xlwing

REM Verify installations
echo.
echo Verifying installations...
python -c "import requests; print(f'requests: {requests.__version__}')"
python -c "import xlwing; print(f'xlwing: {xlwing.__version__}')"

REM Create directories
echo.
echo Creating directories...
if not exist data mkdir data
if not exist .tr-sessions mkdir .tr-sessions

REM Create requirements.txt
echo.
echo Creating requirements.txt...
(
    echo requests^>=2.31.0
    echo xlwing^>=0.30.0
) > requirements.txt

echo.
echo ======================================
echo Setup Complete!
echo ======================================
echo.
echo Next steps:
echo 1. Activate virtual environment:
echo    venv\Scripts\activate.bat
echo.
echo 2. Start the dashboard:
echo    npm run dev
echo.
echo 3. Run data collection:
echo    python scripts\python_api_client.py --export-excel
echo.
echo ======================================
pause
