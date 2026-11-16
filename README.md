# RestoMenago

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

## Data model (planned)

- **tables**: number, seats
- **menu_items**: name, category, price
- **orders**: table, status, created at
- **order_items**: order, dish, quantity, note

## Getting started

Requirements: Node.js, npm, Docker Desktop.

```bash
# frontend
cd client
npm install
npm start          # http://localhost:4200

# backend
cd server
npm install
node src/server.js # http://localhost:3000
```
