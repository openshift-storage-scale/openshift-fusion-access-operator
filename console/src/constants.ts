import { t } from "@/shared/hooks/useFusionAccessTranslations";

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
export const MIN_AMOUNT_OF_NODES_MSG_DIGEST =
  "5da6449cd9450de311ce1e19f6a9a01be8710958";
export const FS_ALLOW_DELETE_LABEL = "scale.spectrum.ibm.com/allowDelete";
export const SC_PROVISIONER = "spectrumscale.csi.ibm.com";

// URL paths
export const FUSION_ACCESS_HOME_URL_PATH = "/fusion-access";
export const STORAGE_CLUSTER_HOME_URL_PATH = "/fusion-access/storage-cluster";
export const STORAGE_CLUSTER_CREATE_URL_PATH =
  "/fusion-access/storage-cluster/create";
export const FILE_SYSTEMS_HOME_URL_PATH = "/fusion-access/file-systems";
export const FILE_SYSTEMS_CREATE_URL_PATH =
  "/fusion-access/file-systems/create";
