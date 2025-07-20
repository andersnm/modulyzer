import { PinsPanel } from "../../components/PinsPanel";
import { ImportDx7SysexCommand } from "./ImportDx7SysexBankCommand";
import { ImportLocalBankCommand } from "./ImportLocalBankCommand";
import { SaveLocalBankCommand } from "./SaveLocalBankCommand";

export function registerPinsCommands(component: PinsPanel) {
    component.registerCommand("import-dx7-sysex-bank", "hgi-stroke hgi-sliders-vertical", null, new ImportDx7SysexCommand(component));
    component.registerCommand("import-local-bank", "hgi-stroke hgi-sliders-horizontal", null, new ImportLocalBankCommand(component));
    component.registerCommand("save-local-bank", "hgi-stroke hgi-download-04", null, new SaveLocalBankCommand(component));

    // component.registerHotkey("CTRL+A", "select-all");
}
