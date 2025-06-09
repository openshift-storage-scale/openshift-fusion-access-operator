import { type EncodedExtension } from "@openshift/dynamic-plugin-sdk-webpack";
import { type ConsolePluginBuildMetadata } from "@openshift-console/dynamic-plugin-sdk-webpack";
import packageJson from "../package.json";

export const pluginMetadata: ConsolePluginBuildMetadata = {
  name: packageJson.name,
  version: packageJson.version,
  displayName: "Fusion Access Plugin",
  exposedModules: {
    FusionAccessHomePage: "./features/fusion-access/pages/FusionAccessHomePage.tsx",
    StorageClusterHomePage:
      "./features/storage-clusters/pages/StorageClusterHomePage.tsx",
    StorageClusterCreatePage:
      "./features/storage-clusters/pages/StorageClusterCreatePage.tsx",
    FileSystemsHomePage: "./features/file-systems/pages/FileSystemsHomePage.tsx",
    FileSystemsCreatePage: "./features/file-systems/pages/FileSystemsCreatePage.tsx",
  },
  dependencies: {
    "@console/pluginAPI": ">=4.18.0-0",
  },
};

export const extensions: EncodedExtension[] = [
  {
    type: "console.navigation/href",
    properties: {
      id: "main",
      name: `%plugin__${packageJson.name}~Fusion Access for SAN%`,
      href: "/fusion-access",
      perspective: "admin",
      section: "storage",
      insertBefore: "persistentvolumes",
    },
  },
  {
    type: "console.page/route",
    properties: {
      exact: true,
      path: "/fusion-access",
      component: { $codeRef: "FusionAccessHomePage" },
    },
  },
  {
    type: "console.page/route",
    properties: {
      exact: true,
      path: "/fusion-access/storage-cluster",
      component: { $codeRef: "StorageClusterHomePage" },
    },
  },
  {
    type: "console.page/route",
    properties: {
      exact: true,
      path: "/fusion-access/storage-cluster/create",
      component: { $codeRef: "StorageClusterCreatePage" },
    },
  },
  {
    type: "console.page/route",
    properties: {
      exact: true,
      path: "/fusion-access/file-systems",
      component: { $codeRef: "FileSystemsHomePage" },
    },
  },
  {
    type: "console.page/route",
    properties: {
      exact: true,
      path: "/fusion-access/file-systems/create",
      component: { $codeRef: "FileSystemsCreatePage" },
    },
  },
];
