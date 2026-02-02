@echo off
title SCGES - Sistema de Controle e Gerenciamento de Estoque
color 0A

echo ============================================================
echo    SCGES - Sistema de Controle e Gerenciamento de Estoque
echo    SEMSC - Secretaria Municipal de Seguranca Comunitaria
echo ============================================================
echo.

:: Configurações
set MONGO_PATH=mongodb\bin\mongod.exe
set MONGO_DATA=mongodb\data\db
set BACKEND_PATH=backend
set FRONTEND_PATH=frontend
set FRONTEND_HOST=127.0.0.1
set FRONTEND_PORT=8080
set BACKEND_PORT=3000

:: Verifica se MongoDB existe
if not exist "%MONGO_PATH%" (
    echo [ERRO] MongoDB nao encontrado em: %MONGO_PATH%
    echo.
    echo Por favor, baixe o MongoDB e extraia na pasta 'mongodb':
    echo   mongodb\
    echo     bin\
    echo       mongod.exe
    echo       mongos.exe
    echo     data\db\
    echo.
    pause
    exit /b 1
)

:: Cria pasta de dados se não existir
if not exist "%MONGO_DATA%" (
    echo [INFO] Criando pasta de dados do MongoDB...
    mkdir "%MONGO_DATA%"
)

echo [1/4] Iniciando MongoDB...
start "MongoDB" cmd /c "%MONGO_PATH% --dbpath %MONGO_DATA% --port 27017"
timeout /t 3 /nobreak > nul
echo       MongoDB iniciado na porta 27017

echo.
echo [2/4] Instalando dependencias do backend...
cd %BACKEND_PATH%
if not exist "node_modules" (
    call npm install
)
echo       Dependencias do backend instaladas

echo.
echo [3/4] Iniciando servidor backend...
start "SCGES Backend" cmd /c "npm start"
timeout /t 2 /nobreak > nul
echo       Backend iniciado na porta %BACKEND_PORT%

cd ..

echo.
echo [4/4] Iniciando frontend...
cd %FRONTEND_PATH%
if not exist "node_modules" (
    echo       Instalando dependencias do frontend...
    call npm install
)
start "SCGES Frontend" cmd /c "npm run dev -- --port %FRONTEND_PORT% --host %FRONTEND_HOST%"
timeout /t 5 /nobreak > nul
echo       Frontend iniciado na porta %FRONTEND_PORT%
cd ..

echo.
echo ============================================================
echo    Sistema iniciado com sucesso!
echo ============================================================
echo.
echo    MongoDB:  http://localhost:27017
echo    Backend:  http://localhost:%BACKEND_PORT%/api
echo    Frontend: http://%FRONTEND_HOST%:%FRONTEND_PORT%
echo.
echo    Abrindo navegador...
echo.

:: Abre o navegador
timeout /t 2 /nobreak > nul
start http://%FRONTEND_HOST%:%FRONTEND_PORT%

echo.
echo    Pressione qualquer tecla para encerrar todos os servicos...
pause > nul

:: Encerra processos
echo.
echo [INFO] Encerrando servicos...
taskkill /FI "WINDOWTITLE eq MongoDB*" /F > nul 2>&1
taskkill /FI "WINDOWTITLE eq SCGES Backend*" /F > nul 2>&1
taskkill /FI "WINDOWTITLE eq SCGES Frontend*" /F > nul 2>&1

echo [INFO] Servicos encerrados.
echo.
pause
