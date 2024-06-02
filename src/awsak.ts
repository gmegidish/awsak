import {Command} from 'commander';
import {MemEntry} from "./mem-entry";
import {BufferedFile} from "./io/buffered-file";
import * as fs from "fs";
import {MemlistReader} from "./memlist-reader";
import {BankReader} from "./bank-reader";
import {OutputBufferedFile} from "./io/output-buffered-file";
import {
	AddiOpcode,
	AddOpcode,
	AndiOpcode,
	BigendOpcode,
	BreakOpcode,
	ClrOpcode,
	CopyOpcode,
	DbraOpcode,
	FadeOpcode,
	JmpOpcode,
	JsrOpcode,
	LoadOpcode,
	MusicOpcode,
	OriOpcode,
	PlayOpcode,
	ResetOpcode,
	ReturnOpcode,
	SetiOpcode,
	SetOpcode,
	SetVecOpcode,
	SetwsOpcode,
	ShlOpcode,
	ShowOpcode,
	ShrOpcode,
	SiOpcode,
	SprOpcode,
	SubOpcode,
	TextOpcode
} from "./opcodes/opcodes";
import {DisassemblerOpcodeVisitor, LabelsOpcodeVisitor, OpcodeVisitor} from "./opcode-visitor";
import {PgmUtils} from "./pgm-utils";
import {Polygon, SvgUtils} from "./svg-utils";
import {BufferedFileSpy} from "./io/buffered-file-spy";
import {VgaUtils} from "./vga-utils";
import assert = require("assert");

const RESOURCE_TYPE_SOUND = 0;
const RESOURCE_TYPE_MUSIC = 1;
const RESOURCE_TYPE_BITMAP = 2;
const RESOURCE_TYPE_PALETTE = 3;
const RESOURCE_TYPE_BYTECODE = 4;
const RESOURCE_TYPE_SHAPE = 5;
const RESOURCE_TYPE_OTHER = 6;

const MEMLIST_PARTS: number[][] = [
	// palette, code, video1, video2
	[0x14, 0x15, 0x16, 0x00], // protection screens
	[0x17, 0x18, 0x19, 0x00], // introduction cinematic
	[0x1A, 0x1B, 0x1C, 0x11],
	[0x1D, 0x1E, 0x1F, 0x11],
	[0x20, 0x21, 0x22, 0x11],
	[0x23, 0x24, 0x25, 0x00], // battlechar cinematic
	[0x26, 0x27, 0x28, 0x11],
	[0x29, 0x2A, 0x2B, 0x11],
	[0x7D, 0x7E, 0x7F, 0x00],
	[0x7D, 0x7E, 0x7F, 0x00]  // password screen
];

class Palette {
	public constructor(public colors: Array<string>) {
	}
}

class PaletteSet {
	public constructor(public palettes: Array<Palette>) {
	}
}

class ColorReader {
	private readColor(buf: BufferedFile): string {
		const c = buf.readUint16();
		const r = ((c >> 8) & 0xf) << 4;
		const g = ((c >> 4) & 0xf) << 4;
		const b = (c & 0xf) << 4;
		return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
	}

	private readPalette(buf: BufferedFile): Palette {
		const colors = [];
		for (let i = 0; i < 16; i++) {
			colors.push(this.readColor(buf));
		}

		return new Palette(colors);
	}

	public readPaletteSet(buf: BufferedFile): PaletteSet {
		const palettes = [];

		while (buf.getOffset() + 32 < buf.size()) {
			palettes.push(this.readPalette(buf));
		}

		return new PaletteSet(palettes);
	}
}

export class AWSAK {
	private program: Command;

	constructor() {
		this.program = new Command();
		this.configure();
	}

	public extract(options: { indir: string, outdir: string }) {
		const memlist = new MemlistReader();
		memlist.parse(BufferedFile.openFile(`${options.indir}/Memlist.bin`));

		fs.mkdirSync(options.outdir, {recursive: true});
		memlist.getEntries().forEach((entry: MemEntry, index: number) => {
			// console.log("Extracting", entry);

			const reader = new BankReader();
			let hex = entry.bankId.toString(16);
			if (hex.length == 1) {
				hex = "0" + hex;
			}

			const buf = reader.read(entry, BufferedFile.openFile(`${options.indir}/Bank${hex}`));

			const ext = this.resourceTypeToExtension(entry.type);
			fs.writeFileSync(`${options.outdir}/${index.toString(16).padStart(4, "0")}.${ext}`, buf);
		});
	}

