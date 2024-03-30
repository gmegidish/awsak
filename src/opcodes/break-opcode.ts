import {Opcode} from "./opcode";
import {OutputBufferedFile} from "../io/output-buffered-file";

export class BreakOpcode extends Opcode {
	public writeTo(buf: OutputBufferedFile): void {
		buf.writeByte(0x06);
	}

	toString(): string {
		return `break`;
	}
}
