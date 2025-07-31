package localvolumediscovery

import (
	"context"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	localv1alpha1 "github.com/openshift-storage-scale/openshift-fusion-access-operator/api/v1alpha1"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"
	"sigs.k8s.io/controller-runtime/pkg/reconcile"
)

const (
	name          = "auto-discover-devices"
	namespace     = "local-storage"
	hostnameLabel = "kubernetes.io/hostname"
)

var discoveryDaemonSet = &appsv1.DaemonSet{
	ObjectMeta: metav1.ObjectMeta{
		Name:      DeviceFinderDiscovery,
		Namespace: namespace,
	},
	Status: appsv1.DaemonSetStatus{
		NumberReady:            3,
		DesiredNumberScheduled: 3,
	},
}

var mockNodeList = &corev1.NodeList{
	TypeMeta: metav1.TypeMeta{
		Kind: "NodeList",
	},
	Items: []corev1.Node{
		{
			TypeMeta: metav1.TypeMeta{
				Kind: "Node",
			},
			ObjectMeta: metav1.ObjectMeta{
				Name: "Node1",
				Labels: map[string]string{
					hostnameLabel: "Node1",
				},
			},
		},
		{
			TypeMeta: metav1.TypeMeta{
				Kind: "Node",
			},
			ObjectMeta: metav1.ObjectMeta{
				Name: "Node2",
				Labels: map[string]string{
					hostnameLabel: "Node2",
				},
			},
		},
	},
}

var localVolumeDiscoveryCR = localv1alpha1.LocalVolumeDiscovery{
	ObjectMeta: metav1.ObjectMeta{
		Name:      name,
		Namespace: namespace,
	},
	TypeMeta: metav1.TypeMeta{
		Kind: "LocalVolumeDiscovery",
	},
	Spec: localv1alpha1.LocalVolumeDiscoverySpec{
		NodeSelector: &corev1.NodeSelector{
			NodeSelectorTerms: []corev1.NodeSelectorTerm{
				{MatchExpressions: []corev1.NodeSelectorRequirement{
					{
						Key:      hostnameLabel,
						Operator: corev1.NodeSelectorOpIn,
						Values:   []string{"Node1", "Node2"},
					},
				}},
			},
		},
	},
}

var localVolumeDiscoveryResultList = localv1alpha1.LocalVolumeDiscoveryResultList{
	TypeMeta: metav1.TypeMeta{
		Kind: "LocalVolumeDiscoveryResultList",
	},
	Items: []localv1alpha1.LocalVolumeDiscoveryResult{
		{
			ObjectMeta: metav1.ObjectMeta{
				Name:      "discovery-result-node1",
				Namespace: namespace,
			},
			Spec: localv1alpha1.LocalVolumeDiscoveryResultSpec{
				NodeName: "Node1",
			},
		},
		{
			ObjectMeta: metav1.ObjectMeta{
				Name:      "discovery-result-node2",
				Namespace: namespace,
			},
			Spec: localv1alpha1.LocalVolumeDiscoveryResultSpec{
				NodeName: "Node2",
			},
		},
	},
}

func newFakeLocalVolumeDiscoveryReconciler(objs ...runtime.Object) *LocalVolumeDiscoveryReconciler {
	scheme, err := localv1alpha1.SchemeBuilder.Build()
	Expect(err).ToNot(HaveOccurred(), "creating scheme")

	err = corev1.AddToScheme(scheme)
	Expect(err).ToNot(HaveOccurred(), "adding corev1 to scheme")

	err = appsv1.AddToScheme(scheme)
	Expect(err).ToNot(HaveOccurred(), "adding appsv1 to scheme")

	crsWithStatus := []client.Object{
		&localv1alpha1.LocalVolumeDiscovery{},
	}

	client := fake.NewClientBuilder().WithScheme(scheme).WithStatusSubresource(crsWithStatus...).WithRuntimeObjects(objs...).Build()

	return &LocalVolumeDiscoveryReconciler{
		Client: client,
		Scheme: scheme,
	}
}

