import { ButtonToolbar, CommandHost, formatHotkey, FullScreen, GridFrameContainer, ICommand, IComponent, TabFrameContainer, visitNodeAndChildNodesBreadth, visitNodeAndChildNodesDepth } from "./nutz";
import { MenuBar } from "./nutz/Menubar";
import { ModalDialogContainer } from "./nutz/ModalDialogContainer";
import { mainMenu, MenuItem } from './menu/menu';
import { tryGetMicrophonePermission } from "./audio/AudioUtil";
import { AudioDevice } from "./audio/AudioDevice";
import { WavePanel } from "./components/WavePanel";
import { SongDocument, WaveDocumentEx } from "./audio/SongDocument";
import { InstrumentFactory } from "./audio/plugins/InstrumentFactory";
import { MasterFactory } from "./audio/plugins/Master";
import { ComboDelayFactory } from "./audio/plugins/ComboDelay";
import { OscillatorFactory } from "./audio/plugins/Oscillator";
import { MixerPanel } from "./components/MixerPanel";
import { ReverbFactory } from "./audio/plugins/Reverb";
import { Dx7Factory } from "./audio/plugins/Dx7";
import { Player } from "./audio/Player";
import { WaveTrackerFactory } from "./audio/plugins/WaveTracker";
import { Open303Factory } from "./audio/plugins/Open303";
import { WAVDecoder } from "./wavefile/WAVDecoder";
import { WAVEncoder, WAVFormat } from "./wavefile/WAVEncoder";
import { PlayerSongAdapter } from "./audio/PlayerSongAdapter";
import { WavePlayer } from "./audio/WavePlayer"; 
import { PinsPanel } from "./components/PinsPanel";
import { registerApplicationCommands } from "./commands/Application/Register";

class BpmInput implements IComponent {

    app: Appl;
    container: HTMLDivElement;
    input: HTMLInputElement;

    constructor(app: Appl) {
        this.app = app;
        this.container = document.createElement("div");
        this.container.classList.add("flex", "gap-1", "items-center");
    
        const label = document.createElement("span");
        label.classList.add("text-white");
        label.innerText = "BPM:";

        this.input = document.createElement("input");
        this.input.type = "number";
        this.input.min = "16";
        this.input.max = "280";
        this.input.value = this.app.song.bpm.toString();
        this.input.classList.add("rounded-lg", "p-1", "bg-neutral-600", "text-white", "text-center");

        this.input.addEventListener("change", () => {
            const i = parseInt(this.input.value);
            if (!isNaN(i)) {
                this.app.song.setBpm(i);
            }
        })

        this.container.appendChild(label);
        this.container.appendChild(this.input);
    }

    getDomNode(): Node {
        return this.container;
    }
}

class ToolbarContainer implements IComponent {
    container: HTMLDivElement;

    constructor() {
        // horizontally aligned, break if overflow
        this.container = document.createElement("div");
        this.container.className = "flex flex-row gap-1";

    }

    addToolbar(toolbar: Node) {
        this.container.appendChild(toolbar);
    }

    getDomNode(): Node {
        return this.container;
    }
}

class ElementComponent implements IComponent {
    constructor(private container: HTMLElement) {

    }
    getDomNode(): Node {
        return this.container;
    }
}

export class Appl extends CommandHost implements IComponent {
    fullscreen: FullScreen;
    menuBar: MenuBar;
    bpmInput: BpmInput;
    toolbar: HTMLElement;
    frame: GridFrameContainer;
    sidebarTabs: TabFrameContainer;
    mainTabs: TabFrameContainer;

    device: AudioDevice;
    song: SongDocument;
    player: Player;
    playerSongAdapter: PlayerSongAdapter;
    wavePlayer: WavePlayer;

    modalDialogContainer: ModalDialogContainer;

    domObserver: MutationObserver;

    instrumentFactories: InstrumentFactory[] = [
        new MasterFactory(),
        new ComboDelayFactory(),
        new OscillatorFactory(),
        new ReverbFactory(),
        new Dx7Factory(),
        new WaveTrackerFactory(),
        new Open303Factory(),
    ];

