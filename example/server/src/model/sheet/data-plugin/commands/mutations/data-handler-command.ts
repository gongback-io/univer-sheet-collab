import type {
    IAccessor,
    ICellData,
    IColumnData,
    ICommand,
    IMutationCommonParams,
    IObjectArrayPrimitiveType,
    IObjectMatrixPrimitiveType,
    IRowData,
    Nullable,
} from '@univerjs/core';
import { CommandType, ICommandService, IUniverInstanceService } from '@univerjs/core';
import {
    IInsertColMutationParams,
    IInsertRowMutationParams,
    InsertColMutation,
    InsertRowMutation,
    ISetColDataCommandParams,
    ISetRangeValuesMutationParams,
    ISetRowDataCommandParams,
    SetColDataCommand,
    SetRangeValuesMutation,
    SetRowDataCommand
} from '@univerjs/sheets';

type Position = "START" | "AFTER_FIRST_SECTION" | "END";

export interface IDataHandlerCommandParams extends IMutationCommonParams {
    unitId: string;
    subUnitId: string;
    columnKey: string;
    rows: {
        rowKey: string;
        value: string;
    }[];
    position?: Position;
}

export const DataHandlerCommand: ICommand<IDataHandlerCommandParams, boolean> = {
    id: 'gongback.command.data-handle',
    type: CommandType.COMMAND,
    handler: (accessor, params) => {
        if (!params) {
            return false;
        }
        const { unitId, subUnitId, columnKey, rows, position } = params;
        const commandService = accessor.get(ICommandService);

        // 컬럼과 행의 인덱스를 각각 매핑 (없으면 새로 삽입)
        const columnIndexMap = getColumnIndexMap(params, accessor, position);
        const rowIndexMap = getRowIndexMap(params, accessor, position);
        if (columnIndexMap === null || rowIndexMap === null) {
            return false;
        }

        const cellValue: IObjectMatrixPrimitiveType<Nullable<ICellData>> = {};
        const colIndex = columnIndexMap[columnKey];
        // 각 행에 대해 cell 값 설정 (같은 columnKey 사용)
        for (const rowItem of rows) {
            const { rowKey, value } = rowItem;
            const rowIndex = rowIndexMap[rowKey];
            if (colIndex === undefined || rowIndex === undefined) {
                continue;
            }
            if (!cellValue[rowIndex]) {
                cellValue[rowIndex] = {};
            }
            cellValue[rowIndex][colIndex] = { v: value };
        }

        const setValueParams: ISetRangeValuesMutationParams = {
            unitId,
            subUnitId,
            cellValue,
        };
        commandService.syncExecuteCommand(SetRangeValuesMutation.id, setValueParams);
        return true;
    },
};

function getColumnIndexMap(params: IDataHandlerCommandParams, accessor: IAccessor, position?: Position) {
    const { unitId, subUnitId, columnKey } = params;
    const univerInstanceService = accessor.get(IUniverInstanceService);
    const commandService = accessor.get(ICommandService);
    const workbook = univerInstanceService.getUniverSheetInstance(unitId);
    if (!workbook) return null;

    const worksheet = workbook.getSheetBySheetId(subUnitId);
    if (!worksheet) {
        return null;
    }
    const columnManager = worksheet.getColumnManager();
    const columnCount = worksheet.getColumnCount();

    // 기본적으로 삽입 위치를 결정 (START: 앞, END: 마지막)
    let insertPositionIndex = -1;
    if (position === "START") {
        insertPositionIndex = -1;
    } else if (position === "END") {
        insertPositionIndex = columnCount - 1;
    } else if (position === "AFTER_FIRST_SECTION") {
        // 간단한 구현: 첫 연속 구간에서 해당 columnKey가 등장한 마지막 인덱스를 찾거나,
        // 없으면 첫 번째 custom metadata가 있는 위치로 판단 (세부 요구사항에 맞게 수정 필요)
        for (let i = 0; i < columnCount; i++) {
            const metadata = columnManager.getCustomMetadata(i);
            if (metadata && metadata.handleKey === columnKey) {
                insertPositionIndex = i;
            } else if (insertPositionIndex !== -1 && (!metadata || metadata.handleKey !== columnKey)) {
                // 연속 섹션이 끝났다고 가정
                break;
            }
        }
    }

    // 기존에 columnKey로 등록된 컬럼 확인
    let existingIndex: number | undefined = undefined;
    for (let i = 0; i < columnCount; i++) {
        const metadata = columnManager.getCustomMetadata(i);
        if (metadata && metadata.handleKey === columnKey) {
            existingIndex = i;
            break;
        }
    }

    const columnIndexMap: { [columnKey: string]: number } = {};
    if (existingIndex === undefined) {
        // insertPositionIndex 뒤에 삽입 (즉, target index = insertPositionIndex + 1)
        const targetColumnIndex = insertPositionIndex + 1;
        const insertColParams: IInsertColMutationParams = {
            unitId,
            subUnitId,
            range: {
                startRow: 0,
                endRow: worksheet.getRowCount() - 1,
                startColumn: targetColumnIndex,
                endColumn: targetColumnIndex,
            },
        };
        commandService.syncExecuteCommand(InsertColMutation.id, insertColParams);
        const columnData: IObjectArrayPrimitiveType<Nullable<IColumnData>> = {
            [targetColumnIndex]: {
                custom: {
                    handleKey: columnKey,
                },
            },
        };
        const setColumnDataParams: ISetColDataCommandParams = {
            unitId,
            subUnitId,
            columnData,
        };
        commandService.syncExecuteCommand(SetColDataCommand.id, setColumnDataParams);
        columnIndexMap[columnKey] = targetColumnIndex;
    } else {
        columnIndexMap[columnKey] = existingIndex;
    }
    return columnIndexMap;
}

