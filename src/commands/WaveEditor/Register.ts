import { WaveFrame } from "../../components/WaveFrame";
import { CopyCommand } from "./CopyCommand";
import { CropCommand } from "./CropCommand";
import { CutCommand } from "./CutCommand";
import { DeleteCommand } from "./DeleteCommand";
import { EditWaveCommand } from "./EditWaveCommand";
import { PasteCommand } from "./PasteCommand";
import { PlayWaveCommand } from "./PlayWaveCommand";
import { SaveWaveCommand } from "./SaveWaveCommand";
import { SelectAllCommand } from "./SelectAllCommand";
import { ZoomClearCommand } from "./ZoomClearCommand";
import { ZoomCommand } from "./ZoomCommand";
import { ZoomInCommand } from "./ZoomInCommand";
import { ZoomOutCommand } from "./ZoomOutCommand";
import { CreateWaveCommand } from "./CreateWaveCommand";
import { DeleteWaveCommand } from "./DeleteWaveCommand";
import { OpenWaveCommand } from "./OpenWaveCommand";
import { PasteNewWaveCommand } from "./PasteNewWaveCommand";

export function registerWaveEditorCommands(component: WaveFrame) {
    component.registerCommand("save-wave", "hgi-stroke hgi-folder-02", "Save...", new SaveWaveCommand(component));
    component.registerCommand("edit-wave", "hgi-stroke hgi-edit-01", "Properties...", new EditWaveCommand(component));
    component.registerCommand("cut", "hgi-stroke hgi-scissor-01", "Cut", new CutCommand(component));
    component.registerCommand("copy", "hgi-stroke hgi-copy-01", "Copy", new CopyCommand(component));
    component.registerCommand("paste", "hgi-stroke hgi-column-insert", "Paste", new PasteCommand(component));
    component.registerCommand("crop", "hgi-stroke hgi-crop", "Crop", new CropCommand(component));
    component.registerCommand("delete", "hgi-stroke hgi-delete-02", "Delete", new DeleteCommand(component));
    component.registerCommand("zoom", "hgi-stroke hgi-zoom-in-area", "Zoom Selection", new ZoomCommand(component));
    component.registerCommand("zoom-in", "hgi-stroke hgi-zoom-in-area", "Zoom In", new ZoomInCommand(component));
    component.registerCommand("zoom-out", "hgi-stroke hgi-zoom-in-area", "Zoom Out", new ZoomOutCommand(component));
    component.registerCommand("zoom-clear", "hgi-stroke hgi-zoom-in-area", "Reset Zoom", new ZoomClearCommand(component));
    component.registerCommand("play-wave", "hgi-stroke hgi-next", "Play Wave", new PlayWaveCommand(component));

    component.registerCommand("select-all", null, null, new SelectAllCommand(component));

    component.registerCommand("create-wave", "hgi-stroke hgi-plus-sign-square", "Create New Wave", new CreateWaveCommand(component));
    component.registerCommand("open-wave", "hgi-stroke hgi-folder-02", "Load Wave", new OpenWaveCommand(component));
    component.registerCommand("paste-new-wave", "hgi-stroke hgi-task-add-01", "Import New Wave from Clipboard", new PasteNewWaveCommand(component));
    component.registerCommand("delete-wave", "hgi-stroke hgi-folder", null, new DeleteWaveCommand(component));

    component.registerHotkey("CTRL+SHIFT+V", "paste-new-wave");
    component.registerHotkey("CTRL+SHIFT+N", "create-wave");
    component.registerHotkey("CTRL+SHIFT+Delete", "delete-wave");

    component.registerHotkey("CTRL+A", "select-all");
    component.registerHotkey("CTRL+C", "copy");
    component.registerHotkey("CTRL+X", "cut");
    component.registerHotkey("CTRL+V", "paste");
    component.registerHotkey("CTRL++", "zoom-in");
    component.registerHotkey("CTRL+-", "zoom-out");
    component.registerHotkey("SHIFT+S", "zoom");
    component.registerHotkey("SHIFT+A", "zoom-clear");
    component.registerHotkey("CTRL+P", "crop");
    component.registerHotkey("CTRL+SHIFT+S", "save-wave");
    component.registerHotkey("CTRL+Backspace", "edit-wave");
    component.registerHotkey("Delete", "delete");
    component.registerHotkey(" ", "play-wave");
}
