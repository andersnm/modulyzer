import { WavesPanel } from "../../components/WavesPanel";
import { CreateWaveCommand } from "./CreateWaveCommand";
import { GotoWaveEditorCommand } from "./GotoWaveEditorCommand";
import { OpenWaveCommand } from "./OpenWaveCommand";
import { PasteNewWaveCommand } from "./PasteNewWaveCommand";

export function registerWaveTableCommands(component: WavesPanel) {

    component.registerCommand("goto-wave-editor", "hgi-stroke hgi-audio-wave-01", null, new GotoWaveEditorCommand(component));
    component.registerCommand("create-wave", "hgi-stroke hgi-plus-sign-square", "Create New Wave", new CreateWaveCommand(component));
    component.registerCommand("open-wave", "hgi-stroke hgi-folder-02", "Load Wave", new OpenWaveCommand(component));
    component.registerCommand("paste-new-wave", "hgi-stroke hgi-task-add-01", "Import New Wave from Clipboard", new PasteNewWaveCommand(component));

    // component.registerCommand("select-all", null, null, new SelectAllCommand(component));
    component.registerHotkey("CTRL+V", "paste-new-wave");
    component.registerHotkey("CTRL+N", "create-wave");
    component.registerHotkey("Enter", "goto-wave-editor");

    // component.registerHotkey("CTRL+SHIFT+S", "save-wave");
    // component.registerHotkey("CTRL+Backspace", "edit-wave");
    // component.registerHotkey("Delete", "delete");
    // component.registerHotkey(" ", "play-wave");
}
