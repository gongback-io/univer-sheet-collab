import {ISidebarService, useDependency} from "@univerjs/ui";
import {Injector, IUniverInstanceService, UniverInstanceType, Workbook} from "@univerjs/core";
import {useEffect} from "react";
import {IRevisionPannelService} from "../services/revision-panel.service";
import HistoryIcon from "../assets/HistoryIcon";

export default function Header() {
    const injector = useDependency(Injector);
    useEffect(() => {
        const univerInstanceService = injector.get(IUniverInstanceService);
        const sidebarService = injector.get(ISidebarService);
        const workbook = univerInstanceService.getCurrentUnitForType<Workbook>(UniverInstanceType.UNIVER_SHEET);
        if (!workbook) return;
        const subUnitId = workbook.getActiveSheet().getSheetId();
        // const activeSheetSubscribe = workbook.activeSheet$.subscribe((sheet) => {
        //     if (sheet?.getSheetId() !== subUnitId) {
        //         sidebarService.close();
        //     }
        // });
        return () => {
            // activeSheetSubscribe.unsubscribe();
        };
    }, []);

    const handleClick = () => {
        const univerInstanceService = injector.get(IUniverInstanceService);
        const workbook = univerInstanceService.getCurrentUnitForType<Workbook>(UniverInstanceType.UNIVER_SHEET);
        const revisionPannelService = injector.get(IRevisionPannelService);
        if (!workbook) return;

        if (revisionPannelService.isOpen) {
            revisionPannelService.close();
        } else {
            revisionPannelService.open();
        }
    }

    return (
        <div style={{cursor:'pointer'}} onClick={handleClick}>
            <HistoryIcon />
            {/*<img src={History} alt="History" style={{ width: '20px', height: '20px', margin: '10px'}} />*/}
        </div>
    )
}
