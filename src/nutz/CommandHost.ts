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
}

interface ICommandInfo {
    name: string;
    icon: string|null;
    description: string|null;
    handler: ICommand;
}

export abstract class CommandHost implements ICommandHost {
    parent: ICommandHost | null;
    commands: { [key: string]: ICommandInfo } = {};
    hotkeys: { [key: string]: string } = {};

    constructor(parent: ICommandHost | null) {
        this.parent = parent;
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
}
