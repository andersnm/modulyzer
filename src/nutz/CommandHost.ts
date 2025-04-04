import { ICommand, ICommandStatic } from "./ICommand";

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

    keyName += e.key.toUpperCase();
    return keyName;
}

export interface ICommandHost {
    executeCommand(command: string): void;
    getCommand(command: string): { hotkey: string, icon: string, description: string };
    getHotkeyForCommand(command: string): string | null;
}

interface ICommandInfo {
    name: string;
    hotkey: string;
    icon: string|null;
    description: string|null;
    handler: ICommand;
}

export abstract class CommandHost implements ICommandHost {
    parent: CommandHost | null;
    commands: { [key: string]: ICommandInfo } = {};
    hotkeys: { [key: string]: string } = {};

    constructor(parent: CommandHost | null) {
        this.parent = parent;
    }

    registerCommand(name: string, icon: string|null, description: string|null, handler: ICommand) {
        this.commands[name] = { name, icon, description, hotkey: null, handler };
    }
    
    getCommand(name: string): ICommandInfo {
        return this.commands[name];
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
        
        const cmdInfo = this.commands[cmd];
        if (cmdInfo && !cmdInfo.hotkey) {
            this.commands[cmd].hotkey = key;
        }
    }

    getHotkeyForCommand(cmd) {
        for (let hotkeyKey of Object.keys(this.hotkeys)) {
            const hotkey = this.hotkeys[hotkeyKey];
            if (hotkey == cmd) {
                return hotkeyKey;
            }
        }

        return null;
    }
}
