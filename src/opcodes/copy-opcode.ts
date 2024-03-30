import {Opcode} from "./opcode";
import {OutputBufferedFile} from "../io/output-buffered-file";

export class CopyOpcode extends Opcode {
	public constructor(public src: number, public dst: number) {
		super();
	}

	public writeTo(buf: OutputBufferedFile): void {
		buf.writeByte(0x0f);
		buf.writeByte(this.src);
		buf.writeByte(this.dst);
	}

	toString(): string {
		return `copy\t${this.src}\t${this.dst}`;
	}
}

