<template>
    <div>
      <svg :width="width" :height="height" @click="addPoint">
          <line x1=0 :y1="viewPort.yorig" :x2="width" :y2="viewPort.yorig" stroke="#333" stroke-width="1px" shape-rendering="crispEdges"/>
          <line :x1="viewPort.xorig" y1="0" :x2="viewPort.xorig" :y2="height" stroke="#333" stroke-width="1px" shape-rendering="crispEdges"/>
          <PredictionCurve :x="prediction.x" :y="prediction.y" :e="prediction.e" :viewPort="viewPort" />
          <circle v-for="p in viewPoints" r="2" :cx="p.x" :cy="p.y" :key="p.id"/>
      </svg>
      <p>
        <label>h: <input type="number" v-model="h"/></label>
        <label>β: <input type="number" v-model="beta"/></label>
        <input type="button" value="clear" @click="points = []"/>
      </p>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import PredictionCurve from "./PredictionCurve.vue";
import { regression } from "@/gaussian_process";
import { ViewPort } from "@/util";

type Prediction = {
  x: Float64Array;
  y: Float64Array;
  e: Float64Array;
};

type Point = {
  x: number;
  y: number;
  id?: number;
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
  private points: Point[] = [];

  private h: number = 3;
  private beta: number = 30;
  private N: number = 100;

  private addPoint(event: MouseEvent) {
    const [x, y] = this.viewPort.actual(event.offsetX, event.offsetY);
    this.points.push({ x, y });
  }

  get viewPoints(): Point[] {
    return this.points.map((p: Point, id: number) => {
      const [x, y] = this.viewPort.view(p.x, p.y);
      return { x, y, id };
    });
  }

  get prediction(): Prediction {
    const xt = new Float64Array(this.N);
    for (let i = 0; i < this.N; i++) {
      xt[i] =
        (this.viewPort.width / this.viewPort.xscale) *
        (i / (this.N - 1) - 1 / 2);
    }

    const n = this.points.length;
    const x = new Float64Array(n);
    const y = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      x[i] = this.points[i].x;
      y[i] = this.points[i].y;
    }
    const [mu, sig] = regression(x, y, xt, this.h, this.beta);

    return {
      x: xt,
      y: mu,
      e: sig
    };
  }
}
</script>

<style scoped>
input[type="number"] {
  width: 6em;
  margin-right: 1em;
}

svg {
  cursor: crosshair;
}
</style>
