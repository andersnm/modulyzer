import { WaveRange } from "./SongDocument";

export function samplePositionFromPixel(canvas: HTMLCanvasElement, offsetX: number, zoom: WaveRange, recordingLength: number) {
    const zoomStart = zoom ? zoom.start : 0;
    const zoomEnd = zoom ? zoom.end : recordingLength;
    const zoomWidth = zoomEnd - zoomStart;

    const n = offsetX / canvas.width;
    return zoomStart + Math.floor(n * zoomWidth);
    // const n = offsetX / canvas.width;
    // return Math.floor(n * recordingLength);
}

export function convertRemToPixels(rem) {
    return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}

export function drawWaveRange(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, zoom: WaveRange, range: WaveRange, bufferLength, color) {
    // invert selection rec, eller tegne opp og ned?
    ctx.fillStyle = color; //"#fff"
    // is in samples, fix to canvass ize

    const zoomStart = zoom ? zoom.start : 0;
    const zoomEnd = zoom ? zoom.end : bufferLength;
    const zoomWidth = zoomEnd - zoomStart;

    const startX = (range.start - zoomStart) / zoomWidth * width;
    const endX = (range.end - zoomStart) / zoomWidth * width;
    // const startX = (this.props.selection.start) / buffer.length * width;
    // const endX = this.props.selection.end / buffer.length * width;
    ctx.fillRect(x + startX, y, endX - startX, height);
}

export function drawWaveBuffer(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, zoom: WaveRange|null, buffer: Float32Array, bgColor, color) {
    ctx.fillStyle = bgColor || "#000";
    ctx.fillRect(x, y, width, height);

    const zoomStart = zoom ? zoom.start : 0;
    const zoomEnd = zoom ? zoom.end : buffer.length;
    const zoomWidth = zoomEnd - zoomStart;

    const deltaX = zoomWidth / width;
    let samplePosition = zoomStart;


    ctx.beginPath();
    ctx.moveTo(x, y + height / 2);
    for (let i = 0; i < width; i++) {

        const sp = Math.floor(samplePosition);
        const currentSample = buffer[sp];
        
        ctx.lineTo(x + i, y + (height / 2) + (currentSample * height));

        samplePosition += deltaX;
    }

    ctx.strokeStyle = color || "#FFF"
    ctx.stroke();
}

export function getHeightPerChannel(canvas: HTMLCanvasElement, channelCount: number, channelMargin: number) {
    let h: number; // height per channel in the editor

    if (channelCount > 1) {
        h = (canvas.height - ((channelCount - 1) * channelMargin)) / channelCount;
    } else {
        h = canvas.height;
    }

    return h;
}
