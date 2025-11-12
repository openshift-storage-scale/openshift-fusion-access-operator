import { type EncodedExtension } from "@openshift/dynamic-plugin-sdk-webpack";
import { type ConsolePluginBuildMetadata } from "@openshift-console/dynamic-plugin-sdk-webpack";
import pkg from "../package.json" with { type: "json" };

export const pluginMetadata: ConsolePluginBuildMetadata = {
  name: pkg.name,
  version: pkg.version,
  displayName: "Fusion Access Plugin",
  exposedModules: {
    FusionAccessHomeScreen:
      "./ui/fusion-access/views/fusion_access_home_screen.tsx",
    StorageClusterHomePage:
      "./features/storage-clusters/pages/StorageClusterHomePage.tsx",
    StorageClusterCreatePage:
      "./features/storage-clusters/pages/StorageClusterCreatePage.tsx",
    FileSystemClaimsHomeScreen:
      "./ui/file-system-claims/views/file_system_claims_home_screen.tsx",
    FileSystemClaimsCreateScreen:
      "./ui/file-system-claims/views/file_system_claims_create_screen.tsx",
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
      name: `%plugin__${pkg.name}~Fusion Access for SAN%`,
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
      component: { $codeRef: "FusionAccessHomeScreen" },
    },
  },
  {
    type: "console.page/route",
    properties: {
      exact: true,
      path: "/fusion-access/storage-cluster/*",
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
      path: "/fusion-access/file-system-claims/*",
      component: { $codeRef: "FileSystemClaimsHomeScreen" },
    },
  },
  {
    type: "console.page/route",
    properties: {
      exact: true,
      path: "/fusion-access/file-system-claims/create",
      component: { $codeRef: "FileSystemClaimsCreateScreen" },
    },
  },
];
