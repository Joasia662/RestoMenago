const { z } = require("zod");

const id = z.coerce.number().int().positive();

const idParams = z.object({ id });

const pagination = {
    page: z.coerce.number().int().min(1).default(1), 
    // z.coerce.number() zamienia wartość na liczbę, a potem sprawdza, czy wyszła liczba
    //.int() ma byc calkowita
    //.positive() wieksza od zera
    pageSize: z.coerce.number().int().min(1).max(100).default(20)
};

module.exports = { id, idParams, pagination };