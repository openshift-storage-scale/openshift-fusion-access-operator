import { Button, List, ListItem, Popover } from "@patternfly/react-core";

type FileSystemStatusProps = {
  title: string;
  description?: Partial<Record<"Success" | "Healthy", string>>;
  icon: React.ReactNode;
};

export const FileSystemStatus: React.FC<FileSystemStatusProps> = (props) => {
  const { title, description, icon } = props;

  if (description) {
    return (
      <Popover
        aria-label="Status popover"
        bodyContent={
          <List aria-label="Status data list">
            {Object.entries(description).map(([statusType, message]) => (
              <ListItem
                aria-labelledby={`${statusType}-message`}
                key={statusType}
              >
                <span id={`${statusType}-message`}>{message}</span>
              </ListItem>
            ))}
          </List>
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
FileSystemStatus.displayName = "FileSystemStatus";
