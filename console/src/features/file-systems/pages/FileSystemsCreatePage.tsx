import { StoreProvider, useStore } from "@/shared/store/provider";
import { reducer, initialState } from "@/shared/store/reducer";
import { FileSystemsCreateButton } from "@/features/file-systems/components/FileSystemsCreateButton";
import { useCreateFileSystemHandler } from "@/features/file-systems/hooks/useCreateFileSystemHandler";
import { ListPage } from "@/shared/components/ListPage";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import {
  EmptyState,
  EmptyStateHeader,
  EmptyStateIcon,
  Form,
  FormContextProvider,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Spinner,
  Stack,
  StackItem,
  TextInput,
  useFormContext,
} from "@patternfly/react-core";
import { useCallback, useMemo, useEffect } from "react";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import { useWatchLocalVolumeDiscoveryResult } from "@/shared/hooks/useWatchLocalVolumeDiscoveryResult";
import { useWatchNode } from "@/shared/hooks/useWatchNode";
import { STORAGE_ROLE_LABEL, WORKER_NODE_ROLE_LABEL } from "@/constants";
import convert from "convert";
import { ExclamationCircleIcon, FolderIcon } from "@patternfly/react-icons";
import type {
  DiscoveredDevice,
  LocalVolumeDiscoveryResult,
} from "@/shared/types/fusion-access/LocalVolumeDiscoveryResult";
import type { State, Actions } from "@/shared/store/types";
import { HelpLabelIcon } from "@/shared/components/HelpLabelIcon";

const getWwn = (device: DiscoveredDevice) => device.WWN.slice("uuid.".length);

const NAME_FIELD_VALIDATION_REGEX =
  /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/;

const FileSystemsCreate: React.FC = () => {
  return (
    <StoreProvider<State, Actions>
      reducer={reducer}
      initialState={initialState}
    >
      <FormContextProvider>
        <ConnectedCreateFileSystems />
      </FormContextProvider>
    </StoreProvider>
  );
};
FileSystemsCreate.displayName = "FileSystemsCreate";
export default FileSystemsCreate;

const ConnectedCreateFileSystems: React.FC = () => {
  const [store, dispatch] = useStore<State, Actions>();
  const { t } = useFusionAccessTranslations();

  return (
    <ListPage
      documentTitle={t("Create file system")}
      title={t("Create file system")}
      description={t(
        "Create a file system to represent your required storage (based on the selected nodes’ storage)."
      )}
      alert={store.alert}
      onDismissAlert={() => dispatch({ type: "dismissAlert" })}
    >
      <FileSystemCreateForm />
    </ListPage>
  );
};
ConnectedCreateFileSystems.displayName = "ConnectedCreateFileSystems";

interface Lun {
  name: string;
  id: string;
  capacity: string;
}

const FileSystemCreateForm = () => {
  const [store] = useStore<State, Actions>();
  const {
    getValue,
    setValue,
    getError,
    setError,
    errors,
    isTouched,
    setTouched,
  } = useFormContext();
  const { t } = useFusionAccessTranslations();
  const fileSystemName = getValue("name");
  const fileSystemNameErrorMessage = getError("name");
  const [discoveryResultsForStorageNodes, loaded] =
    useDisksDiscoveryResultsForStorageNodes();

  const selectedLuns = useSelectedLuns(getValue("selected-luns"));

  // we show only disks that are present in all nodes
  const discoveredDevices =
    discoveryResultsForStorageNodes[0]?.status?.discoveredDevices?.filter(
      ({ WWN }) =>
        discoveryResultsForStorageNodes.every((r) =>
          r.status?.discoveredDevices?.some((d) => d.WWN === WWN)
        )
    ) || [];

  const selectedDevices = discoveredDevices.filter((d) =>
    selectedLuns.find((l) => l.id === getWwn(d))
  );
  const handleCreateFileSystem = useCreateFileSystemHandler(
    fileSystemName,
    discoveryResultsForStorageNodes,
    selectedDevices
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
        setValue("selected-luns", JSON.stringify(nextSelectedLuns));
      },
    [selectedLuns, setValue]
  );

  const handleSelectAllLuns = useCallback(
    (_event: React.FormEvent<HTMLInputElement>, isSelecting: boolean) => {
      const nextSelectedLuns = isSelecting ? availableLuns : [];
      setValue("selected-luns", JSON.stringify(nextSelectedLuns));
    },
    [availableLuns, setValue]
  );

  useEffect(() => {
    if (!isTouched("name")) {
      return;
    }
    if (NAME_FIELD_VALIDATION_REGEX.test(fileSystemName)) {
      setError("name", undefined);
    } else {
      setError(
        "name",
        t("Must match the expression: {{NAME_FIELD_VALIDATION_REGEX}}", {
          NAME_FIELD_VALIDATION_REGEX,
        })
      );
    }
  }, [fileSystemName, setError, isTouched, t]);

  const columns = useColumns();

  return (
    <Stack hasGutter>
      <StackItem>
        <Form
          isWidthLimited
          id="file-system-create-form"
          onSubmit={(e) => {
            e.preventDefault();
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
                setValue("name", newName);
                setTouched("name", true);
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
            labelIcon={
              <HelpLabelIcon
                popoverContent={t(
                  "Select LUNs to designate the storage devices used in the file system."
                )}
              />
            }
          >
            {!loaded ? (
              <EmptyState>
                <EmptyStateHeader
                  titleText={t("Loading LUNs")}
                  headingLevel="h4"
                  icon={<EmptyStateIcon icon={Spinner} />}
                />
              </EmptyState>
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
              <EmptyState>
                <EmptyStateHeader
                  titleText={t("No available LUNs")}
                  headingLevel="h4"
                  icon={<EmptyStateIcon icon={FolderIcon} />}
                />
              </EmptyState>
            )}
          </FormGroup>
        </Form>
      </StackItem>
      <StackItem>
        <FileSystemsCreateButton
          key="create-filesystem"
          type="submit"
          form="file-system-create-form"
          isDisabled={
            !!Object.keys(errors).length ||
            !fileSystemName ||
            !selectedDevices.length
          }
          isLoading={store.ctas.createFileSystem.isLoading}
          onCreateFileSystem={handleCreateFileSystem}
        />
      </StackItem>
    </Stack>
  );
};
FileSystemCreateForm.displayName = "FileSystemCreateForm";

const useDisksDiscoveryResultsForStorageNodes = (): [
  LocalVolumeDiscoveryResult[],
  boolean,
] => {
  const [disksDiscoveryResults, lvLoaded] = useWatchLocalVolumeDiscoveryResult({
    isList: true,
  });

  const [selectedNodes, nodesLoaded] = useWatchNode({
    isList: true,
    withLabels: [WORKER_NODE_ROLE_LABEL, STORAGE_ROLE_LABEL],
  });

  const results = useMemo(
    () =>
      disksDiscoveryResults.filter((result) =>
        selectedNodes.find(
          (node) => node.metadata?.name === result.spec.nodeName
        )
      ),
    [disksDiscoveryResults, selectedNodes]
  );

  return [results, lvLoaded && nodesLoaded];
};

const useSelectedLuns = (serializedLuns: string) =>
  useMemo(() => JSON.parse(serializedLuns || "[]") as Lun[], [serializedLuns]);

const useColumns = () => {
  const { t } = useFusionAccessTranslations();
  return useMemo(
    () =>
      ({
        NAME: t("Name"),
        ID: t("ID"),
        CAPACITY: t("Capacity"),
      }) as const,
    [t]
  );
};
