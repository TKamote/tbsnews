@echo off
REM Simple 3-in-1 Git Push Script for Windows
REM Usage: push.bat "Your commit message"

if "%~1"=="" (
    echo Error: Please provide a commit message
    echo Usage: push.bat "Your commit message"
    exit /b 1
)

set COMMIT_MSG=%~1

echo.
echo 🚀 Starting git push...
echo.

REM Step 1: Add all files
echo Step 1/3: Adding files...
git add .
if errorlevel 1 (
    echo ❌ Failed to add files
    exit /b 1
)
echo ✅ Files added
echo.

REM Step 2: Commit
echo Step 2/3: Committing...
git commit -m "%COMMIT_MSG%"
if errorlevel 1 (
    echo ❌ Failed to commit
    exit /b 1
)
echo ✅ Committed: %COMMIT_MSG%
echo.

REM Step 3: Push
echo Step 3/3: Pushing to GitHub...
git push origin main
if errorlevel 1 (
    echo ❌ Failed to push
    exit /b 1
)
echo.
echo ✅ Successfully pushed to GitHub!
echo 🎉 Your changes will auto-deploy to Vercel
echo.

