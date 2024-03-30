import * as fs from "fs";

export class BufferedFile {
	private offset = 0;

	protected constructor(protected data: Uint8Array) {
		this.offset = 0;
	}

	public seek(offset: number) {
		this.offset = offset;
	}

	public size() {
		return this.data.length;
	}

	public available(): boolean {
		return this.data.length > this.offset;
	}

	public static open(fileData: Uint8Array): BufferedFile {
		return new BufferedFile(fileData);
	}

	public static openFile(path: string): BufferedFile {
		const data = fs.readFileSync(path);
		return BufferedFile.open(data);
	}

	public getOffset(): number {
		return this.offset;
	}

	public readByte(): number {
		if (this.offset >= this.data.length) {
			throw new Error("Read beyond the end of the file");
		}

		return this.data[this.offset++];
	}

	public readByteAt(offset: number): number {
		if (this.offset >= this.data.length) {
			throw new Error("Read beyond the end of the file");
		}
		return this.data[offset] & 0xff;
	}

	public readBytes(count: number): Uint8Array {
		if (this.offset + count > this.data.length) {
			throw new Error("Read beyond the end of the file");
		}

		const result = this.data.slice(this.offset, this.offset + count);
		this.offset += count;
		return result;
	}

	public readUint16(): number {
		return (this.readByte() << 8) | this.readByte();
	}

	public readUint16At(offset: number): number {
		return (this.readByteAt(offset) << 8) | this.readByteAt(offset + 1);
	}

	public readUint32(): number {
		return (this.readUint16() << 16) | this.readUint16();
	}

	public readUint32At(offset: number): number {
		return (this.readUint16At(offset) << 16) | this.readUint16At(offset + 2);
	}
}