function getRowIndexMap(params: IDataHandlerCommandParams, accessor: IAccessor, position?: Position) {
    const { unitId, subUnitId, rows } = params;
    const univerInstanceService = accessor.get(IUniverInstanceService);
    const commandService = accessor.get(ICommandService);
    const workbook = univerInstanceService.getUniverSheetInstance(unitId);
    if (!workbook) return null;

    const worksheet = workbook.getSheetBySheetId(subUnitId);
    if (!worksheet) {
        return null;
    }
    const rowManager = worksheet.getRowManager();
    const rowCount = worksheet.getRowCount();

    // 기본 삽입 위치 설정
    let insertPositionIndex = -1;
    if (position === "START") {
        insertPositionIndex = -1;
    } else if (position === "END") {
        insertPositionIndex = rowCount - 1;
    } else if (position === "AFTER_FIRST_SECTION") {
        // 첫 번째 연속 섹션의 마지막 인덱스를 찾음 (간단한 구현, 필요에 따라 조정)
        for (let i = 0; i < rowCount; i++) {
            const metadata = rowManager.getCustomMetadata(i);
            if (metadata && metadata.handleKey) {
                insertPositionIndex = i;
            } else if (insertPositionIndex !== -1 && (!metadata || !metadata.handleKey)) {
                break;
            }
        }
    }

    const rowIndexMap: { [rowKey: string]: number } = {};
    const needInsertRowKeys: string[] = [];
    // rows 배열의 각 rowKey가 이미 존재하는지 확인
    for (const rowItem of rows) {
        const { rowKey } = rowItem;
        let found = false;
        for (let i = 0; i < rowCount; i++) {
            const metadata = rowManager.getCustomMetadata(i);
            if (metadata && metadata.handleKey === rowKey) {
                rowIndexMap[rowKey] = i;
                found = true;
                break;
            }
        }
        if (!found) {
            needInsertRowKeys.push(rowKey);
        }
    }

    // 새로 삽입해야 할 row의 기본 위치: 기존 insertPositionIndex 또는 rowCount 중 큰 값 사용
    let maxDataRowIndex = insertPositionIndex;
    for (let i = 0; i < rowCount; i++) {
        const metadata = rowManager.getCustomMetadata(i);
        if (metadata && metadata.handleKey) {
            if (i > maxDataRowIndex) {
                maxDataRowIndex = i;
            }
        }
    }

    let idx = 0;
    needInsertRowKeys.forEach((rowKey) => {
        const targetRowIndex = maxDataRowIndex + idx + 1;
        const insertRowParams: IInsertRowMutationParams = {
            unitId,
            subUnitId,
            range: {
                startRow: targetRowIndex,
                endRow: targetRowIndex,
                startColumn: 0,
                endColumn: worksheet.getColumnCount() - 1,
            },
        };
        commandService.syncExecuteCommand(InsertRowMutation.id, insertRowParams);
        const rowData: IObjectArrayPrimitiveType<Nullable<IRowData>> = {
            [targetRowIndex]: {
                custom: {
                    handleKey: rowKey,
                },
            },
        };
        const setRowDataParams: ISetRowDataCommandParams = {
            unitId,
            subUnitId,
            rowData,
        };
        commandService.syncExecuteCommand(SetRowDataCommand.id, setRowDataParams);
        rowIndexMap[rowKey] = targetRowIndex;
        idx++;
    });

    return rowIndexMap;
}