var _ = Describe("LocalVolumeDiscoveryReconciler", func() {
	Context("Reconcile", func() {
		DescribeTable("should set correct phase and conditions based on daemon set status",
			func(discoveryDaemonCreated bool, discoveryDesiredDaemonsCount, discoveryReadyDaemonsCount int32, expectedPhase localv1alpha1.DiscoveryPhase, conditionType string, conditionStatus metav1.ConditionStatus) {
				discoveryDS := &appsv1.DaemonSet{}
				discoveryDaemonSet.DeepCopyInto(discoveryDS)
				discoveryDS.Status.NumberReady = discoveryReadyDaemonsCount
				discoveryDS.Status.DesiredNumberScheduled = discoveryDesiredDaemonsCount

				discoveryObj := &localv1alpha1.LocalVolumeDiscovery{
					ObjectMeta: metav1.ObjectMeta{
						Name:      name,
						Namespace: namespace,
					},
					TypeMeta: metav1.TypeMeta{
						Kind: "LocalVolumeDiscovery",
					},
				}
				objects := []runtime.Object{
					discoveryObj,
				}

				if discoveryDaemonCreated {
					objects = append(objects, discoveryDS)
				}

				req := ctrl.Request{
					NamespacedName: types.NamespacedName{
						Name:      discoveryObj.Name,
						Namespace: discoveryObj.Namespace,
					},
				}
				fakeReconciler := newFakeLocalVolumeDiscoveryReconciler(objects...)
				_, err := fakeReconciler.Reconcile(context.TODO(), req)
				Expect(err).ToNot(HaveOccurred())
				err = fakeReconciler.Client.Get(context.TODO(), types.NamespacedName{Name: discoveryObj.Name, Namespace: discoveryObj.Namespace}, discoveryObj)
				Expect(err).ToNot(HaveOccurred())
				Expect(discoveryObj.Status.Phase).To(Equal(expectedPhase))
				Expect(discoveryObj.Status.Conditions[0].Type).To(Equal(conditionType))
				Expect(discoveryObj.Status.Conditions[0].Status).To(Equal(conditionStatus))
			},
			Entry("all the desired discovery daemonset pods are running - case 1",
				true, int32(1), int32(1), localv1alpha1.Discovering, "Available", metav1.ConditionTrue,
			),
			Entry("all the desired discovery daemonset pods are running - case 2",
				true, int32(100), int32(100), localv1alpha1.Discovering, "Available", metav1.ConditionTrue,
			),
			Entry("ready discovery daemonset pods are less than the desired count",
				true, int32(100), int32(80), localv1alpha1.Discovering, "Progressing", metav1.ConditionFalse,
			),
			Entry("no discovery daemonset pods are running",
				true, int32(0), int32(0), localv1alpha1.DiscoveryFailed, "Degraded", metav1.ConditionFalse,
			),
			Entry("discovery daemonset not created",
				false, int32(0), int32(0), localv1alpha1.DiscoveryFailed, "Degraded", metav1.ConditionFalse,
			),
		)
	})

	Context("deleteOrphanDiscoveryResults", func() {
		It("should delete orphan discovery results when NodeSelector is updated", func() {
			nodeList := &corev1.NodeList{}
			mockNodeList.DeepCopyInto(nodeList)
			discoveryDS := &appsv1.DaemonSet{}
			discoveryDaemonSet.DeepCopyInto(discoveryDS)

			discoveryObj := &localv1alpha1.LocalVolumeDiscovery{}
			localVolumeDiscoveryCR.DeepCopyInto(discoveryObj)

			discoveryResults := &localv1alpha1.LocalVolumeDiscoveryResultList{}
			localVolumeDiscoveryResultList.DeepCopyInto(discoveryResults)

			objects := []runtime.Object{
				nodeList, discoveryObj, discoveryDS, discoveryResults,
			}

			fakeReconciler := newFakeLocalVolumeDiscoveryReconciler(objects...)
			req := reconcile.Request{
				NamespacedName: types.NamespacedName{
					Name:      discoveryObj.Name,
					Namespace: discoveryObj.Namespace,
				},
			}

			_, err := fakeReconciler.Reconcile(context.TODO(), req)
			Expect(err).ToNot(HaveOccurred())
			results := &localv1alpha1.LocalVolumeDiscoveryResultList{}
			err = fakeReconciler.Client.List(context.TODO(), results, client.InNamespace(namespace))
			Expect(err).ToNot(HaveOccurred())
			Expect(results.Items).To(HaveLen(2))

			// update discovery CR to remove "Node2"
			discoveryObj.Spec.NodeSelector.NodeSelectorTerms[0].MatchExpressions[0].Values = []string{"Node1"}
			fakeReconciler = newFakeLocalVolumeDiscoveryReconciler(objects...)
			err = fakeReconciler.deleteOrphanDiscoveryResults(context.TODO(), discoveryObj)
			Expect(err).ToNot(HaveOccurred())
			// assert that discovery result object on "Node2" is deleted
			results = &localv1alpha1.LocalVolumeDiscoveryResultList{}
			err = fakeReconciler.Client.List(context.TODO(), results, client.InNamespace(namespace))
			Expect(err).ToNot(HaveOccurred())
			Expect(results.Items).To(HaveLen(1))
			Expect(results.Items[0].Spec.NodeName).To(Equal("Node1"))

			// skip deletion of orphan results when no NodeSelector is provided
			discoveryObj.Spec = localv1alpha1.LocalVolumeDiscoverySpec{}
			err = fakeReconciler.deleteOrphanDiscoveryResults(context.TODO(), discoveryObj)
			Expect(err).ToNot(HaveOccurred())
			Expect(results.Items).To(HaveLen(1))
			Expect(results.Items[0].Spec.NodeName).To(Equal("Node1"))
		})

		It("should handle empty discovery results list gracefully", func() {
			nodeList := &corev1.NodeList{}
			mockNodeList.DeepCopyInto(nodeList)
			discoveryDS := &appsv1.DaemonSet{}
			discoveryDaemonSet.DeepCopyInto(discoveryDS)

			discoveryObj := &localv1alpha1.LocalVolumeDiscovery{}
			localVolumeDiscoveryCR.DeepCopyInto(discoveryObj)

			objects := []runtime.Object{
				nodeList, discoveryObj, discoveryDS,
			}

			fakeReconciler := newFakeLocalVolumeDiscoveryReconciler(objects...)
			err := fakeReconciler.deleteOrphanDiscoveryResults(context.TODO(), discoveryObj)
			Expect(err).ToNot(HaveOccurred())

			results := &localv1alpha1.LocalVolumeDiscoveryResultList{}
			err = fakeReconciler.Client.List(context.TODO(), results, client.InNamespace(namespace))
			Expect(err).ToNot(HaveOccurred())
			Expect(results.Items).To(BeEmpty())
		})
	})
})
