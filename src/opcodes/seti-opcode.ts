import {Opcode} from "./opcode";
import {OutputBufferedFile} from "../io/output-buffered-file";

export class SetiOpcode extends Opcode {
	public constructor(public v: number, public imm16: number) {
		super();
	}

	public writeTo(buf: OutputBufferedFile): void {
		buf.writeByte(0x00);
		buf.writeByte(this.v);
		buf.writeUint16(this.imm16);
	}

	toString(): string {
		return `seti\tv${this.v}\t${this.imm16}`;
	}
}