	private decodeShapeParts(buf: BufferedFile, zoom: number, x: number, y: number): Array<Polygon> {
		const realZoom = zoom / 64.0;
		const cx = x - (buf.readByte() * realZoom);
		const cy = y - (buf.readByte() * realZoom);
		let n = buf.readByte();

		let out: Array<Polygon> = [];
		for (let i = 0; i <= n; i++) {
			let address = buf.readUint16();
			const px = cx + (buf.readByte() * realZoom);
			const py = cy + (buf.readByte() * realZoom);
			let color = 0xff;
			if (address & 0x8000) {
				address &= 0x7fff;
				color = buf.readByte() & 0x7f;
				buf.readByte(); // skip
			}

			address = (address << 1) & 0xffff;
			const currentAddress = buf.getOffset();
			const polygons = this.decodeShape(buf, address, color, zoom, px, py);
			buf.seek(currentAddress);
			out = out.concat(polygons);
		}

		return out;
	}

	private decodeShape(buf: BufferedFile, off: number, color: number, zoom: number, x: number, y: number): Array<Polygon> {
		// console.log("Starting from offset " + off.toString(16));

		buf.seek(off);
		const type = buf.readByte();
		// console.log("type=" + type.toString(16) + " color=" + color.toString(16) + " zoom=" + zoom + " x=" + x + " y=" + y);

		if (type >= 0xc0) {
			if (color & 0x80) {
				color = type & 0x3f;
			}

			// todo: fixme
			color &= 0x0f;

			const realZoom = zoom / 64.0;
			const bbw = buf.readByte() * realZoom;
			const bbh = buf.readByte() * realZoom;
			const npoints = buf.readByte();
			const points = [];
			for (let i = 0; i < npoints; i++) {
				const tx = buf.readByte() * realZoom;
				const ty = buf.readByte() * realZoom;
				points.push({x: tx, y: ty});
			}

			const x1 = x - bbw / 2;
			const x2 = x + bbw / 2;
			const y1 = y - bbh / 2;
			const y2 = y + bbh / 2;

			if (x1 > 319 || x2 < 0 || y1 > 199 || y2 < 0) {
				return [];
			}

			if (bbw == 0 && bbh == 1 && npoints == 4) {
				// this is a single point
				// useful for generating fonts using this single pixel shape
				// console.log("Single pixel at " + off + " with color " + color);
			}

			const polygon = new Polygon();
			polygon.color = color;
			polygon.points = [];

			for (let i = 0; i < npoints; i++) {
				const tox = x1 + points[i].x;
				const toy = y1 + points[i].y;
				polygon.points.push([tox, toy]);
			}

			return [polygon];
		} else {
			if ((type & 0x3f) == 2) {
				return this.decodeShapeParts(buf, zoom, x, y);
			}
		}

		return [];
	}

	private writeSvg(polygons: Array<Polygon>, filename: string) {
		const out = SvgUtils.toSvg(polygons);
		fs.writeFileSync(filename, out);
	}

	private loadPalette(palette: string, index: number): Array<[number, number, number]> {
		const data = fs.readFileSync(palette);
		const buf = BufferedFile.open(data);
		buf.seek(index * 16 * 2);
		const out: Array<[number, number, number]> = [];
		for (let i = 0; i < 16; i++) {
			const c = buf.readUint16();
			const r = ((c >> 8) & 0xf) << 4;
			const g = ((c >> 4) & 0xf) << 4;
			const b = (c & 0xf) << 4;
			out.push([r, g, b]);
		}

		return out;
	}

	private pgm2scr(options: { infile: string, scr: string }) {
		const input = fs.readFileSync(options.infile).toString();
		const buf = PgmUtils.pgm2scr(input);
		fs.writeFileSync(options.scr, buf);
	}

	public pal2act(options: { palette: string, index: number, output: string }) {
		const data = fs.readFileSync(options.palette);
		const buf = BufferedFile.open(data);
		buf.seek(options.index * 16 * 2);

		const out = OutputBufferedFile.create();
		for (let i = 0; i < 16; i++) {
			const c = buf.readUint16();
			const r = ((c >> 8) & 0xf) << 4;
			const g = ((c >> 4) & 0xf) << 4;
			const b = (c & 0xf) << 4;
			out.writeByte(r);
			out.writeByte(g);
			out.writeByte(b);
		}

		for (let i = 16; i < 256; i++) {
			out.writeByte(0);
			out.writeByte(0);
			out.writeByte(0);
		}

		out.writeByte(0x00);
		out.writeByte(0x10);
		out.writeByte(0xff);
		out.writeByte(0xff);

		fs.writeFileSync(options.output, out.toUint8Array());
	}

