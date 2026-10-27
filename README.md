# AngelDust

**Angel Dust — sweet lolita atelier.** An online shop for lolita-inspired clothing: soft linen and cherry blossom colours, puffy cards, lace-stitched scallops and a dark theme.

Built with **React + Vite** (website), **Node.js + Express** (server) and **MySQL** (database).

## Features

- Product catalogue with categories, search, sorting and a page for every product (photo gallery, colours, sizes, size guide)
- Favourites with your own named collections (log in required)
- Cart with quantities, sizes, promo codes, gift wrap and a free-shipping bar; guest carts are kept and merged on login
- Accounts with login / sign-up (passwords hashed with bcrypt, sessions stored in MySQL)
- Dark-garment promo (`BLACKLACE10`) on a hidden "dark edit" page, discounting dark colours only
- Light and dark theme, sticky category bar, hamburger menu on small screens

## Running it locally

You need [Node.js](https://nodejs.org) (v20+) and [MySQL 8](https://dev.mysql.com/downloads/).

```bash
npm install
cp .env.example .env        # then fill in your MySQL user and password
npm run db:setup            # creates the database, tables and starter products
npm run photos              # imports the product photos into the database
npm run dev                 # starts the server and the website
```

Then open <http://localhost:5173>.

## Useful commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Website + server for development |
| `npm run db:setup` | Create or upgrade the database (safe to re-run; keeps customer data) |
| `npm run photos` | Crop and import photos from `product-photos/<Product Name>/<colour> <number>.jpg` |
| `npm run build` then `npm start` | Production build, served by the Node server |

## Project layout

```
src/            React website (pages, components, styles)
server/         Express API (auth, catalogue, favourites, cart)
database/       schema.sql + seed.sql (starter catalogue and promo codes)
scripts/        photo import script
product-photos/ source photos, one folder per product
public/         processed photos served by the site
```

## Photos

The product and hero photos are placeholders collected from other lolita shops (see `product-photos/SOURCES.md`). They belong to those shops and should be replaced with your own or licensed photos before the shop goes live.
