import { Appl } from '../App';
import { IndexedDBMap } from '../IndexedDBMap';
import { FormGroup, IComponent, VInset, ModalButtonBar, Button, HFlex, domAppendNodes } from '../nutz';

function copyOnClick(e: HTMLElement): HTMLElement {
    e.classList.add("hover:cursor-copy");
    e.addEventListener("click", async () => {
        const range = document.createRange();
        range.selectNodeContents(e);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        // and/or:
        // const text = e.innerText;
        // await navigator.clipboard.writeText(text);
    });

    return e;
}

export class FileSystemConfiguration implements IComponent {
    app: Appl;
    cancelable: boolean = true;
    homeDir: FileSystemDirectoryHandle | null;
    permission: PermissionState | null;

    buttonBar: ModalButtonBar;
    containerElement: HTMLElement;
    homeDirInput: HTMLInputElement;
    homeDirButton: HTMLButtonElement;

    constructor(app: Appl, homeDir: FileSystemDirectoryHandle | null) {
        this.app = app;
        this.homeDir = homeDir;
        this.cancelable = !!homeDir;
        this.containerElement = VInset(undefined, ["flex-1", "gap-1"]);
        this.containerElement.tabIndex = -1;

        const infoP = document.createElement("p");
        infoP.classList.add("text-white");
        domAppendNodes(infoP, [ 
            document.createTextNode("Pick a local directory to store projects, presets and (temporary) waveforms. F.ex "),
            domAppendNodes(copyOnClick(document.createElement("code")), document.createTextNode("%UserProfile%\\modulyzer")),
            document.createTextNode(" or "),
            domAppendNodes(copyOnClick(document.createElement("code")), document.createTextNode("~/modulyzer")),
            document.createTextNode("."),
        ]);

        this.homeDirInput = document.createElement("input");
        this.homeDirInput.className = "w-full rounded-lg p-1 bg-neutral-800";
        this.homeDirInput.value = homeDir?.name || "<not set>";
        this.homeDirInput.disabled = true;

        this.homeDirButton = Button();
        this.homeDirButton.innerText = "Browse...";
        this.homeDirButton.addEventListener("click", this.onHomeDirButtonClick)

        const homeDirBar = HFlex([this.homeDirInput, this.homeDirButton], "gap-1");
        const homeDirGroup = FormGroup("Directory", homeDirBar);

        this.buttonBar = new ModalButtonBar(this.app);

        this.containerElement.appendChild((VInset(infoP)));
        this.containerElement.appendChild(homeDirGroup);
        this.containerElement.appendChild(this.buttonBar.getDomNode());

        this.bindButtons();

        this.containerElement.addEventListener("nutz:mounted", this.onMounted);
        this.containerElement.addEventListener("nutz:unmounted", this.onUnmounted);
    }

    onMounted = async () => {
        await this.checkPermission();
    }

    onUnmounted = () => {
    }

    onHomeDirButtonClick = async () => {
        const handleMap = new IndexedDBMap("handles");
        const homeHandle = await handleMap.get<FileSystemDirectoryHandle>("HomeHandle");

        const handle = await window.showDirectoryPicker({
            startIn: homeHandle,
            mode: "readwrite", 
        });

        this.homeDir = handle;
        this.homeDirInput.value = handle.name;

        await this.checkPermission();
    };

    async checkPermission() {
        if (this.homeDir) {
            this.permission = await this.homeDir.requestPermission();
            this.bindButtons();
        }
    }

    bindButtons() {
        const hasPermission = this.permission === "granted";
        this.buttonBar.cancelButton.disabled = !this.cancelable || !hasPermission;
        this.buttonBar.okButton.disabled = !hasPermission;
    }

    getDomNode(): Node {
        return this.containerElement;
    }
}
