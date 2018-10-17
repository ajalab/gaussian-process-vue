<template>
<path :d="path" stroke="#57d" stroke-width="2px" fill="none"/>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { Point, ViewPort } from "@/util";

@Component
export default class PredictionCurve extends Vue {
  @Prop()
  private xs!: Float64Array;
  @Prop()
  private ys!: Float64Array;
  @Prop()
  private viewPort!: ViewPort;

  get path(): string {
    const n = this.xs.length;
    let [x, y] = this.viewPort.view(this.xs[0], this.ys[0]);
    let s = `M${x} ${y}`;

    for (let i = 1; i < n; i++) {
      [x, y] = this.viewPort.view(this.xs[i], this.ys[i]);
      s = s + ` L${x} ${y}`;
    }

    return s;
  }
}
</script>
