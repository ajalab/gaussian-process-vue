<template>
  <g>
    <path :d="mean" id="mean"/>
    <path :d="confidence" id="confidence"/>
  </g>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { ViewPort } from "@/util";

@Component
export default class PredictionCurve extends Vue {
  @Prop()
  private x!: Float64Array;
  @Prop()
  private y!: Float64Array;
  @Prop()
  private e!: Float64Array;
  @Prop()
  private viewPort!: ViewPort;

  get mean(): string {
    const n = this.x.length;
    let [x, y] = this.viewPort.view(this.x[0], this.y[0]);
    let s = `M${x} ${y}`;

    for (let i = 1; i < n; i++) {
      [x, y] = this.viewPort.view(this.x[i], this.y[i]);
      s = s + ` L${x} ${y}`;
    }
    return s;
  }

  get confidence(): string {
    const upperX = this.x;
    const upperY = this.y.map((y, i) => y - this.e[i]);
    const lowerX = this.x.slice();
    const lowerY = this.y.map((y, i) => y + this.e[i]);
    const n = upperX.length;

    let [x, y] = this.viewPort.view(upperX[0], upperY[0]);
    let upper = `M${-1} ${y} L${x} ${y}`;
    for (let i = 1; i < n; i++) {
      [x, y] = this.viewPort.view(upperX[i], upperY[i]);
      upper = upper + `L${x} ${y}`;
    }
    upper = upper + `L${this.viewPort.width + 2} ${y}`;
    let lower = "";
    for (let i = n - 1; i >= 0; i--) {
      [x, y] = this.viewPort.view(lowerX[i], lowerY[i]);
      lower = lower + `L${x} ${y}`;
    }

    return `${upper} ${lower} Z`;
  }
}
</script>

<style scoped>
#mean {
  stroke: #57d;
  stroke-width: 2px;
  fill: none;
}

#confidence {
  stroke: #57d;
  fill: #57d;
  fill-opacity: 0.5;
}
</style>