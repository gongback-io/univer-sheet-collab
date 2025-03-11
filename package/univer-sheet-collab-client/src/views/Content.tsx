import "@univerjs/ui/lib/index.css";
import "@univerjs/design/lib/index.css";
import "@univerjs/docs-ui/lib/index.css";
import "@univerjs/sheets-ui/lib/index.css";

import {defaultTheme} from "@univerjs/design";

import { UniverRenderEnginePlugin } from "@univerjs/engine-render";
import { UniverUIPlugin } from "@univerjs/ui";
import { UniverDocsPlugin } from "@univerjs/docs";
import { UniverSheetsPlugin } from "@univerjs/sheets";
import { UniverDocsUIPlugin } from "@univerjs/docs-ui";
import { UniverSheetsUIPlugin } from "@univerjs/sheets-ui";
import {useDependency} from "@univerjs/ui";
import {
    Injector,
    IWorkbookData, LocaleService,
    LocaleType,
    Univer,
    UniverInstanceType,
    Workbook,
} from "@univerjs/core";
import {useEffect, useRef, useState} from "react";
import {IRevisionPannelService} from "../services/revision-panel.service";
import ActivityIndicator from "./ActivityIndicator";
import {RevisionId} from "@gongback/univer-sheet-collab";
import {FUniver} from "@univerjs/core/facade";
import '@univerjs/sheets/facade';

type Props = {
    revision?: RevisionId
    workbookData?: IWorkbookData
    isCurrent: boolean
    onClickApply: (revision: RevisionId) => void
}
export default function Content({revision, workbookData, isCurrent, onClickApply}: Props) {
    const injector = useDependency(Injector);
    const localService = useDependency(LocaleService);
    const [loading, setLoading] = useState(true);
    const univerRef = useRef<Univer>();
    const fUniverRef = useRef<FUniver>();
    const workbookRef = useRef<Workbook>();
    const disposeAwait = useRef<Promise<any>>(Promise.resolve());

    const createUniver = (container?: string) => {
        const univer = new Univer({
            theme: defaultTheme,
            locales: {
                [LocaleType.EN_US]: {},
            }
        });

        // 2) 플러그인 등록
        univer.registerPlugin(UniverRenderEnginePlugin);
        univer.registerPlugin(UniverUIPlugin, {container: container, header: false, contextMenu: false, toolbar:false});
        univer.registerPlugin(UniverDocsPlugin);
        univer.registerPlugin(UniverDocsUIPlugin);
        univer.registerPlugin(UniverSheetsPlugin);
        univer.registerPlugin(UniverSheetsUIPlugin);

        return univer;
    }

    const disposeUniver = async () => {
        if (univerRef.current) {

            return new Promise(resolve => {
                if (document.getElementById('sheet-revision') === null) {
                    resolve(null)
                    return;
                }

                univerRef.current?.dispose();
                let data = document.getElementById('sheet-revision')!.innerHTML;
                if (data === '') {
                    resolve(null)
                    return;
                }
                const observer = new MutationObserver(mutationList => {
                    let data = document.getElementById('sheet-revision')!.innerHTML;
                    if (data === '') {
                        resolve(null)
                        observer.disconnect()
                        return;
                    }
                });
                observer.observe(document.getElementById('sheet-revision')!,{childList: true, subtree: false});
            })
        }
        return Promise.resolve(null)
    }

    useEffect(() => {
        setLoading(true);
        disposeAwait.current.then(() => {
            setLoading(false);
            const univer = createUniver('sheet-revision');
            const fUniver = FUniver.newAPI(univer);
            const workbook = univer.createUnit(UniverInstanceType.UNIVER_SHEET, workbookData || {}) as Workbook;

            const fWorkbook = fUniver.getWorkbook(workbook.getUnitId());
            fWorkbook?.setEditable(false);

            univerRef.current = univer;
            fUniverRef.current = fUniver;
            workbookRef.current = workbook

        })
        return () => {
            disposeAwait.current = disposeUniver();
        }
    }, [workbookData]);

    const handleCancelClick = () => {
        const revisionPannelService = injector.get(IRevisionPannelService);
        revisionPannelService.close();
    }

    return (
        <div style={{
            backgroundColor: '#eeeeee',
            flex:1,
            display: 'flex',
            flexDirection: 'column',
        }}>
            {loading && <ActivityIndicator />}

            <div style={{display:'flex', alignItems:'center'}}>
                <button
                    style={{margin:10}}
                    onClick={handleCancelClick}
                >
                    x
                </button>
                {!isCurrent && revision && (
                    <button
                        onClick={() => onClickApply(revision)}
                        style={{height:40, backgroundColor:'#0a57d0'}}
                    >
                        {localService.t('collab.restoreThisVersion')}
                    </button>
                )}
            </div>
            <div style={{width:'100%', flex:1, backgroundColor:'white'}} id="sheet-revision"/>
        </div>
    )
}
