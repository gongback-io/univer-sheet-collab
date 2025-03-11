import {ICellData, ICommandInfo, IKeyValue, Nullable, ObjectMatrix, Workbook} from "@univerjs/core";

/**
 * Recursively traverses an object or array and replaces any undefined value
 * with the provided replacement string.
 *
 * @param data - The input data to process.
 * @param replaceString - The string to use as a replacement for undefined values.
 * @returns A new object or array with undefined values replaced.
 */
export function deepReplaceUndefined<T>(data: T, replaceString: string): T {
    if (data === undefined) {
        return replaceString as unknown as T;
    } else if (Array.isArray(data)) {
        return data.map(item => deepReplaceUndefined(item, replaceString)) as unknown as T;
    } else if (typeof data === 'object' && data !== null) {
        const result: any = {};
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                const value = (data as any)[key];
                // Even if value is undefined, this recursive call will replace it with replaceString.
                result[key] = deepReplaceUndefined(value, replaceString);
            }
        }
        return result as T;
    }
    return data;
}

/**
 * Recursively traverses an object or array and replaces any occurrence of the replacement string
 * with undefined.
 *
 * @param data - The input data to process.
 * @param replaceString - The replacement string that should be converted back to undefined.
 * @returns A new object or array with the replacement string converted back to undefined.
 */
export function deepRestoreUndefined<T>(data: T, replaceString: string): T {
    if (data === replaceString) {
        return undefined as unknown as T;
    } else if (Array.isArray(data)) {
        return data.map(item => deepRestoreUndefined(item, replaceString)) as unknown as T;
    } else if (typeof data === 'object' && data !== null) {
        const result: any = {};
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                const value = (data as any)[key];
                result[key] = deepRestoreUndefined(value, replaceString);
            }
        }
        return result as T;
    }
    return data;
}

export function deepEqual(a: any, b: any): boolean {
    // 동일한 참조이거나 동일한 원시값이면 true
    if (a === b) return true;

    // a나 b가 null이거나 객체가 아니라면 false
    if (a == null || typeof a !== 'object' ||
        b == null || typeof b !== 'object') {
        return false;
    }

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    // 키 개수가 다르면 다른 객체
    if (keysA.length !== keysB.length) return false;

    // 각 키에 대해 재귀적으로 비교
    for (let key of keysA) {
        // b에 해당 키가 없거나, 값이 같지 않으면 false
        if (!Object.prototype.hasOwnProperty.call(b, key) || !deepEqual(a[key], b[key])) {
            return false;
        }
    }

    return true;
}

/**
 * 압축된 구조에서 사용되는 특수 필드
 */
export interface CompressRef {
    __ref: number;
}

export interface CompressId {
    __id: number;
}

/**
 * 임의의 데이터 타입:
 * - 원시값(null, boolean, number, string, symbol, bigint)
 * - 객체 또는 배열
 */
export type AnyData = any; // 혹은 좀 더 정밀한 타입 정의 가능

/**
 * 중복되는 하위 구조(객체/배열)를 압축하는 함수
 *
 * @param data 압축할 원본 데이터 (원시값, 객체, 배열)
 * @returns 압축된 데이터
 */
export function compressDuplicates(data: AnyData): AnyData {
    // structureMap: 동일 구조를 직렬화한 문자열 -> 부여된 ID
    const structureMap = new Map<string, number>();
    // visitedMap: 이미 방문한 원본 객체 -> 압축된 결과 (순환 방지)
    const visitedMap = new WeakMap<object, AnyData>();
    let nextId = 1;

    /**
     * 내부 재귀 함수
     */
    function _compress(value: AnyData): AnyData {
        // null, undefined, number, string, boolean 등 원시 타입은 그대로 반환
        if (value === null || typeof value !== "object") {
            return value;
        }
        // 이미 방문한 객체면, 방문 시 만들어 둔 결과를 그대로 반환(순환 참조 방지)
        if (visitedMap.has(value)) {
            return visitedMap.get(value);
        }

        let compressed: AnyData;
        if (Array.isArray(value)) {
            // 배열이면 각 원소를 재귀적으로 압축
            compressed = value.map(_compress);
        } else {
            // 객체이면 각 프로퍼티를 재귀적으로 압축
            compressed = {};
            for (const key in value) {
                if (Object.prototype.hasOwnProperty.call(value, key)) {
                    compressed[key] = _compress(value[key]);
                }
            }
        }

        // 압축된 결과를 문자열화하여 구조 키를 얻는다.
        const strKey = JSON.stringify(compressed);

        // structureMap에 동일한 구조(strKey)가 있는지 확인
        if (structureMap.has(strKey)) {
            // 이미 등록된 구조라면 __ref만 남긴다.
            const refId = structureMap.get(strKey)!; // !는 null/undefined가 아님을 단언
            const refObj: CompressRef = { __ref: refId };
            visitedMap.set(value, refObj);
            return refObj;
        }

        // 처음 등장하는 구조라면, 새로운 ID 부여
        const currentId = nextId++;
        structureMap.set(strKey, currentId);

        // compressed 결과물에 __id를 부여한다 (객체/배열 구분 없이 달아줄 수 있음)
        (compressed as CompressId).__id = currentId;

        // visitedMap에 등록
        visitedMap.set(value, compressed);

        return compressed;
    }

    // 최상위 호출
    return _compress(data);
}

/**
 * 압축된 구조를 복원(decompress)하는 함수
 *
 * @param data 압축된 데이터(최상위)
 * @returns 복원된(원본 형태와 동일 참조 구조) 객체/배열/값
 */
export function decompress(data: AnyData): AnyData {
    // __id -> 실제 객체/배열 참조를 매핑
    const idMap = new Map<number, AnyData>();

    /**
     * 내부 재귀 함수
     */
    function _decompress(value: AnyData): AnyData {
        // 원시값은 그대로 반환
        if (value === null || typeof value !== "object") {
            return value;
        }

        // 만약 "__ref"가 있다면, 이미 등록된 구조를 참조
        if ("__ref" in value) {
            const refVal = (value as CompressRef).__ref;
            if (!idMap.has(refVal)) {
                throw new Error(
                    `Decompress error: __ref=${refVal} 에 해당하는 __id가 아직 등록되지 않았습니다. (잘못된 순서 or 데이터)`
                );
            }
            return idMap.get(refVal);
        }

        // 이제 "__ref"가 아니라면 실제 데이터의 "정의" 부분
        // __id가 있으면, 이 객체/배열을 idMap에 미리 등록
        let currentId: number | null = null;
        if ("__id" in value) {
            currentId = (value as CompressId).__id;
            // 배열인지 객체인지 확인
            const placeholder = Array.isArray(value) ? [] : {};
            // idMap에 placeholder를 등록 (아직 내부 필드는 채우지 않음)
            idMap.set(currentId, placeholder);
        }

        // 하위 속성(혹은 배열 원소)을 재귀적으로 복원
        let result: AnyData;
        if (Array.isArray(value)) {
            result = value.map(_decompress);
        } else {
            result = {};
            for (const key in value) {
                if (!Object.prototype.hasOwnProperty.call(value, key)) {
                    continue;
                }
                // __id 필드는 최종 결과에서 제거(필요하다면 남길 수도 있음)
                if (key === "__id") continue;
                result[key] = _decompress(value[key]);
            }
        }

        // 만약 현재 __id가 있었다면, 그 ID에 대응하는 실제 객체를 result로 변경
        if (currentId != null) {
            idMap.set(currentId, result);
        }

        return result;
    }

    // 최상위에서 시작
    return _decompress(data);
}