	public bmp2pic(options: { infile: string, scr: string }) {
		const buf = fs.readFileSync(options.infile);
		const reader = BufferedFile.open(buf);
		if (reader.readUint16LE() != 0x4d42) {
			console.error("Not a valid .bmp file");
			process.exit(1);
		}

		reader.seek(10);
		const dataOffset = reader.readUint32LE();
		const bmpSize = reader.readUint32LE();
		const bmpWidth = reader.readUint32LE();
		const bmpHeight = reader.readUint32LE();
		const bmpPlanes = reader.readUint16LE();
		const bmpBpp = reader.readUint16LE();
		const bmpCompression = reader.readUint32LE();
		if (bmpWidth !== 320 || bmpHeight !== 200 || bmpPlanes !== 1 || bmpBpp !== 8 || bmpCompression !== 0) {
			console.error(`Expected a 320x200 8bpp 1plane no-compression .bmp file. Found ${bmpWidth}x${bmpHeight} ${bmpPlanes} ${bmpBpp} ${bmpCompression}`);
			process.exit(1);
		}

		reader.seek(dataOffset + 256*4);
		if (buf.length - reader.getOffset() != 320*200) {
			console.error("Something's not okay with this .bmp");
			process.exit(1);
		}

		const bitmap = reader.readBytes(bmpWidth * bmpHeight);

		const output = OutputBufferedFile.create();
		for (let plane = 0; plane < 4; plane++) {
			for (let y = 0; y < 200; y++) {
				for (let x = 0; x < 320; x += 8) {
					let c = 0;
					for (let b = 0; b < 8; b++) {
						c = (c << 1) | ((bitmap[y * 320 + x + b] >> plane) & 1);
					}

					output.writeByte(c);
				}
			}
		}

		fs.writeFileSync(options.scr, output.toUint8Array());
	}

	public pic2bmp(options: { pic: string, palette: string, index: number, output: string }) {
		const buf = fs.readFileSync(options.pic);
		if (buf.length != 32000) {
			console.error("File " + options.pic + " is not 32000 bytes long");
			process.exit(1);
		}

		const screen = VgaUtils.toLinear(buf);

		const out = OutputBufferedFile.create();
		out.writeUint16LE(0x4d42); // BM
		out.writeUint32LE(320 * 200 * 3 + 54); // filesize
		out.writeUint16LE(0); // reserved
		out.writeUint16LE(0); // reserved
		out.writeUint32LE(54); // offset to data
		out.writeUint32LE(40); // size of DIB header
		out.writeUint32LE(320); // width
		out.writeUint32LE(200); // height
		out.writeUint16LE(1); // planes
		out.writeUint16LE(8); // bits per pixel
		out.writeUint32LE(0); // compression
		out.writeUint32LE(320 * 200); // size of image
		out.writeUint32LE(0); // horizontal resolution
		out.writeUint32LE(0); // vertical resolution
		out.writeUint32LE(0); // colors in color table
		out.writeUint32LE(0); // important color count

		if (!options.palette) {
			// palette not specified, use 16 colors of grayscale
			for (let i = 0; i < 16; i++) {
				const c = (i << 4) + i;
				out.writeByte(c);
				out.writeByte(c);
				out.writeByte(c);
				out.writeByte(0);
			}
		}

		if (options.palette) {
			const palette = this.loadPalette(options.palette, options.index || 0);
			for (let i = 0; i < 16; i++) {
				const [r, g, b] = palette[i];
				out.writeByte(b);
				out.writeByte(g);
				out.writeByte(r);
				out.writeByte(0);
			}
		}

		for (let i = 16; i < 256; i++) {
			out.writeUint32LE(0);
		}

		// bmp files are upside-down
		for (let y = 199; y >= 0; y--) {
			out.writeBytes(screen.slice(y * 320, (y + 1) * 320));
		}

		fs.writeFileSync(options.output, out.toUint8Array());
	}

