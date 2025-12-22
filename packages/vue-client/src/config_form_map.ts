import type { Component } from "vue";
import BadukConfigForm from "@/components/GameCreation/BadukConfigForm.vue";
import ParalleGoConfigForm from "@/components/GameCreation/ParallelGoConfigForm.vue";
import DriftGoConfigFormVue from "./components/GameCreation/DriftGoConfigForm.vue";
import GridBadukConfigForm from "./components/GameCreation/GridBadukConfigForm.vue";
import SFractionalConfigForm from "./components/GameCreation/SFractionalConfigForm.vue";
import PyramidConfigForm from "./components/GameCreation/PyramidConfigForm.vue";
import RengoConfigForm from "./components/GameCreation/RengoConfigForm.vue";
import CubeBadukConfigForm from "./components/GameCreation/CubeBadukConfigForm.vue";

export const config_form_map: {
  [variant: string]: Component<{ initialConfig: object }>;
} = {
  baduk: BadukConfigForm,
  cube: CubeBadukConfigForm,
  phantom: BadukConfigForm,
  parallel: ParalleGoConfigForm,
  capture: BadukConfigForm,
  tetris: BadukConfigForm,
  pyramid: PyramidConfigForm,
  "thue-morse": BadukConfigForm,
  freeze: BadukConfigForm,
  keima: GridBadukConfigForm,
  "one color": BadukConfigForm,
  drift: DriftGoConfigFormVue,
  quantum: BadukConfigForm,
  sfractional: SFractionalConfigForm,
  lighthouse: GridBadukConfigForm,
  rengo: RengoConfigForm,
};
