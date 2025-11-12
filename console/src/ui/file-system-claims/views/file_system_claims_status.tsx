import { ResourceLink } from "@openshift-console/dynamic-plugin-sdk";
import { Button, Popover } from "@patternfly/react-core";
import { Trans } from "react-i18next";
import { FS_ALLOW_DELETE_LABEL, SPECTRUM_SCALE_NAMESPACE } from "@/constants";
import { groupVersionKind } from "@/data/models/file_system_gvk";

type FileSystemStatusProps = {
  title: string;
  message: string;
  icon: React.ReactNode;
  fileSystemName: string;
};

export const FileSystemsStatus: React.FC<FileSystemStatusProps> = (props) => {
  const { title, message, icon, fileSystemName } = props;

  if (title && message && icon) {
    return (
      <Popover
        bodyContent={
          message.startsWith("<bold>WARNING:</bold>") ? (
            <Trans
              defaults={message}
              values={{ label: FS_ALLOW_DELETE_LABEL, fileSystemName }}
              components={{
                bold: <strong />,
                label: <strong />,
                FileSystemNameLink: <FileSystemNameLink />,
              }}
            />
          ) : (
            <span>{message}</span>
          )
        }
      >
        <Button variant="link" isInline icon={icon}>
          {title}
        </Button>
      </Popover>
    );
  }

  return (
    <>
      {icon} {title}
    </>
  );
};
FileSystemsStatus.displayName = "FileSystemsStatus";

const FileSystemNameLink: React.FC<React.PropsWithChildren<{}>> = (props) => {
  return (
    <ResourceLink
      key="fs-link"
      groupVersionKind={groupVersionKind}
      name={props.children as string}
      namespace={SPECTRUM_SCALE_NAMESPACE}
      hideIcon
      className="pf-v6-u-display-inline-grid"
    />
  );
};
FileSystemNameLink.displayName = "FileSystemNameLink";
