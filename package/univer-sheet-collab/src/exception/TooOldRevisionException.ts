export class TooOldRevisionException extends Error {
    constructor(message?: string) {
        super(message);
        this.name = 'TooOldRevisionException';
    }
}
