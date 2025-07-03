import { useCallback } from "react";
import { k8sCreate, useK8sModel } from "@openshift-console/dynamic-plugin-sdk";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import type { Cluster } from "@/shared/types/ibm-spectrum-scale/Cluster";
import { STORAGE_ROLE_LABEL } from "@/constants";
import { useStore } from "@/shared/store/provider";
import type { State, Actions } from "@/shared/store/types";
import { useRedirectHandler } from "@/shared/hooks/useRedirectHandler";

const [storageRoleLabelKey, storageRoleLabelValue] =
  STORAGE_ROLE_LABEL.split("=");
const nodeSelector = { [storageRoleLabelKey]: storageRoleLabelValue };

export const useCreateStorageClusterHandler = () => {
  const [, dispatch] = useStore<State, Actions>();

  const { t } = useFusionAccessTranslations();

  const [storageScaleClusterModel] = useK8sModel({
    group: "scale.spectrum.ibm.com",
    version: "v1beta1",
    kind: "Cluster",
  });

  const redirectToFileSystemsHome = useRedirectHandler(
    "/fusion-access/file-systems"
  );

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
      redirectToFileSystemsHome();
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
  }, [dispatch, redirectToFileSystemsHome, storageScaleClusterModel, t]);
};
