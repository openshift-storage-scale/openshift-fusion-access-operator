import { useMemo } from "react";
import {
  HorizontalNav,
  type NavPage,
} from "@openshift-console/dynamic-plugin-sdk";
import { useFusionAccessTranslations } from "@/shared/hooks/useFusionAccessTranslations";
import { FileSystemsTab } from "./FileSystemsTab";

export const FileSystemsTabbedNav: React.FC = () => {
  const { t } = useFusionAccessTranslations();

  const pages: NavPage[] = useMemo(
    () => [
      {
        name: t("File systems"),
        href: "",
        component: FileSystemsTab,
      },
    ],
    [t]
  );

  return <HorizontalNav pages={pages} />;
};
FileSystemsTabbedNav.displayName = "FileSystemsTabbedNav";
