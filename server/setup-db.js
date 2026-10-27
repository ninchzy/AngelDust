// Creates the database from .env (if missing), runs schema.sql, upgrades older
// databases to the current shape, then runs seed.sql.
// Usage: npm run db:setup   (safe to re-run; customer data is kept)
import { readFile } from 'node:fs/promises';
import mysql from 'mysql2/promise';
import { dbConfig } from './db.js';

const { database, ...server } = dbConfig;
const sql = name => readFile(new URL(`../database/${name}`, import.meta.url), 'utf8');

async function hasColumn(conn, table, column) {
    const [rows] = await conn.execute(
        'SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?',
        [database, table, column]
    );
    return rows.length > 0;
}

// Changes made after the first version of schema.sql. Each one checks first, so it only runs once.
const upgrades = [
    {
        name: 'product sizes',
        needed: conn => hasColumn(conn, 'products', 'sizes').then(has => !has),
        sql: "ALTER TABLE products ADD COLUMN sizes VARCHAR(100) NOT NULL DEFAULT 'XS,S,M,L,XL' AFTER tag",
    },
    {
        name: 'size on cart items',
        needed: conn => hasColumn(conn, 'cart_items', 'size').then(has => !has),
        sql: "ALTER TABLE cart_items ADD COLUMN size VARCHAR(12) NOT NULL DEFAULT '' AFTER variant_id, DROP PRIMARY KEY, ADD PRIMARY KEY (user_id, variant_id, size)",
    },
    {
        name: 'dark flag on colours',
        needed: conn => hasColumn(conn, 'product_variants', 'is_dark').then(has => !has),
        sql: 'ALTER TABLE product_variants ADD COLUMN is_dark TINYINT(1) NOT NULL DEFAULT 0 AFTER swatch_hex',
    },
    {
        name: 'size on order items',
        needed: conn => hasColumn(conn, 'order_items', 'size').then(has => !has),
        sql: "ALTER TABLE order_items ADD COLUMN size VARCHAR(12) NOT NULL DEFAULT '' AFTER variant_name",
    },
];

const conn = await mysql.createConnection({ ...server, multipleStatements: true });
try {
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await conn.query(`USE \`${database}\``);
    await conn.query(await sql('schema.sql'));
    for (const upgrade of upgrades) {
        if (await upgrade.needed(conn)) {
            await conn.query(upgrade.sql);
            console.log(`Upgraded: ${upgrade.name}`);
        }
    }
    await conn.query(await sql('seed.sql'));
    console.log(`Database "${database}" is ready ♡`);
} finally {
    await conn.end();
}
