import type { IoK8sApiCoreV1Node } from "@/models/kubernetes/1.30/types";
import { signal } from "@preact/signals-react";
import { NodesSelectionTableRowViewModel } from "./NodesSelectionTableRowViewModel";

let instance: NodeSelectionTableViewModel;

export const useNodesSelectionTableViewModel = () => {
  if (!instance) {
    instance = new NodeSelectionTableViewModel();
  }

  return instance;
};

export class NodeSelectionTableViewModel {
  readonly #isLoaded$ = signal<boolean>(false);
  readonly #loadErrorMessage$ = signal<string>("");
  // readonly #sharedDisksBySelectedNodes$ = signal(new Set<string>());
  #tableRows$ = signal<NodesSelectionTableRowViewModel[]>([]);

  set isLoaded(newValue: boolean) {
    this.#isLoaded$.value = newValue;
  }
  get isLoaded(): boolean {
    return this.#isLoaded$.value;
  }

  set loadErrorMessage(newValue: string) {
    this.#loadErrorMessage$.value = newValue;
  }
  get loadErrorMessage(): string {
    return this.#loadErrorMessage$.value;
  }

  setTableRows(nodes: IoK8sApiCoreV1Node[]) {
    this.#tableRows$.value = nodes.map(
      (node) => new NodesSelectionTableRowViewModel(node)
    );
  }
  get tableRows(): NodesSelectionTableRowViewModel[] {
    return this.#tableRows$.value;
  }

  // set sharedDisksBySelectedNodes(newValue: any) {
  //   this.#sharedDisksBySelectedNodes$.value = newValue;
  // }
  // get sharedDisksBySelectedNodes() {
  //   return this.#sharedDisksBySelectedNodes$;
  // }
}
