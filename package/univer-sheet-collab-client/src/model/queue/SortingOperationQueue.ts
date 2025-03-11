import {RevisionId} from "@gongback/univer-sheet-collab";

export default class SortingOperationQueue<T extends { revision: RevisionId }> {
    private queue: { [key: number]: T } = {};
    private _maxRevision: number = 0;
    private _startRevision: number = 999999999999999;

    push(item: T) {
        this._setRevision(item);
        this.queue[item.revision] = item;
    }

    clear() {
        this.queue = {};
        this._maxRevision = 0;
        this._startRevision = 999999999999999;
    }

    shift(): T | undefined {
        if (Object.keys(this.queue).length === 0) {
            return undefined;
        }
        if (this._startRevision > this._maxRevision) {
            return undefined;
        }
        const item = this.queue[this._startRevision];
        if (!item) {
            console.error(`Queue is corrupted. Start revision: ${this._startRevision}, Max revision: ${this._maxRevision}`, this.queue)
            throw new Error(`Queue is corrupted.`);
        }
        delete this.queue[this._startRevision];
        this._startRevision++;
        return item;
    }

    forEach(callback: (item: T) => void) {
        for (let i = this._startRevision; i <= this._maxRevision; i++) {
            const item = this.queue[i];
            if (!item) {
                console.error(`Queue is corrupted. Start revision: ${this._startRevision}, Max revision: ${this._maxRevision}`, this.queue)
                throw new Error(`Queue is corrupted.`);
            }
            callback(item);
        }
    }

    private _setRevision(item: T) {
        if (item.revision > this._maxRevision) {
            this._maxRevision = item.revision;
        }
        if (item.revision < this._startRevision) {
            this._startRevision = item.revision;
        }
    }
}
