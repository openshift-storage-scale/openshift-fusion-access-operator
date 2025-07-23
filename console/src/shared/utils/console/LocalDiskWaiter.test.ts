/**
 * Unit tests for waitForLocalDiskUsedConditionFalse function
 *
 * To run these tests, you need to install Jest dependencies:
 * npm install --save-dev jest @types/jest ts-jest @testing-library/jest-dom
 *
 * Then run: npm test
 */

import { k8sGet } from "@openshift-console/dynamic-plugin-sdk";
import type { LocalDisk } from "@/shared/types/ibm-spectrum-scale/LocalDisk";
import {
  waitForLocalDiskUsedConditionFalse,
  type LocalDiskConditionError,
} from "./LocalDiskWaiter";

// Jest types are provided by @types/jest package

// Mock the k8sGet function
jest.mock("@openshift-console/dynamic-plugin-sdk", () => ({
  k8sGet: jest.fn(),
  useK8sModel: jest.fn(),
}));

const mockK8sGet = k8sGet as any; // Jest mocked function

describe("waitForLocalDiskUsedConditionFalse", () => {
  const mockModel = {
    kind: "LocalDisk",
    apiVersion: "scale.spectrum.ibm.com/v1beta1",
  } as any;

  const testOptions = {
    name: "test-disk",
    namespace: "test-namespace",
    model: mockModel,
    timeoutMs: 10000, // 10 seconds for faster tests
    initialDelayMs: 100, // 100ms for faster tests
    maxDelayMs: 1000, // 1 second max delay
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2023-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("Scenario 1: LocalDisk reaches target state before timeout", () => {
    it("should resolve immediately when Used condition is False", async () => {
      const mockLocalDisk: LocalDisk = {
        metadata: { name: "test-disk", namespace: "test-namespace" },
        status: {
          conditions: [
            {
              type: "Used",
              status: "False",
              lastTransitionTime: "2023-01-01T00:00:00Z",
              message: "LocalDisk is not in use",
              reason: "NotUsed",
            },
          ],
        },
      } as any;

      mockK8sGet.mockResolvedValue(mockLocalDisk);

      const promise = waitForLocalDiskUsedConditionFalse(testOptions);

      // Fast-forward initial check
      await jest.runOnlyPendingTimersAsync();

      await expect(promise).resolves.toBeUndefined();
      expect(mockK8sGet).toHaveBeenCalledTimes(1);
      expect(mockK8sGet).toHaveBeenCalledWith({
        model: mockModel,
        name: "test-disk",
        ns: "test-namespace",
      });
    });

    it("should resolve when Used condition is missing (considered as False)", async () => {
      const mockLocalDisk: LocalDisk = {
        metadata: { name: "test-disk", namespace: "test-namespace" },
        status: {
          conditions: [
            {
              type: "Ready",
              status: "True",
              lastTransitionTime: "2023-01-01T00:00:00Z",
              message: "LocalDisk is ready",
              reason: "Ready",
            },
          ],
        },
      } as any;

      mockK8sGet.mockResolvedValue(mockLocalDisk);

      const promise = waitForLocalDiskUsedConditionFalse(testOptions);

      await jest.runOnlyPendingTimersAsync();

      await expect(promise).resolves.toBeUndefined();
      expect(mockK8sGet).toHaveBeenCalledTimes(1);
    });

    it("should eventually resolve after multiple checks when condition changes to False", async () => {
      const mockLocalDiskUsed: LocalDisk = {
        metadata: { name: "test-disk", namespace: "test-namespace" },
        status: {
          conditions: [
            {
              type: "Used",
              status: "True",
              lastTransitionTime: "2023-01-01T00:00:00Z",
              message: "LocalDisk is in use",
              reason: "InUse",
            },
          ],
        },
      } as any;

      const mockLocalDiskNotUsed: LocalDisk = {
        metadata: { name: "test-disk", namespace: "test-namespace" },
        status: {
          conditions: [
            {
              type: "Used",
              status: "False",
              lastTransitionTime: "2023-01-01T00:00:00Z",
              message: "LocalDisk is not in use",
              reason: "NotUsed",
            },
          ],
        },
      } as any;

      // Mock k8sGet to return "Used=True" for first two calls, then "Used=False"
      mockK8sGet
        .mockResolvedValueOnce(mockLocalDiskUsed)
        .mockResolvedValueOnce(mockLocalDiskUsed)
        .mockResolvedValue(mockLocalDiskNotUsed);

      const startTime = Date.now();
      const promise = waitForLocalDiskUsedConditionFalse(testOptions);

      // Control time progression through the polling cycles
      // First check (immediate)
      await jest.advanceTimersByTimeAsync(0);

      // Second check (after 100ms delay)
      jest.setSystemTime(startTime + 100);
      await jest.advanceTimersByTimeAsync(100);

      // Third check (after 200ms delay - exponential backoff)
      jest.setSystemTime(startTime + 300);
      await jest.advanceTimersByTimeAsync(200);

      await expect(promise).resolves.toBeUndefined();
      expect(mockK8sGet).toHaveBeenCalledTimes(3);
    });
  });

  describe("Scenario 2: LocalDisk does not reach target state before timeout", () => {
    it("should timeout and reject with TIMEOUT error", async () => {
      const mockLocalDisk: LocalDisk = {
        metadata: { name: "test-disk", namespace: "test-namespace" },
        status: {
          conditions: [
            {
              type: "Used",
              status: "True",
              lastTransitionTime: "2023-01-01T00:00:00Z",
              message: "LocalDisk is in use",
              reason: "InUse",
            },
          ],
        },
      } as any;

      mockK8sGet.mockResolvedValue(mockLocalDisk);

      const startTime = Date.now();
      const promise = waitForLocalDiskUsedConditionFalse(testOptions);

      // Advance system time past the timeout
      jest.setSystemTime(startTime + testOptions.timeoutMs + 1000);

      await expect(promise).rejects.toThrow("Timeout after");

      const error = await promise.catch((e) => e) as LocalDiskConditionError;
      expect(error.reason).toBe("TIMEOUT");
      expect(error.message).toContain('Timeout after 10000ms waiting for LocalDisk "test-disk"');
    });

    it("should respect timeout even with exponential backoff", async () => {
      const mockLocalDisk: LocalDisk = {
        metadata: { name: "test-disk", namespace: "test-namespace" },
        status: {
          conditions: [
            {
              type: "Used",
              status: "Unknown",
              lastTransitionTime: "2023-01-01T00:00:00Z",
              message: "LocalDisk status unknown",
              reason: "Unknown",
            },
          ],
        },
      } as any;

      mockK8sGet.mockResolvedValue(mockLocalDisk);

      const shortTimeoutOptions = {
        ...testOptions,
        timeoutMs: 500, // Very short timeout
      };

      const startTime = Date.now();
      const promise = waitForLocalDiskUsedConditionFalse(shortTimeoutOptions);

      // Advance system time past the timeout
      jest.setSystemTime(startTime + 600);

      await expect(promise).rejects.toThrow("Timeout after");

      const error = await promise.catch((e) => e) as LocalDiskConditionError;
      expect(error.reason).toBe("TIMEOUT");
    });
  });

  describe("Scenario 3: LocalDisk cannot be found", () => {
    it("should reject with RESOURCE_NOT_FOUND error when LocalDisk is not found", async () => {
      const notFoundError = {
        status: 404,
        message: "LocalDisk not found",
      };

      mockK8sGet.mockRejectedValue(notFoundError);

      const promise = waitForLocalDiskUsedConditionFalse(testOptions);

      await expect(promise).rejects.toThrow('LocalDisk "test-disk" not found in namespace "test-namespace"');

      const error = await promise.catch((e) => e) as LocalDiskConditionError;
      expect(error.reason).toBe("RESOURCE_NOT_FOUND");
    });

    it("should continue polling on non-404 errors and eventually timeout", async () => {
      const networkError = new Error("Network error");

      mockK8sGet.mockRejectedValue(networkError);

      // Spy on console.warn to verify error logging
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      const startTime = Date.now();
      const promise = waitForLocalDiskUsedConditionFalse(testOptions);

      // Advance system time past the timeout
      jest.setSystemTime(startTime + testOptions.timeoutMs + 1000);

      await expect(promise).rejects.toThrow("Timeout after");

      const error = await promise.catch((e) => e) as LocalDiskConditionError;
      expect(error.reason).toBe("TIMEOUT");

      // Verify that warnings were logged for network errors
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("failed while checking LocalDisk condition"),
        networkError
      );

      consoleSpy.mockRestore();
    });

    it("should handle unknown error types", async () => {
      const unknownError = "String error";

      mockK8sGet.mockRejectedValue(unknownError);

      // Spy on console.warn to verify error logging
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      const shortTimeoutOptions = {
        ...testOptions,
        timeoutMs: 300, // Short timeout for faster test
      };

      const startTime = Date.now();
      const promise = waitForLocalDiskUsedConditionFalse(shortTimeoutOptions);

      // Advance system time past the timeout
      jest.setSystemTime(startTime + 400);

      await expect(promise).rejects.toThrow("Timeout after");

      // Verify that warnings were logged
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("failed while checking LocalDisk condition"),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe("Exponential backoff behavior", () => {
    it("should use exponential backoff delays", async () => {
      const mockLocalDisk: LocalDisk = {
        metadata: { name: "test-disk", namespace: "test-namespace" },
        status: {
          conditions: [
            {
              type: "Used",
              status: "True",
              lastTransitionTime: "2023-01-01T00:00:00Z",
              message: "LocalDisk is in use",
              reason: "InUse",
            },
          ],
        },
      } as any;

      // Track when k8sGet is called and advance time step by step
      const callTimes: number[] = [];
      let callCount = 0;

      mockK8sGet.mockImplementation(() => {
        callTimes.push(Date.now());
        callCount++;
        return Promise.resolve(mockLocalDisk);
      });

      const startTime = Date.now();
      const promise = waitForLocalDiskUsedConditionFalse(testOptions);

      // Simulate the exponential backoff timing step by step
      // First call is immediate
      await jest.advanceTimersByTimeAsync(0);
      expect(callCount).toBe(1);

      // First delay: 100ms
      jest.setSystemTime(startTime + 100);
      await jest.advanceTimersByTimeAsync(100);
      expect(callCount).toBe(2);

      // Second delay: 200ms (doubled)
      jest.setSystemTime(startTime + 300);
      await jest.advanceTimersByTimeAsync(200);
      expect(callCount).toBe(3);

      // Third delay: 400ms (doubled again)
      jest.setSystemTime(startTime + 700);
      await jest.advanceTimersByTimeAsync(400);
      expect(callCount).toBe(4);

      // Fourth delay: 800ms (doubled again)
      jest.setSystemTime(startTime + 1500);
      await jest.advanceTimersByTimeAsync(800);
      expect(callCount).toBe(5);

      // Fifth delay: 1000ms (capped at maxDelayMs)
      jest.setSystemTime(startTime + 2500);
      await jest.advanceTimersByTimeAsync(1000);
      expect(callCount).toBe(6);

      // Verify the exponential backoff pattern was followed
      expect(mockK8sGet).toHaveBeenCalledTimes(6);
    });

    it("should cap delays at maxDelayMs", async () => {
      const mockLocalDisk: LocalDisk = {
        metadata: { name: "test-disk", namespace: "test-namespace" },
        status: {
          conditions: [
            {
              type: "Used",
              status: "True",
              lastTransitionTime: "2023-01-01T00:00:00Z",
              message: "LocalDisk is in use",
              reason: "InUse",
            },
          ],
        },
      } as any;

      let callCount = 0;
      mockK8sGet.mockImplementation(() => {
        callCount++;
        return Promise.resolve(mockLocalDisk);
      });

      const customOptions = {
        ...testOptions,
        initialDelayMs: 100,
        maxDelayMs: 300, // Low cap for testing
        timeoutMs: 2000,
      };

      const startTime = Date.now();
      const promise = waitForLocalDiskUsedConditionFalse(customOptions);

      // Go through several backoff cycles with time control
      await jest.advanceTimersByTimeAsync(0); // First check (immediate)
      expect(callCount).toBe(1);

      // First delay: 100ms
      jest.setSystemTime(startTime + 100);
      await jest.advanceTimersByTimeAsync(100);
      expect(callCount).toBe(2);

      // Second delay: 200ms
      jest.setSystemTime(startTime + 300);
      await jest.advanceTimersByTimeAsync(200);
      expect(callCount).toBe(3);

      // Third delay: 300ms (should be capped at maxDelayMs)
      jest.setSystemTime(startTime + 600);
      await jest.advanceTimersByTimeAsync(300);
      expect(callCount).toBe(4);

      // Fourth delay: 300ms (still capped, not doubled to 600ms)
      jest.setSystemTime(startTime + 900);
      await jest.advanceTimersByTimeAsync(300);
      expect(callCount).toBe(5);

      expect(mockK8sGet).toHaveBeenCalledTimes(5);
    });
  });

  describe("Edge cases", () => {
    it("should handle LocalDisk with no status", async () => {
      const mockLocalDisk: LocalDisk = {
        metadata: { name: "test-disk", namespace: "test-namespace" },
        // No status field
      } as any;

      mockK8sGet.mockResolvedValue(mockLocalDisk);

      const promise = waitForLocalDiskUsedConditionFalse(testOptions);

      await jest.runOnlyPendingTimersAsync();

      // Should resolve because no conditions means not used
      await expect(promise).resolves.toBeUndefined();
    });

    it("should handle LocalDisk with empty conditions array", async () => {
      const mockLocalDisk: LocalDisk = {
        metadata: { name: "test-disk", namespace: "test-namespace" },
        status: {
          conditions: [],
        },
      } as any;

      mockK8sGet.mockResolvedValue(mockLocalDisk);

      const promise = waitForLocalDiskUsedConditionFalse(testOptions);

      await jest.runOnlyPendingTimersAsync();

      // Should resolve because no Used condition means not used
      await expect(promise).resolves.toBeUndefined();
    });

    it("should handle multiple conditions with only Used=False", async () => {
      const mockLocalDisk: LocalDisk = {
        metadata: { name: "test-disk", namespace: "test-namespace" },
        status: {
          conditions: [
            {
              type: "Ready",
              status: "True",
              lastTransitionTime: "2023-01-01T00:00:00Z",
              message: "LocalDisk is ready",
              reason: "Ready",
            },
            {
              type: "Used",
              status: "False",
              lastTransitionTime: "2023-01-01T00:00:00Z",
              message: "LocalDisk is not in use",
              reason: "NotUsed",
            },
            {
              type: "Available",
              status: "True",
              lastTransitionTime: "2023-01-01T00:00:00Z",
              message: "LocalDisk is available",
              reason: "Available",
            },
          ],
        },
      } as any;

      mockK8sGet.mockResolvedValue(mockLocalDisk);

      const promise = waitForLocalDiskUsedConditionFalse(testOptions);

      await jest.runOnlyPendingTimersAsync();

      await expect(promise).resolves.toBeUndefined();
    });
  });
});
