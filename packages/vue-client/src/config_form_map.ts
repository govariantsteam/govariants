import type { Component } from "vue";
import BadukConfigForm from "@/components/GameCreation/BadukConfigForm.vue";
import BadukWithAbstractBoardConfigForm from "@/components/GameCreation/BadukWithAbstractBoardConfigForm.vue";
import ParalleGoConfigForm from "@/components/GameCreation/ParallelGoConfigForm.vue";
import DriftGoConfigFormVue from "./components/GameCreation/DriftGoConfigForm.vue";
import GridBadukConfigForm from "./components/GameCreation/GridBadukConfigForm.vue";
import SFractionalConfigForm from "./components/GameCreation/SFractionalConfigForm.vue";

export const config_form_map: {
  [variant: string]: Component<{ initialConfig: object }>;
} = {
  baduk: BadukConfigForm,
  phantom: BadukConfigForm,
  badukWithAbstractBoard: BadukWithAbstractBoardConfigForm,
  parallel: ParalleGoConfigForm,
  capture: BadukConfigForm,
  tetris: BadukConfigForm,
  pyramid: GridBadukConfigForm,
  "thue-morse": BadukConfigForm,
  freeze: BadukConfigForm,
  keima: GridBadukConfigForm,
  "one color": BadukConfigForm,
  drift: DriftGoConfigFormVue,
  quantum: BadukConfigForm,
  sfractional: SFractionalConfigForm,
};
