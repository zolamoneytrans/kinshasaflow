declare module 'wav' {
  import { Writable, WritableOptions } from 'stream';

  export interface WriterOptions extends WritableOptions {
    format?: number;
    channels?: number;
    sampleRate?: number;
    bitDepth?: number;
  }

  export class Writer extends Writable {
    constructor(options?: WriterOptions);
  }

  export class Reader extends Writable {
    constructor(options?: any);
  }

  const wav: {
    Writer: typeof Writer;
    Reader: typeof Reader;
  };

  export default wav;
}
