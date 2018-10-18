<template>
    <svg :width="width" :height="height" @click="addPoint">
        <line x1=0 :y1="viewPort.yorig" :x2="width" :y2="viewPort.yorig" stroke="#333" stroke-width="1px" shape-rendering="crispEdges"/>
        <line :x1="viewPort.xorig" y1="0" :x2="viewPort.xorig" :y2="height" stroke="#333" stroke-width="1px" shape-rendering="crispEdges"/>
        <PredictionCurve :x="prediction.x" :y="prediction.y" :e="prediction.e" :viewPort="viewPort" />
        <circle v-for="p in viewPoints" r="2" :cx="p.x" :cy="p.y" :key="p.id"/>
    </svg>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import PredictionCurve from "./PredictionCurve.vue";
import { regression } from "@/gaussian_process";
import { ViewPort } from "@/util";

const N = 100;

type Prediction = {
  x: Float64Array;
  y: Float64Array;
  e: Float64Array;
};

type Point = {
  x: number;
  y: number;
  id: number;
};

@Component({
  components: {
    PredictionCurve
  }
})
export default class GaussoianProcess extends Vue {
  @Prop()
  private width!: number;
  @Prop()
  private height!: number;

  private viewPort: ViewPort = new ViewPort(this.width, this.height, 30, 30);
  private lastID: number = 0;
  private points: Point[] = [];

  private addPoint(event: MouseEvent) {
    const [x, y] = this.viewPort.actual(event.offsetX, event.offsetY);
    this.points.push({ x, y, id: this.lastID });
    this.lastID++;
  }

  get viewPoints(): Point[] {
    return this.points.map((p: Point) => {
      const [x, y] = this.viewPort.view(p.x, p.y);
      return { x, y, id: p.id };
    });
  }

  get prediction(): Prediction {
    const xt = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      xt[i] = (this.width / this.viewPort.xscale) * (i / (N - 1) - 1 / 2);
    }

    const n = this.points.length;
    const x = new Float64Array(n);
    const y = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      x[i] = this.points[i].x;
      y[i] = this.points[i].y;
    }
    const [mu, sig] = regression(x, y, xt);

    return {
      x: xt,
      y: mu,
      e: sig
    };
  }
}
</script>
