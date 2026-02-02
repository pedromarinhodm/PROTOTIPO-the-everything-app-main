# SCGES - Sistema de Controle e Gerenciamento de Estoque

Sistema completo para controle e gerenciamento de estoque do almoxarifado da SEMSC (Secretaria Municipal de Segurança Comunitária).

## 📋 Visão Geral

O SCGES é um sistema fullstack composto por:

- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + Mongoose
- **Banco de Dados**: MongoDB local
- **Armazenamento de Arquivos**: MongoDB GridFS

## 🚀 Funcionalidades

### Gestão de Produtos
- Cadastro, edição e exclusão de produtos
- Busca por descrição, código ou fornecedor
- Geração automática de códigos sequenciais
- Alerta de estoque baixo (≤5 unidades)

### Controle de Movimentações
- Registro de entradas de materiais
- Registro de saídas com controle de requisitante
- Validação de estoque disponível
- Histórico completo com filtros avançados

### Relatórios
- Relatório de estoque em PDF
- Relatório de histórico em PDF
- Relatório completo em Excel
- Armazenamento persistente em GridFS

### Dashboard
- Total de produtos cadastrados
- Total de entradas e saídas
- Alertas de estoque baixo
- Movimentações recentes

## ⚙️ Pré-requisitos

1. **Node.js** (v18 ou superior)
   - Download: https://nodejs.org/

2. **MongoDB** (v7.0 ou superior)
   - Download: https://www.mongodb.com/try/download/community
   - Extraia para a pasta `mongodb` na raiz do projeto

## 🛠️ Instalação

### 1. Clone ou extraia o projeto

```bash
cd scges
```

### 2. Configure o MongoDB

Baixe o MongoDB Community Server e extraia na estrutura:

```
mongodb/
├── bin/
│   ├── mongod.exe
│   └── mongos.exe
└── data/db/           # Crie esta pasta vazia
```

### 3. Instale as dependências

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd ..
npm install
```

### 4. Configure as variáveis de ambiente

O arquivo `backend/.env` já está configurado para MongoDB local:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/scges
PORT=3001
NODE_ENV=development
```

## ▶️ Executando o Sistema

### Opção 1: Script Automático (Windows)

Clique duas vezes em `iniciar.bat` para:
1. Iniciar o MongoDB
2. Iniciar o backend
3. Iniciar o frontend
4. Abrir o navegador automaticamente
