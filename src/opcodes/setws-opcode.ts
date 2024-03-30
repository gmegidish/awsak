import {Opcode} from "./opcode";
import {OutputBufferedFile} from "../io/output-buffered-file";

export class SetwsOpcode extends Opcode {
	public constructor(public page: number) {
		super();
	}

	public writeTo(buf: OutputBufferedFile): void {
		buf.writeByte(0x0d);
		buf.writeByte(this.page);
	}

	toString(): string {
		return `setws\t${this.page}`;
	}
}
