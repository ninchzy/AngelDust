export class ApiError extends Error {
    constructor(message, status) {
        super(message);
        this.status = status;
    }
}

// Small fetch wrapper for our own /api. Throws ApiError with a friendly message.
export async function api(path, { method = 'GET', body } = {}) {
    let res;
    try {
        res = await fetch(`/api${path}`, {
            method,
            credentials: 'same-origin',
            headers: {
                'X-Requested-With': 'fetch',
                ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
            },
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
    } catch {
        throw new ApiError("We can't reach the shop right now. Please try again in a moment.", 0);
    }

    const data = res.status === 204 ? null : await res.json().catch(() => null);
    if (!res.ok) throw new ApiError(data?.error || 'Something went wrong. Please try again.', res.status);
    return data;
}
