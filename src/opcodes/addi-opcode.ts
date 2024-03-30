import {Opcode} from "./opcode";
import {OutputBufferedFile} from "../io/output-buffered-file";

export class AddiOpcode extends Opcode {
	public constructor(public v: number, public imm16: number) {
		super();
	}

	public writeTo(buf: OutputBufferedFile): void {
		buf.writeByte(0x03);
		buf.writeByte(this.v);
		buf.writeUint16(this.imm16);
	}

	toString(): string {
		return `addi\tv${this.v}\t${this.imm16}`;
	}
}
