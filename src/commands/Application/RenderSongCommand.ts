import { Appl } from "../../App";
import { OfflineAudioDevice } from "../../audio/AudioDevice";
import { Player } from "../../audio/Player";
import { PlayerSongAdapter } from "../../audio/PlayerSongAdapter";
import { BusyPanel } from "../../components/BusyPanel";
import { WAVEncoder, WAVFormat } from "../../wavefile/WAVEncoder";

export class RenderSongCommand {
  constructor(private app: Appl) {
  }

  async handle() {

    const saveHandle = await window.showSaveFilePicker({
      startIn: this.app.projectFile ?? this.app.homeDir,
      types: [
        {
          accept: {
            "audio/wav": [".wav" ],
          }
        }
      ],
      suggestedName: this.app.projectFile?.name ?? this.app.song.name,
    });

    const sampleRate = 44100;

    const panel = new BusyPanel(this.app, "Rendering. Please wait...");
    this.app.modalDialogContainer.showBusyModal("Mixdown", panel, false);

    const offlineDevice = new OfflineAudioDevice();
    const songLengthSec = this.app.song.loopEnd * (60 / this.app.song.bpm);
    await offlineDevice.create(sampleRate, songLengthSec, 2);

    const player = new Player(this.app.instrumentFactories, offlineDevice);
    const playerSongAdapter = new PlayerSongAdapter(this.app.song);
    playerSongAdapter.attachPlayer(player);

    const audioBuffer = await player.playOffline();
    const buffers = [audioBuffer.getChannelData(0), audioBuffer.getChannelData(1)];

    const enc = new WAVEncoder();
    const wav = enc.encode("Encoded", sampleRate, WAVFormat.Int16, buffers )
    let blob = new Blob([wav], {type: "audio/wav"});

    const writable = await saveHandle.createWritable();
    await writable.write(blob);
    await writable.close();

    this.app.modalDialogContainer.endModal(true);
  }
}
