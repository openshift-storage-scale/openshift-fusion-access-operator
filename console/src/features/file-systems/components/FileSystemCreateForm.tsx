import { useCallback, useEffect, useMemo } from "react";
import convert from "convert";
import {
  useFormContext,
  Stack,
  StackItem,
  Form,
  FormGroup,
  TextInput,
  FormHelperText,
  HelperText,
  HelperTextItem,
  EmptyState,
  Spinner,
} from "@patternfly/react-core";
import { ExclamationCircleIcon, FolderIcon } from "@patternfly/react-icons";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import { HelpLabelIcon } from "@/shared/components/HelpLabelIcon";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import { useStore } from "@/shared/store/provider";
import type { State, Actions } from "@/shared/store/types";
import type { DiscoveredDevice } from "@/shared/types/fusion-access/LocalVolumeDiscoveryResult";
import { useStorageClusterLvdrs } from "../hooks/useStorageClusterLvdrs";
import type { Lun } from "../types/Lun";
import { useCreateFileSystemHandler } from "../hooks/useCreateFileSystemHandler";

export const FileSystemCreateForm = () => {
  const [, dispatch] = useStore<State, Actions>();

  const form = useFormContext();

  const { t } = useFusionAccessTranslations();

  const fileSystemName = form.getValue("name");

  const fileSystemNameErrorMessage = form.getError("name");

  const [lvdrs, lvdrsLoaded, lvdrsLoadError] = useStorageClusterLvdrs();

  useEffect(() => {
    if (lvdrsLoadError) {
      dispatch({
        type: "showAlert",
        payload: {
          title: t("Failed to load LocaVolumeDiscoveryResults"),
          description: lvdrsLoadError.message,
          isDismissable: true,
          variant: "danger",
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lvdrsLoadError, t]);

  const selectedLuns = useSelectedLuns(form.getValue("selected-luns"));

  // we show only disks that are present in all nodes
  const discoveredDevices =
    lvdrs[0]?.status?.discoveredDevices?.filter(({ WWN }) =>
      lvdrs.every((r) =>
        r.status?.discoveredDevices?.some((d) => d.WWN === WWN)
      )
    ) ?? [];

  const selectedDevices = discoveredDevices.filter((d) =>
    selectedLuns.find((l) => l.id === getWwn(d))
  );

  const availableLuns = discoveredDevices.map((disk) => {
    const size = convert(disk.size, "B").to("GiB");
    const r = {
      name: disk.path,
      id: getWwn(disk),
      // Note: Usage of 'GB' is intentional here
      capacity: size.toFixed(2) + " GB",
    };

    return r;
  });

  const handleSelectLun = useCallback(
    (lun: Lun) =>
      (_event: React.FormEvent<HTMLInputElement>, isSelecting: boolean) => {
        const nextSelectedLuns = isSelecting
          ? selectedLuns.concat(lun)
          : selectedLuns.filter(({ id }) => id !== lun.id);
        form.setValue("selected-luns", JSON.stringify(nextSelectedLuns));
      },
    [selectedLuns, form]
  );

  const handleSelectAllLuns = useCallback(
    (_event: React.FormEvent<HTMLInputElement>, isSelecting: boolean) => {
      const nextSelectedLuns = isSelecting ? availableLuns : [];
      form.setValue("selected-luns", JSON.stringify(nextSelectedLuns));
    },
    [availableLuns, form]
  );

  useEffect(() => {
    if (!form.isTouched("name")) {
      return;
    }
    if (NAME_FIELD_VALIDATION_REGEX.test(fileSystemName)) {
      form.setError("name", undefined);
    } else {
      form.setError(
        "name",
        t("Must match the expression: {{NAME_FIELD_VALIDATION_REGEX}}", {
          NAME_FIELD_VALIDATION_REGEX,
        })
      );
    }
  }, [fileSystemName, form, t]);

  useEffect(() => {
    dispatch({
      type: "updateCtas",
      payload: {
        createFileSystem: {
          isDisabled:
            !form.isValid || !fileSystemName || selectedDevices.length === 0,
        },
      },
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.isValid, fileSystemName, selectedDevices.length]);

  const columns = useMemo(
    () =>
      ({
        NAME: t("Name"),
        ID: t("ID"),
        CAPACITY: t("Capacity"),
      }) as const,
    [t]
  );

  const handleCreateFileSystem = useCreateFileSystemHandler(
    fileSystemName,
    selectedDevices,
    lvdrs
  );

  return (
    <Stack hasGutter>
      <StackItem isFilled>
        <Form
          isWidthLimited
          id="file-system-create-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleCreateFileSystem();
          }}
        >
          <FormGroup isRequired label="Name" fieldId="name">
            <TextInput
              type="text"
              id="name"
              name="name"
              isRequired
              minLength={1}
              value={fileSystemName}
              placeholder="file-system-1"
              validated={fileSystemNameErrorMessage ? "error" : "default"}
              onChange={(_, newName) => {
                form.setValue("name", newName);
                form.setTouched("name", true);
              }}
            />
            {fileSystemNameErrorMessage ? (
              <FormHelperText>
                <HelperText>
                  <HelperTextItem
                    icon={<ExclamationCircleIcon />}
                    variant="error"
                  >
                    {fileSystemNameErrorMessage}
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            ) : null}
          </FormGroup>
          <FormGroup
            isRequired
            fieldId="luns-selection-table"
            label="Select LUNs"
            labelHelp={
              <HelpLabelIcon
                popoverContent={t(
                  "Select LUNs to designate the storage devices used in the file system."
                )}
              />
            }
          >
            {!lvdrsLoaded ? (
              <EmptyState
                titleText={t("Loading LUNs")}
                headingLevel="h4"
                icon={Spinner}
              />
            ) : availableLuns.length ? (
              <Table id="luns-selection-table" variant="compact">
                <Thead>
                  <Tr>
                    <Th
                      aria-label="Select all LUNs"
                      select={{
                        isSelected:
                          availableLuns.length === selectedLuns.length,
                        onSelect: handleSelectAllLuns,
                      }}
                    />
                    {Object.entries(columns).map(([name, value]) => (
                      <Th key={name}>{value}</Th>
                    ))}
                  </Tr>
                </Thead>
                <Tbody>
                  {availableLuns.map((lun, rowIndex) => (
                    <Tr key={lun.id}>
                      <Td
                        select={{
                          rowIndex,
                          isSelected: selectedLuns.some(
                            ({ id }) => id === lun.id
                          ),
                          onSelect: handleSelectLun(lun),
                        }}
                      />
                      <Td dataLabel={columns.NAME}>{lun.name}</Td>
                      <Td dataLabel={columns.ID}>{lun.id}</Td>
                      <Td dataLabel={columns.CAPACITY}>{lun.capacity}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            ) : (
              <EmptyState
                titleText={t("No available LUNs")}
                headingLevel="h4"
                icon={FolderIcon}
              ></EmptyState>
            )}
          </FormGroup>
        </Form>
      </StackItem>
    </Stack>
  );
};
FileSystemCreateForm.displayName = "FileSystemCreateForm";

const useSelectedLuns = (serializedLuns: string) =>
  useMemo(() => JSON.parse(serializedLuns || "[]") as Lun[], [serializedLuns]);

const getWwn = (device: DiscoveredDevice) => device.WWN.slice("uuid.".length);

const NAME_FIELD_VALIDATION_REGEX =
  /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/;
