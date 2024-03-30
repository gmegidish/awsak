import {Opcode} from "./opcode";
import {OutputBufferedFile} from "../io/output-buffered-file";

export class AddOpcode extends Opcode {
	public constructor(public v1: number, public v2: number) {
		super();
	}

	public writeTo(buf: OutputBufferedFile): void {
		buf.writeByte(0x02);
		buf.writeByte(this.v1);
		buf.writeByte(this.v2);
	}

	toString(): string {
		return `add\tv${this.v1}\tv${this.v2}`;
	}
}
