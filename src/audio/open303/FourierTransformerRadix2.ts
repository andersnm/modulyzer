import { rdft } from "./Fft";

export class FourierTransformerRadix2 {
    private N: number;
    private logN: number;
    private ip: Int32Array; // Auxiliary array for FFT
    private w: Float64Array;  // Work array for FFT
    private direction: 'FORWARD' | 'INVERSE';
    private normalizationMode: 'ORTHONORMAL_TRAFO' | 'NORMALIZE_ON_FORWARD_TRAFO' | 'NORMALIZE_ON_INVERSE_TRAFO';
    private normalizationFactor: number;
    tmpBuffer: {re, im}[];

    constructor() {
        this.N = 0;
        this.logN = 0;
        this.direction = 'FORWARD';
        this.normalizationMode = 'NORMALIZE_ON_INVERSE_TRAFO';
        this.normalizationFactor = 1.0;
        this.w = null;
        this.ip = null;
        this.tmpBuffer = null;

        this.setBlockSize(256); // Default block size
    }

    private isPowerOfTwo(value: number): boolean {
        return (value & (value - 1)) === 0 && value > 0;
    }

    private updateNormalizationFactor(): void {
        if (
            (this.normalizationMode === 'NORMALIZE_ON_FORWARD_TRAFO' && this.direction === 'FORWARD') ||
            (this.normalizationMode === 'NORMALIZE_ON_INVERSE_TRAFO' && this.direction === 'INVERSE')
        ) {
            this.normalizationFactor = 1.0 / this.N;
        } else if (this.normalizationMode === 'ORTHONORMAL_TRAFO') {
            this.normalizationFactor = 1.0 / Math.sqrt(this.N);
        } else {
            this.normalizationFactor = 1.0;
        }
    }

    public setBlockSize(newBlockSize: number): void {
        // Check new block size for validity
        if (newBlockSize >= 2 && this.isPowerOfTwo(newBlockSize)) {
            // Avoid unnecessary reallocations and recomputations
            if (newBlockSize !== this.N) {
                this.N = newBlockSize;
                this.logN = Math.floor(Math.log2(this.N + 0.5));
                this.updateNormalizationFactor();

                // Reallocate and initialize work array
                this.w = new Float64Array(2 * this.N).fill(0);

                // Reallocate and initialize auxiliary array
                this.ip = new Int32Array(Math.ceil(4.0 + Math.sqrt(this.N))).fill(0);
                this.ip[0] = 0; // Indicate that re-initialization is necessary

                // Reallocate and initialize temporary buffer
                this.tmpBuffer = new Array(this.N); // .fill({ re: 0, im: 0 });
                for (let i = 0; i < this.tmpBuffer.length; i++) {
                    this.tmpBuffer[i] = {re: 0, im:0};
                  }
              
            }
        } else if (!this.isPowerOfTwo(newBlockSize) || newBlockSize <= 1) {
            throw new Error('Block size must be a power of two and greater than or equal to 2');
        }
    }

    public setDirection(newDirection: 'FORWARD' | 'INVERSE'): void {
        if (newDirection === 'FORWARD' || newDirection === 'INVERSE') {
            // Conjugate twiddle factors only if the direction changes
            if (newDirection !== this.direction) {
                this.direction = newDirection;
                this.updateNormalizationFactor();
            }
        } else {
            throw new Error('Invalid direction: must be "FORWARD" or "INVERSE"');
        }
    }

    public transformSymmetricSpectrum(inSpectrum: { re: number; im: number }[], outSignal: Float64Array): void {
        this.setDirection('INVERSE');

        // Retrieve the real part of the first array entry
        // const d_inBuffer: number[] = new Array(this.N);  //inSpectrum.map((complex) => complex.re);

        // Copy the input into the output for the in-place routine (with normalization if necessary)
        // if (this.normalizationFactor !== 1.0) {
            for (let n = 0; n < this.N; n++) {
                const m = n % 2;
                if (m === 0) {
                    outSignal[n] = 2.0 * inSpectrum[(n / 2) | 0].re * this.normalizationFactor;
                } else {
                    outSignal[n] = 2.0 * -inSpectrum[(n / 2) | 0].im * this.normalizationFactor;
                }
                // outSignal[n] = 2.0 * d_inBuffer[n] * this.normalizationFactor;
            }
        // } else {
        //     for (let n = 0; n < this.N; n++) {
        //         outSignal[n] = 2.0 * d_inBuffer[n];
        //     }
        // }

        // Take the complex conjugates of the second half of the spectrum
        // for (let n = 3; n < this.N; n += 2) {
        //     outSignal[n] = -outSignal[n];
        // }

        // Use Ooura's FFT routine (adapted for TypeScript)
        rdft(this.N, -1, outSignal, this.ip, this.w);
    }

