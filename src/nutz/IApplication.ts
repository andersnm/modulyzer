export interface IApplication {
    executeCommand(command: string): void;
}


export abstract class ApplicationBase implements IApplication {
    commands: { [key: string]: any} = {};
    hotkeys: { [key: string]: string} = {};

    registerCommand(cmd: string, handler: any) {
        this.commands[cmd] = handler;
    }

    executeCommand(cmd: string, ...args: any[]) {
        const command = this.commands[cmd];
        if (!command) {
            throw new Error("No such command: " + cmd);
        }

        command.handle(...args);
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

        return null;
    }
}
