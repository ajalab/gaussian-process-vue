<template>
    <svg :width="width" :height="height" @click="addPoint">
        <circle v-for="p in viewPoints" r="2" :cx="p.x" :cy="p.y" :key="p.id"/>
        <line x1=0 :y1="viewPort.yorig" :x2="width" :y2="viewPort.yorig" stroke="#333" stroke-width="1px" shape-rendering="crispEdges"/>
        <line :x1="viewPort.xorig" y1="0" :x2="viewPort.xorig" :y2="height" stroke="#333" stroke-width="1px" shape-rendering="crispEdges"/>
        <PredictionCurve :xs="predictX" :ys="predictY" :viewPort="viewPort" />
    </svg>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import PredictionCurve from "./PredictionCurve.vue";
import { regression } from "@/gaussian_process";
import { Point, ViewPort } from "@/util";

const N = 100;

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

  private lastID: number = 0;
  private points: Point[] = [];
  private viewPort: ViewPort = new ViewPort(this.width, this.height, 30, 30);

  private addPoint(event: MouseEvent) {
    const [x, y] = this.viewPort.actual(event.offsetX, event.offsetY);
    this.points.push(new Point(x, y, this.lastID));
    this.lastID++;
  }

  get viewPoints(): Point[] {
    return this.points.map((p: Point) => {
      const [x, y] = this.viewPort.view(p.x, p.y);
      return new Point(x, y, p.id);
    });
  }

  get predictX(): Float64Array {
    const xs = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      xs[i] = (this.width / this.viewPort.xscale) * (i / (N - 1) - 1 / 2);
    }
    return xs;
  }

  get predictY(): Float64Array {
    const n = this.points.length;
    const x = new Float64Array(n);
    const y = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      x[i] = this.points[i].x;
      y[i] = this.points[i].y;
    }
    const [mu, sig] = regression(x, y, this.predictX);
    return mu;
  }
}
</script>
