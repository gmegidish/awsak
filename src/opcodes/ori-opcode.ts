import {Opcode} from "./opcode";
import {OutputBufferedFile} from "../io/output-buffered-file";

export class OriOpcode extends Opcode {
	public constructor(public v: number, public imm16: number) {
		super();
	}

	public writeTo(buf: OutputBufferedFile): void {
		buf.writeByte(0x15);
		buf.writeByte(this.v);
		buf.writeUint16(this.imm16);
	}

	toString(): string {
		return `ori\tv${this.v}\t0x${this.imm16.toString(16).padStart(4, "0")}`;
	}
}
