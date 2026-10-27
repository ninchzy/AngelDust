// Throw this from a route to send `{ error: message }` with the given status.
export class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}
