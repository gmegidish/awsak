import {Opcode} from "./opcode";
import {OutputBufferedFile} from "../io/output-buffered-file";

export class MusicOpcode extends Opcode {
	public constructor(public resourceId: number, public delay: number, public pos: number) {
		super();
	}

	public writeTo(buf: OutputBufferedFile): void {
		buf.writeByte(0x1a);
		buf.writeUint16(this.resourceId);
		buf.writeUint16(this.delay);
		buf.writeByte(this.pos);
	}

	toString(): string {
		return `music\t${this.resourceId}\t${this.delay}\t${this.pos}`;
	}
}
