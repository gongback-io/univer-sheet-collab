import { ICommandInfo } from "@univerjs/core";
import axios from "axios";
export async function putCellData(docId: string, command: ICommandInfo) {
    console.log("putCellData", docId, command);
    return axios.post(`http://localhost:3000/sheet/${docId}`, {command})
}
