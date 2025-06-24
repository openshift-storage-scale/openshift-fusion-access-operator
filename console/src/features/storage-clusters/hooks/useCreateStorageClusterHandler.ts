import { useCallback } from "react";
import { k8sCreate, useK8sModel } from "@openshift-console/dynamic-plugin-sdk";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import type { Cluster } from "@/shared/types/ibm-spectrum-scale/Cluster";
import { FILE_SYSTEMS_HOME_URL_PATH, STORAGE_ROLE_LABEL } from "@/constants";
import { useStore } from "@/shared/store/provider";
import { useHistory } from "react-router";
import type { State, Actions } from "@/shared/store/types";

const [storageRoleLabelKey, storageRoleLabelValue] =
  STORAGE_ROLE_LABEL.split("=");
const nodeSelector = { [storageRoleLabelKey]: storageRoleLabelValue };

export const useCreateStorageClusterHandler = () => {
  const [, dispatch] = useStore<State, Actions>();
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
        type: "global/updateCta",
        payload: { isLoading: true },
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
      history.push(FILE_SYSTEMS_HOME_URL_PATH);
    } catch (e) {
      const description = e instanceof Error ? e.message : (e as string);
      dispatch({
        type: "global/showAlert",
        payload: {
          variant: "danger",
          title: t("An error occurred while creating resources"),
          description,
          isDismissable: true,
        },
      });
    }
    dispatch({
      type: "global/updateCta",
      payload: { isLoading: false },
    });
  }, [dispatch, history, storageScaleClusterModel, t]);
};
