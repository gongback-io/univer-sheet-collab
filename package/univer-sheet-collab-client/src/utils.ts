import {IOperation} from "@gongback/univer-sheet-collab";

export function mergeOperations<T extends object = object>(
    ops1: IOperation<T>[],
    ops2: IOperation<T>[]
): IOperation<T>[] {
    // 두 배열을 합칩니다.
    const combined = [...ops1, ...ops2];

    // revision 값이 중복되지 않도록 Map을 이용해 de-duplication을 수행합니다.
    const uniqueOps = new Map<number, IOperation<T>>();
    for (const op of combined) {
        if (!uniqueOps.has(op.revision)) {
            uniqueOps.set(op.revision, op);
        }
        // 만약 같은 revision에 대해 다른 정책이 있다면 여기서 처리할 수 있습니다.
    }

    // Map의 value들을 배열로 변환한 후 revision 기준으로 오름차순 정렬합니다.
    return Array.from(uniqueOps.values()).sort((a, b) => a.revision - b.revision);
}

// export function latestsRevision(ops: IOperation[]): number {
//     return ops.reduce((max, op) => Math.max(max, op.revision), -1);
// }
