import { Helmet } from "react-helmet";
import {
  ListPageBody,
  ListPageHeader,
} from "@openshift-console/dynamic-plugin-sdk";
import { Stack, StackItem } from "@patternfly/react-core";
import { useLayoutEffect } from "react";
import type { State } from "../store/types";
import { ListPageAlert } from "./ListPageAlert";

interface ListPageProps {
  documentTitle: string;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  alerts?: State["alerts"];
  listPageBodyStyle?: Partial<UseListPageBodyStyleHackOptions>;
  footer?: React.ReactNode;
}

export const ListPage: React.FC<ListPageProps> = (props) => {
  const {
    actions,
    alerts = [],
    children,
    description = <br />,
    documentTitle,
    listPageBodyStyle = {},
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
            <ListPageAlert alert={alerts[0]} />
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
