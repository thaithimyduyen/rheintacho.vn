@echo off
setlocal
cd /d "%~dp0"

where py >nul 2>nul
if %errorlevel%==0 (
    py -m pip show Pillow >nul 2>nul
    if errorlevel 1 py -m pip install -r requirements.txt
    py image_batch_composer.py
    goto :end
)

where python >nul 2>nul
if %errorlevel%==0 (
    python -m pip show Pillow >nul 2>nul
    if errorlevel 1 python -m pip install -r requirements.txt
    python image_batch_composer.py
    goto :end
)

echo Khong tim thay Python tren may.
echo Hay cai Python 3.10+ tu https://www.python.org/downloads/
echo Nho tick "Add Python to PATH" khi cai dat.
pause

:end
endlocal
