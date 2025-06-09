import { Helmet } from "react-helmet";
import {
  ListPageBody,
  ListPageHeader,
} from "@openshift-console/dynamic-plugin-sdk";
import {
  AlertGroup,
  Alert,
  AlertActionCloseButton,
  Stack,
  StackItem,
  List,
  ListItem,
} from "@patternfly/react-core";
import type { AlertSlice } from "@/contexts/store/types";
import { useLayoutEffect } from "react";

interface ListPageProps {
  documentTitle: string;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  alert?: AlertSlice;
  onDismissAlert?: (alert: AlertSlice) => void;
  listPageBodyStyle?: Partial<UseListPageBodyStyleHackOptions>;
  footer?: React.ReactNode;
}

export const ListPage: React.FC<ListPageProps> = (props) => {
  const {
    actions,
    alert,
    children,
    description = <br />,
    documentTitle,
    listPageBodyStyle = {},
    onDismissAlert,
    title,
    footer,
  } = props;

  useListPageBodyStyleHack(listPageBodyStyle);

  return (
    <>
      <Helmet>
        <title data-testid="document-title">{documentTitle}</title>
      </Helmet>

      <ListPageHeader title={title} helpText={description}>
        {actions}
      </ListPageHeader>

      <ListPageBody>
        <Stack hasGutter>
          <StackItem>{children}</StackItem>
          <StackItem isFilled style={{ alignContent: "flex-end" }}>
            {alert && (
              <AlertGroup isLiveRegion>
                <Alert
                  isInline
                  key={alert.key}
                  variant={alert.variant}
                  title={alert.title}
                  actionClose={
                    alert.isDismissable ? (
                      <AlertActionCloseButton
                        title={alert.title as string}
                        variantLabel={alert.variant}
                        onClose={() => {
                          onDismissAlert?.(alert);
                        }}
                      />
                    ) : null
                  }
                >
                  {alert.description &&
                  typeof alert.description !== "string" ? (
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
            )}
          </StackItem>
          <StackItem>{footer}</StackItem>
        </Stack>
      </ListPageBody>
    </>
  );
};
ListPage.displayName = "ListPage";

interface UseListPageBodyStyleHackOptions {
  isFlex: boolean;
  isFilled: boolean;
  direction: "column" | "row";
  alignment: "start" | "end" | "center" | "space-between" | "space-around";
  justification: "start" | "end" | "center" | "space-between" | "space-around";
}

const LIST_PAGE_BODY_DEFAULT_CLASSES =
  "co-m-pane__body co-m-pane__body--no-top-margin";
const LIST_PAGE_BODY_SELECTOR = "#content-scrollable > .co-m-pane__body";

const useListPageBodyStyleHack = (
  options: Partial<UseListPageBodyStyleHackOptions>
) => {
  const {
    isFlex = true,
    isFilled = true,
    direction = "column",
    alignment,
    justification,
  } = options;

  useLayoutEffect(() => {
    const ref = document.querySelector<HTMLDivElement>(LIST_PAGE_BODY_SELECTOR);

    if (ref) {
      // reset classes first
      ref.className = LIST_PAGE_BODY_DEFAULT_CLASSES;

      // then set new classes
      const classes = [
        isFlex ? "pf-v6-u-display-flex" : "",
        isFilled ? "pf-v6-u-flex-grow-1" : "",
        direction ? `pf-v6-u-flex-direction-${direction}` : "",
        alignment ? `pf-v6-u-align-items-${alignment}` : "",
        justification ? `pf-v6-u-justify-content-${justification}` : "",
      ].filter(Boolean);
      ref.classList.add(...classes);
    }
  }, [isFlex, isFilled, direction, alignment, justification]);
};
