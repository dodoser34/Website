@echo off
setlocal

cd /d "%~dp0"
set "ROOT=%CD%"
set "PYTHON=%ROOT%\.venv\Scripts\python.exe"
set "BACKEND=%ROOT%\woodstyle\backend"
set "FRONTEND=%ROOT%\woodstyle\frontend"

if not exist "%PYTHON%" (
  echo [ERROR] Python environment was not found:
  echo %PYTHON%
  echo.
  echo Create .venv and install backend requirements first.
  pause
  exit /b 1
)

if not exist "%BACKEND%\main.py" (
  echo [ERROR] Backend was not found:
  echo %BACKEND%
  pause
  exit /b 1
)

if not exist "%FRONTEND%\package.json" (
  echo [ERROR] Frontend was not found:
  echo %FRONTEND%
  pause
  exit /b 1
)

if not exist "%FRONTEND%\node_modules" (
  echo Installing frontend dependencies...
  pushd "%FRONTEND%"
  call npm install
  if errorlevel 1 (
    popd
    echo [ERROR] npm install failed.
    pause
    exit /b 1
  )
  popd
)

echo Starting WoodStyle backend...
start "WoodStyle Backend" /D "%BACKEND%" cmd /k ""%PYTHON%" -m uvicorn main:app --reload --host 127.0.0.1 --port 8000"

echo Starting WoodStyle frontend...
start "WoodStyle Frontend" /D "%FRONTEND%" cmd /k "npm run dev -- --host 127.0.0.1"

echo.
echo WoodStyle is starting:
echo Site:    http://localhost:5173
echo API:     http://localhost:8000
echo Swagger: http://localhost:8000/docs
echo.
echo You can close this window. Backend and frontend run separately.
timeout /t 3 /nobreak >nul

endlocal
