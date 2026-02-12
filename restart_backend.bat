@echo off
echo Stopping all Node.js processes...
taskkill /F /IM node.exe

echo.
echo Cleaning up MongoDB Lock files...
if exist "c:\Users\moham\Desktop\pos\offline-sub-clean\back-end\data\db\mongod.lock" del "c:\Users\moham\Desktop\pos\offline-sub-clean\back-end\data\db\mongod.lock"

echo.
echo Starting Backend Server...
cd c:\Users\moham\Desktop\pos\offline-sub-clean\back-end
npm start
pause
