import {OutputBufferedFile} from "../io/output-buffered-file";
import {Opcode} from "./opcode";

export class ShowOpcode extends Opcode {
	public constructor(public pageId: number) {
		super();
	}

	public writeTo(buf: OutputBufferedFile): void {
		buf.writeByte(0x10);
		buf.writeByte(this.pageId);
	}

	toString(): string {
		return `show\t${this.pageId}`;
	}
}
