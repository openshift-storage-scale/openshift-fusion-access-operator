import { useCallback } from "react";
import { k8sCreate, useK8sModel } from "@openshift-console/dynamic-plugin-sdk";
import { useFusionAccessTranslations } from "@/hooks/useFusionAccessTranslations";
import type { Cluster } from "@/models/ibm-spectrum-scale/Cluster";
import { STORAGE_ROLE_LABEL } from "@/constants";
import { useStoreContext } from "@/contexts/store/provider";
import { getDigest } from "@/utils/crypto/hash";
import { useHistory } from "react-router";
import type { State, Actions } from "@/contexts/store/types";

const [storageRoleLabelKey, storageRoleLabelValue] =
  STORAGE_ROLE_LABEL.split("=");
const nodeSelector = { [storageRoleLabelKey]: storageRoleLabelValue };

export const useCreateStorageClusterHandler = () => {
  const [, dispatch] = useStoreContext<State, Actions>();
  const { t } = useFusionAccessTranslations();
  const history = useHistory();

  const [storageScaleClusterModel] = useK8sModel({
    group: "scale.spectrum.ibm.com",
    version: "v1beta1",
    kind: "Cluster",
  });

  return useCallback(async () => {
    try {
      dispatch({
        type: "updateCtas",
        payload: { createStorageCluster: { isLoading: true } },
      });
      await k8sCreate<Cluster>({
        model: storageScaleClusterModel,
        data: {
          apiVersion: "scale.spectrum.ibm.com/v1beta1",
          kind: "Cluster",
          metadata: { name: "ibm-spectrum-scale" },
          spec: {
            license: { accept: true, license: "data-management" },
            pmcollector: {
              nodeSelector,
            },
            daemon: {
              nodeSelector,
            },
          },
        },
      });
      history.push("/fusion-access/file-systems");
    } catch (e) {
      const description = e instanceof Error ? e.message : (e as string);
      const descriptionDigest = await getDigest(description);
      dispatch({
        type: "addAlert",
        payload: {
          key: descriptionDigest,
          variant: "danger",
          title: t("An error occurred while creating resources"),
          description,
          isDismissable: true,
        },
      });
    }
    dispatch({
      type: "updateCtas",
      payload: { createStorageCluster: { isLoading: false } },
    });
  }, [dispatch, history, storageScaleClusterModel, t]);
};