	private accept(reader: BufferedFile, visitor: OpcodeVisitor) {

		const data = fs.readFileSync("resources/0019.shp");
		const shapebuf = BufferedFileSpy.open(data);

		while (reader.available()) {
			visitor.visitOffset(reader.getOffset());

			const opcode = reader.readByte();
			if (opcode & 0x80) {
				let offset = ((opcode << 8) | reader.readByte()) << 1;
				offset &= 0xffff;
				let x = reader.readByte();
				let y = reader.readByte();
				if (y > 199) {
					x += (y - 199);
					y = 199;
				}

				const polygons = this.decodeShape(shapebuf, offset, 0xff, 64, x, y);
				this.writeSvg(polygons, `resources/shape_${offset.toString(16).padStart(4, "0")}.svg`);
				visitor.visitOpcode(new SprOpcode(x, false, y, false, 64, false, offset, false));
			} else if (opcode & 0x40) {
				let offset = (reader.readUint16() << 1) & 0xffff;
				let useAux = false;
				let x = reader.readByte();
				let isReferenceX = false;
				let isReferenceY = false;
				let isReferenceZoom = false;

				switch (opcode & 0x30) {
					case 0x30:
						x += 0x100;
						break;
					case 0x20:
						break;
					case 0x10:
						isReferenceX = true;
						break;
					case 0x00:
						x = (x << 8) | reader.readByte();
						if (x >= 0x8000) {
							x = x - 0x10000;
						}
						break;
				}

				let y = reader.readByte();
				if ((opcode & 8) === 0) {
					if ((opcode & 4) === 0) {
						y = (y << 8) | reader.readByte();
						if (y >= 0x8000) {
							y = y - 0x10000;
						}
					} else {
						isReferenceY = true;
					}
				}

				let zoom = 64;
				switch (opcode & 3) {
					case 0:
						// default 64
						break;
					case 1:
						zoom = reader.readByte();
						isReferenceZoom = true;
						break;
					case 2:
						zoom = reader.readByte();
						break;
					case 3:
						useAux = true;
						break;
				}

				if (!useAux) {
					// sprite
					const polygons = this.decodeShape(shapebuf, offset, 0xff, zoom, x, y);
					this.writeSvg(polygons, `resources/shape_${offset.toString(16).padStart(4, "0")}.svg`);
				}

				visitor.visitOpcode(new SprOpcode(x, isReferenceX, y, isReferenceY, zoom, isReferenceZoom, offset, useAux));
			} else {
				switch (opcode) {
					case 0x00: {
						const v = reader.readByte();
						const imm16 = reader.readUint16();
						visitor.visitOpcode(new SetiOpcode(v, imm16));
					}
						break;

					case 0x01: {
						const v1 = reader.readByte();
						const v2 = reader.readByte();
						visitor.visitOpcode(new SetOpcode(v1, v2));
					}
						break;

					case 0x02: {
						const v1 = reader.readByte();
						const v2 = reader.readByte();
						visitor.visitOpcode(new AddOpcode(v1, v2));
					}
						break;

					case 0x03: {
						const v = reader.readByte();
						const imm16 = reader.readUint16();
						visitor.visitOpcode(new AddiOpcode(v, imm16));
					}
						break;

					case 0x04: {
						const offset = reader.readUint16();
						visitor.visitOpcode(new JsrOpcode(offset));
					}
						break;

					case 0x05:
						visitor.visitOpcode(new ReturnOpcode());
						break;

					case 0x06:
						visitor.visitOpcode(new BreakOpcode());
						break;

					case 0x07: {
						const offset = reader.readUint16();
						visitor.visitOpcode(new JmpOpcode(offset));
					}
						break;

					case 0x08: {
						const vec = reader.readByte();
						const imm16 = reader.readUint16();
						visitor.visitOpcode(new SetVecOpcode(vec, imm16));
					}
						break;

					case 0x09: {
						const v = reader.readByte();
						const offset = reader.readUint16();
						visitor.visitOpcode(new DbraOpcode(v, offset));
					}
						break;

					case 0x0a: {
						const cond = reader.readByte();
						const v = reader.readByte();
						let value = reader.readByte();
						let isReference = false;
						if (cond & 0x80) {
							isReference = true;
						} else if (cond & 0x40) {
							value = (value << 8) + reader.readByte();
							if (value & 0x8000) {
								value = value - 0x10000;
							}
						}

						const offset = reader.readUint16();
						visitor.visitOpcode(new SiOpcode(v, value, isReference, cond & 0x3f, offset));
						break;
					}

					case 0x0b: {
						const pal = reader.readByte();
						reader.readByte(); // skip
						visitor.visitOpcode(new FadeOpcode(pal));
					}
						break;

					case 0x0c: {
						const threadId = reader.readByte();
						const count = reader.readByte();
						const type = reader.readByte();
						visitor.visitOpcode(new ResetOpcode(threadId, count, type));
					}
						break;

					case 0x0d: {
						const page = reader.readByte();
						visitor.visitOpcode(new SetwsOpcode(page));
					}
						break;

					case 0x0e: {
						const page = reader.readByte();
						const color = reader.readByte();
						visitor.visitOpcode(new ClrOpcode(page, color));
					}
						break;

					case 0x0f: {
						const src = reader.readByte();
						const dst = reader.readByte();
						visitor.visitOpcode(new CopyOpcode(src, dst));
					}
						break;

					case 0x10: {
						const pageId = reader.readByte();
						visitor.visitOpcode(new ShowOpcode(pageId));
					}
						break;

					case 0x11: {
						visitor.visitOpcode(new BigendOpcode());
					}
						break;

					case 0x12: {
						const stringId = reader.readUint16();
						const x = reader.readByte();
						const y = reader.readByte();
						const color = reader.readByte();
						visitor.visitOpcode(new TextOpcode(stringId, x, y, color));
					}
						break;

					case 0x13: {
						const v1 = reader.readByte();
						const v2 = reader.readByte();
						visitor.visitOpcode(new SubOpcode(v1, v2));
					}
						break;

					case 0x14: {
						const v = reader.readByte();
						const imm16 = reader.readUint16();
						visitor.visitOpcode(new AndiOpcode(v, imm16));
					}
						break;

					case 0x15: {
						const v = reader.readByte();
						const imm16 = reader.readUint16();
						visitor.visitOpcode(new OriOpcode(v, imm16));
					}
						break;

					case 0x16: {
						const v = reader.readByte();
						const imm16 = reader.readUint16();
						visitor.visitOpcode(new ShlOpcode(v, imm16));
					}
						break;

					case 0x17: {
						const v = reader.readByte();
						const imm16 = reader.readUint16();
						visitor.visitOpcode(new ShrOpcode(v, imm16));
					}
						break;

					case 0x18: {
						const resourceId = reader.readUint16();
						const freq = reader.readByte();
						const vol = reader.readByte();
						const channel = reader.readByte();
						visitor.visitOpcode(new PlayOpcode(resourceId, freq, vol, channel));
					}
						break;

					case 0x19: {
						const imm16 = reader.readUint16();
						visitor.visitOpcode(new LoadOpcode(imm16));
					}
						break;

					case 0x1a: {
						const res = reader.readUint16();
						const delay = reader.readUint16();
						const pos = reader.readByte();
						visitor.visitOpcode(new MusicOpcode(res, delay, pos));
					}
						break;

					default:
						console.log("Unsupported 0x" + opcode.toString(16) + " at offset " + reader.getOffset().toString(16));
						process.exit(0);
				}
			}
		}

		visitor.visitEnd();

		/* some hack to find unused shapes */
		/*
		const visited = shapebuf.getOffsetsVisited();
		let notVisited = 0;
		for (let i = 0; i < visited.length; i++) {
			if (visited[i] === 0) {
				notVisited++;
				console.log("Offset " + i + " not visited");

				const offset = i;
				const polygons = this.decodeShape(shapebuf, offset, 0xff, 64, 160, 100);
				this.writeSvg(polygons, `resources/shape_XXX${offset}.svg`);
				while (i < visited.length && visited[i] === 0) {
					i++;
				}
			}
		}

		console.log("Not visited: " + notVisited);
		*/
	}

