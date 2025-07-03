import type { AlertProps } from "@patternfly/react-core/dist/esm/components/Alert/Alert";
import {
  AlertGroup,
  Alert,
  AlertActionCloseButton,
  List,
  ListItem,
} from "@patternfly/react-core";

export interface Alert extends Pick<AlertProps, "key" | "variant" | "title"> {
  description?: string | string[];
  dismiss?: VoidFunction;
}

type ListPageAlertProps = { alert?: Alert };

export const ListPageAlert: React.FC<ListPageAlertProps> = (props) => {
  const { alert } = props;

  return alert ? (
    <AlertGroup isLiveRegion>
      <Alert
        isInline
        key={alert.key}
        variant={alert.variant}
        title={alert.title}
        actionClose={
          alert.dismiss ? (
            <AlertActionCloseButton
              title={alert.title as string}
              variantLabel={alert.variant}
              onClose={alert.dismiss}
            />
          ) : null
        }
      >
        {alert.description && typeof alert.description !== "string" ? (
          <List>
            {alert.description.map((desc, idx) => (
              <ListItem key={idx}>{desc}</ListItem>
            ))}
          </List>
        ) : (
          alert.description
        )}
      </Alert>
    </AlertGroup>
  ) : null;
};
ListPageAlert.displayName = "ListPageAlert";
