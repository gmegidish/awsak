import {OpcodeWithOffset} from "./opcode";
import {OutputBufferedFile} from "../io/output-buffered-file";

export class SiOpcode extends OpcodeWithOffset {

	public constructor(
		public v: number,
		public value: number,
		public isReference: boolean,
		public cond: number,
		public offset: number) {
		super();
	}

	public writeTo(buf: OutputBufferedFile): void {

		let flags = this.cond & 0x3f;

		if (this.isReference) {
			flags |= 0x80;
		} else if (this.value > 0xff || this.value < 0) {
			flags |= 0x40;
		}

		buf.writeByte(0x0a);
		buf.writeByte(flags);
		buf.writeByte(this.v);
		if (!this.isReference) {
			if (flags & 0x40) {
				buf.writeUint16(this.value & 0xffff);
			} else {
				buf.writeByte(this.value);
			}
		} else {
			buf.writeByte(this.value & 0xff);
		}

		buf.writeUint16(this.offset);
	}

	toString(): string {
		let operation = "";
		switch (this.cond & 0x3f) {
			case 0:
				operation = "==";
				break;
			case 1:
				operation = "!=";
				break;
			case 2:
				operation = ">";
				break;
			case 3:
				operation = ">=";
				break;
			case 4:
				operation = "<";
				break;
			case 5:
				operation = "<=";
				break;
			default:
				throw new Error("Invalid condition " + this.cond);
		}

		if (this.isReference) {
			return `si\tv${this.v}\t${operation}\tv${this.value}\tL${this.offset.toString(16).padStart(4, "0")}`;
		} else {
			return `si\tv${this.v}\t${operation}\t${this.value}\tL${this.offset.toString(16).padStart(4, "0")}`;
		}
	}

	getOffset(): number {
		return this.offset;
	}
}
