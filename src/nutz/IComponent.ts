export interface INotify {
    notify?(source: IComponent, eventName: string, ...args: any): void;
};

export interface IComponent extends INotify {
    // render(): IRenderResult;
    getDomNode(): Node;
}
