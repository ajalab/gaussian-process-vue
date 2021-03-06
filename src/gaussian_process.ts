function cholesky(a: Float64Array, n: number): Float64Array {
    if (a.length !== n * n) {
        throw new Error("n * n should be equal to a.length");
    }

    const l = new Float64Array(n * n);
    for (let j = 0; j < n; j++) {
        let s = 0.0;
        for (let k = 0; k < j; k++) {
            const l_jk = l[n * j + k];
            s = s + l_jk * l_jk;
        }
        const l_jj = Math.sqrt(a[n * j + j] - s);
        l[n * j + j] = l_jj;
        for (let i = j + 1; i < n; i++) {
            let s = 0.0;
            for (let k = 0; k < j; k++) {
                const l_ik = l[n * i + k];
                const l_jk = l[n * j + k];
                s = s + l_ik * l_jk;
            }
            l[n * i + j] = (a[n * i + j] - s) / l_jj;
        }
    }
    return l;
}

function solveForward(l: Float64Array, b: Float64Array): Float64Array {
    const n = b.length;
    const y = new Float64Array(n);
    for (let j = 0; j < n; j++) {
        let s = 0.0;
        for (let k = 0; k < j; k++) {
            s = s + l[n * j + k] * y[k];
        }
        y[j] = (b[j] - s) / l[n * j + j];
    }
    return y;
}

function solveBackward(l: Float64Array, y: Float64Array): Float64Array {
    const n = y.length;
    const x = new Float64Array(n);
    for (let j = n - 1; j >= 0; j--) {
        let s = 0.0;
        for (let k = n - 1; k > j; k--) {
            s = s + l[n * k + j] * x[k];
        }
        x[j] = (y[j] - s) / l[n * j + j];
    }
    return x;
}

// Solve Ax = b where A = LL^T.
function solve(l: Float64Array, b: Float64Array) {
    const y = solveForward(l, b);
    const x = solveBackward(l, y);
    return x;
}

function inv(l: Float64Array, n: number): Float64Array {
    const r = new Float64Array(n * n);
    for (let i = 0; i < n; i++) {
        const e = new Float64Array(n);
        e[i] = 1;
        const y = solveForward(l, e);
        const x = solveBackward(l, y);
        for (let j = 0; j < n; j++) {
            r[n * j + i] = x[j];
        }
    }
    return r;
}

function sub(x: Float64Array, y: Float64Array): Float64Array {
    return x.map((v, i) => v - y[i]);
}

function mul(x: Float64Array, y: Float64Array, n: number): Float64Array {
    const r = new Float64Array(n * n);
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            let s = 0;
            for (let k = 0; k < n; k++) {
                s += x[n * i + k] * y[n * k + j];
            }
            r[n * i + j] = s;
        }
    }
    return r;
}

function dot(x: Float64Array, y: Float64Array): number {
    const n = x.length;

    let s = 0.0;
    for (let i = 0; i < n; i++) {
        s = s + x[i] * y[i];
    }
    return s;
}

function kernel(x1: number, x2: number, t: number) {
    const d = x1 - x2;
    return Math.exp(d * d * -t);
}

function dkernel(x1: number, x2: number, t: number) {
    const d = x1 - x2;
    return -Math.exp(d * d * -t) * (d * d);
}

export function predict(
    x: Float64Array,
    y: Float64Array,
    xt: Float64Array,
    t: number = 3,
    beta: number = 30
): [Float64Array, Float64Array] {

    const n = x.length;
    const c = new Float64Array(n * n);
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            c[n * i + j] = kernel(x[i], x[j], t) + (i === j ? 1.0 / beta : 0);
        }
    }
    const l = cholesky(c, n);
    const a = solve(l, y);
    const m = xt.length;
    const mu = new Float64Array(m);
    const sigma = new Float64Array(m);
    for (let j = 0; j < m; j++) {
        const k = new Float64Array(n);
        for (let i = 0; i < n; i++) {
            k[i] = kernel(x[i], xt[j], t);
        }
        const v = solveForward(l, k);
        mu[j] = dot(k, a);
        sigma[j] = kernel(xt[j], xt[j], t) + 1.0 / beta - dot(v, v);
    }

    return [mu, sigma];
}

export function optimize(
    x: Float64Array,
    y: Float64Array,
    beta: number = 30,
    m = 100,
    learning_rate: number = 0.05,
): number {
    const n = x.length;
    let t = 1;
    for (let k = 0; k < m; k++) {
        const c = new Float64Array(n * n);
        const dc = new Float64Array(n * n);
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                c[n * i + j] = kernel(x[i], x[j], t) + (i === j ? 1.0 / beta : 0);
                dc[n * i + j] = dkernel(x[i], x[j], t);
            }
        }
        const l = cholesky(c, n);
        const a = solve(l, y);
        const aa = new Float64Array(n * n);
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                aa[n * i + j] = a[i] * a[j];
            }
        }
        const cinv = inv(l, n);
        const m = mul(sub(aa, cinv), dc, n);
        let tr = 0;
        for (let i = 0; i < n; i++) {
            tr = tr + m[n * i + i];
        }
        t = t + tr * learning_rate;
    }
    return t;
}