	public compile(options: { file: string, outfile: string }) {

		// converts between a label and its offset in output buffer
		const labelOffsets = new Map<string, number>();

		// converts between a label and a reference to it in output buffer
		const labelRefs = new Map<number, string>();

		const output = OutputBufferedFile.create();

		const lines = fs.readFileSync(options.file).toString().split("\n");
		for (let line of lines) {
			const commentStart = line.indexOf("//");
			if (commentStart >= 0) {
				line = line.substring(0, commentStart);
			}

			let parts = line
			.split(/[\s\t]+/)
			.filter((part) => part.length > 0);
			if (parts.length === 0) {
				continue;
			}

			if (parts[0].endsWith(":")) {
				const label = parts[0].substring(0, parts[0].length - 1);
				labelOffsets.set(label, output.getOffset());

				// consume part
				parts = parts.slice(1);
				if (parts.length === 0) {
					continue;
				}
			}

			switch (parts[0]) {
				case "add":
					assert(parts.length === 3);
					assert(parts[1].startsWith("v"));
					assert(parts[2].startsWith("v"));
					new AddOpcode(parseInt(parts[1].substring(1)), parseInt(parts[2].substring(1))).writeTo(output);
					break;

				case "addi":
					assert(parts.length === 3);
					assert(parts[1].startsWith("v"));
					new AddiOpcode(parseInt(parts[1].substring(1)), parseInt(parts[2])).writeTo(output);
					break;

				case "ori":
					assert(parts.length === 3);
					assert(parts[1].startsWith("v"));
					new OriOpcode(parseInt(parts[1].substring(1)), parseInt(parts[2])).writeTo(output);
					break;

				case "sub":
					assert(parts.length === 3);
					assert(parts[1].startsWith("v"));
					assert(parts[2].startsWith("v"));
					new SubOpcode(parseInt(parts[1].substring(1)), parseInt(parts[2].substring(1))).writeTo(output);
					break;

				case "andi":
					assert(parts.length === 3);
					assert(parts[1].startsWith("v"));
					new AndiOpcode(parseInt(parts[1].substring(1)), parseInt(parts[2])).writeTo(output);
					break;

				case "set":
					assert(parts.length === 3);
					assert(parts[1].startsWith("v"));
					assert(parts[2].startsWith("v"));
					new SetOpcode(parseInt(parts[1].substring(1)), parseInt(parts[2].substring(1))).writeTo(output);
					break;

				case "seti":
					assert(parts.length === 3);
					assert(parts[1].startsWith("v"));
					new SetiOpcode(parseInt(parts[1].substring(1)), parseInt(parts[2])).writeTo(output);
					break;

				case "shl":
					assert(parts.length === 3);
					assert(parts[1].startsWith("v"));
					new ShlOpcode(parseInt(parts[1].substring(1)), parseInt(parts[2])).writeTo(output);
					break;

				case "shr":
					assert(parts.length === 3);
					assert(parts[1].startsWith("v"));
					new ShrOpcode(parseInt(parts[1].substring(1)), parseInt(parts[2])).writeTo(output);
					break;

				case "show":
					assert(parts.length === 2);
					new ShowOpcode(parseInt(parts[1])).writeTo(output);
					break;

				case "setvec":
					assert(parts.length === 3);
					new SetVecOpcode(parseInt(parts[1]), 0xbeef).writeTo(output);
					labelRefs.set(output.getOffset() - 2, parts[2]);
					break;

				case "text":
					assert(parts.length === 5);
					new TextOpcode(parseInt(parts[1]), parseInt(parts[2]), parseInt(parts[3]), parseInt(parts[4])).writeTo(output);
					break;

				case "return":
					new ReturnOpcode().writeTo(output);
					break;

				case "bigend":
					new BigendOpcode().writeTo(output);
					break;

				case "setws":
					assert(parts.length === 2);
					new SetwsOpcode(parseInt(parts[1])).writeTo(output);
					break;

				case "break":
					new BreakOpcode().writeTo(output);
					break;

				case "clr":
					assert(parts.length === 3);
					new ClrOpcode(parseInt(parts[1]), parseInt(parts[2])).writeTo(output);
					break;

				case "copy":
					assert(parts.length === 3);
					new CopyOpcode(parseInt(parts[1]), parseInt(parts[2])).writeTo(output);
					break;

				case "fade":
					assert(parts.length === 2);
					new FadeOpcode(parseInt(parts[1])).writeTo(output);
					break;

				case "reset":
					assert(parts.length === 4);
					new ResetOpcode(parseInt(parts[1]), parseInt(parts[2]), parseInt(parts[3])).writeTo(output);
					break;

				case "load":
					assert(parts.length === 2);
					new LoadOpcode(parseInt(parts[1])).writeTo(output);
					break;

				case "dbra":
					assert(parts.length === 3);
					assert(parts[1].startsWith("v"));
					new DbraOpcode(parseInt(parts[1].substring(1)), 0xbeef).writeTo(output);
					labelRefs.set(output.getOffset() - 2, parts[2]);
					break;

				case "si": {
					assert(parts.length === 5);
					assert(parts[1].startsWith("v"));

					const v = parseInt(parts[1].substring(1));
					const operation = parts[2];
					let isReference = false;
					let value = 0;
					if (parts[3].startsWith("v")) {
						isReference = true;
						value = parseInt(parts[3].substring(1));
					} else {
						value = parseInt(parts[3]);
					}

					const operations = ["==", "!=", ">", ">=", "<", "<="];
					assert(operations.includes(operation));
					const cond = operations.indexOf(operation);
					new SiOpcode(v, value, isReference, cond, 0xbeef).writeTo(output);

					labelRefs.set(output.getOffset() - 2, parts[4]);
				}
					break;

				case "spr":
					// assert(parts.length === 4);
					const resourceId = parseInt(parts[1]);
					const isReferenceX = parts[2].startsWith("v");
					const isReferenceY = parts[3].startsWith("v");
					const isReferenceZ = parts[4].startsWith("v");
					const x = parseInt(isReferenceX ? parts[2].substring(1) : parts[2]);
					const y = parseInt(isReferenceY ? parts[3].substring(1) : parts[3]);
					const z = parseInt(isReferenceZ ? parts[4].substring(1) : parts[4]);
					new SprOpcode(x, isReferenceX, y, isReferenceY, z, isReferenceZ, resourceId, false).writeTo(output);
					break;

				case "jsr":
					assert(parts.length === 2);
					new JsrOpcode(0xbeef).writeTo(output);
					labelRefs.set(output.getOffset() - 2, parts[1]);
					break;

				case "jmp":
					assert(parts.length === 2);
					new JmpOpcode(0xbeef).writeTo(output);
					labelRefs.set(output.getOffset() - 2, parts[1]);
					break;

				case "play":
					assert(parts.length === 5);
					new PlayOpcode(parseInt(parts[1]), parseInt(parts[2]), parseInt(parts[3]), parseInt(parts[4])).writeTo(output);
					break;

				case "music":
					assert(parts.length === 4);
					new MusicOpcode(parseInt(parts[1]), parseInt(parts[2]), parseInt(parts[3])).writeTo(output);
					break;

				default:
					console.log("Unsupported opcode " + parts.join(" "));
				// process.exit(1);
				// break;
			}
		}

		// resolve all labels
		labelRefs.forEach((label, offset) => {
			const labelOffset = labelOffsets.get(label);
			if (labelOffset === undefined) {
				console.log("Label " + label + " not found");
				process.exit(1);
			}

			output.writeUint16At(offset, labelOffset);
		});

		fs.writeFileSync(options.outfile, output.toUint8Array());
	}

