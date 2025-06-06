import type { FilesystemStatus } from "@/utils/status/filesystem";
import { Button, Popover } from "@patternfly/react-core";

type FileSystemStatusProps = {
  status: FilesystemStatus;
};

const FileSystemStatus: React.FC<FileSystemStatusProps> = ({ status }) => {
  if (status.description) {
    return (
      <Popover
        aria-label="Status popover"
        bodyContent={<div>{status.description}</div>}
      >
        <Button variant="link" isInline icon={status.icon}>
          {status.title}
        </Button>
      </Popover>
    );
  }
  return (
    <>
      {status.icon} {status.title}
    </>
  );
};

export default FileSystemStatus;
