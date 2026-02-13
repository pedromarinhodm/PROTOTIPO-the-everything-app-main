@echo off
title SCGES - Sistema de Controle e Gerenciamento de Estoque
color 0A

echo ============================================================
echo    SCGES - Sistema de Controle e Gerenciamento de Estoque
echo    SEMSC - Secretaria Municipal de Seguranca Cidada
echo ============================================================
echo.

:: Configurações
set BACKEND_PATH=backend
set FRONTEND_PATH=frontend
set FRONTEND_HOST=127.0.0.1
set FRONTEND_PORT=8080
set BACKEND_PORT=3000

echo [1/3] Verificando configuracao do Supabase...
if not exist "%BACKEND_PATH%\.env" (
    echo [AVISO] Arquivo .env nao encontrado em %BACKEND_PATH%\.env
    echo        Certifique-se de configurar as variaveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
    echo.
    pause
)

echo       Configuracao OK - Usando Supabase

echo.
echo [2/3] Instalando dependencias do backend...
cd %BACKEND_PATH%
if not exist "node_modules" (
    call npm install
)
echo       Dependencias do backend instaladas

echo.
echo [3/3] Iniciando servidor backend...
start "SCGES Backend" cmd /c "npm run dev"
timeout /t 3 /nobreak > nul
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
echo    Banco de Dados: Supabase (PostgreSQL)
echo    Backend:        http://localhost:%BACKEND_PORT%/api
echo    Frontend:       http://%FRONTEND_HOST%:%FRONTEND_PORT%
echo.
echo    Sincronizacao entre dispositivos ativa!
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
taskkill /FI "WINDOWTITLE eq SCGES Backend*" /F > nul 2>&1
taskkill /FI "WINDOWTITLE eq SCGES Frontend*" /F > nul 2>&1

echo [INFO] Servicos encerrados.
echo.
pause
