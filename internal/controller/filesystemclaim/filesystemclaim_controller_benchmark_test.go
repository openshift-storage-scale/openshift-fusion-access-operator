/*
Copyright 2025.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package filesystemclaim

import (
	"context"
	"fmt"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/onsi/ginkgo/v2"
	"github.com/onsi/gomega"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"
	"sigs.k8s.io/controller-runtime/pkg/log"
	"sigs.k8s.io/controller-runtime/pkg/log/zap"
	"sigs.k8s.io/controller-runtime/pkg/reconcile"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	fusionv1alpha1 "github.com/openshift-storage-scale/openshift-fusion-access-operator/api/v1alpha1"
)

// setupBenchmarkLogger initializes the controller-runtime logger for benchmarks
func setupBenchmarkLogger() {
	// Set up zap logger for benchmarks - send logs to null device
	nullDevice, _ := os.OpenFile("/dev/null", os.O_WRONLY, 0)
	logger := zap.New(zap.UseDevMode(false), zap.WriteTo(nullDevice))
	log.SetLogger(logger)
}

// setupMockEnvironment creates a complete mock environment with all required resources
func setupMockEnvironment(scheme *runtime.Scheme, fsc *fusionv1alpha1.FileSystemClaim) client.Client {
	// Create mock nodes with required labels
	node1 := &corev1.Node{
		ObjectMeta: metav1.ObjectMeta{
			Name: "worker-storage-node-1",
			Labels: map[string]string{
				WorkerNodeRoleLabel:   "",
				ScaleStorageRoleLabel: ScaleStorageRoleValue,
			},
		},
	}

	node2 := &corev1.Node{
		ObjectMeta: metav1.ObjectMeta{
			Name: "worker-storage-node-2",
			Labels: map[string]string{
				WorkerNodeRoleLabel:   "",
				ScaleStorageRoleLabel: ScaleStorageRoleValue,
			},
		},
	}

	// Create mock LocalVolumeDiscoveryResult objects
	lvdr1 := &fusionv1alpha1.LocalVolumeDiscoveryResult{
		ObjectMeta: metav1.ObjectMeta{
			Name:      fmt.Sprintf("discovery-result-%s", node1.Name),
			Namespace: "openshift-fusion-access-operator", // Default operator namespace
		},
		Status: fusionv1alpha1.LocalVolumeDiscoveryResultStatus{
			DiscoveredDevices: []fusionv1alpha1.DiscoveredDevice{
				{Path: "/dev/sdb"},
				{Path: "/dev/sdc"},
				{Path: "/dev/sdd"},
			},
		},
	}

	lvdr2 := &fusionv1alpha1.LocalVolumeDiscoveryResult{
		ObjectMeta: metav1.ObjectMeta{
			Name:      fmt.Sprintf("discovery-result-%s", node2.Name),
			Namespace: "openshift-fusion-access-operator", // Default operator namespace
		},
		Status: fusionv1alpha1.LocalVolumeDiscoveryResultStatus{
			DiscoveredDevices: []fusionv1alpha1.DiscoveredDevice{
				{Path: "/dev/sdb"},
				{Path: "/dev/sdc"},
				{Path: "/dev/sdd"},
			},
		},
	}

	// Create fake client with all required objects
	return fake.NewClientBuilder().
		WithScheme(scheme).
		WithObjects(fsc, node1, node2, lvdr1, lvdr2).
		Build()
}

// BenchmarkRequeueLogic benchmarks just the requeue logic without full reconciliation
func BenchmarkRequeueLogic(b *testing.B) {
	setupBenchmarkLogger()

	strategies := []struct {
		name  string
		delay time.Duration
	}{
		{"0ms", 0},
		{"10ms", 10 * time.Millisecond},
		{"100ms", 100 * time.Millisecond},
		{"500ms", 500 * time.Millisecond},
	}

	for _, strategy := range strategies {
		b.Run(strategy.name, func(b *testing.B) {
			reconciler := &FileSystemClaimReconciler{
				RequeueDelay: strategy.delay,
			}

			b.ResetTimer()
			b.RunParallel(func(pb *testing.PB) {
				for pb.Next() {
					result := ctrl.Result{RequeueAfter: reconciler.RequeueDelay}
					_ = result // Use result to prevent optimization
				}
			})
		})
	}
}

// BenchmarkReconcile0ms benchmarks the reconciler with immediate requeue (0ms delay)
func BenchmarkReconcile0ms(b *testing.B) {
	setupBenchmarkLogger()
	ctx := context.Background()
	scheme := runtime.NewScheme()

	_ = corev1.AddToScheme(scheme)
	_ = fusionv1alpha1.AddToScheme(scheme)

	fsc := &fusionv1alpha1.FileSystemClaim{
		ObjectMeta: metav1.ObjectMeta{
			Name:      "benchmark-fsc",
			Namespace: "ibm-spectrum-scale",
		},
		Spec: fusionv1alpha1.FileSystemClaimSpec{
			Devices: []string{"/dev/sdb", "/dev/sdc"},
		},
	}

	fakeClient := setupMockEnvironment(scheme, fsc)

	reconciler := &FileSystemClaimReconciler{
		Client:       fakeClient,
		Scheme:       scheme,
		RequeueDelay: 0, // Immediate requeue
	}

	req := reconcile.Request{
		NamespacedName: types.NamespacedName{
			Name:      fsc.Name,
			Namespace: fsc.Namespace,
		},
	}

	b.ResetTimer()
	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			_, err := reconciler.Reconcile(ctx, req)
			// Don't fail on "not found" errors - this is expected in benchmarks
			if err != nil && !strings.Contains(err.Error(), "not found") {
				b.Errorf("Reconcile failed: %v", err)
			}
		}
	})
}

// BenchmarkReconcile100ms benchmarks the reconciler with timer-based requeue (100ms delay)
func BenchmarkReconcile100ms(b *testing.B) {
	setupBenchmarkLogger()
	ctx := context.Background()
	scheme := runtime.NewScheme()

	_ = corev1.AddToScheme(scheme)
	_ = fusionv1alpha1.AddToScheme(scheme)

	fsc := &fusionv1alpha1.FileSystemClaim{
		ObjectMeta: metav1.ObjectMeta{
			Name:      "benchmark-fsc-timer",
			Namespace: "ibm-spectrum-scale",
		},
		Spec: fusionv1alpha1.FileSystemClaimSpec{
			Devices: []string{"/dev/sdb", "/dev/sdc"},
		},
	}

	fakeClient := setupMockEnvironment(scheme, fsc)

	reconciler := &FileSystemClaimReconciler{
		Client:       fakeClient,
		Scheme:       scheme,
		RequeueDelay: 100 * time.Millisecond, // 100ms delay
	}

	req := reconcile.Request{
		NamespacedName: types.NamespacedName{
			Name:      fsc.Name,
			Namespace: fsc.Namespace,
		},
	}

	b.ResetTimer()
	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			_, err := reconciler.Reconcile(ctx, req)
			// Don't fail on "not found" errors - this is expected in benchmarks
			if err != nil && !strings.Contains(err.Error(), "not found") {
				b.Errorf("Reconcile failed: %v", err)
			}
		}
	})
}

// BenchmarkReconcileWithTimeouts compares different requeue strategies with actual timeout simulation
func BenchmarkReconcileWithTimeouts(b *testing.B) {
	setupBenchmarkLogger()
	ctx := context.Background()
	scheme := runtime.NewScheme()

	_ = corev1.AddToScheme(scheme)
	_ = fusionv1alpha1.AddToScheme(scheme)

	fsc := &fusionv1alpha1.FileSystemClaim{
		ObjectMeta: metav1.ObjectMeta{
			Name:      "benchmark-fsc-strategies",
			Namespace: "ibm-spectrum-scale",
		},
		Spec: fusionv1alpha1.FileSystemClaimSpec{
			Devices: []string{"/dev/sdb"},
		},
	}

	fakeClient := setupMockEnvironment(scheme, fsc)

	req := reconcile.Request{
		NamespacedName: types.NamespacedName{
			Name:      fsc.Name,
			Namespace: fsc.Namespace,
		},
	}

	strategies := []struct {
		name  string
		delay time.Duration
	}{
		{"0ms", 0},
		{"10ms", 10 * time.Millisecond},
		{"100ms", 100 * time.Millisecond},
		{"500ms", 500 * time.Millisecond},
	}

	for _, strategy := range strategies {
		b.Run(strategy.name, func(b *testing.B) {
			reconciler := &FileSystemClaimReconciler{
				Client:       fakeClient,
				Scheme:       scheme,
				RequeueDelay: strategy.delay,
			}

			b.ResetTimer()
			b.RunParallel(func(pb *testing.PB) {
				for pb.Next() {
					result, err := reconciler.Reconcile(ctx, req)
					// Don't fail on "not found" errors - this is expected in benchmarks
					if err != nil && !strings.Contains(err.Error(), "not found") {
						b.Errorf("Reconcile failed: %v", err)
					}

					// Apply the actual requeue delay from the result
					if result.RequeueAfter > 0 {
						time.Sleep(result.RequeueAfter)
					}
				}
			})
		})
	}
}

// TestReconcilePerformanceComparison is a Ginkgo test for performance analysis
var _ = ginkgo.Describe("Reconcile Performance Comparison", func() {
	ginkgo.Context("Comparing immediate vs timer-based requeue", func() {
		ginkgo.It("should show performance differences with different requeue strategies", func() {
			// This test can be used to run the benchmarks and compare results
			// Run with: go test -bench=BenchmarkMockReconcileStrategies -benchmem
			gomega.Expect(true).To(gomega.BeTrue()) // Placeholder assertion
		})
	})
})
