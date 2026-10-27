import { Router } from 'express';
import { pool, transaction } from './db.js';
import { HttpError } from './errors.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function productIdParam(req) {
    const id = Number(req.params.productId);
    if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'Unknown product.');
    return id;
}

function collectionName(body) {
    const name = String(body?.name || '').trim();
    if (!name || name.length > 40) throw new HttpError(400, 'Collection names can be 1–40 characters.');
    return name;
}

async function addFavourite(db, userId, productId) {
    try {
        await db.execute('INSERT IGNORE INTO favourites (user_id, product_id) VALUES (?, ?)', [userId, productId]);
    } catch (err) {
        if (err.code === 'ER_NO_REFERENCED_ROW_2') throw new HttpError(404, 'Unknown product.');
        throw err;
    }
}

// Mounted behind requireUser (see index.js).
export const favouritesRouter = Router();

favouritesRouter.get('/favourites', async (req, res) => {
    const uid = req.user.id;
    const [favs] = await pool.execute(
        'SELECT product_id FROM favourites WHERE user_id = ? ORDER BY created_at DESC, product_id', [uid]
    );
    const [collections] = await pool.execute(
        'SELECT id, name FROM collections WHERE user_id = ? ORDER BY created_at, id', [uid]
    );
    const [items] = await pool.execute(
        `SELECT ci.collection_id, ci.product_id FROM collection_items ci
         JOIN collections c ON c.id = ci.collection_id
         WHERE c.user_id = ? ORDER BY ci.added_at DESC`, [uid]
    );
    res.json({
        items: favs.map(f => f.product_id),
        collections: collections.map(c => ({
            id: c.id,
            name: c.name,
            items: items.filter(i => i.collection_id === c.id).map(i => i.product_id),
        })),
    });
});

favouritesRouter.put('/favourites/:productId', async (req, res) => {
    await addFavourite(pool, req.user.id, productIdParam(req));
    res.status(204).end();
});

// Un-hearting also takes the piece out of every collection.
favouritesRouter.delete('/favourites/:productId', async (req, res) => {
    const productId = productIdParam(req);
    await transaction(async db => {
        await db.execute(
            `DELETE ci FROM collection_items ci JOIN collections c ON c.id = ci.collection_id
             WHERE c.user_id = ? AND ci.product_id = ?`, [req.user.id, productId]
        );
        await db.execute('DELETE FROM favourites WHERE user_id = ? AND product_id = ?', [req.user.id, productId]);
    });
    res.status(204).end();
});

// Sets exactly which of the user's collections contain this piece.
favouritesRouter.put('/favourites/:productId/collections', async (req, res) => {
    const productId = productIdParam(req);
    const wanted = Array.isArray(req.body?.collectionIds) ? req.body.collectionIds.filter(id => UUID_RE.test(id)) : [];

    await transaction(async db => {
        await addFavourite(db, req.user.id, productId);
        const [owned] = await db.execute('SELECT id FROM collections WHERE user_id = ?', [req.user.id]);
        const ownedIds = owned.map(c => c.id);
        const keep = wanted.filter(id => ownedIds.includes(id));
        const drop = ownedIds.filter(id => !keep.includes(id));

        if (drop.length) {
            await db.query('DELETE FROM collection_items WHERE product_id = ? AND collection_id IN (?)', [productId, drop]);
        }
        if (keep.length) {
            await db.query('INSERT IGNORE INTO collection_items (collection_id, product_id) VALUES ?', [keep.map(id => [id, productId])]);
        }
    });
    res.status(204).end();
});

favouritesRouter.post('/collections', async (req, res) => {
    const id = String(req.body?.id || '');
    if (!UUID_RE.test(id)) throw new HttpError(400, 'Invalid collection id.');
    const name = collectionName(req.body);
    try {
        await pool.execute('INSERT INTO collections (id, user_id, name) VALUES (?, ?, ?)', [id, req.user.id, name]);
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') throw new HttpError(409, 'That collection already exists.');
        throw err;
    }
    res.status(201).json({ id, name });
});

favouritesRouter.patch('/collections/:id', async (req, res) => {
    const name = collectionName(req.body);
    const [result] = await pool.execute(
        'UPDATE collections SET name = ? WHERE id = ? AND user_id = ?', [name, req.params.id, req.user.id]
    );
    if (!result.affectedRows) throw new HttpError(404, 'Collection not found.');
    res.status(204).end();
});

favouritesRouter.delete('/collections/:id', async (req, res) => {
    await pool.execute('DELETE FROM collections WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.status(204).end();
});
