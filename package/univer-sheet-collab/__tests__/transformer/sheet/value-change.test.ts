// import SheetMutationSetRangeValuesOperation
//     from "@src/model/transformer/operation/model/sheet/value-change/SheetMutationSetRangeValuesOperation";
// import {IOperation} from "@src/index";
// import {ISetRangeValuesMutationParams} from "@univerjs/sheets";
// import SheetMutationMoveRangeOperation
//     from "@src/model/transformer/operation/model/sheet/value-change/SheetMutationMoveRangeOperation";
//
// describe('SheetMutationSetRangeValuesOperation', () => {
//     it('test conflict cell value', () => {
//         const oa1:IOperation<ISetRangeValuesMutationParams> = {
//             collabId: "A",
//             operationId: "OA1",
//             command: {
//                 id: 'sheet.mutation.set-range-values',
//                 params: {
//                     unitId: 'unitId',
//                     subUnitId: 's-sheet',
//                     cellValue: {
//                         0: {
//                             0: {
//                                 v: "1"
//                             },
//                             1: {
//                                 v: "1"
//                             }
//                         }
//                     }
//                 }
//             }
//         }
//         const ob1:IOperation<ISetRangeValuesMutationParams> = {
//             collabId: "B",
//             operationId: "OB1",
//             command: {
//                 id: 'sheet.mutation.set-range-values',
//                 params: {
//                     unitId: 'unitId',
//                     subUnitId: 's-sheet',
//                     cellValue: {
//                         0: {
//                             0: {
//                                 v: "2"
//                             },
//                             2: {
//                                 v: "2"
//                             }
//                         }
//                     }
//                 }
//             }
//         }
//         const transformer = new SheetMutationSetRangeValuesOperation(oa1);
//         let transformable = new SheetMutationSetRangeValuesOperation(ob1);
//         transformable = transformer.transform(transformable);
//
//         expect(undefined).toBe(transformable.source.command.params!.cellValue![0][0]);
//         expect("2").toBe(transformable.source.command.params!.cellValue![0][2]!.v);
//         if (transformable.source.command.params!.cellValue![0][1]) {
//             throw new Error('');
//         }
//         expect('{"0":{"2":{"v":"2"}}}').toBe(JSON.stringify(transformable.source.command.params!.cellValue))
//         console.log(JSON.stringify(transformable.source.command.params!.cellValue))
//     });
// });
//
// describe('SheetMutationMoveRangeOperation', () => {
//     it("test conflict with move-range 1", () => {
//         const transformer = new SheetMutationMoveRangeOperation({
//             collabId: "A",
//             operationId: "OA1",
//             command: {
//                 "id": "sheet.mutation.move-range",
//                 "type": 2,
//                 "params": {
//                     "fromRange": {
//                         "startRow": 0,
//                         "startColumn": 0,
//                         "endRow": 0,
//                         "endColumn": 2,
//                         "rangeType": 0
//                     },
//                     "toRange": {
//                         "startRow": 0,
//                         "startColumn": 1,
//                         "endRow": 0,
//                         "endColumn": 3,
//                         "rangeType": 0
//                     },
//                     "from": {
//                         "value": {
//                             "0": {
//                                 "0": null,
//                                 "1": null,
//                                 "2": null
//                             }
//                         },
//                         "subUnitId": "s-sheet"
//                     },
//                     "to": {
//                         "value": {
//                             "0": {
//                                 "1": {
//                                     "v": 1,
//                                     "t": 2
//                                 },
//                                 "2": {
//                                     "v": 2,
//                                     "t": 2
//                                 },
//                                 "3": {
//                                     "v": 3,
//                                     "t": 2
//                                 }
//                             }
//                         },
//                         "subUnitId": "s-sheet"
//                     },
//                     "unitId": "unitId",
//                 }
//             }
//         })
//         const transformable = new SheetMutationSetRangeValuesOperation({
//             collabId: "B",
//             operationId: "OB1",
//             command: {
//                 id: 'sheet.mutation.set-range-values',
//                 params: {
//                     unitId: 'unitId',
//                     subUnitId: 's-sheet',
//                     cellValue: {
//                         "0": {
//                             "0": {
//                                 "v": 0,
//                                 "t": 2
//                             },
//                             "1": {
//                                 "v": 0,
//                                 "t": 2
//                             },
//                             "2": {
//                                 "v": 0,
//                                 "t": 2
//                             },
//                             "3": {
//                                 "v": 0,
//                                 "t": 2
//                             },
//                             "4": {
//                                 "v": 2,
//                                 "t": 2
//                             }
//                         }
//                     }
//                 }
//             }
//         });
//         transformer.transform(transformable);
//         expect('{"0":{"3":{"t":2},"4":{"v":2,"t":2}}}').toBe(JSON.stringify(transformable.source.command.params!.cellValue!));
//         expect(undefined).toBe(transformable.source.command.params!.cellValue![0][0]);
//         expect(undefined).toBe(transformable.source.command.params!.cellValue![0][1]);
//         expect(undefined).toBe(transformable.source.command.params!.cellValue![0][2]);
//         expect(undefined).toBe(transformable.source.command.params!.cellValue![0][3]!.v);
//         expect(2).toBe(transformable.source.command.params!.cellValue![0][3]!.t);
//         expect(2).toBe(transformable.source.command.params!.cellValue![0][4]!.v);
//         expect(2).toBe(transformable.source.command.params!.cellValue![0][4]!.t);
//
//     });
//     it("test conflict with move-range 2", () => {
//         const transformable = new SheetMutationMoveRangeOperation({
//             collabId: "A",
//             operationId: "OA1",
//             command: {
//                 "id": "sheet.mutation.move-range",
//                 "type": 2,
//                 "params": {
//                     "fromRange": {
//                         "startRow": 0,
//                         "startColumn": 0,
//                         "endRow": 0,
//                         "endColumn": 2,
//                         "rangeType": 0
//                     },
//                     "toRange": {
//                         "startRow": 0,
//                         "startColumn": 1,
//                         "endRow": 0,
//                         "endColumn": 3,
//                         "rangeType": 0
//                     },
//                     "from": {
//                         "value": {
//                             "0": {
//                                 "0": null,
//                                 "1": null,
//                                 "2": null
//                             }
//                         },
//                         "subUnitId": "s-sheet"
//                     },
//                     "to": {
//                         "value": {
//                             "0": {
//                                 "1": {
//                                     "v": 1,
//                                     "t": 2
//                                 },
//                                 "2": {
//                                     "v": 2,
//                                     "t": 2
//                                 },
//                                 "3": {
//                                     "v": 3,
//                                     "t": 2
//                                 }
//                             }
//                         },
//                         "subUnitId": "s-sheet"
//                     },
//                     "unitId": "unitId",
//                 }
//             }
//         })
//         const transformer = new SheetMutationSetRangeValuesOperation({
//             collabId: "B",
//             operationId: "OB1",
//             command: {
//                 id: 'sheet.mutation.set-range-values',
//                 params: {
//                     unitId: 'unitId',
//                     subUnitId: 's-sheet',
//                     cellValue: {
//                         "0": {
//                             "0": {
//                                 "v": 0,
//                                 "t": 2
//                             },
//                             "1": {
//                                 "v": 0,
//                                 "t": 2
//                             },
//                             "2": {
//                                 "v": 0,
//                                 "t": 2
//                             },
//                             "3": {
//                                 "v": 0,
//                                 "t": 2
//                             }
//                         }
//                     }
//                 }
//             }
//         });
//         transformer.transform(transformable);
//
//         expect("{}").toBe(JSON.stringify(transformable.source.command.params!.from.value))
//         expect('{"0":{"1":{"t":2},"2":{"t":2},"3":{"t":2}}}').toBe(JSON.stringify(transformable.source.command.params!.to.value))
//     });
// });
