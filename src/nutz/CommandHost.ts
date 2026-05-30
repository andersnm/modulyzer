import { ICommand } from "./ICommand";

export function formatHotkey(e: KeyboardEvent) {
    let keyName = "";
    if (e.ctrlKey) {
        keyName += "CTRL+";
    }
    if (e.altKey) {
        keyName += "ALT+";
    }
    if (e.shiftKey) {
        keyName += "SHIFT+";
    }
    if (e.metaKey) {
        keyName += "META+";
    }

    if (e.key.length === 1) {
        keyName += e.key.toUpperCase();
    } else {
        keyName += e.key;
    }

    return keyName;
}

export interface ICommandHost {
    executeCommand(command: string, ...args: any[]): void;
    getCommand(command: string): ICommandInfo;
    getHotkeyForCommand(command: string): string | null;
    addStateListener(command: string, callback: (command: string, state: ICommandState) => void): void;
    removeStateListener(command: string, callback: (command: string, state: ICommandState) => void): void;
}

export interface ICommandInfo {
    name: string;
    icon: string|null;
    description: string|null;
    handler: ICommand;
}

export interface ICommandState {
    enabled: boolean;
    toggled: boolean;
}

export abstract class CommandHost implements ICommandHost {
    parent: CommandHost | null;
    commands: { [key: string]: ICommandInfo } = {};
    commandStates: { [key: string]: ICommandState } = {};
    stateListeners: { [key: string]: ((command: string, state: ICommandState) => void)[] } = {};
    hotkeys: { [key: string]: string } = {};
    childHosts: CommandHost[] = [];

    constructor(parent: CommandHost | null) {
        this.parent = parent;
        if (this.parent) {
            this.parent.childHosts.push(this);
        }
    }

    destroy() {
        if (this.parent) {
            const ti = this.parent.childHosts.indexOf(this);
            if (ti === -1) {
                throw new Error("Internal error: Child host not found in parent's childHosts array");
            }

            this.parent.childHosts.splice(ti, 1);
            this.parent = null;
        }
    }

    registerCommand(name: string, icon: string|null, description: string|null, handler: ICommand) {
        this.commands[name] = { name, icon, description, handler };
    }
    
    getCommand(name: string): ICommandInfo {
        if (this.commands.hasOwnProperty(name)) {
            return this.commands[name];
        }

        if (this.parent) {
            return this.parent.getCommand(name);
        }

        return null;
    }

    executeCommand(cmd: string, ...args: any[]) {
        const command = this.commands[cmd];
        if (!command) {
            if (this.parent) {
                return this.parent.executeCommand(cmd, ...args);
            } else {
                console.error("No such command: " + cmd);
                return;
            }
        }

        try {
            return command.handler.handle(...args);
        } catch (err) {
            console.error("Failed executing command: " + cmd);
            console.error(err);
        }
    }

    registerHotkey(key: string, cmd: string) {
        this.hotkeys[key] = cmd;
    }

    getHotkeyForCommand(cmd) {
        for (let hotkeyKey of Object.keys(this.hotkeys)) {
            const hotkey = this.hotkeys[hotkeyKey];
            if (hotkey == cmd) {
                return hotkeyKey;
            }
        }

        if (this.parent) {
            return this.parent.getHotkeyForCommand(cmd);
        }

        return null;
    }

    getCommandState(name: string): ICommandState {
        if (!this.commandStates[name]) {
            this.commandStates[name] = { enabled: true, toggled: false };
        }
        return this.commandStates[name];
    }

    setCommandState(name: string, partial: Partial<ICommandState>) {
        const state = this.getCommandState(name);
        Object.assign(state, partial);

        this.invokeStateListeners(name, state);
    }

    private invokeStateListeners(name: string, state: ICommandState) {
        const listeners = this.stateListeners[name];
        if (listeners) {
            for (const cb of listeners) {
                try {
                    cb(name, state);
                } catch (err) {
                    console.error("Error in command: " + name);
                    console.error(err);
                }
            }
        }

        for (const child of this.childHosts) {
            child.invokeStateListeners(name, state);
        }
    }

    addStateListener(command: string, callback: (command: string, state: ICommandState) => void): void {
        if (!this.stateListeners[command]) {
            this.stateListeners[command] = [];
        }

        this.stateListeners[command].push(callback);
    }

    removeStateListener(command: string, callback: (command: string, state: ICommandState) => void): void {
        const list = this.stateListeners[command];
        if (!list) return;

        const idx = list.indexOf(callback);
        if (idx !== -1) {
            list.splice(idx, 1);
        }
    }
}
