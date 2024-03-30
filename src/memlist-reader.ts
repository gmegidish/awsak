import {MemEntry} from "./mem-entry";
import {BufferedFile} from "./io/buffered-file";

const MEMENTRY_STATE_END_OF_MEMLIST = 0xff;

export class MemlistReader {

	private entries: Array<MemEntry> = [];

	public getEntries(): Array<MemEntry> {
		return this.entries;
	}

	public parse(f: BufferedFile) {

		while (true) {
			const state = f.readByte();
			if (state === MEMENTRY_STATE_END_OF_MEMLIST) { // Assuming 0xFF marks the end of the entries
				break;
			}

			const type = f.readByte();
			f.readUint16(); // Skip 2 bytes

			const memEntry: MemEntry = {
				state,
				type,
				unk4: f.readUint16(),
				unk8: f.readByte(),
				bankId: f.readByte(),
				bankOffset: f.readUint32(),
				unkC: f.readUint16(),
				packedSize: f.readUint16(),
				unk10: f.readUint16(),
				size: f.readUint16(),
			};

			this.entries.push(memEntry);
		}

		console.log("Loaded " + this.entries.length + " entries from memlist");
	}
}
