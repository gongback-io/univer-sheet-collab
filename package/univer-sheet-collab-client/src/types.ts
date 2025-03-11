import {ManagerOptions, SocketOptions} from "socket.io-client";

export const defaultOpEmitName =  "sheet-collab-operation";
export const defaultOpEventName =  "sheet-collab-operation";
export const defaultJoinEventName =  "sheet-collab-join";
export const defaultLeaveEventName =  "sheet-collab-leave";
export const defaultFetchEventName =  "sheet-collab-fetch";

export type CollabSocketOptions = Partial<ManagerOptions & SocketOptions> & {

}