	public decompile(options: { file: string }) {

		const buf = fs.readFileSync(options.file);
		const reader = BufferedFile.open(buf);

		const labelVisitor = new LabelsOpcodeVisitor();
		this.accept(reader, labelVisitor);

		reader.seek(0);
		const disassembler = new DisassemblerOpcodeVisitor(labelVisitor);
		this.accept(reader, disassembler);
	}

	private extensionToResourceType(extension: string): number {
		switch (extension) {
			case "snd":
				return RESOURCE_TYPE_SOUND;
			case "mus":
				return RESOURCE_TYPE_MUSIC;
			case "pic":
				return RESOURCE_TYPE_BITMAP;
			case "pal":
				return RESOURCE_TYPE_PALETTE;
			case "txt":
				return RESOURCE_TYPE_BYTECODE;
			case "shp":
				return RESOURCE_TYPE_SHAPE;
			case "bin":
				return RESOURCE_TYPE_OTHER;
		}

		throw new Error("Unknown extension " + extension);
	}

	private resourceTypeToExtension(resourceType: number): string {
		switch (resourceType) {
			case RESOURCE_TYPE_SOUND:
				return "snd";
			case RESOURCE_TYPE_MUSIC:
				return "mus";
			case RESOURCE_TYPE_BITMAP:
				return "pic";
			case RESOURCE_TYPE_PALETTE:
				return "pal";
			case RESOURCE_TYPE_BYTECODE:
				return "txt";
			case RESOURCE_TYPE_SHAPE:
				return "shp";
			case RESOURCE_TYPE_OTHER:
				return "bin";
		}

		throw new Error("Unknown resource type " + resourceType);
	}

