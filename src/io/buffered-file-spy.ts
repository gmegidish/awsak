import {BufferedFile} from "./buffered-file";

export class BufferedFileSpy extends BufferedFile {

	private offsetsVisited: Uint8Array;

	private constructor(protected data: Uint8Array) {
		super(data);
		this.offsetsVisited = new Uint8Array(data.length);
	}

	public static open(fileData: Uint8Array): BufferedFileSpy {
		return new BufferedFileSpy(fileData);
	}

	readByte(): number {
		this.offsetsVisited[this.getOffset()] = 1;
		return super.readByte();
	}

	readByteAt(offset: number): number {
		this.offsetsVisited[offset] = 1;
		return super.readByteAt(offset);
	}

	getOffsetsVisited(): Uint8Array {
		return this.offsetsVisited;
	}
}
