# RestoMenago

A web application for restaurant staff. Waiters use it to take and manage
orders at tables; the restaurant manager maintains the list of tables and
the menu.

## Roles

| Role | What they can do |
|---|---|
| Waiter | Create an order for a table, add or remove items, change the order status |
| Manager (admin) | Add and remove tables, add and remove dishes from the menu |

## Features

- [ ] Tables: list, add, remove
- [ ] Menu: list, add, remove dishes
- [ ] Orders: create, edit items, change status
- [ ] Order status flow: `OPEN → IN_PREPARATION → SERVED → PAID`, or `CANCELLED`
- [ ] Roles and login

## Tech stack

- **Frontend:** Angular 22, TypeScript, SCSS
- **Backend:** Node.js, Express 5, Zod (validation)
- **Database:** PostgreSQL 16 (Docker), Knex (migrations and queries)

## Project structure

```text
RestoMenago/
├── client/   # Angular application
└── server/   # REST API (Express)
    └── src/
        ├── app.js          # builds the app (createApp)
        ├── server.js       # starts the server
        ├── errors/
        ├── middleware/
        └── modules/        # tables, menu-items, orders
```

The backend uses a layered architecture: routes → controllers → services →
repositories. Business rules live in services; only repositories touch data.

## Data model 

- **tables**: number, seats
- **menu_items**: name, category, price
- **orders**: table, status, created at
- **order_items**: order, dish, quantity, note

```mermaid
erDiagram
    users ||--o{ orders : "takes"
    tables ||--o{ orders : "has"
    orders ||--o{ order_items : "contains"
    menu_items ||--o{ order_items : "appears in"

    users {
        int id PK
        string username UK
        string password_hash
        string role
        timestamptz created_at
    }
    tables {
        int id PK
        int number UK
        int seats
        timestamptz created_at
    }
    menu_items {
        int id PK
        string name UK
        string category
        decimal price
        boolean is_available
        timestamptz created_at
    }
    orders {
        int id PK
        int table_id FK
        int waiter_id FK
        string status
        timestamptz created_at
        timestamptz updated_at
        timestamptz closed_at
    }
    order_items {
        int id PK
        int order_id FK
        int menu_item_id FK
        int quantity
        decimal unit_price
        string note
    }
```


## Getting started

### Requirements

- Node.js 22 or newer
- npm
- Docker Desktop (running)

### 1. Clone the repository

```bash
git clone https://github.com/Joasia662/RestoMenago.git
cd RestoMenago
```

### 2. Start the database

Run once to create the PostgreSQL container:

```bash
docker run --name restomenago-db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=restomenago -p 5432:5432 -v restomenago-pgdata:/var/lib/postgresql/data -d postgres:16
```

Next time, start the existing container instead:

```bash
docker start restomenago-db
```

### 3. Configure the backend

```bash
cd server
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
```

Open `server/.env` and set the database credentials used in step 2:

```text
PORT=3000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/restomenago
```

### 4. Install dependencies and create the database schema

```bash
npm install
npx knex migrate:latest
```

### 5. Run the backend

```bash
npm run dev
```

The API runs on http://localhost:3000. Check it at http://localhost:3000/api/health; the expected response is `{"status":"ok","database":"up"}`.

### 6. Run the frontend

In a second terminal, from the project root:

```bash
cd client
npm install
npm start
```

The application runs on http://localhost:4200.

### Useful commands

| Command (run in `server/`) | What it does |
| --- | --- |
| `npx knex migrate:latest` | applies all pending migrations |
| `npx knex migrate:rollback` | reverts the last batch of migrations |
| `docker stop restomenago-db` | stops the database |
| `docker exec -it restomenago-db psql -U postgres -d restomenago` | opens the SQL console |
