import { Appl } from '../../App';
import { ShowAudioConfigurationCommand } from './ShowAudioConfigurationCommand';
import { CreateWaveCommand } from './CreateWaveCommand';
import { ShowSequenceEditorCommand } from './ShowSequenceEditorCommand';
import { ShowWavesCommand } from './ShowWavesCommand';
import { ShowPatternsCommand } from './ShowPatternsCommand';
import { OpenWaveCommand } from './OpenWaveCommand';
import { ShowPatternEditorCommand } from './ShowPatternEditorCommand';
import { ShowWaveEditorCommand } from './ShowWaveEditorCommand';
import { SaveSongCommand } from './SaveSongCommand';
import { RecordWaveCommand } from './RecordWaveCommand';
import { PlayWaveCommand } from './PlayWaveCommand';

export function registerApplicationCommands(app: Appl) {
    app.registerCommand("show-audio-configuration", null, null, new ShowAudioConfigurationCommand(app));
    app.registerCommand("show-waves", null, null, new ShowWavesCommand(app));
    app.registerCommand("show-patterns", null, null, new ShowPatternsCommand(app));
    app.registerCommand("show-pattern-editor", null, null, new ShowPatternEditorCommand(app));
    app.registerCommand("show-wave-editor", null, null, new ShowWaveEditorCommand(app));
    app.registerCommand("show-sequence-editor", null, null, new ShowSequenceEditorCommand(app));
    app.registerCommand("save-song", "hgi-download-04", null, new SaveSongCommand(app));
    
    app.registerCommand("create-wave", "hgi-plus-sign-square", null, new CreateWaveCommand(app));
    app.registerCommand("open-wave", "hgi-folder-02", null, new OpenWaveCommand(app));
    app.registerCommand("record-wave", "hgi-record", null, new RecordWaveCommand(app));
    app.registerCommand("play-wave", "hgi-next", null, new PlayWaveCommand(app));

    app.registerHotkey("F2", "show-pattern-editor");
    app.registerHotkey("SHIFT+F2", "show-patterns");
    // app.registerHotkey("F3", "show-mixer");
    // app.registerHotkey("SHIFT+F3", "show-pins");
    app.registerHotkey("F4", "show-sequence-editor");
    app.registerHotkey("F9", "show-wave-editor");
    app.registerHotkey("SHIFT+F9", "show-waves");

    app.registerHotkey("CTRL+S", "save-song");
}
