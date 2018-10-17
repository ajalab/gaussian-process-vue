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

function dot(x: Float64Array, y: Float64Array): number {
    const n = x.length;

    let s = 0.0;
    for (let i = 0; i < n; i++) {
        s = s + x[i] * y[i];
    }
    return s;
}

function kernel(x1: number, x2: number, h: number) {
    const d = x1 - x2;
    return Math.exp(d * d / -h);
}

export function regression(
    x: Float64Array,
    y: Float64Array,
    xt: Float64Array,
    h: number = 3,
    beta: number = 30
): [Float64Array, Float64Array] {

    const n = x.length;
    const c = new Float64Array(n * n);
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            c[n * i + j] = kernel(x[i], x[j], h) + (i === j ? 1.0 / beta : 0);
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
            k[i] = kernel(x[i], xt[j], h);
        }
        const v = solveForward(l, k);
        mu[j] = dot(k, a);
        sigma[j] = kernel(xt[j], xt[j], h) + 1.0 / beta - dot(v, v);
    }

    return [mu, sigma];
}
