# Backend - SCGES

Backend do Sistema de Controle e Gerenciamento de Estoque.

## Requisitos

- Node.js 18+
- Projeto Supabase ativo
- MongoDB local (apenas para migracao inicial)

## Instalacao

```bash
npm install
```

## Configuracao (.env)

```env
PORT=3000

# Origem (legado) para migracao
MONGODB_URI=mongodb://127.0.0.1:27017/controle_estoque

# Destino (Supabase)
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=SEU_SERVICE_ROLE_KEY

# Opcional: conexao direta Postgres (SQL/psql)
DATABASE_URL=postgresql://postgres:SENHA@db.PROJETO.supabase.co:5432/postgres
```

## Banco Supabase

1. Execute `backend/supabase/schema.sql` no SQL Editor do Supabase.
2. Garanta os buckets privados:
- `formularios`
- `product-files`

## Migracao de dados MongoDB -> Supabase

```bash
npm run migrate:supabase
```

Migracao inclui:
- Produtos (`produtos` -> `products`)
- Movimentacoes (`movimentacaos` -> `movements`)
- PDFs de formularios (GridFS `formularios` -> Supabase Storage `formularios`)
- PDFs de notas fiscais (GridFS `product_files` -> Supabase Storage `product-files`)

## Execucao

### Desenvolvimento

```bash
npm run dev
```

### Producao

```bash
npm start
```
