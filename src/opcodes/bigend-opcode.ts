import {Opcode} from "./opcode";
import {OutputBufferedFile} from "../io/output-buffered-file";

export class BigendOpcode extends Opcode {
	public writeTo(buf: OutputBufferedFile): void {
		buf.writeByte(0x11);
	}

	toString(): string {
		return `bigend`;
	}
}
