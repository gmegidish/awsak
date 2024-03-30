import {Opcode, OpcodeWithOffset} from "./opcodes/opcode";

export class OpcodeVisitor {

	public visitOffset(offset: number): void {
	}

	public visitOpcode(opcode: Opcode) {
	}

	public visitEnd() {
	}
}

export class LabelsOpcodeVisitor extends OpcodeVisitor {

	private labels: Map<number, string> = new Map();

	public constructor() {
		super();
		this.visitLabel(0);
	}

	private visitLabel(offset: number) {
		if (!this.labels.has(offset)) {
			this.labels.set(offset, `L${offset.toString(16).padStart(4, "0")}`);
		}
	}

	public visitOpcode(opcode: Opcode) {
		if (opcode instanceof OpcodeWithOffset) {
			const ref = opcode as OpcodeWithOffset;
			this.visitLabel(ref.getOffset());
		}
	}

	public getLabel(offset: number): string | undefined {
		return this.labels.get(offset);
	}

	public visitEnd() {
	}
}

export class DisassemblerOpcodeVisitor extends OpcodeVisitor {

	private offset = 0;

	public constructor(private labels: LabelsOpcodeVisitor) {
		super();
	}

	public visitOffset(offset: number) {
		super.visitOffset(offset);
		this.offset = offset;
	}

	public visitOpcode(opcode: Opcode) {
		let out = "";

		if (opcode instanceof OpcodeWithOffset) {
			const ref = opcode as OpcodeWithOffset;
			if (!this.labels.getLabel(ref.getOffset())) {
				console.log("No label for offset", ref.getOffset());
				process.exit(1);
			}
		}

		if (this.labels.getLabel(this.offset)) {
			out += this.labels.getLabel(this.offset) + ":";
		}

		out += "\t" + opcode.toString();
		console.log(out);
	}
}
