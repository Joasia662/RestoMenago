# RestoMenago

A web application for restaurant staff. Waiters use it to take and manage
orders at tables; the restaurant manager maintains the list of tables and
the menu.

## Roles

| Role | What they can do |
|---|---|
| Waiter (`WAITER`) | See the tables, open an order for a table, add or remove items, send the order to the kitchen, mark it as served and paid |
| Manager (`ADMIN`) | Everything a waiter can do, plus add and remove tables and manage the menu (add, withdraw, delete dishes) |

## Features

- [x] Login with JWT, two roles with different permissions
- [x] Tables: list, add, remove (a table with order history cannot be removed)
- [x] Menu: list with pagination, filtering and search; add, edit, withdraw, delete dishes
- [x] Orders: open an order for a table, add / edit / remove items with notes
- [x] Dish photos: the manager uploads PNG / JPEG / WEBP (max 2 MB), stored in the database, file type checked by its content
- [x] Order status flow: `OPEN → IN_PREPARATION → SERVED → PAID`, or `CANCELLED` before serving
- [x] Business rules (409 Conflict when broken):
  - a table can have only one active order (also guarded by a partial unique index in the database)
  - the status can change only along the flow above
  - items can be changed only while the order is `OPEN` or `IN_PREPARATION`
  - an unavailable dish cannot be ordered
  - an empty order cannot be sent to the kitchen
- [x] Asynchronous events: order events are handled by listeners (kitchen ticket, activity log) after the response is sent
- [x] Dashboard: tables generated from the database, coloured by order status, order panel on the right
- [x] API documentation (Swagger), unit and integration tests, Docker Compose

## Tech stack

- **Frontend:** Angular 22, TypeScript, SCSS
- **Backend:** Node.js 22, Express 5, Zod (validation), JWT + bcrypt (authentication)
- **Database:** PostgreSQL 16, Knex (queries, migrations, seeds)
- **Docs and tests:** Swagger UI (OpenAPI 3.1), Node test runner, Supertest
- **Infrastructure:** Docker, Docker Compose, nginx (serves the frontend)

## Project structure

```text
RestoMenago/
├── docker-compose.yml   # db + backend + frontend
├── client/              # Angular application (Dockerfile, nginx.conf)
└── server/              # REST API (Express, Dockerfile)
    ├── src/
    │   ├── app.js          # builds the app (createApp)
    │   ├── server.js       # starts the server
    │   ├── config.js       # reads environment variables
    │   ├── errors/         # AppError and its subclasses
    │   ├── middleware/     # logger, validation, authentication, roles, error handler
    │   ├── events/         # event bus (EventEmitter) and order listeners
    │   ├── docs/           # OpenAPI specification for Swagger
    │   ├── db/             # Knex, unit of work, migrations, seeds
    │   └── modules/        # auth, users, tables, menu-items, orders
    └── test/
        ├── unit/           # services and event bus, no database
        └── integration/    # real HTTP requests to the API and database
```

The backend uses a layered architecture: routes → controllers → services →
repositories. Business rules live in services; only repositories touch data.
Request DTOs are Zod schemas, response DTOs are mappers. All errors go through
one error handler and have the same format:

```json
{ "error": { "code": "TABLE_ALREADY_HAS_ACTIVE_ORDER", "message": "Table already has an active order", "requestId": "..." } }
```

## Data model

- **users**: username, password hash, role
- **tables**: number, seats
- **menu_items**: name, category, price, availability
- **orders**: table, waiter, status, created / updated / closed at
- **order_items**: order, dish, quantity, unit price at the time of ordering, note

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

## Demo accounts

Created by the seed:

| Login | Password | Role |
|---|---|---|
| `manager` | `manager123` | ADMIN |
| `anna` | `anna123` | WAITER |
| `piotr` | `piotr123` | WAITER |

## Run with Docker Compose (recommended)

Requirements: Docker Desktop (running).

```bash
git clone https://github.com/Joasia662/RestoMenago.git
cd RestoMenago
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
```

Open `.env` and set `JWT_SECRET` to a long random string, then:

```bash
docker compose up --build
```

| What | Address |
|---|---|
| Application | http://localhost:8080 |
| API | http://localhost:3000/api |
| API documentation (Swagger) | http://localhost:3000/api/docs |

Three containers start: `db` (PostgreSQL), `backend` (Express API) and `frontend`
(nginx with the built Angular app). The backend runs the migrations on start and
loads the demo data only when the database is empty, so data survives restarts.

Stop with `Ctrl+C` or `docker compose down`. To start from a clean database:
`docker compose down -v`.

## Run locally (development)

Requirements: Node.js 22, npm, Docker Desktop.

### 1. Start the database

Run once to create the PostgreSQL container:

```bash
docker run --name restomenago-db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=restomenago -p 5432:5432 -v restomenago-pgdata:/var/lib/postgresql/data -d postgres:16
```

Next time, start the existing container instead:

```bash
docker start restomenago-db
```

### 2. Configure the backend

```bash
cd server
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
```

Open `server/.env` and set:

```text
PORT=3000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/restomenago
JWT_SECRET=any-long-random-string
JWT_EXPIRES_IN=8h
```

### 3. Install dependencies, create the schema and load demo data

```bash
npm install
npx knex migrate:latest
npx knex seed:run
```

### 4. Run the backend

```bash
npm run dev
```

The API runs on http://localhost:3000 and the Swagger documentation on
http://localhost:3000/api/docs. Check http://localhost:3000/api/health; the
expected response is `{"status":"ok","database":"up"}`.

### 5. Run the frontend

In a second terminal, from the project root:

```bash
cd client
npm install
npm start
```

The application runs on http://localhost:4200. The dev server forwards `/api`
requests to the backend (`proxy.conf.json`).

## Tests

From `server/`, with the database running:

```bash
npm test                    # all tests
npm run test:unit           # unit tests only (no database needed)
npm run test:integration    # integration tests (resets the database with the seed)
```

`server/requests.http` contains ready requests for the VS Code REST Client extension.

## Useful commands

| Command (run in `server/`) | What it does |
| --- | --- |
| `npx knex migrate:latest` | applies all pending migrations |
| `npx knex migrate:rollback` | reverts the last batch of migrations |
| `npx knex seed:run` | resets the data to the demo data |
| `docker stop restomenago-db` | stops the local database |
| `docker exec -it restomenago-db psql -U postgres -d restomenago` | opens the SQL console |
