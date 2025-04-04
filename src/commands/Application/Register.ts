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
import { OpenSongCommand } from './OpenSongCommand';
import { PlaySongCommand } from './PlaySongCommand';
import { StopSongCommand } from './StopSongCommand';
import { PasteNewWaveCommand } from './PasteNewWaveCommand';
import { CreatePatternCommand } from './CreatePatternCommand';

export function registerApplicationCommands(app: Appl) {
    app.registerCommand("show-audio-configuration", null, null, new ShowAudioConfigurationCommand(app));
    app.registerCommand("show-waves", null, null, new ShowWavesCommand(app));
    app.registerCommand("show-patterns", null, null, new ShowPatternsCommand(app));
    app.registerCommand("show-pattern-editor", null, null, new ShowPatternEditorCommand(app));
    app.registerCommand("show-wave-editor", null, null, new ShowWaveEditorCommand(app));
    app.registerCommand("show-sequence-editor", null, null, new ShowSequenceEditorCommand(app));
    app.registerCommand("save-song", "hgi-stroke hgi-download-04", null, new SaveSongCommand(app));
    app.registerCommand("open-song", "hgi-stroke hgi-folder-02", null, new OpenSongCommand(app));
    app.registerCommand("play-song", "hgi-stroke hgi-next", null, new PlaySongCommand(app));
    app.registerCommand("stop-song", "hgi-stroke hgi-record", null, new StopSongCommand(app));

    app.registerCommand("create-wave", "hgi-stroke hgi-plus-sign-square", null, new CreateWaveCommand(app));
    app.registerCommand("open-wave", "hgi-stroke hgi-folder-02", null, new OpenWaveCommand(app));
    app.registerCommand("record-wave", "hgi-stroke hgi-record", null, new RecordWaveCommand(app));
    app.registerCommand("play-wave", "hgi-stroke hgi-next", null, new PlayWaveCommand(app));
    app.registerCommand("paste-new-wave", "hgi-stroke hgi-next", null, new PasteNewWaveCommand(app));

    app.registerCommand("create-pattern", "hgi-stroke hgi-plus-sign-square", null, new CreatePatternCommand(app));

    app.registerHotkey("F2", "show-pattern-editor");
    app.registerHotkey("SHIFT+F2", "show-patterns");
    // app.registerHotkey("F3", "show-mixer");
    // app.registerHotkey("SHIFT+F3", "show-pins");
    app.registerHotkey("F4", "show-sequence-editor");
    app.registerHotkey("F5", "play-song");
    app.registerHotkey("F8", "stop-song");
    app.registerHotkey("F9", "show-wave-editor");
    app.registerHotkey("SHIFT+F9", "show-waves");

    app.registerHotkey("CTRL+O", "open-song");
    app.registerHotkey("CTRL+S", "save-song");
}
