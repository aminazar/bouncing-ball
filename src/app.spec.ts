import { describe, it, expect, beforeAll } from '@jest/globals';
import {Ball, LEFT_WIND_VELOCITY, start, Surface, Throw, World } from './app';
function timeoutPromise(fn: () => void, t: number) {
	return new Promise(resolve => setTimeout(() => {
		fn();
		resolve(null);
	}, t));
}

describe('App', () => {
	beforeAll(() => {
		document.body.innerHTML = `
		<div id="box"></div>
		`;
	})
	it('should have a start function', () => {
		expect(typeof start).toBe('function');
	});

	it('should have World class', () => {
		expect(typeof World).toBe('function');
	});

	it('should have Ball class', () => {
		expect(typeof Ball).toBe('function');
	});

	it('should have Surface class', () => {
		expect(typeof Surface).toBe('function');
	});

	it('should have Throw class', () => {
		expect(typeof Throw).toBe('function');
	});

	describe('World Class',  async () => {
		const w = new World(10);
		beforeAll(() => w.init());

		it('gets its boundaries from the box div',  () => {
			expect(w.boundaries).not.toBeNull();
			expect(w.box).not.toBeNull();
		});

		it('responds to the mouse down and up events with generating a ball', async () => {
			if (w.box) {
				expect(w.box.dispatchEvent(new Event('mousedown'))).toBeTruthy();
				await timeoutPromise(() => {
					if (w.box) {
						w.box.dispatchEvent(new Event('mouseup'));
						expect(w.balls.length).toBe(1);
						expect(w.surfaces.length).toBe(1);
					}
				}, 100);
			}
		});
	});

	describe('Ball class', () => {
		const ball = new Ball(0, 0, 200, 100);
		const box = document.getElementById('box');

		beforeAll(() => {
			if (box) {
				ball.paint(box);
			}
			ball.recalc(60, 50)
		});

		it('should affect gravity and velocity to the position' , () => {
			expect(ball.x).toBe(12);
			expect(ball.y).toBe(6);
			ball.recalc(60, 50);
			expect(ball.x).toBe(24);
			expect(ball.y).toBe(12.18);
		});

		it('should detect hit to surface', () => {
			const floor = new Surface(0, 1, -15, 0);
			expect(ball.hits(floor)).toBe(false);
			ball.recalc(60, 50);
			expect(ball.x).toBe(36);
			expect(ball.y).toBe(18.54);
			expect(ball.hits(floor)).toBe(true);
		});

		it('should paint the ball' , () => {
			if (box) {
				expect(box.children.length).toBe(1);
				expect(box.children[0]).toBe(ball.element);
				if (ball.element) {
					expect(ball.element.style.left).toBe(ball.x + 'px');
					expect(ball.element.style.top).toBe(ball.y + 'px');
					expect(ball.element.style.width).toBe(ball.radius * 2  + 'px');
					expect(ball.element.style.height).toBe(ball.radius * 2 + 'px');
				}
			}
		});

		it('should erase the ball', () => {
			if (box) {
				ball.erase(box);
				expect(box.children.length).toBe(0);
			}
		})
	});

	describe('Surface class', () => {
		const ball = new Ball(0, 0, 200, 100);
		const floor = new Surface(0, 1, -3, 0);
		it('should reflect a ball', () => {
			floor.reflects(ball);
			expect(ball.vx).toBe(200);
			expect(ball.vy).toBeGreaterThan(-100);
			expect(ball.vy).toBeLessThan(0);
		})
	});

	describe('Throw class', () => {
		const t = new Throw(10, 10);
		beforeAll(async () => {
			await timeoutPromise(() => t.thowEnds(200, 300), 300);
		});

		it('should give correct velocity', () => {
			const [vx, vy] = t.velocity();
			expect(vx).toBeCloseTo(60, -2);
			expect(vy).toBeCloseTo(48, -2);
		});

		it('should give default wind velocity when no drag happened', async () => {
			const nt = new Throw(10, 10);
			await timeoutPromise(() => nt.thowEnds(20, 30), 100);
			const [vx, vy] = nt.velocity();
			expect(vx).toBe(LEFT_WIND_VELOCITY);
			expect(vy).toBe(0);
		})
	});
});
