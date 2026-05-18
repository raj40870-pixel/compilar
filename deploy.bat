@echo off
:: Ensure the script runs in the directory where the batch file is located
cd /d "%~dp0"

echo Deploying frontend to compilar.vercel.app ...
cd frontend
npx vercel --prod --yes

echo.
echo Done! Live at https://compilar.vercel.app
pause
