export interface ICommand {
    handle(...args: any[]): any;
}

export interface ICommandStatic<T> {
    new (...args: any[]): T;
    commands: { [key: string]: any};
    hotkeys: { [key: string]: string};
}