	public pack(options: { indir: string, outdir: string }) {
		const files = fs.readdirSync(options.indir)
		.filter((file) => file.match(/^[0-9a-f]{4}\.(bin|snd|mus|pic|pal|shp|txt)$/))
		.sort();

		console.log("Packing " + files.length + " files to " + options.outdir);
		fs.mkdirSync(options.outdir, {recursive: true});

		const MAX_BANK_SIZE = 128 * 1024;

		const memlist = OutputBufferedFile.create();

		let bankId = 1;
		let bankFile = OutputBufferedFile.create();

		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			const buf = fs.readFileSync(`${options.indir}/${file}`);
			if (bankFile.getOffset() + buf.length > MAX_BANK_SIZE) {
				if (bankFile.getOffset() === 0) {
					throw new Error("File " + file + " is too big to fit in a bank of " + MAX_BANK_SIZE + " bytes");
				}

				const outFile = `${options.outdir}/Bank${bankId.toString(16).padStart(2, "0")}`;
				console.log(`Writing bank file ${outFile} with ${bankFile.getOffset()} bytes`);
				fs.writeFileSync(outFile, bankFile.toUint8Array());
				bankFile = OutputBufferedFile.create();
				bankId++;
			}

			const type = this.extensionToResourceType(file.split(".")[1]);

			memlist.writeByte(0x00); // state
			memlist.writeByte(type); // type
			memlist.writeUint16(0x00); // unk
			memlist.writeUint16(0x00); // unk
			memlist.writeByte(0x00); // rankNum
			memlist.writeByte(bankId); // bankId
			memlist.writeUint32(bankFile.getOffset()); // bankOffset
			memlist.writeUint16(0x00); // unk
			memlist.writeUint16(buf.length); // packedSize
			memlist.writeUint16(0x00); // unk1
			memlist.writeUint16(buf.length); // size

			bankFile.writeBytes(buf);
		}

