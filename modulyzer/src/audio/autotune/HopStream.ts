export class HopStream {
  protected readonly frameSize: number;
  protected readonly hopSize: number;
  private readonly buffer: Float32Array;
  private readonly frameSlices: Float32Array[];
  private ptr: number = 0;
  private onFrame: (frame: Float32Array) => void;

  constructor(
    frameSize: number,
    hopSize: number,
    onFrame: (frame: Float32Array) => void,
    maxDataSize?: number
  ) {
    if (hopSize > frameSize) {
      throw new Error("Hop size must be smaller than frame size");
    }
    if ((frameSize % hopSize) !== 0) {
      console.log(frameSize, hopSize)
      throw new Error("Hop size must divide frame size");
    }

    this.frameSize = frameSize;
    this.hopSize = hopSize;
    this.onFrame = onFrame;

    const actualMaxDataSize = maxDataSize ?? frameSize;
    this.buffer = new Float32Array(frameSize + actualMaxDataSize);

    this.frameSlices = [];
    for (let j = 0; j + frameSize <= this.buffer.length; j += hopSize) {
      this.frameSlices.push(this.buffer.subarray(j, j + frameSize));
    }
  }

  public push(data: Float32Array): void {
    const frameSize = this.frameSize;
    const hopSize = this.hopSize;
    const buffer = this.buffer;
    const frameSlices = this.frameSlices;

    buffer.set(data, this.ptr);
    this.ptr += data.length;

    let i = 0;
    let j = 0;
    for (; j + frameSize <= this.ptr; ++i, j += hopSize) {
      this.onFrame(frameSlices[i]);
    }

    let k = 0;
    for (; j < this.ptr; ) {
      buffer.set(frameSlices[i], k);
      let nhops = Math.ceil((k + frameSize) / hopSize) | 0;
      let nptr = nhops * hopSize;
      if (nptr !== k + frameSize) {
        nhops -= 1;
        nptr -= hopSize;
      }
      i += nhops;
      j += nptr - k;
      k = nptr;
    }

    this.ptr += k - j;
  }
}
