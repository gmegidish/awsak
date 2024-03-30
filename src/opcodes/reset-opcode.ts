import {Opcode} from "./opcode";
import {OutputBufferedFile} from "../io/output-buffered-file";

export class ResetOpcode extends Opcode {
	public constructor(public threadId: number, public count: number, public type: number) {
		super();
	}

	public writeTo(buf: OutputBufferedFile): void {
		buf.writeByte(0x0c);
		buf.writeByte(this.threadId);
		buf.writeByte(this.count);
		buf.writeByte(this.type);
	}

	toString(): string {
		return `reset\t${this.threadId}\t${this.count}\t${this.type}`;
	}
}
