import { Button, Popover } from "@patternfly/react-core";

type FileSystemStatusProps = {
  title: string;
  description?: string;
  icon: React.ReactNode;
};

export const FileSystemStatus: React.FC<FileSystemStatusProps> = (props) => {
  const { title, description, icon } = props;

  if (description) {
    return (
      <Popover
        aria-label="Status popover"
        bodyContent={<div>{description}</div>}
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
FileSystemStatus.displayName = "FileSystemStatus";
