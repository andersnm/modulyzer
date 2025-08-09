import { ButtonToolbar, CommandHost, formatHotkey, FullScreen, GridFrameContainer, HFlex, ICommand, IComponent, StatusBar, TabFrameContainer, visitNodeAndChildNodesBreadth, visitNodeAndChildNodesDepth } from "./nutz";
import { MenuBar } from "./nutz/Menubar";
import { ModalDialogContainer } from "./nutz/ModalDialogContainer";
import { mainMenu } from './menu/menu';
import { AudioDevice } from "./audio/AudioDevice";
import { SongDocument, WaveDocument } from "./audio/SongDocument";
import { InstrumentFactory } from "./audio/plugins/InstrumentFactory";
import { MasterFactory } from "./audio/plugins/Master";
import { ComboDelayFactory } from "./audio/plugins/ComboDelay";
import { OscillatorFactory } from "./audio/plugins/Oscillator";
import { ReverbFactory } from "./audio/plugins/Reverb";
import { Dx7Factory } from "./audio/plugins/Dx7";
import { Player } from "./audio/Player";
import { WaveTrackerFactory } from "./audio/plugins/WaveTracker";
import { Open303Factory } from "./audio/plugins/Open303";
import { PlayerSongAdapter } from "./audio/PlayerSongAdapter";
import { WavePlayer } from "./audio/WavePlayer"; 
import { registerApplicationCommands } from "./commands/Application/Register";
import { ContextMenuContainer } from "./nutz/ContextMenuContainer";
import { KickDrumFactory } from "./audio/plugins/KickDrum";
import { IndexedDBMap } from "./IndexedDBMap";
import { InflictorFactory } from "./audio/plugins/Inflictor";

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

export class Appl extends CommandHost implements IComponent {
    fullscreen: FullScreen;
    menuBar: MenuBar;
    bpmInput: BpmInput;
    toolbar: HTMLElement;
    frame: GridFrameContainer;
    mainTabs: TabFrameContainer;

    device: AudioDevice;
    song: SongDocument;
    player: Player;
    playerSongAdapter: PlayerSongAdapter;
    wavePlayer: WavePlayer;
    homeDir: FileSystemDirectoryHandle;

    modalDialogContainer: ModalDialogContainer;
    contextMenuContainer: ContextMenuContainer;

    domObserver: MutationObserver;

    instrumentFactories: InstrumentFactory[] = [
        new MasterFactory(),
        new ComboDelayFactory(),
        new OscillatorFactory(),
        new ReverbFactory(),
        new Dx7Factory(),
        new WaveTrackerFactory(),
        new Open303Factory(),
        new KickDrumFactory(),
        new InflictorFactory(),
    ];

    constructor() {
        super(null);
        registerApplicationCommands(this);

        this.song = new SongDocument();
        this.playerSongAdapter = new PlayerSongAdapter(this.song);

        this.device = new AudioDevice();

        this.wavePlayer = new WavePlayer(this);

        this.frame = new GridFrameContainer();
        this.fullscreen = new FullScreen(this.frame);

        this.menuBar = new MenuBar(this);
        this.menuBar.bindMenubarMenu(mainMenu);

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

        const toolbarContainer = HFlex([toolbar, this.bpmInput.getDomNode()], "gap-1");

        this.mainTabs = new TabFrameContainer(false);

        this.frame.addFrame("top", this.menuBar.getDomNode() as HTMLElement);
        this.frame.addFrame("top", toolbarContainer, undefined, 1);
        this.frame.addFrame("main", this.mainTabs.getDomNode() as HTMLElement);

        this.modalDialogContainer = new ModalDialogContainer();
        this.contextMenuContainer = new ContextMenuContainer();

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
        window.addEventListener("beforeunload", (e) => {
            // set a truthy value to property returnValue
            e.returnValue = true;
            e.preventDefault();
          });
    }

    async init() {

        // Default main views
        this.executeCommand("show-sequence-editor");
        this.executeCommand("show-pattern-editor");
        this.executeCommand("show-wave-editor");
        this.executeCommand("show-mixer");

        // re-focus
        this.executeCommand("show-sequence-editor");

        // Initialize filesystem
        this.homeDir = await this.readSetting<FileSystemDirectoryHandle>("HomeHandle");
        const permission = await this.homeDir?.queryPermission()
        if (permission !== "granted") {
            await this.executeCommand("show-filesystem-configuration");
        }

        // Initialize audio
        this.device.outputDeviceId = await this.readSetting<string>("OutputDevice") ?? null;
        this.device.inputDeviceId = await this.readSetting<string>("InputDevice") ?? null;
        this.device.latencySec = await this.readSetting<number>("Latency") ?? 125;

        await this.executeCommand("show-audio-configuration");
    }

    async readSetting<T>(key: string) {
        const handleMap = new IndexedDBMap("settings");
        return await handleMap.get<T>(key);
    }

    async writeSetting<T>(key: string, value: T) {
        const handleMap = new IndexedDBMap("settings");
        await handleMap.set(key, value);
    }

    async setAudioDevice(outputDeviceId: string, inputDeviceId: string, latencySec: number) {
        await this.device.create(outputDeviceId, inputDeviceId, latencySec);

        this.player = new Player(this.instrumentFactories, this.device.context);
        this.playerSongAdapter.attachPlayer(this.player);

        await this.writeSetting("OutputDevice", outputDeviceId);
        await this.writeSetting("InputDevice", inputDeviceId);
        await this.writeSetting("Latency", latencySec);
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

    recordWave: WaveDocument = null;
    recordOffset: number = 0;

    startRecordWave(wave: WaveDocument, offset: number = 0) {

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
