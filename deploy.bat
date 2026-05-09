@echo off
echo Deploying to compilar.vercel.app ...
cd frontend
npx vercel --prod --yes
echo.
echo Done! Live at https://compilar.vercel.app
pause
