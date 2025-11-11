import {
  type K8sModel,
  k8sCreate,
  useK8sModel,
} from "@openshift-console/dynamic-plugin-sdk";
import { useCallback } from "react";
import { SPECTRUM_SCALE_NAMESPACE } from "@/constants";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import { useRedirectHandler } from "@/shared/hooks/useRedirectHandler";
import { useStore } from "@/shared/store/provider";
import type { Actions, State } from "@/shared/store/types";
import type { FileSystemClaim } from "@/shared/types/fusion-storage-openshift-io/v1alpha1/FileSystemClaim";
import type { LunsViewModel } from "./useLunsViewModel";

export const useCreateFileSystemHandler = (
  fileSystemName: string,
  luns: LunsViewModel,
) => {
  const [, dispatch] = useStore<State, Actions>();

  const { t } = useFusionAccessTranslations();

  const redirectToFileSystemsHome = useRedirectHandler(
    "/fusion-access/file-systems",
  );

  const [fileSystemClaimModel] = useK8sModel({
    group: "fusion.storage.openshift.io",
    version: "v1alpha1",
    kind: "FileSystemClaim",
  });

  return useCallback(async () => {
    try {
      dispatch({
        type: "global/updateCta",
        payload: { isLoading: true },
      });

      await createFileSystemClaim(
        fileSystemClaimModel,
        fileSystemName,
        luns.data.map((l) => l.path),
        SPECTRUM_SCALE_NAMESPACE,
      );

      redirectToFileSystemsHome();
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
    } finally {
      dispatch({
        type: "global/updateCta",
        payload: { isLoading: false },
      });
    }
  }, [
    dispatch,
    fileSystemClaimModel,
    fileSystemName,
    luns,
    redirectToFileSystemsHome,
    t,
  ]);
};

function createFileSystemClaim(
  model: K8sModel,
  fileSystemName: string,
  devices: string[],
  namespace?: string,
): Promise<FileSystemClaim> {
  return k8sCreate<FileSystemClaim>({
    model,
    data: {
      apiVersion: "fusion.storage.openshift.io/v1alpha1",
      kind: "FileSystemClaim",
      metadata: { name: fileSystemName, namespace },
      spec: {
        devices,
      },
    },
  });
}
