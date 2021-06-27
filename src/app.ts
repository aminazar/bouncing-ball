const DEFAULT_RADIUS = 10;
const DEFAULT_DAMP = 0.2;
const GRAVITY = 200;
export const LEFT_WIND_VELOCITY = 100;
const FPS = 60;

export class Ball {
	x: number;
	y: number;
	spin: number;
	vx: number;
	vy: number;
	radius: number;
	relationalPositionToSurface: any = {};
	element: HTMLElement | null;

	constructor(x: number, y: number, vx = LEFT_WIND_VELOCITY, vy = 0, radius = DEFAULT_RADIUS, spin = 0) {
		this.x = x;
		this.y = y;
		this.vx = vx;
		this.vy = vy;
		this.radius = radius;
		this.spin = spin;
		this.element = null;
	}

	paint(box: HTMLElement | null) {
		if (!this.element) {
			this.element = document.createElement('div');
			this.element.className = 'ball';
			if (box) {
				box.appendChild(this.element);
			}
		}
		this.element.style.width = (this.radius * 2) + 'px';
		this.element.style.height= (this.radius * 2) + 'px';
		this.element.style.left = this.x + 'px';
		this.element.style.top = this.y + 'px';
	}

	erase(box: HTMLElement | null) {
		if (this.element && box) {
			box.removeChild(this.element);
		}
	}

	hits(surface: Surface): boolean {
		if (this.relationalPositionToSurface[surface.index]) {
			const sign = this.relationalPositionToSurface[surface.index];
			if(sign !== Math.sign(surface.calc(this.x, this.y)  - sign * this.radius * 2)) {
				return true;
			}
		} else {
			this.relationalPositionToSurface[surface.index] = Math.sign( surface.calc(this.x, this.y));
		}
		return false;
	}

	recalc(t: number, gravity: number): void {
		this.x += this.vx * t / 1000;
		this.y += this.vy * t / 1000;
		this.vy += gravity * t / 1000;
	}

	out(boundaries: ClientRect): boolean {
		return (this.x - this.radius > boundaries.right) || (this.x + this.radius < boundaries.left) || (this.y + this.radius < boundaries.top) || (this.y - this.radius > boundaries.bottom);
	}
}

export class Surface {
	// A surface is a line in the Viewport with this equation: ax + by + c = 0
	a: number;
	b: number;
	c: number;
	damp = DEFAULT_DAMP;
	index: number;

	constructor(A: number, B: number, C: number, index: number) {
		this.a = A;
		this.b = B;
		this.c = C;
		this.index = index;
	}

	calc(x: number, y: number) {
		return this.a * x + this.b * y + this.c;
	}

	reflects(ball: Ball) {
		const mult = ball.vx * this.a + ball.vy * this.b;
		const normalSquare = this.a * this.a + this.b * this.b;
		const remainderVelocity = 1 - this.damp;
		ball.vx = (ball.vx - 2 * mult / normalSquare * this.a) ;
		ball.vy = (ball.vy - 2 * mult / normalSquare * this.b) * remainderVelocity;
	}
}

export class Throw {
	startX: number;
	startY: number;
	endX: number;
	endY: number;
	startT: Date;
	endT: Date;
	constructor(x: number, y: number) {
		this.startT = new Date();
		this.startX = x;
		this.startY = y;
		this.endT = new Date();
		this.endX = NaN;
		this.endY = NaN;
	}

	thowEnds(x: number, y: number) {
		this.endT = new Date();
		this.endX = x;
		this.endY = y;
	}

	velocity(): number[] {
		const t = (this.endT.getTime() - this.startT.getTime()) / 100;
		if (t < 2) {
			return [LEFT_WIND_VELOCITY, 0];
		}
		return [(this.endX - this.startX) / t, (this.endY - this.startY) / t];
	}
}

export class World {
	balls: Ball[];
	surfaces: Surface[];
	gravity: number;
	boundaries: ClientRect;
	box: HTMLElement | null;

	constructor(gravity: number) {
		this.gravity = gravity;
		this.balls = [];
		this.surfaces = [];
		this.boundaries = {bottom: NaN, right: NaN, top:NaN, left: NaN, height: NaN, width: NaN};
		this.box = null;
	}

	init() {
		let box = document.getElementById('box');
		if (box) {
			this.box = box;
			let ballThrow: Throw;
			box.addEventListener('mousedown', event => {
				ballThrow = new Throw(event.clientX, event.clientY);
			});
			box.addEventListener(('mouseup'), event => {
				ballThrow.thowEnds(event.clientX, event.clientY);
				let [vx, vy] = ballThrow.velocity();
				this.newBall(event.clientX, event.clientY, vx, vy);
			})
			let rect = box.getBoundingClientRect();
			this.boundaries = rect;
			let floor = new Surface(0, 1, -rect.bottom, 0);
			this.surfaces.push(floor);
		} else {
			console.log('"box" id is missing!');
		}
	}

	newBall(x: number, y: number, vx: number, vy: number) {
		let ball = new Ball(x, y, vx, vy);
		if ( !this.surfaces.some(surface => Math.abs(surface.calc(x, y)) < 2 * DEFAULT_RADIUS)) {
			this.balls.push(ball);
			ball.paint(this.box);
		}
	}

	start() {
		const t = Math.floor(1000 / FPS);
		setInterval(() => this.recalc(t), t);
	}

	recalc(t: number) {
		this.balls.forEach((ball, index) => {
			this.surfaces.forEach(surface => {
				if (ball.hits(surface)) {
					surface.reflects(ball);
					ball.recalc(t, this.gravity);
				}
			});
			ball.recalc(t, this.gravity);
			if (ball.out(this.boundaries)) {
				ball.erase(this.box);
				this.balls.splice(index, 1);
			} else {
				ball.paint(this.box);
			}
		})
	}
}

export function start() {
	let world = new World(GRAVITY);
	world.init();
	world.start();
}
