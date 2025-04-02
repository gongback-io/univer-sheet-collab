export interface IBroadcastOperator {
    emit(op: any, data: any): any;
}
export interface IServer {
    on(ev: any, listener: any): any;
    to(room: any): IBroadcastOperator;
}
export interface ISocket {
    id: string;
    on(ev: any, listener: any): any;
    off(ev: any, listener: any): any;
    to(room: any): IBroadcastOperator;
    join(room: any): any;
    leave(room: any): any;
}
export interface Subscriber {
    on (event: string, callback: (...args: any[]) => void): void;
    connect(): Promise<any>;
    subscribe(channel: string, listener: (message: string) => void): Promise<any>;
    unsubscribe(channel: string): Promise<any>;
}
