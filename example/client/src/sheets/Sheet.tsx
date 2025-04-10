import {useEffect, useRef, useState} from "react";
import {useNavigate} from "react-router-dom";
import {RevisionStorage} from "./data/RevisionStorage";
import {FWorkbook} from "@univerjs/sheets/facade";

import {ICommandInfo, LocaleType, merge, Univer } from "@univerjs/core";
import { FUniver } from "@univerjs/core/facade";
import { defaultTheme } from "@univerjs/design";

import { UniverFormulaEnginePlugin } from "@univerjs/engine-formula";
import { UniverRenderEnginePlugin } from "@univerjs/engine-render";
import { UniverUIPlugin } from "@univerjs/ui";
import { UniverDocsPlugin } from "@univerjs/docs";
import { UniverDocsUIPlugin } from "@univerjs/docs-ui";
import { UniverSheetsPlugin } from "@univerjs/sheets";
import { UniverSheetsUIPlugin } from "@univerjs/sheets-ui";
import { UniverSheetsFormulaPlugin } from "@univerjs/sheets-formula";
import { UniverSheetsFormulaUIPlugin } from "@univerjs/sheets-formula-ui";
import { UniverSheetsNumfmtPlugin } from "@univerjs/sheets-numfmt";
import { UniverSheetsNumfmtUIPlugin } from "@univerjs/sheets-numfmt-ui";
import { UniverFindReplacePlugin } from '@univerjs/find-replace';
import { UniverSheetsFindReplacePlugin } from '@univerjs/sheets-find-replace';
import { UniverSheetCollabPlugin } from "@gongback/univer-sheet-collab";
import { UniverSheetCollabClientPlugin, CollabSocket } from "@gongback/univer-sheet-collab-client";

import DesignEnUS from '@univerjs/design/locale/en-US';
import UIEnUS from '@univerjs/ui/locale/en-US';
import DocsUIEnUS from '@univerjs/docs-ui/locale/en-US';
import SheetsEnUS from '@univerjs/sheets/locale/en-US';
import SheetsUIEnUS from '@univerjs/sheets-ui/locale/en-US';
import SheetsFormulaUIEnUS from '@univerjs/sheets-formula-ui/locale/en-US';
import SheetsNumfmtUIEnUS from '@univerjs/sheets-numfmt-ui/locale/en-US';
import FindReplaceEnUS from '@univerjs/find-replace/locale/en-US';
import SheetsFindReplaceEnUS from '@univerjs/sheets-find-replace/locale/en-US';
import SheetCollabEnUS from '@gongback/univer-sheet-collab-client/locale/en-US';

import '@univerjs/engine-formula/facade';
import '@univerjs/ui/facade';
import '@univerjs/docs-ui/facade';
import '@univerjs/sheets/facade';
import '@univerjs/sheets-ui/facade';
import '@univerjs/sheets-formula/facade';
import '@univerjs/sheets-numfmt/facade';
import "@gongback/univer-sheet-collab-client/facade";

import "@univerjs/design/lib/index.css";
import "@univerjs/ui/lib/index.css";
import "@univerjs/docs-ui/lib/index.css";
import "@univerjs/sheets-ui/lib/index.css";
import "@univerjs/sheets-formula-ui/lib/index.css";
import "@univerjs/sheets-numfmt-ui/lib/index.css";
import '@univerjs/find-replace/lib/index.css';
import {putCellData} from "./action";


