import './activityIndicator.css'
import ActivityIndicator from "./ActivityIndicator";
import {Injector, IUniverInstanceService} from "@univerjs/core";
import {IBlockMutationService} from "../services/block.mutation.service";
import {useDependency} from "@univerjs/ui";
import {useEffect, useState} from "react";
export default function Block() {
    const injector = useDependency(Injector);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const blockMutationService = injector.get(IBlockMutationService)
        blockMutationService.status$.subscribe((status) => {
            setVisible(status);
        })
    }, []);

    if (!visible) return null;
    return (
        <ActivityIndicator />
    );
}
