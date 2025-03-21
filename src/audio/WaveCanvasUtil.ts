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
    ctx.globalAlpha = 0.5;
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

export function drawWaveBuffer(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, zoom: WaveRange|null, playPosition: number, buffer: Float32Array, bgColor, color) {
    ctx.fillStyle = bgColor || "#000";
    ctx.globalAlpha = 1;

    ctx.fillRect(x, y, width, height);

    const zoomStart = zoom ? zoom.start : 0;
    const zoomEnd = zoom ? zoom.end : buffer.length;
    const zoomWidth = zoomEnd - zoomStart;

    const deltaX = zoomWidth / width;
    // const deltaX = buffer.length / width;
    let samplePosition = zoomStart;

    console.log("Drawing wave buffer", zoomStart, zoomEnd, deltaX)

    ctx.beginPath();
    ctx.moveTo(x, y + height / 2);
    for (let i = 0; i < width; i++) {

        const sp = Math.floor(samplePosition);
        const currentSample = buffer[sp];
        
        ctx.lineTo(x + i, y + (height / 2) + (currentSample * height));

        samplePosition += deltaX;
    }
    ctx.strokeStyle = color || "#FFF"
    // ctx.strokeStyle = "#fff"
    ctx.stroke();

    // // invert selection rec, eller tegne opp og ned?
    // ctx.fillStyle = "#fff"
    // ctx.globalAlpha = 0.5;
    // if (selection) {
    //     // is in samples, fix to canvass ize
    //     const startX = (selection.start - zoomStart) / zoomWidth * width;
    //     const endX = (selection.end - zoomStart) / zoomWidth * width;
    //     // const startX = (this.props.selection.start) / buffer.length * width;
    //     // const endX = this.props.selection.end / buffer.length * width;
    //     ctx.fillRect(x + startX, y, endX - startX, height);
    // }

    // draw play position
    const playX = (playPosition - zoomStart) / zoomWidth * width;
    // const playX = this.props.playPosition / buffer.length * width;
    ctx.strokeStyle = "#0F0"
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.moveTo(x + playX, y);
    ctx.lineTo(x + playX, y + height);
    ctx.stroke();
}