export default function Sheet({docId}: {docId?: string}) {
    const navigate = useNavigate();
    const fUniverRef = useRef<FUniver | null>(null);
    const [socket, setSocket] = useState<CollabSocket | null>(null);
    const [connected, setConnected] = useState(false);
    const [revision, setRevision] = useState<number>();

    const [loadingPutCell, setLoadingPutCell] = useState(false);

    useEffect(() => {
        if (!docId) {
            navigate('/');
            return;
        }
        const univer = new Univer({
            theme: defaultTheme,
            locale: LocaleType.EN_US,
            locales: {
                [LocaleType.EN_US]: merge(
                    DesignEnUS,
                    UIEnUS,
                    DocsUIEnUS,
                    SheetsEnUS,
                    SheetsUIEnUS,
                    SheetsFormulaUIEnUS,
                    SheetsNumfmtUIEnUS,
                    FindReplaceEnUS,
                    SheetsFindReplaceEnUS,
                    SheetCollabEnUS
                ),
            }
        });

        // 2) 플러그인 등록
        univer.registerPlugin(UniverRenderEnginePlugin);
        univer.registerPlugin(UniverFormulaEnginePlugin);

        univer.registerPlugin(UniverUIPlugin, {
            container: 'sheet',
        });

        univer.registerPlugin(UniverDocsPlugin);
        univer.registerPlugin(UniverDocsUIPlugin);

        univer.registerPlugin(UniverSheetsPlugin);
        univer.registerPlugin(UniverSheetsUIPlugin);
        univer.registerPlugin(UniverSheetsFormulaPlugin);
        univer.registerPlugin(UniverSheetsFormulaUIPlugin);
        univer.registerPlugin(UniverSheetsNumfmtPlugin);
        univer.registerPlugin(UniverSheetsNumfmtUIPlugin);
        univer.registerPlugin(UniverFindReplacePlugin);
        univer.registerPlugin(UniverSheetsFindReplacePlugin);

        univer.registerPlugin(UniverSheetCollabPlugin);
        univer.registerPlugin(UniverSheetCollabClientPlugin, {
            serverUrl: 'http://localhost:3000',
            allowOfflineEditing: true,
            revisionControl: {
                storage: {
                    revision: new RevisionStorage()
                }
            }
        });

        const fUniver = FUniver.newAPI(univer);
        fUniverRef.current = fUniver;
        const fCollab = fUniver.getCollab();
        setSocket(fCollab.getSocket());

        (async() => {
            const firstWorkbook:FWorkbook = await fCollab.join(docId, {makeCurrent: true})
            console.log('workbook', firstWorkbook.getWorkbook().save())

            // Multiple Instances (https://docs.univer.ai/en-US/playground/sheets/multiple-instances)
            // if (docId !== 'second') {
            //     const secondWorkbook:FWorkbook = await fCollab.join('second', {makeCurrent: false})
            //     console.log('secondWorkbook', secondWorkbook.getWorkbook().save())
            // }

            fCollab.onRevisionChanged(firstWorkbook.getWorkbook().getUnitId(), revision => {
                setRevision(revision);
            })

        })()

        return (() => {
            univer.dispose()
        })
    }, []);

    useEffect(() => {
        if (!socket) {
            return;
        }
        socket.on('connect', () => {
            setConnected(true);
        });
        socket.on('disconnect', () => {
            setConnected(false);
        });
    }, [socket]);

    const disconnect = () => {
        socket?.disconnect();
    }
    const connect = () => {
        socket?.connect();
    }
    const printLog = () => {
        console.log(fUniverRef.current?.getActiveWorkbook()?.save());
    }

    const putCellTest = async (rowKey: string, columnKey: string, value: string) => {
        if (!docId) {
            return;
        }
        if (!fUniverRef.current) {
            return;
        }
        const workbook = fUniverRef.current.getWorkbook(docId);
        if (!workbook) {
            return;
        }
        try {
            const sheetId = workbook.getActiveSheet().getSheetId()
            setLoadingPutCell(true);
            const params = {
                unitId: docId,
                subUnitId: sheetId,
                columnKey,
                rows: [
                    {
                        rowKey,
                        value
                    }
                ]
            }
            const command: ICommandInfo = {
                id: "gongback.command.data-handle",
                type: 1,
                params
            }
            await putCellData(docId, command)
        } catch  (e) {
            alert((e as any).message);
        } finally {
            setLoadingPutCell(false);
        }
    }

    return (
        <div style={{width:'100%', height:'100%', display:'flex', flexDirection:'column'}}>
            <div style={{display:'flex', alignItems:'center'}}>
                {connected ? (
                    <button onClick={disconnect}>disconnect server</button>
                ): (
                    <button onClick={connect}>connect server</button>
                )}
                <button onClick={printLog}>print log</button>
                <button
                    onClick={async () => {
                        await putCellTest("userId1", "name", "userId1 NAME")
                        await putCellTest("userId1", "school", "userId1 SCHOOL")
                        await putCellTest("userId2", "name", "userId2 NAME")
                        await putCellTest("userId2", "school", "userId2 SCHOOL")
                    }}
                    disabled={loadingPutCell}
                >
                    {loadingPutCell ? "loading.." : "test put cell"}
                </button>
                <span>revision: {revision}</span>

            </div>
            <div style={{width:'100%', flex:1}} id="sheet"/>
        </div>
    )

}
