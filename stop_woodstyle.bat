@echo off
setlocal

echo Stopping WoodStyle services on ports 5173 and 8000...

for %%P in (5173 8000) do (
  for /f "tokens=5" %%A in ('netstat -ano ^| findstr /R /C:":%%P .*LISTENING"') do (
    taskkill /PID %%A /T /F >nul 2>&1
  )
)

echo WoodStyle services stopped.
timeout /t 2 /nobreak >nul

endlocal
