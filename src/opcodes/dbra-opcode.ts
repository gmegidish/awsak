import {OutputBufferedFile} from "../io/output-buffered-file";
import {OpcodeWithOffset} from "./opcode";

export class DbraOpcode extends OpcodeWithOffset {
	public constructor(public v: number, public offset: number) {
		super();
	}

	public writeTo(buf: OutputBufferedFile): void {
		buf.writeByte(0x09);
		buf.writeByte(this.v);
		buf.writeUint16(this.offset);
	}

	toString(): string {
		return `dbra\tv${this.v}\tL${this.offset.toString(16).padStart(4, "0")}`;
	}

	getOffset(): number {
		return this.offset;
	}
}
