import { t } from "@/shared/hooks/useFusionAccessTranslations";

// This link will need to be updated in-between versions 
export const LEARN_MORE_LINK =
  "https://docs.redhat.com/en/documentation/openshift_container_platform/4.19/html/virtualization/virtualization-with-ibm-fusion-access-for-san";
export const MINIMUM_AMOUNT_OF_NODES = 3;
export const MINIMUM_AMOUNT_OF_NODES_LITERAL = t("three");
export const MINIMUM_AMOUNT_OF_SHARED_DISKS = 1;
export const MINIMUM_AMOUNT_OF_SHARED_DISKS_LITERAL = t("one");
export const MINIMUM_AMOUNT_OF_MEMORY_GIB = 20;
export const MINIMUM_AMOUNT_OF_MEMORY_GIB_LITERAL = "20 GiB";
export const VALUE_NOT_AVAILABLE = "--";
export const STORAGE_ROLE_LABEL = "scale.spectrum.ibm.com/role=storage";
export const WORKER_NODE_ROLE_LABEL = "node-role.kubernetes.io/worker=";
export const MASTER_NODE_ROLE_LABEL = "node-role.kubernetes.io/master=";
export const CPLANE_NODE_ROLE_LABEL = "node-role.kubernetes.io/control-plane=";
export const FS_ALLOW_DELETE_LABEL = "scale.spectrum.ibm.com/allowDelete";
export const SC_PROVISIONER = "spectrumscale.csi.ibm.com";
