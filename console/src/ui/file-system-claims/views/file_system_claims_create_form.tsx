import {
  EmptyState,
  Form,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Spinner,
  Stack,
  StackItem,
  TextInput,
} from "@patternfly/react-core";
import { ExclamationCircleIcon, FolderIcon } from "@patternfly/react-icons";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import { HelpLabelIcon } from "@/shared/components/HelpLabelIcon";
import { useLocalizationService } from "@/ui/services/use_localization_service";
import { useFileSystemClaimsCreateFormViewModel } from "../view-models/use_file_system_claims_create_form_view_model";

export const FileSystemClaimsCreateForm: React.FC<{ formId: string }> = ({
  formId,
}) => {
  const vm = useFileSystemClaimsCreateFormViewModel();
  const { t } = useLocalizationService();

  return (
    <Stack hasGutter>
      <StackItem isFilled>
        <Form isWidthLimited id={formId} onSubmit={vm.handleSubmitForm}>
          <FormGroup
            isRequired
            label={t("File system claim name")}
            fieldId="name"
          >
            <TextInput
              type="text"
              id="name"
              name="name"
              isRequired
              maxLength={vm.fileSystemNameMaxLength}
              value={vm.fileSystemName}
              placeholder="file-system-1"
              validated={vm.fileSystemNameErrorMessage ? "error" : "default"}
              onChange={vm.handleFileSystemNameChange}
            />
            {vm.fileSystemNameErrorMessage ? (
              <FormHelperText>
                <HelperText>
                  <HelperTextItem
                    icon={<ExclamationCircleIcon />}
                    variant="error"
                  >
                    {vm.fileSystemNameErrorMessage}
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
                  "Select LUNs to designate the storage devices used in the file system.",
                )}
              />
            }
          >
            {!vm.luns.loaded ? (
              <EmptyState
                titleText={t("Loading LUNs")}
                headingLevel="h4"
                icon={Spinner}
              />
            ) : vm.luns.data.length ? (
              <Table id="luns-selection-table" variant="compact">
                <Thead>
                  <Tr>
                    <Th
                      aria-label="Select all LUNs"
                      select={{
                        isSelected: vm.luns.data.every((l) => l.isSelected),
                        onSelect: vm.handleSelectAllLuns,
                      }}
                    />
                    {Object.entries(vm.columns).map(([name, value]) => (
                      <Th key={name}>{value}</Th>
                    ))}
                  </Tr>
                </Thead>
                <Tbody>
                  {vm.luns.data.map((lun, rowIndex) => (
                    <Tr key={lun.path}>
                      <Td
                        select={{
                          rowIndex,
                          isSelected: vm.luns.isSelected(lun),
                          onSelect: vm.handleSelectLun(lun),
                        }}
                      />
                      <Td dataLabel={vm.columns.PATH}>{lun.path}</Td>
                      <Td dataLabel={vm.columns.WWN}>{lun.wwn}</Td>
                      <Td dataLabel={vm.columns.CAPACITY}>{lun.capacity}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            ) : (
              <EmptyState
                titleText={t("No LUNs available")}
                headingLevel="h4"
                icon={FolderIcon}
              />
            )}
          </FormGroup>
        </Form>
      </StackItem>
    </Stack>
  );
};
FileSystemClaimsCreateForm.displayName = "FileSystemClaimsCreateForm";
