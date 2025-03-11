import {useEffect, useState} from "react";
import {IConfirmService, useDependency} from "@univerjs/ui";
import {
    ICommandService,
    IConfigService,
    Injector,
    IUniverInstanceService, LocaleService,
    UniverInstanceType,
    Workbook
} from "@univerjs/core";
import {IRevisionPannelService} from "../services/revision-panel.service";
import {IRevisionPanelConfig, REVISION_PANEL_CONFIG_KEY} from "../controller/config.schema";
import {ApplyRevisionMutation, IRevisionWorkbook, RevisionId} from "@gongback/univer-sheet-collab";
import Content from "./Content";
import Panel from "./Panel";

export default function Layer() {
    const [hidden, setHidden] = useState(true);
    const [revisionSheet, setRevisionSheet] = useState<IRevisionWorkbook[]>([]);
    const [revision, setRevision] = useState<IRevisionWorkbook | null>(null);
    const injector = useDependency(Injector);

    useEffect(() => {
        setRevision(null);
        if (hidden) return;
        (async () => {
            const configService = injector.get(IConfigService);
            const config = configService.getConfig<IRevisionPanelConfig>(REVISION_PANEL_CONFIG_KEY);
            const univerInstanceService = injector.get(IUniverInstanceService)
            const workbook = univerInstanceService.getCurrentUnitForType<Workbook>(UniverInstanceType.UNIVER_SHEET);
            if (!workbook) {
                return
            }

            const result = await config?.revisionControl?.storage.revision?.getList(workbook.getUnitId());
            if (result) {
                setRevisionSheet(
                    [...result].sort((a, b) => b.revision - a.revision)
                );
            }
        })()
    }, [hidden]);

    useEffect(() => {
        const univerInstanceService = injector.get(IUniverInstanceService);
        const revisionPannelService = injector.get(IRevisionPannelService);

        const subscribe = revisionPannelService.open$.subscribe((isOpen) => {
            setHidden(!isOpen);
        })

        const workbook = univerInstanceService.getCurrentUnitForType<Workbook>(UniverInstanceType.UNIVER_SHEET);
        if (!workbook) return;
        return () => {
            subscribe.unsubscribe();
        };
    }, []);

    const handleApply = async (revision: RevisionId) => {
        const configService = injector.get(IConfigService);
        const confirmService = injector.get(IConfirmService);
        const localeService = injector.get(LocaleService);
        const config = configService.getConfig<IRevisionPanelConfig>(REVISION_PANEL_CONFIG_KEY);
        const univerInstanceService = injector.get(IUniverInstanceService)
        const workbook = univerInstanceService.getCurrentUnitForType<Workbook>(UniverInstanceType.UNIVER_SHEET);
        if (config && workbook) {
            const confirm = await confirmService.confirm({
                id: 'collab.confirm.apply-revision',
                title: {
                    title: localeService.t('collab.apply.title'),
                },
                children: { title: localeService.t('collab.apply.message') },
                cancelText: localeService.t('button.cancel'),
                confirmText: localeService.t('button.confirm'),
            });

            if (confirm) {
                const commandService = injector.get(ICommandService)
                commandService.syncExecuteCommand(ApplyRevisionMutation.id, {
                    unitId: workbook.getUnitId(),
                    revision
                })
            }
        }
    }

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: hidden ? 'none' : 'flex',
            zIndex: 10,
        }}>
            <Content
                revision={revision?.revision}
                isCurrent={revisionSheet.length > 0 && revision?.revision === revisionSheet[0]?.revision}
                workbookData={revision?.workbookData}
                onClickApply={handleApply}
            />
            <Panel
                revisionSheet={revisionSheet}
                selectRevision={revision?.revision}
                onSelectRevision={(revision) => {
                    console.log('onSelectRevision', revision);
                    setRevision(revision);
                }}
            />
        </div>
    )
}