    constructor() {
        super(null);
        registerApplicationCommands(this);

        this.song = new SongDocument();

        this.device = new AudioDevice();

        this.wavePlayer = new WavePlayer(this);

        this.frame = new GridFrameContainer();
        this.fullscreen = new FullScreen(this.frame);

        this.menuBar = new MenuBar(this);
        this.menuBar.bindMenubarMenu(mainMenu);

        // NOTE: toolbar input button assigns to bpmInput
        const toolbar = ButtonToolbar(this, [
            {
                type: "button",
                label: "",
                action: "open-song",
            },
            {
                type: "button",
                label: "",
                action: "save-song",
            },
            {
                type: "button",
                label: "Play",
                action: "play-song",
            },
            {
                type: "button",
                label: "Stop",
                action: "stop-song",
            },
        ]);

        this.bpmInput = new BpmInput(this);
        const toolbarContainer = new ToolbarContainer();
        toolbarContainer.addToolbar(toolbar);
        toolbarContainer.addToolbar(this.bpmInput.getDomNode());

        this.sidebarTabs = new TabFrameContainer(true);
        this.sidebarTabs.setTabsPosition("bottom");

        this.mainTabs = new TabFrameContainer(false);

        this.frame.addFrame("top", 100, this.menuBar);
        
        // TODO; buttons and bpm+slider \ vu on same row
        this.frame.addFrame("top", 100, toolbarContainer);
        this.frame.addFrame("left", 100, this.sidebarTabs);
        this.frame.addFrame("main", 100, this.mainTabs);

        this.modalDialogContainer = new ModalDialogContainer();

        this.song.addEventListener("updateDocument", (ev: CustomEvent<SongDocument>) => {
            this.bpmInput.input.value = this.song.bpm.toString();
        });

        // Emit events for mounts and unmounts
        this.domObserver = new MutationObserver((mutationList: MutationRecord[], observer) => {
            for (const mutation of mutationList) {
                if (mutation.type === "childList") {
                    for (let node of mutation.addedNodes) {
                        visitNodeAndChildNodesBreadth(node, (subnode) => {
                            // console.log("OBSERVA", subnode);
                            subnode.dispatchEvent(new CustomEvent("nutz:mounted"));
                        });
                    }

                    for (let node of mutation.removedNodes) {
                        visitNodeAndChildNodesDepth(node, subnode => {
                            subnode.dispatchEvent(new CustomEvent("nutz:unmounted"));
                        });
                        
                    }
                }
            }
        });

        // observe the whole body - want to interact with modals opened in the body
        const config = { childList: true, subtree: true };
        this.domObserver.observe(document.body, config);
        // this.domObserver.observe(this.fullscreen.getDomNode(), config);

        window.addEventListener("keydown", this.onKeyDown);
    }

    async init() {

        // await this.storage.open();
        this.executeCommand("show-patterns");
        this.executeCommand("show-waves");

        const permission = await tryGetMicrophonePermission();

        this.executeCommand("show-audio-configuration");
        this.executeCommand("show-sequence-editor");
        this.executeCommand("show-pattern-editor");

        // recording panel = waveeditorpanel - redigerer én wave i prosjekte.
        const wq = new WavePanel(this);
        this.mainTabs.addTab("Wave", wq);

        const mq = new MixerPanel(this);
        this.mainTabs.addTab("Mixer", mq);

        const pq = new PinsPanel(this);
        this.sidebarTabs.addTab("Pins", pq);

        // re-focus
        this.executeCommand("show-patterns");
        this.executeCommand("show-sequence-editor");
    }

    async setAudioDevice(outputDeviceId, inputDeviceId) {
        await this.device.create(outputDeviceId, inputDeviceId);

        if (this.playerSongAdapter) {
            // this.playerSongAdapter.detach();
        }

        this.player = new Player(this.instrumentFactories, this.device.context);
        this.playerSongAdapter = new PlayerSongAdapter(this.player, this.song);
    }

    render() {
        this.init();
        return this.fullscreen.getDomNode();
    }

    getDomNode(): Node {
        return this.fullscreen.getDomNode();
    }

    uploadProject() {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";

        input.onchange = (event: Event) => {
            const target = event.target as HTMLInputElement;
            const file = target.files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = () => {
                    const json = JSON.parse(reader.result as string);
                    this.song.importProjectJson(json);
                    // callback(reader.result);
                };
                reader.readAsText(file);
            }
        };

        input.click();
    }

    downloadWave(wave: WaveDocumentEx) {
        const enc = new WAVEncoder();
        const wav = enc.encode(wave.name, wave.sampleRate, WAVFormat.Int32, wave.buffers )
        let blob = new Blob([wav], {type: "application/wav"});

        var a = window.document.createElement("a");
        window.document.body.appendChild(a);
        a.style.display = "none";

        var url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = "test.wav";
        a.click();
        window.URL.revokeObjectURL(url);
    }

    recordWave: WaveDocumentEx = null;
    recordOffset: number = 0;

    startRecordWave(wave: WaveDocumentEx, offset: number = 0) {

        if (this.recordWave) {
            this.stopRecordWave();
            return;
        }

        this.recordWave = wave;
        this.recordOffset = offset;
        this.device.recorder.addEventListener("input", this.onInput);
    }

    stopRecordWave() {
        if (!this.recordWave) {
            return;
        }

        this.device.recorder.removeEventListener("input", this.onInput);
        this.recordWave = null;
        this.recordOffset = 0;
    }

    onInput = (ev: CustomEvent<Float32Array[]>) => {
        const inputs = ev.detail;
        const inputLength = inputs[0].length;
        const outputLength = this.recordWave.sampleCount;

        if (this.recordOffset + inputLength >= outputLength) {
            // TODO; leaves some silence at end
            console.log("reached end of recording")
            this.stopRecordWave();
            return;
        }

        this.song.replaceWaveBuffer(this.recordWave, this.recordOffset, inputs);

        for (let i = 0; i < this.recordWave.buffers.length; i++) {
            const output = this.recordWave.buffers[i];
            const input = inputs[i % inputs.length];

            for (let j = 0; j < input.length; j++) {
                output[this.recordOffset + j] = input[j];
            }
        }

        this.recordOffset += inputLength;
        // notify document
    };

    onKeyDown = (e: KeyboardEvent) => {
        const keyName = formatHotkey(e);
        const hotkeyCommand = this.hotkeys[keyName];
        if (hotkeyCommand) {
            this.executeCommand(hotkeyCommand);
            // e.stopPropagation();
            e.preventDefault();
        }
    };
};
