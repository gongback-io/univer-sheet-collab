// import SheetMutationInsertColOperation
//     from "@src/model/transformer/operation/model/sheet/skeleton-change/SheetMutationInsertColOperation";
// import SheetMutationRemoveColOperation
//     from "@src/model/transformer/operation/model/sheet/skeleton-change/SheetMutationRemoveColOperation";
// import {getSetRangeValueOperation} from "./util";
// import SheetMutationInsertRowOperation
//     from "@src/model/transformer/operation/model/sheet/skeleton-change/SheetMutationInsertRowOperation";
// import SheetMutationRemoveRowOperation
//     from "@src/model/transformer/operation/model/sheet/skeleton-change/SheetMutationRemoveRowOperation";
//
// describe("Insert remove row and columns", () => {
//     it('test insert-col', () => {
//         const transformer = new SheetMutationInsertColOperation({
//             collabId: "A",
//             operationId: "OA1",
//             command: {
//                 "id": "sheet.mutation.insert-col",
//                 "type": 2,
//                 "params": {
//                     "unitId": "test",
//                     "subUnitId": "s-sheet",
//                     "range": {
//                         "startColumn": 1,
//                         "endColumn": 1,
//                         "startRow": 0,
//                         "endRow": 999,
//                         "rangeType": 2
//                     },
//                     "colInfo": [
//                         {
//                             "w": 88,
//                             "hd": 0
//                         }
//                     ],
//                 }
//             }
//         })
//         const transformable = getSetRangeValueOperation();
//
//         transformer.transform(transformable);
//         console.log(JSON.stringify(transformable.source.command.params!.cellValue!))
//
//         expect('{"0":{"0":{"v":"00","t":2},"2":{"v":"01","t":2},"3":{"v":"02","t":2},"4":{"v":"03","t":2},"5":{"v":"04","t":2}},"1":{"0":{"v":"10","t":2},"2":{"v":"11","t":2},"3":{"v":"12","t":2},"4":{"v":"13","t":2},"5":{"v":"14","t":2}},"2":{"0":{"v":"20","t":2},"2":{"v":"21","t":2},"3":{"v":"22","t":2},"4":{"v":"23","t":2},"5":{"v":"24","t":2}},"3":{"0":{"v":"30","t":2},"2":{"v":"31","t":2},"3":{"v":"32","t":2},"4":{"v":"33","t":2},"5":{"v":"34","t":2}}}').toBe(JSON.stringify(transformable.source.command.params!.cellValue!));
//     });
//
//     it('test remove-col', () => {
//         const transformer = new SheetMutationRemoveColOperation({
//             collabId: "A",
//             operationId: "OA1",
//             command: {
//                 "id": "sheet.mutation.remove-col",
//                 "type": 2,
//                 "params": {
//                     "unitId": "test",
//                     "subUnitId": "s-sheet",
//                     "range": {
//                         "startRow": 0,
//                         "startColumn": 2,
//                         "endRow": 999,
//                         "endColumn": 2,
//                         "rangeType": 0,
//                         "unitId": "test",
//                         "sheetId": "s-sheet"
//                     },
//                 }
//             }
//         })
//         const transformable = getSetRangeValueOperation();
//
//         transformer.transform(transformable);
//         console.log(JSON.stringify(transformable.source.command.params!.cellValue!))
//         expect('{"0":{"0":{"v":"00","t":2},"1":{"v":"01","t":2},"2":{"v":"03","t":2},"3":{"v":"04","t":2}},"1":{"0":{"v":"10","t":2},"1":{"v":"11","t":2},"2":{"v":"13","t":2},"3":{"v":"14","t":2}},"2":{"0":{"v":"20","t":2},"1":{"v":"21","t":2},"2":{"v":"23","t":2},"3":{"v":"24","t":2}},"3":{"0":{"v":"30","t":2},"1":{"v":"31","t":2},"2":{"v":"33","t":2},"3":{"v":"34","t":2}}}\n').toBe(JSON.stringify(transformable.source.command.params!.cellValue!));
//     })
//     it("test remove-row", () => {
//         const transformer = new SheetMutationRemoveRowOperation({
//             collabId: "B",
//             operationId: "OB1",
//             command: {
//                 "id": "sheet.mutation.remove-rows",
//                 "type": 2,
//                 "params": {
//                     "unitId": "test",
//                     "subUnitId": "s-sheet",
//                     "range": {
//                         "startRow": 1,
//                         "startColumn": 0,
//                         "endRow": 1,
//                         "endColumn": 19,
//                         "rangeType": 1,
//                         "unitId": "test",
//                         "sheetId": "s-sheet"
//                     },
//                 }
//             }
//         })
//         const transformable = getSetRangeValueOperation();
//
//         transformer.transform(transformable);
//         expect('{"0":{"0":{"v":"00","t":2},"1":{"v":"01","t":2},"2":{"v":"02","t":2},"3":{"v":"03","t":2},"4":{"v":"04","t":2}},"1":{"0":{"v":"20","t":2},"1":{"v":"21","t":2},"2":{"v":"22","t":2},"3":{"v":"23","t":2},"4":{"v":"24","t":2}},"2":{"0":{"v":"30","t":2},"1":{"v":"31","t":2},"2":{"v":"32","t":2},"3":{"v":"33","t":2},"4":{"v":"34","t":2}}}').toBe(JSON.stringify(transformable.source.command.params!.cellValue!));
//     })
//
//     it('test insert-col', () => {
//         const transformer = new SheetMutationInsertColOperation({
//             collabId: "A",
//             operationId: "OA1",
//             command: {
//                 "id": "sheet.mutation.insert-col",
//                 "type": 2,
//                 "params": {
//                     "unitId": "test",
//                     "subUnitId": "s-sheet",
//                     "range": {
//                         "startColumn": 1,
//                         "endColumn": 1,
//                         "startRow": 0,
//                         "endRow": 999,
//                         "rangeType": 2
//                     },
//                     "colInfo": [
//                         {
//                             "w": 88,
//                             "hd": 0
//                         }
//                     ],
//                 }
//             }
//         })
//         const transformable = getSetRangeValueOperation();
//
//         transformer.transform(transformable);
//         console.log(JSON.stringify(transformable.source.command.params!.cellValue!))
//
//         expect('{"0":{"0":{"v":"00","t":2},"2":{"v":"01","t":2},"3":{"v":"02","t":2},"4":{"v":"03","t":2},"5":{"v":"04","t":2}},"1":{"0":{"v":"10","t":2},"2":{"v":"11","t":2},"3":{"v":"12","t":2},"4":{"v":"13","t":2},"5":{"v":"14","t":2}},"2":{"0":{"v":"20","t":2},"2":{"v":"21","t":2},"3":{"v":"22","t":2},"4":{"v":"23","t":2},"5":{"v":"24","t":2}},"3":{"0":{"v":"30","t":2},"2":{"v":"31","t":2},"3":{"v":"32","t":2},"4":{"v":"33","t":2},"5":{"v":"34","t":2}}}').toBe(JSON.stringify(transformable.source.command.params!.cellValue!));
//     });
//
//     it("test double insert-row", () => {
//         const transformer = new SheetMutationInsertRowOperation({
//             collabId: "B",
//             operationId: "OB1",
//             command: {
//                 "id": "sheet.mutation.insert-row",
//                 "type": 2,
//                 "params": {
//                     "unitId": "test",
//                     "subUnitId": "s-sheet",
//                     "range": {
//                         "startRow": 1,
//                         "endRow": 1,
//                         "startColumn": 0,
//                         "endColumn": 19,
//                         "rangeType": 1
//                     },
//                     "rowInfo": [
//                         {
//                             "h": 24,
//                             "hd": 0
//                         }
//                     ],
//                 }
//             }
//         })
//         const transformable = new SheetMutationInsertRowOperation({
//             collabId: "A",
//             operationId: "OA1",
//             command: {
//                 "id": "sheet.mutation.insert-row",
//                 "type": 2,
//                 "params": {
//                     "unitId": "test",
//                     "subUnitId": "s-sheet",
//                     "range": {
//                         "startRow": 1,
//                         "endRow": 1,
//                         "startColumn": 0,
//                         "endColumn": 19,
//                         "rangeType": 1
//                     },
//                     "rowInfo": [
//                         {
//                             "h": 24,
//                             "hd": 0
//                         }
//                     ],
//                 }
//             }
//         })
//
//         transformer.transform(transformable);
//         console.log(JSON.stringify(transformable.source.command.params!))
//         expect('{"unitId":"test","subUnitId":"s-sheet","range":{"startRow":2,"endRow":2,"startColumn":0,"endColumn":19,"rangeType":1},"rowInfo":[{"h":24,"hd":0}]}').toBe(JSON.stringify(transformable.source.command.params!));
//     });
// })
