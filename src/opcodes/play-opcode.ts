import {Opcode} from "./opcode";
import {OutputBufferedFile} from "../io/output-buffered-file";

export class PlayOpcode extends Opcode {
	public constructor(public resourceId: number, public freq: number, public vol: number, public channel: number) {
		super();
	}

	public writeTo(buf: OutputBufferedFile): void {
		buf.writeByte(0x18);
		buf.writeUint16(this.resourceId);
		buf.writeByte(this.freq);
		buf.writeByte(this.vol);
		buf.writeByte(this.channel);
	}

	toString(): string {
		return `play\t${this.resourceId}\t${this.freq}\t${this.vol}\t${this.channel}`;
	}
}
