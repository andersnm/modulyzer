export class OverlapStream {
  buffer: Float32Array;
  first_slice: Float32Array;
  second_slice: Float32Array;
  sptr: number;
  eptr: number;
  onFrame: (frame: Float32Array) => void;

  constructor(private frame_size: number, private hop_size: number, onFrame: (frame: Float32Array) => void) {
    this.onFrame = onFrame;
    this.buffer = new Float32Array(2 * this.frame_size);
    this.first_slice = this.buffer.subarray(0, this.frame_size);
    this.second_slice = this.buffer.subarray(this.frame_size);
    this.sptr = 0;
    this.eptr = 0;
  }

  public push(data: Float32Array): void {
    var n = this.frame_size
    var i, j, k
    var B = this.buffer
    
    //Add data to frame
    k = this.eptr
    for(i=0, j=this.sptr; j<k && i<n; ++i, ++j) {
      B[j] += data[i]
    }
    for(; i<n; ++i, ++j) {
      B[j] = data[i]
    }
    this.sptr += this.hop_size
    this.eptr = j
    
    //Emit frame if necessary
    if(this.sptr >= this.frame_size) {
      this.onFrame(this.first_slice)
      this.first_slice.set(this.second_slice)
      this.sptr -= this.frame_size
      this.eptr -= this.frame_size
    }
  }
}
