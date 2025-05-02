import { WavesPanel } from "../../components/WavesPanel";
import { CreateWaveCommand } from "./CreateWaveCommand";
import { DeleteWaveCommand } from "./DeleteWaveCommand";
import { EditWaveCommand } from "./EditWaveCommand";
import { GotoWaveEditorCommand } from "./GotoWaveEditorCommand";
import { OpenWaveCommand } from "./OpenWaveCommand";
import { PasteNewWaveCommand } from "./PasteNewWaveCommand";

export function registerWaveTableCommands(component: WavesPanel) {

    component.registerCommand("goto-wave-editor", "hgi-stroke hgi-audio-wave-01", null, new GotoWaveEditorCommand(component));
    component.registerCommand("create-wave", "hgi-stroke hgi-plus-sign-square", "Create New Wave", new CreateWaveCommand(component));
    component.registerCommand("open-wave", "hgi-stroke hgi-folder-02", "Load Wave", new OpenWaveCommand(component));
    component.registerCommand("paste-new-wave", "hgi-stroke hgi-task-add-01", "Import New Wave from Clipboard", new PasteNewWaveCommand(component));
    component.registerCommand("edit-wave", "hgi-stroke hgi-edit-01", null, new EditWaveCommand(component));
    component.registerCommand("delete-wave", "hgi-stroke hgi-folder", null, new DeleteWaveCommand(component));

    component.registerHotkey("CTRL+V", "paste-new-wave");
    component.registerHotkey("CTRL+N", "create-wave");
    component.registerHotkey("Enter", "goto-wave-editor");
    component.registerHotkey("CTRL+Backspace", "edit-wave");
    component.registerHotkey("Delete", "delete-wave");
}
