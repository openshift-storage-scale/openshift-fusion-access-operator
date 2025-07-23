// Jest setup file for console tests
import '@testing-library/jest-dom';

// Mock the dynamic plugin SDK module
jest.mock("@openshift-console/dynamic-plugin-sdk", () => ({
  k8sGet: jest.fn(),
  k8sCreate: jest.fn(),
  k8sUpdate: jest.fn(),
  k8sDelete: jest.fn(),
  k8sPatch: jest.fn(),
  useK8sModel: jest.fn(),
  useK8sWatchResource: jest.fn(),
}));

// Setup global test environment
global.console = {
  ...console,
  // Suppress console.warn and console.error during tests unless specifically testing them
  warn: jest.fn(),
  error: jest.fn(),
};