		// remainder
		if (bankFile.getOffset() > 0) {
			const outFile = `${options.outdir}/Bank${bankId.toString(16).padStart(2, "0")}`;
			console.log(`Writing bank file ${outFile} with ${bankFile.getOffset()} bytes`);
			fs.writeFileSync(outFile, bankFile.toUint8Array());
		}

		// termination
		for (let i = 0; i < 20; i++) {
			memlist.writeByte(0xff);
		}

		fs.writeFileSync(`${options.outdir}/Memlist.bin`, memlist.toUint8Array());
	}

	private configure() {
		this.program
		.name('Another World Swiss Army Knife - awsak')
		.version('0.9.0');

		this.program
		.command('extract')
		.description('Extract files')
		.requiredOption('--indir <dir>', 'Specify input directory')
		.requiredOption('--outdir <dir>', 'Specify output directory')
		.action((options) => this.extract(options));

		this.program
		.command('pack')
		.description('Pack files')
		.requiredOption('--indir <dir>', 'Specify input directory')
		.requiredOption('--outdir <dir>', 'Specify output directory')
		.action((options) => this.pack(options));

		this.program
		.command('compile')
		.description("Compile assembly to bytecode")
		.requiredOption('--file <path>', 'Specify input filename to compile')
		.requiredOption('--outfile <path>', 'Specify output filename')
		.action((options) => this.compile(options));

		this.program
		.command('decompile')
		.description("Decompile bytecode into assembly")
		.requiredOption('--file <path>', 'Specify input filename to decompile')
		.action((options) => this.decompile(options));

		this.program
		.command('pic2bmp')
		.description("Convert a .pic resource to an 8-bit .bmp")
		.requiredOption('--pic <filename>', 'Specify resource .pic filename')
		.option('--palette <filename>', 'Specify resource .pal filename)')
		.option('--index <filename>', 'Palette index within resource (0-31)')
		.requiredOption('--output <filename>', 'Specify output filename (bmp)')
		.action((options: any) => this.pic2bmp(options));

		this.program
		.command('bmp2pic')
		.description("Convert a .bmp to background resource")
		.requiredOption('--infile <path>', 'Specify input filename (bmp)')
		.requiredOption('--scr <path>', 'Specify output filename (eg 0013.scr)')
		.action((options: any) => this.bmp2pic(options));
	}

	public static main() {
		const ref = new AWSAK();
		ref.program.parse(process.argv);
	}
}
