export class Point {
	constructor(public x: number, public y: number) {
	}
}

export class Polygon {
	constructor(public color: number, public points: Array<Point>) {
	}
}

export class SvgUtils {

	public static toSvg(polygons: Array<Polygon>): string {

		const SVG_HEADER = '<svg width="320" height="200" xmlns="http://www.w3.org/2000/svg">';
		const BACKGROUND = `\t<rect class="ignored" width="320" height="200" style="fill: #ff00ff;" />`
		const SVG_FOOTER = '</svg>';

		let out = "";
		out += SVG_HEADER + "\n";
		// out += BACKGROUND + "\n";
		for (let i = 0; i < polygons.length; i++) {
			const polygon = polygons[i];
			const items = [];
			for (let j = 0; j < polygon.points.length; j++) {
				const point = polygon.points[j];
				items.push(`${point.x},${point.y}`);
			}

			const color256 = (polygon.color << 4) | polygon.color;
			const color = color256.toString(16).padStart(2, "0");
			const fill = `#${color}${color}${color}`;
			out += `\t<polygon points="${items.join(" ")}" style="fill: ${fill};" />\n`;
		}

		out += SVG_FOOTER + "\n";
		return out;
	}
}
