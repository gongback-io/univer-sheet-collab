import {Publisher} from "../../types";
import {DocId, IOperation} from "@gongback/univer-sheet-collab";
import {isPublishableOp} from "../../util/OperationModelUtil";
import {IOperationPublisher} from "./IOperationPublisher";

export class OperationPublisher implements IOperationPublisher {
    constructor(private syncPublisher: Publisher) {}

    async publishOperation(docId: DocId, operation: IOperation): Promise<void> {
        try {
            if (isPublishableOp(operation)) {
                await this.syncPublisher.publish(`doc:${docId}:op`, JSON.stringify(operation));
            }
        } catch (err) {
            console.error('[OperationPublisher] Failed to publish operation:', err);
            throw err;
        }
    }
}
