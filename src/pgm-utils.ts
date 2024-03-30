import {OutputBufferedFile} from "./io/output-buffered-file";

export class PgmUtils {

	public static scr2pgm(buf: Uint8Array): string {

		let str = "";
		str += "P2\n";
		str += "320 200\n";
		str += "15\n";

		let offset = 0;
		for (let y = 0; y < 200; y++) {
			let line = "";
			for (let x = 0; x < 320; x += 8) {
				for (let b = 0; b < 8; b++) {
					const mask = 1 << (7 - b);
					let color = 0;
					for (let p = 0; p < 4; ++p) {
						if (buf[offset + p * 8000] & mask) {
							color |= 1 << p;
						}
					}

					line += color + " ";
				}

				offset++;
			}

			str += line + "\n";
		}

		return str;
	}

	public static pgm2scr(input: string): Uint8Array {

		const lines = input.split("\n");
		if (lines[0] != "P2") {
			console.error("Expecting a P2 PGM file");
			process.exit(1);
		}

		if (lines[1] != "320 200") {
			console.error("Expecting a 320x200 image");
			process.exit(1);
		}

		if (lines[2] != "15") {
			console.error("Expecting a 16 colors image");
			process.exit(1);
		}

		const bitmap = new Uint8Array(320 * 200);
		for (let y = 0; y < 200; y++) {
			const line = lines[y + 3].split(" ");
			for (let x = 0; x < 320; x++) {
				bitmap[y * 320 + x] = parseInt(line[x], 10);
			}
		}

		const buf = OutputBufferedFile.create();
		for (let plane = 0; plane < 4; plane++) {
			for (let y = 0; y < 200; y++) {
				for (let x = 0; x < 320; x += 8) {
					let c = 0;
					for (let b = 0; b < 8; b++) {
						c = (c << 1) | ((bitmap[y * 320 + x + b] >> plane) & 1);
					}

					buf.writeByte(c);
				}
			}
		}

		return buf.toUint8Array();
	}
}
