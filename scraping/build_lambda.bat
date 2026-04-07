@echo off
chcp 65001 >nul

echo ==============================
echo   Lambda Package Build
echo ==============================

if exist dist rmdir /s /q dist
mkdir dist\function

echo [1/4] Installing dependencies (Linux x86_64 via uv)...
uv pip install ^
    --target dist\function ^
    --python-platform x86_64-unknown-linux-gnu ^
    --python-version 3.12 ^
    --no-build-isolation ^
    -r pyproject.toml

if errorlevel 1 (
    echo ERROR: uv pip install failed
    exit /b 1
)

echo [2/4] Removing unnecessary files to reduce size...
for /d /r dist\function %%d in (__pycache__) do (
    if exist "%%d" rmdir /s /q "%%d"
)
for /d /r dist\function %%d in (*.dist-info) do (
    if exist "%%d" rmdir /s /q "%%d"
)
for /d /r dist\function %%d in (tests test) do (
    if exist "%%d" rmdir /s /q "%%d"
)
del /s /q dist\function\*.pyc >nul 2>&1

echo [3/4] Copying source files...
copy pipeline.py       dist\function\ >nul
copy config.py         dist\function\ >nul
copy lambda_handler.py dist\function\ >nul
xcopy /E /I /Q extractors dist\function\extractors >nul
xcopy /E /I /Q plugins    dist\function\plugins >nul
xcopy /E /I /Q utils      dist\function\utils >nul

echo [4/4] Creating zip...
powershell -Command "Compress-Archive -Path dist\function\* -DestinationPath dist\function.zip -Force"

if errorlevel 1 (
    echo ERROR: zip failed
    exit /b 1
)

echo.
echo ==============================
echo   Build Complete!
echo ==============================
echo.
for %%A in (dist\function.zip) do echo   function.zip : %%~zA bytes
echo.
echo Next step: upload to S3
echo   aws s3 cp dist\function.zip s3://YOUR_BUCKET_NAME/lambda/function.zip
