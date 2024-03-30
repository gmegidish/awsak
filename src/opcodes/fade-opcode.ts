import {Opcode} from "./opcode";
import {OutputBufferedFile} from "../io/output-buffered-file";

export class FadeOpcode extends Opcode {
	public constructor(public pal: number) {
		super();
	}

	public writeTo(buf: OutputBufferedFile): void {
		buf.writeByte(0x0b);
		buf.writeByte(this.pal);
		buf.writeByte(0x00);
	}

	toString(): string {
		return `fade\t${this.pal}`;
	}
}
