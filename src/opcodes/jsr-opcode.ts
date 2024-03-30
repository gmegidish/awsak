import {OpcodeWithOffset} from "./opcode";
import {OutputBufferedFile} from "../io/output-buffered-file";

export class JsrOpcode extends OpcodeWithOffset {
	public constructor(public offset: number) {
		super();
	}

	public writeTo(buf: OutputBufferedFile): void {
		buf.writeByte(0x04);
		buf.writeUint16(this.offset);
	}

	toString(): string {
		return `jsr\tL${this.offset.toString(16).padStart(4, "0")}`;
	}

	getOffset(): number {
		return this.offset;
	}
}
