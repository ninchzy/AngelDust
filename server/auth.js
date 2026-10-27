import crypto from 'node:crypto';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from './db.js';
import { HttpError } from './errors.js';

const COOKIE = 'ad_session';
const SESSION_DAYS = 30;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const hashToken = token => crypto.createHash('sha256').update(token).digest('hex');
const publicUser = row => ({ id: row.id, name: row.display_name, email: row.email });

function readCookie(req, name) {
    const header = req.headers.cookie || '';
    for (const part of header.split(';')) {
        const [k, ...v] = part.trim().split('=');
        if (k === name) return decodeURIComponent(v.join('='));
    }
    return null;
}

async function startSession(res, userId) {
    const token = crypto.randomBytes(32).toString('base64url');
    await pool.execute(
        'INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? DAY))',
        [hashToken(token), userId, SESSION_DAYS]
    );
    res.cookie(COOKIE, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
        path: '/',
    });
}

// Attaches req.user (or null) from the session cookie.
export async function loadUser(req, res, next) {
    req.user = null;
    const token = readCookie(req, COOKIE);
    if (token) {
        const [rows] = await pool.execute(
            `SELECT u.id, u.email, u.display_name FROM sessions s
             JOIN users u ON u.id = s.user_id
             WHERE s.token_hash = ? AND s.expires_at > NOW()`,
            [hashToken(token)]
        );
        if (rows[0]) req.user = publicUser(rows[0]);
    }
    next();
}

export function requireUser(req, res, next) {
    if (!req.user) throw new HttpError(401, 'Please log in first.');
    next();
}

// Very small in-memory brake on password guessing: 10 failed logins per IP per 15 minutes.
const failures = new Map();
const WINDOW_MS = 15 * 60 * 1000;
function tooManyFailures(ip) {
    const entry = failures.get(ip);
    if (!entry || Date.now() - entry.since > WINDOW_MS) return false;
    return entry.count >= 10;
}
function recordFailure(ip) {
    const entry = failures.get(ip);
    if (!entry || Date.now() - entry.since > WINDOW_MS) failures.set(ip, { count: 1, since: Date.now() });
    else entry.count++;
}

export const authRouter = Router();

authRouter.get('/me', (req, res) => {
    res.json({ user: req.user });
});

authRouter.post('/register', async (req, res) => {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!name || name.length > 80) throw new HttpError(400, 'Please tell us your name (up to 80 characters).');
    if (!EMAIL_RE.test(email) || email.length > 255) throw new HttpError(400, 'Please enter a valid email address.');
    if (password.length < 8 || password.length > 200) throw new HttpError(400, 'Your password needs at least 8 characters.');

    const hash = await bcrypt.hash(password, 12);
    let result;
    try {
        [result] = await pool.execute(
            'INSERT INTO users (email, password_hash, display_name) VALUES (?, ?, ?)',
            [email, hash, name]
        );
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') throw new HttpError(409, 'An account with this email already exists — try logging in.');
        throw err;
    }
    await startSession(res, result.insertId);
    res.status(201).json({ user: { id: result.insertId, name, email } });
});

authRouter.post('/login', async (req, res) => {
    if (tooManyFailures(req.ip)) throw new HttpError(429, 'Too many attempts. Please wait a few minutes and try again.');

    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const [rows] = await pool.execute('SELECT id, email, display_name, password_hash FROM users WHERE email = ?', [email]);
    const row = rows[0];

    if (!row || !(await bcrypt.compare(password, row.password_hash))) {
        recordFailure(req.ip);
        throw new HttpError(401, 'That email and password don\'t match.');
    }
    failures.delete(req.ip);
    await startSession(res, row.id);
    res.json({ user: publicUser(row) });
});

authRouter.post('/logout', async (req, res) => {
    const token = readCookie(req, COOKIE);
    if (token) await pool.execute('DELETE FROM sessions WHERE token_hash = ?', [hashToken(token)]);
    res.clearCookie(COOKIE, { path: '/' });
    res.status(204).end();
});
