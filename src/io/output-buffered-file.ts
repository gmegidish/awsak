import assert = require("assert");

export abstract class OutputFile {

	public abstract writeByte(value: number): void;

	public abstract writeByteAt(offset: number, value: number): void;

	public writeBytes(bytes: Uint8Array) {
		for (let i = 0; i < bytes.length; i++) {
			this.writeByte(bytes[i]);
		}
	}

	public writeUint16(value: number) {
		this.writeByte(value >> 8);
		this.writeByte(value & 0xff);
	}

	public writeUint16LE(value: number) {
		this.writeByte(value & 0xff);
		this.writeByte(value >> 8);
	}

	public writeUint16At(offset: number, value: number) {
		this.writeByteAt(offset, value >> 8);
		this.writeByteAt(offset + 1, value & 0xff);
	}

	public writeUint32(value: number) {
		this.writeByte(value >> 24);
		this.writeByte((value >> 16) & 0xff);
		this.writeByte((value >> 8) & 0xff);
		this.writeByte(value & 0xff);
	}

	public writeUint32LE(value: number) {
		this.writeByte(value & 0xff);
		this.writeByte((value >> 8) & 0xff);
		this.writeByte((value >> 16) & 0xff);
		this.writeByte(value >> 24);
	}
}

export class OutputBufferedFile extends OutputFile {

	private MAX_SIZE = 1024 * 1024;

	private data: Uint8Array = new Uint8Array(this.MAX_SIZE);
	private offset = 0;

	private constructor() {
		super();
	}

	public static create(): OutputBufferedFile {
		return new OutputBufferedFile();
	}

	public writeByte(value: number) {
		this.data = this.ensureCapacity(this.offset + 1);
		this.data[this.offset++] = value;
	}

	public writeByteAt(offset: number, value: number) {
		assert(offset < this.data.length);
		this.data[offset] = value;
	}

	public toUint8Array(): Uint8Array {
		return this.data.slice(0, this.offset);
	}

	private ensureCapacity(minCapacity: number): Uint8Array {
		if (minCapacity > this.data.length) {
			throw new Error("Too much data written, needed " + minCapacity + " but only " + this.data.length + " available");
		}

		return this.data;
	}

	public getOffset(): number {
		return this.offset;
	}
}
