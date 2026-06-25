@echo off
setlocal enabledelayedexpansion

echo.
echo ==========================================
echo   NOIRE E-COMMERCE - INSTALACION RAPIDA
echo ==========================================
echo.

REM Verificar si Node.js está instalado
echo [1/4] Verificando Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ❌ Node.js no está instalado
    echo Descargar desde: https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js detectado:
node -v

REM Instalar dependencias del Backend
echo.
echo [2/4] Instalando dependencias del Backend...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ❌ Error instalando Backend
    pause
    exit /b 1
)
echo ✅ Backend instalado
cd ..

REM Instalar dependencias del Frontend
echo.
echo [3/4] Instalando dependencias del Frontend...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Error instalando Frontend
    pause
    exit /b 1
)
echo ✅ Frontend instalado

REM Mostrar instrucciones
echo.
echo [4/4] Configuración completada
echo.
echo ==========================================
echo   PRÓXIMOS PASOS:
echo ==========================================
echo.
echo 1. Editar credentials en backend\.env
echo    - DB_QUITO_PASSWORD
echo    - DB_GUAYAQUIL_PASSWORD
echo.
echo 2. Terminal 1 - Iniciar Backend:
echo    cd backend
echo    npm start
echo.
echo 3. Terminal 2 - Iniciar Frontend:
echo    npm run dev
echo.
echo 4. Abrir navegador:
echo    http://localhost:5173
echo.
echo ==========================================
echo.

pause
