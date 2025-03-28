import { Appl } from './App';
import { ShowAudioConfigurationCommand } from './commands/ShowAudioConfigurationCommand';
import { CreateWaveCommand } from './commands/CreateWaveCommand';
import { ShowSequenceEditorCommand } from './commands/ShowSequenceEditorCommand';
import { ShowWavesCommand } from './commands/ShowWavesCommand';
import { ShowPatternsCommand } from './commands/ShowPatternsCommand';
import { OpenWaveCommand } from './commands/OpenWaveCommand';
import { ShowPatternEditorCommand } from './commands/ShowPatternEditorCommand';
import { ShowWaveEditorCommand } from './commands/ShowWaveEditorCommand';
import { SaveSongCommand } from './commands/SaveSongCommand';
import { RecordWaveCommand } from './commands/RecordWaveCommand';

const app = new Appl();
// app.registerCommand("play-current-recording", new PlayCurrentRecordingCommand(app))
app.registerCommand("show-audio-configuration", new ShowAudioConfigurationCommand(app))
app.registerCommand("show-waves", new ShowWavesCommand(app))
app.registerCommand("show-patterns", new ShowPatternsCommand(app))
app.registerCommand("show-pattern-editor", new ShowPatternEditorCommand(app))
app.registerCommand("show-wave-editor", new ShowWaveEditorCommand(app))
app.registerCommand("show-sequence-editor", new ShowSequenceEditorCommand(app))
app.registerCommand("save-song", new SaveSongCommand(app))

app.registerCommand("create-wave", new CreateWaveCommand(app))
app.registerCommand("open-wave", new OpenWaveCommand(app))
app.registerCommand("record-wave", new RecordWaveCommand(app))

// app.registerCommand("copy-selection", new CopySelectionCommand(app))
// app.registerCommand("cut-selection", new CutSelectionCommand(app))
// app.registerCommand("paste-selection", new PasteSelectionCommand(app))

// app.registerCommand("play-song", new PlayCurrentSongCommand(app))
// app.registerCommand("stop-song", new StopCurrentSongCommand(app))

// app.registerHotkey("CTRL+C", "copy-selection");
// app.registerHotkey("CTRL+X", "cut-selection");
// app.registerHotkey("CTRL+P", "paste-selection");
// app.registerHotkey("F4", "show-sequence");
// app.registerHotkey("F5", "play-song");
// app.registerHotkey("F8", "stop-song");

const el = app.render();

const mountPoint = document.querySelector("#app")!;
mountPoint.appendChild(el);

window["app"] =app;