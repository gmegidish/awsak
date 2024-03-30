import {OutputBufferedFile} from "../io/output-buffered-file";
import {OpcodeWithOffset} from "./opcode";

export class JmpOpcode extends OpcodeWithOffset {
	public constructor(public offset: number) {
		super();
	}

	public writeTo(buf: OutputBufferedFile): void {
		buf.writeByte(0x07);
		buf.writeUint16(this.offset);
	}

	toString(): string {
		return `jmp\tL${this.offset.toString(16).padStart(4, "0")}`;
	}

	getOffset(): number {
		return this.offset;
	}
}
