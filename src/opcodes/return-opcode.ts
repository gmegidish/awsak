import {Opcode} from "./opcode";
import {OutputBufferedFile} from "../io/output-buffered-file";

export class ReturnOpcode extends Opcode {
	public writeTo(buf: OutputBufferedFile): void {
		buf.writeByte(0x05);
	}

	toString(): string {
		return `return`;
	}
}
