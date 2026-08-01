export interface ICommand {
    handle(...args: any[]): any;
}
