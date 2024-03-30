import {OutputBufferedFile} from "../io/output-buffered-file";

export abstract class Opcode {
	abstract writeTo(buf: OutputBufferedFile): void;

	abstract toString(): string;
}

export abstract class OpcodeWithOffset extends Opcode {
	abstract getOffset(): number;
}
