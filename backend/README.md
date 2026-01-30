# Backend - SCGES

Backend do Sistema de Controle e Gerenciamento de Estoque.

## Requisitos

- Node.js 18+
- MongoDB 7.0+

## Instalação

```bash
npm install
```

## Configuração

Edite o arquivo `.env`:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/scges
PORT=3001
NODE_ENV=development
```

## Execução

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm start
```

## Estrutura

```
src/
├── controllers/      # Controladores REST
│   ├── productController.js
│   ├── movementController.js
│   ├── reportController.js
│   ├── fileController.js
│   └── dashboardController.js
│
├── models/           # Modelos Mongoose
│   ├── Product.js
│   └── Movement.js
│
├── routes/           # Rotas da API
│   ├── productRoutes.js
│   ├── movementRoutes.js
│   ├── reportRoutes.js
│   ├── fileRoutes.js
│   └── dashboardRoutes.js
│
├── services/         # Lógica de negócio
│   ├── productService.js
│   ├── movementService.js
│   └── reportService.js
│
├── db/               # Conexão com banco
│   └── connection.js
│
├── gridfs/           # Armazenamento GridFS
│   └── gridfsStorage.js
│
└── server.js         # Ponto de entrada
```

## API Endpoints

### Produtos
- `GET /api/products` - Lista todos
- `GET /api/products/:id` - Obtém por ID
- `POST /api/products` - Cria novo
- `PUT /api/products/:id` - Atualiza
- `DELETE /api/products/:id` - Remove

### Movimentações
- `GET /api/movements` - Lista com filtros
- `POST /api/movements/entry` - Registra entrada
- `POST /api/movements/exit` - Registra saída

### Relatórios
- `GET /api/reports/estoque/pdf` - PDF de estoque
- `GET /api/reports/historico/pdf` - PDF de histórico
- `GET /api/reports/excel` - Excel completo

### Arquivos
- `GET /api/files` - Lista arquivos
- `GET /api/files/:id` - Download
- `DELETE /api/files/:id` - Remove

### Dashboard
- `GET /api/dashboard/stats` - Estatísticas
- `GET /api/dashboard/recent-movements` - Recentes
- `GET /api/dashboard/low-stock` - Estoque baixo
