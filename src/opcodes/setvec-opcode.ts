import {OpcodeWithOffset} from "./opcode";
import {OutputBufferedFile} from "../io/output-buffered-file";

export class SetVecOpcode extends OpcodeWithOffset {
	public constructor(public vec: number, public offset: number) {
		super();
	}

	public writeTo(buf: OutputBufferedFile): void {
		buf.writeByte(0x08);
		buf.writeByte(this.vec);
		buf.writeUint16(this.offset);
	}

	toString(): string {
		return `setvec\t${this.vec}\tL${this.offset.toString(16).padStart(4, "0")}`;
	}

	getOffset(): number {
		return this.offset;
	}
}
