import {Opcode} from "./opcode";
import {OutputBufferedFile} from "../io/output-buffered-file";

export class ClrOpcode extends Opcode {
	public constructor(public page: number, public color: number) {
		super();
	}

	public writeTo(buf: OutputBufferedFile): void {
		buf.writeByte(0x0e);
		buf.writeByte(this.page);
		buf.writeByte(this.color);
	}

	toString(): string {
		return `clr\t${this.page}\t${this.color}`;
	}
}
