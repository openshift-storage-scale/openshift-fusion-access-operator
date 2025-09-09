import { useMemo, useCallback, useEffect } from "react";
import { useFormContext } from "@patternfly/react-core";
import type { ThProps } from "@patternfly/react-table/dist/esm/components/Table/Th.d.ts";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import { useStore } from "@/shared/store/provider";
import type { State, Actions } from "@/shared/store/types";
import { useCreateFileSystemHandler } from "./useCreateFileSystemHandler";
import { useLunsViewModel, type Lun } from "./useLunsViewModel";

type OnSelect = NonNullable<NonNullable<ThProps["select"]>["onSelect"]>;

const NAME_FIELD_MAX_LENGTH = 128;
const NAME_FIELD_VALIDATION_REGEX =
  /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/;

export const useFileSystemCreateFormViewModel = () => {
  const { t } = useFusionAccessTranslations();

  const columns = useMemo(
    () =>
      ({
        PATH: t("Path"),
        WWN: t("WWN"),
        CAPACITY: t("Capacity"),
      }) as const,
    [t]
  );

  const [, dispatch] = useStore<State, Actions>();

  const luns = useLunsViewModel();

  const form = useFormContext();

  const fileSystemName = form.getValue("name");

  const fileSystemNameErrorMessage = form.getError("name");

  const handleFileSystemNameChange = useCallback(
    (_, newName) => {
      form.setValue("name", newName);
      form.setTouched("name", true);
    },
    [form]
  );

  const handleSelectLun = useCallback<(lun: Lun) => OnSelect>(
    (lun) => (_, isSelecting) => {
      luns.setSelected(lun, isSelecting);
    },
    [luns]
  );

  const handleSelectAllLuns = useCallback<OnSelect>(
    (_, isSelecting) => {
      luns.setAllSelected(isSelecting);
    },
    [luns]
  );

  const handleCreateFileSystem = useCreateFileSystemHandler(
    fileSystemName,
    luns
  );

  const handleSubmitForm = useCallback(
    (e) => {
      e.preventDefault();
      handleCreateFileSystem();
    },
    [handleCreateFileSystem]
  );

  useEffect(() => {
    if (!form.isTouched("name")) {
      return;
    }

    switch (true) {
      case fileSystemName.length > NAME_FIELD_MAX_LENGTH:
        form.setError(
          "name",
          t("Must contain at most {{NAME_FIELD_MAX_LENGTH}} characters", {
            NAME_FIELD_MAX_LENGTH,
          })
        );   
        break;
      case !NAME_FIELD_VALIDATION_REGEX.test(fileSystemName):
        form.setError(
          "name",
          t("Must match the expression: {{NAME_FIELD_VALIDATION_REGEX}}", {
            NAME_FIELD_VALIDATION_REGEX,
          })
        );
        break;      
      default:
        form.setError("name", undefined);
    }
  }, [fileSystemName, form, t]);

  useEffect(() => {
    dispatch({
      type: "global/updateCta",
      payload: {
        isDisabled:
          !form.isValid ||
          !fileSystemName ||
          luns.data.every((l) => !l.isSelected),
      },
    });
  }, [form.isValid, fileSystemName, luns.data, dispatch]);

  return useMemo(
    () =>
      ({
        columns,
        fileSystemName,
        fileSystemNameMaxLength: NAME_FIELD_MAX_LENGTH,
        fileSystemNameErrorMessage,
        luns,
        handleSelectLun,
        handleSelectAllLuns,
        handleFileSystemNameChange,
        handleSubmitForm,
      }) as const,
    [
      columns,
      fileSystemName,
      fileSystemNameErrorMessage,
      luns,
      handleSelectLun,
      handleSelectAllLuns,
      handleFileSystemNameChange,
      handleSubmitForm,
    ]
  );
};

export type FileSystemCreateFormViewModel = ReturnType<
  typeof useFileSystemCreateFormViewModel
>;
