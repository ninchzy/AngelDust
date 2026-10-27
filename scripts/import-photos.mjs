// Turns the photos in product-photos/ into web-ready images and records them in the database.
//
//   product-photos/<Product Name>/<colour> <number>.<jpg|png|webp>
//   e.g. product-photos/Teatime Peter Pan Collar Blouse/sky 1.jpg
//
// - <Product Name> must match the product's name in the database (letter case doesn't matter).
// - <colour> must match one of that product's colours; number 1 is the card photo for that colour.
// - Every photo is centre-cropped to the card shape (4:5) so all products line up and saved as WebP
//   in public/products/<product-slug>/ in two sizes: <name>.webp (960px, product page gallery)
//   and <name>-480.webp (cards, thumbnails, cart — see smallPhoto() in src/utils.js).
//
// Usage: npm run photos
import { readdir, mkdir, rm } from 'node:fs/promises';
import { join, extname, parse } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { pool } from '../server/db.js';

const SOURCE = fileURLToPath(new URL('../product-photos/', import.meta.url));
const OUTPUT = fileURLToPath(new URL('../public/products/', import.meta.url));
const SIZES = [
    { width: 960, height: 1200, suffix: '' },        // 4:5, same shape as the product card
    { width: 480, height: 600, suffix: '-480' },
];
const WEBP = { quality: 78, effort: 6, smartSubsample: true };
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

        const baseName = `${slugify(colour)}-${number}`;
        const outName = `${baseName}.webp`;
        for (const size of SIZES) {
            await sharp(join(inDir, file))
                .rotate()                                      // respect phone photo orientation
                .resize(size.width, size.height, { fit: 'cover', position: 'centre' })
                .webp(WEBP)
                .toFile(join(outDir, `${baseName}${size.suffix}.webp`));
        }

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
