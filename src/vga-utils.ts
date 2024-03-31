import assert = require("assert");

export class VgaUtils {

	public static toLinear(buf: Uint8Array): Uint8Array {

		assert(buf.length === 32000);
		const out = new Uint8Array(320 * 200);

		let offset = 0;
		let ptr = 0;
		for (let y = 0; y < 200; y++) {
			for (let x = 0; x < 320; x += 8) {
				for (let b = 0; b < 8; b++) {
					const mask = 1 << (7 - b);
					let color = 0;
					for (let p = 0; p < 4; ++p) {
						if (buf[offset + p * 8000] & mask) {
							color |= 1 << p;
						}
					}

					out[ptr++] = color;
				}

				offset++;
			}
		}

		return out;
	}
}
