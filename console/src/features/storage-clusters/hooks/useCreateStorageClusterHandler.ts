import { k8sCreate, useK8sModel } from "@openshift-console/dynamic-plugin-sdk";
import { useCallback } from "react";
import { STORAGE_ROLE_LABEL } from "@/constants";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import { useRedirectHandler } from "@/shared/hooks/useRedirectHandler";
import { useStore } from "@/shared/store/provider";
import type { Actions, State } from "@/shared/store/types";
import type { Cluster } from "@/shared/types/scale-spectrum-ibm-com/v1beta1/Cluster";

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

  const redirectToFileSystemClaimsHome = useRedirectHandler(
    "/fusion-access/file-system-claims",
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
      redirectToFileSystemClaimsHome();
    } catch (e) {
      const description = e instanceof Error ? e.message : (e as string);
      dispatch({
        type: "global/addAlert",
        payload: {
          title: t("An error occurred while creating resources"),
          description,
          variant: "danger",
        },
      });
    }
    dispatch({
      type: "global/updateCta",
      payload: { isLoading: false },
    });
  }, [dispatch, redirectToFileSystemClaimsHome, storageScaleClusterModel, t]);
};
