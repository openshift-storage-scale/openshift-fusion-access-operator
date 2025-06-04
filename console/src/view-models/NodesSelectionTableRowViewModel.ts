import {
  VALUE_NOT_AVAILABLE,
  MINIMUM_AMOUNT_OF_MEMORY_GIB,
  STORAGE_ROLE_LABEL,
} from "@/constants";
import type {
  IoK8sApiCoreV1Node,
  IoK8sApimachineryPkgApiResourceQuantity,
} from "@/models/kubernetes/1.30/types";
import { getName, getUid, hasLabel } from "@/utils/console/K8sResourceCommon";
import {
  getCpu,
  getMemory,
  getRole,
  type ConvertableMemoryValue,
} from "@/utils/kubernetes/1.30/IoK8sApiCoreV1Node";
import { signal, type Signal } from "@preact/signals-react";

export class NodesSelectionTableRowViewModel {
  readonly #uid: string | undefined;
  readonly #name: string | undefined;
  readonly #role: string | undefined;
  readonly #cpu: IoK8sApimachineryPkgApiResourceQuantity | undefined;
  readonly #memory: ConvertableMemoryValue | Error;
  readonly #warnings: Set<"InsufficientMemory">;
  readonly #status$: Signal<"selected" | "selection-pending" | "unselected">;

  constructor(node: IoK8sApiCoreV1Node) {
    const uid = getUid(node);
    const name = getName(node);
    const role = getRole(node);
    const cpu = getCpu(node);
    const memory = getMemory(node);
    const status = hasLabel(node, STORAGE_ROLE_LABEL)
      ? "selected"
      : "unselected";

    if (
      !(memory instanceof Error) &&
      memory.to("GiB") < MINIMUM_AMOUNT_OF_MEMORY_GIB
    ) {
      this.warnings.add("InsufficientMemory");
    }

    this.#uid = uid;
    this.#name = name;
    this.#role = role;
    this.#cpu = cpu;
    this.#memory = memory;
    this.#warnings = new Set();
    this.#status$ = signal(status);
  }

  get uid() {
    return this.#uid;
  }

  get name() {
    return this.#name;
  }

  get role() {
    return this.#role;
  }

  get cpu() {
    return this.#cpu;
  }

  /**
   * Returns the memory value as a formatted string: <value> <unit>.
   *
   * If the internal memory value is an Error, returns a constant indicating the value is not available.
   * Otherwise, converts the memory value to the best imperial unit (typically, GiB, MiB or KiB) and formats it as a string with the specified number of decimal places.
   *
   * @param fixed - The number of decimal places to include in the formatted string. Defaults to 2.
   * @returns The formatted memory string or a value-not-available constant if the memory is invalid.
   */
  getMemoryAsString(fixed = 2) {
    return this.#memory instanceof Error
      ? VALUE_NOT_AVAILABLE
      : this.#memory.to("best", "imperial").toString(fixed);
  }

  get warnings() {
    return this.#warnings;
  }

  get status() {
    return this.#status$.value;
  }

  set status(newValue: "selected" | "selection-pending" | "unselected") {
    this.#status$.value = newValue;
  }
}
