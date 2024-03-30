import {MemEntry} from "./mem-entry";
import {BufferedFile} from "./io/buffered-file";

export class BankReader {

	public constructor() {
	}

	public read(memEntry: MemEntry, bankFile: BufferedFile): Uint8Array {
		// console.log("Reading entry", memEntry);

		bankFile.seek(memEntry.bankOffset);

		if (memEntry.packedSize === memEntry.size) {
			// file is uncompressed
			return bankFile.readBytes(memEntry.size);
		}

		// file is compressed
		const buf = new Uint8Array(memEntry.packedSize);
		buf.set(bankFile.readBytes(memEntry.packedSize), 0);
		const reader = BufferedFile.open(buf);

		const output = new Uint8Array(memEntry.size);

		let iofs = memEntry.packedSize - 4;
		let datasize = reader.readUint32At(iofs);
		iofs -= 4;
		let oofs = datasize - 1;
		let crc = reader.readUint32At(iofs);
		iofs -= 4;
		let chunk = reader.readUint32At(iofs);
		iofs -= 4;
		crc ^= chunk;

		const getBit = (): number => {
			let carry = chunk & 1;
			chunk >>>= 1;
			if (chunk === 0) {
				chunk = reader.readUint32At(iofs);
				iofs -= 4;
				crc ^= chunk;
				carry = (chunk & 1);
				chunk = (1 << 31) | (chunk >> 1);
			}

			return carry;
		}

		const getBits = (count: number): number => {
			let result = 0;
			for (let i = 0; i < count; i++) {
				result = (result << 1) | getBit();
			}
			return result;
		}

		const copyLiteral = (bits: number, len: number) => {
			let count = getBits(bits) + len + 1;
			datasize -= count;
			while (count-- > 0) {
				output[oofs--] = getBits(8);
			}
		}

		const copyReference = (bits: number, count: number) => {
			const offset = getBits(bits);
			datasize -= count;
			while (count-- > 0) {
				output[oofs] = output[oofs + offset];
				--oofs;
			}
		}

		while (datasize > 0) {
			if (getBit() === 0) {
				switch (getBit()) {
					case 0:
						copyLiteral(3, 0);
						break;

					case 1:
						copyReference(8, 2);
						break;
				}
			} else {
				const c = getBits(2);
				switch (c) {
					case 3:
						copyLiteral(8, 8);
						break;
					case 2:
						copyReference(12, getBits(8) + 1);
						break;
					case 1:
						copyReference(10, 4);
						break;
					case 0:
						copyReference(9, 3);
						break;
				}
			}
		}

		if (crc != 0) {
			throw new Error("CRC failed, could not decompress bank properly");
		}

		return output;
	}
}