    public transformRealSignal(inSignal: number[], outSpectrum: { re: number; im: number }[]): void {
        this.setDirection('FORWARD');

        // Retrieve the buffer for transformation
        const d_outBuffer: Float64Array = new Float64Array(this.N);

        // Copy and normalize the input signal into the transformation buffer
        if (this.normalizationFactor !== 1.0) {
            for (let n = 0; n < this.N; n++) {
                d_outBuffer[n] = inSignal[n] * this.normalizationFactor;
            }
        } else {
            for (let n = 0; n < this.N; n++) {
                d_outBuffer[n] = inSignal[n];
            }
        }

        // Perform the forward FFT transformation
        rdft(this.N, 1, d_outBuffer, this.ip, this.w);

        // Convert the transformed result into the `outSpectrum` array
        // The real parts and imaginary parts are interleaved in d_outBuffer
        outSpectrum[0].re = d_outBuffer[0];
        outSpectrum[0].im = d_outBuffer[1];

        for (let k = 1; k < this.N / 2; k++) {
            const re = d_outBuffer[2 * k];
            const im = d_outBuffer[2 * k + 1];
            outSpectrum[k].re = re; // = { re, im }; // Positive frequencies
            outSpectrum[k].im = -im; // = { re, im: -im }; // Negative frequencies (complex conjugates)
        }

        // outSpectrum[0] = { re: d_outBuffer[0], im: 0 }; // DC component
        // outSpectrum[this.N / 2] = { re: d_outBuffer[1], im: 0 }; // Nyquist frequency

        // for (let k = 1; k < this.N / 2; k++) {
        //     const re = d_outBuffer[2 * k];
        //     const im = d_outBuffer[2 * k + 1];
        //     outSpectrum[k] = { re, im }; // Positive frequencies
        //     outSpectrum[this.N - k] = { re, im: -im }; // Negative frequencies (complex conjugates)
        // }

        // // Handle special case for imaginary parts in the interleaved array
        // // for (let n = 3; n < this.N; n += 2) {
        // //     d_outBuffer[n] = -d_outBuffer[n];
        // // }

        // for (let k = 1; k < this.N / 2; k++) {
        //     outSpectrum[k] = { re: outSpectrum[k].re, im: -outSpectrum[k].im };
        // }
    }
    // public transformRealSignal(inSignal: number[], outSpectrum: { re: number; im: number }[]): void {
    //     this.setDirection('FORWARD');

    //     // Map to extract the real part as an array
    //     const d_outBuffer: number[] = outSpectrum.map((complex) => complex.re);

    //     // Normalize the input and copy it into the output
    //     if (this.normalizationFactor !== 1.0) {
    //         for (let n = 0; n < this.N; n++) {
    //             d_outBuffer[n] = inSignal[n] * this.normalizationFactor;
    //         }
    //     } else {
    //         for (let n = 0; n < this.N; n++) {
    //             d_outBuffer[n] = inSignal[n];
    //         }
    //     }

    //     // Apply the Ooura FFT routine
    //     rdft(this.N, 1, d_outBuffer, this.ip, this.w);

    //     // Take the complex conjugates of the second half of the spectrum
    //     for (let n = 3; n < this.N; n += 2) {
    //         d_outBuffer[n] = -d_outBuffer[n];
    //     }

    //     // Update `outSpectrum` with the transformed real values
    //     for (let i = 0; i < this.N; i++) {
    //         outSpectrum[i] = { re: d_outBuffer[i], im: outSpectrum[i]?.im ?? 0 };
    //     }
    // }
}
