import {Opcode} from "./opcode";
import {OutputBufferedFile} from "../io/output-buffered-file";

export class LoadOpcode extends Opcode {
	public constructor(public imm16: number) {
		super();
	}

	public writeTo(buf: OutputBufferedFile): void {
		buf.writeByte(0x19);
		buf.writeUint16(this.imm16);
	}

	toString(): string {
		return `load\t${this.imm16}`;
	}
}
