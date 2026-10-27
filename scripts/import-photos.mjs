// Turns the photos in product-photos/ into web-ready images and records them in the database.
//
//   product-photos/<Product Name>/<colour> <number>.<jpg|png|webp>
//   e.g. product-photos/Teatime Peter Pan Collar Blouse/sky 1.jpg
//
// - <Product Name> must match the product's name in the database (letter case doesn't matter).
// - <colour> must match one of that product's colours; number 1 is the card photo for that colour.
// - Every photo is centre-cropped to the card shape (4:5) so all products line up, resized and saved as WebP
//   in public/products/<product-slug>/.
//
// Usage: npm run photos
import { readdir, mkdir, rm } from 'node:fs/promises';
import { join, extname, parse } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { pool } from '../server/db.js';

const SOURCE = fileURLToPath(new URL('../product-photos/', import.meta.url));
const OUTPUT = fileURLToPath(new URL('../public/products/', import.meta.url));
const WIDTH = 960;
const HEIGHT = 1200;   // 4:5, same as the product card
const IMAGE_TYPES = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

const norm = s => s.trim().toLowerCase().replace(/\s+/g, ' ');
const slugify = s => norm(s).replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const [products] = await pool.query('SELECT id, slug, name FROM products');
const [variants] = await pool.query('SELECT id, product_id, name FROM product_variants');

const folders = (await readdir(SOURCE, { withFileTypes: true })).filter(d => d.isDirectory());
const rows = [];
const warnings = [];

for (const folder of folders) {
    const product = products.find(p => norm(p.name) === norm(folder.name));
    if (!product) { warnings.push(`No product named "${folder.name}" — folder skipped.`); continue; }

    const inDir = join(SOURCE, folder.name);
    const outDir = join(OUTPUT, product.slug);
    await rm(outDir, { recursive: true, force: true });
    await mkdir(outDir, { recursive: true });

    const files = (await readdir(inDir)).filter(f => IMAGE_TYPES.has(extname(f).toLowerCase()));

    for (const file of files) {
        const match = parse(file).name.match(/^(.*?)\s*(\d+)$/);
        if (!match) { warnings.push(`${folder.name}/${file}: name should be "<colour> <number>".`); continue; }
        const [, colour, number] = match;
        const variant = variants.find(v => v.product_id === product.id && norm(v.name) === norm(colour));
        if (!variant) { warnings.push(`${folder.name}/${file}: "${product.name}" has no colour "${colour}".`); continue; }

        const outName = `${slugify(colour)}-${number}.webp`;
        await sharp(join(inDir, file))
            .rotate()                                          // respect phone photo orientation
            .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'centre' })
            .webp({ quality: 82 })
            .toFile(join(outDir, outName));

        rows.push({
            productId: product.id,
            variantId: variant.id,
            url: `/products/${product.slug}/${outName}`,
            alt: `${product.name} — ${variant.name}`,
            sort: Number(number),
        });
    }
    console.log(`✓ ${product.name} (${files.length} photos)`);
}

// Replace the photo list for every product we just processed.
const productIds = [...new Set(rows.map(r => r.productId))];
const conn = await pool.getConnection();
try {
    await conn.beginTransaction();
    if (productIds.length) await conn.query('DELETE FROM product_images WHERE product_id IN (?)', [productIds]);
    if (rows.length) {
        await conn.query(
            'INSERT INTO product_images (product_id, variant_id, url, alt_text, sort_order) VALUES ?',
            [rows.map(r => [r.productId, r.variantId, r.url, r.alt, r.sort])]
        );
    }
    await conn.commit();
} catch (err) {
    await conn.rollback();
    throw err;
} finally {
    conn.release();
}

const withPhotos = new Set(rows.map(r => r.variantId));
for (const v of variants) {
    if (!withPhotos.has(v.id)) {
        const p = products.find(x => x.id === v.product_id);
        warnings.push(`"${p.name}" — colour "${v.name}" has no photos yet.`);
    }
}

console.log(`\nSaved ${rows.length} photos for ${productIds.length} products.`);
if (warnings.length) console.log('\nHeads up:\n- ' + warnings.join('\n- '));
await pool.end();
