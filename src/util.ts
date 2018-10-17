export class Point {
    constructor(public x: number, public y: number, public id: number) { }
}

export class ViewPort {
    constructor(
        public width: number,
        public height: number,
        public xscale: number,
        public yscale: number,
        public xorig: number = width / 2,
        public yorig: number = height / 2
    ) { }

    public view(x: number, y: number): [number, number] {
        const vx = x * this.xscale + this.xorig;
        const vy = y * -this.yscale + this.yorig;
        return [vx, vy];
    }

    public actual(x: number, y: number): [number, number] {
        const ax = (x - this.xorig) / this.xscale;
        const ay = (y - this.yorig) / -this.yscale;
        return [ax, ay];
    }
}
