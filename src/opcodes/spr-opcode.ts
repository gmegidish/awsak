import {Opcode} from "./opcode";
import {OutputBufferedFile} from "../io/output-buffered-file";

export class SprOpcode extends Opcode {
	public constructor(
		public x: number, public isReferenceX: boolean,
		public y: number, public isReferenceY: boolean,
		public z: number, public isReferenceZ: boolean,
		public resourceId: number,
		public useAux: boolean,
	) {
		super();
	}

	public writeTo(buf: OutputBufferedFile): void {

		/* commented out because not tested thoroughly
		// optimization using 0x80 bit
		if (!this.useAux && !this.isReferenceX && !this.isReferenceY && !this.isReferenceZ && this.z === 64) {
			if (this.x < 256 && this.y < 256 && this.resourceId >= 0x8000 && (this.resourceId & 1) === 0) {
				const offset = (this.resourceId >> 1) | 0x8000;
				buf.writeByte(offset >> 8);
				buf.writeByte(offset & 0xff);
				buf.writeByte(this.x);
				buf.writeByte(this.y);
				return;
			}
		}
		*/

		let flags = 0x40;
		flags |= (this.isReferenceX ? 0x10 : 0);
		flags |= (this.isReferenceY ? 0x04 : 0);
		flags |= (this.isReferenceZ ? 0x01 : 0x02);

		const offset = this.resourceId >> 1;

		if (this.useAux) {
			throw new Error("Aux not supported yet");
		}

		buf.writeByte(flags);
		buf.writeUint16(offset);
		if (this.isReferenceX) {
			buf.writeByte(this.x);
		} else {
			buf.writeUint16(this.x);
		}

		if (this.isReferenceY) {
			buf.writeByte(this.y);
		} else {
			buf.writeUint16(this.y);
		}

		// doesn't matter if it's reference or not. it's always single byte.
		// note: default zoom of 64 not yet supported
		buf.writeByte(this.z);
	}

	toString(): string {
		let out = `spr\t`;
		out += this.useAux ? `aux\t` : "";
		out += `${this.resourceId}\t`;

		out += this.isReferenceX ? `v${this.x}\t` : `${this.x}\t`;
		out += this.isReferenceY ? `v${this.y}\t` : `${this.y}\t`;
		out += this.isReferenceZ ? `v${this.z}\t` : `${this.z}\t`;

		return out;
	}
}
