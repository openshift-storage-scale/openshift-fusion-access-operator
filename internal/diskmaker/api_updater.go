package diskmaker

import (
	"context"
	"fmt"
	"os"

	"github.com/darkdoc/purple-storage-rh-operator/api/v1alpha1"

	v1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/client-go/kubernetes"
	typedcorev1 "k8s.io/client-go/kubernetes/typed/core/v1"
	"k8s.io/client-go/tools/record"
	"k8s.io/klog/v2"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/client/config"
)

const componentName = "local-storage-diskmaker"

type ApiUpdater interface {
	recordEvent(obj runtime.Object, e *DiskEvent)
	getLocalVolume(lv *v1alpha1.LocalVolume) (*v1alpha1.LocalVolume, error)
	CreateDiscoveryResult(lvdr *v1alpha1.LocalVolumeDiscoveryResult) error
	GetDiscoveryResult(name, namespace string) (*v1alpha1.LocalVolumeDiscoveryResult, error)
	UpdateDiscoveryResultStatus(lvdr *v1alpha1.LocalVolumeDiscoveryResult) error
	UpdateDiscoveryResult(lvdr *v1alpha1.LocalVolumeDiscoveryResult) error
	GetLocalVolumeDiscovery(name, namespace string) (*v1alpha1.LocalVolumeDiscovery, error)
}

type sdkAPIUpdater struct {
	recorder record.EventRecorder
	// This client, initialized using mgr.Client() above, is a split client
	// that reads objects from the cache and writes to the apiserver
	client client.Client
}

func NewAPIUpdater(scheme *runtime.Scheme) (ApiUpdater, error) {
	recorder, err := getEventRecorder(scheme)
	if err != nil {
		klog.Error(err, "failed to get event recorder")
		return &sdkAPIUpdater{}, err
	}

	config, err := config.GetConfig()
	if err != nil {
		klog.Error(err, "failed to get rest.config")
		return &sdkAPIUpdater{}, err
	}
	crClient, err := client.New(config, client.Options{})
	if err != nil {
		klog.Error(err, "failed to create controller-runtime client")
		return &sdkAPIUpdater{}, err
	}

	apiClient := &sdkAPIUpdater{
		client:   crClient,
		recorder: recorder,
	}
	return apiClient, nil
}

func getEventRecorder(scheme *runtime.Scheme) (record.EventRecorder, error) {
	var recorder record.EventRecorder
	config, err := config.GetConfig()
	if err != nil {
		klog.Error(err, "failed to get rest.config")
		return recorder, err
	}
	kubeClient, err := kubernetes.NewForConfig(config)
	if err != nil {
		klog.Error(err, "could not build kubeclient")
	}
	eventBroadcaster := record.NewBroadcaster()
	eventBroadcaster.StartLogging(klog.Infof)
	eventBroadcaster.StartRecordingToSink(&typedcorev1.EventSinkImpl{Interface: kubeClient.CoreV1().Events("")})
	recorder = eventBroadcaster.NewRecorder(scheme, v1.EventSource{Component: componentName})
	return recorder, nil
}

func (s *sdkAPIUpdater) recordEvent(obj runtime.Object, e *DiskEvent) {
	nodeName := os.Getenv("MY_NODE_NAME")
	message := e.Message
	if len(nodeName) != 0 {
		message = fmt.Sprintf("%s - %s", nodeName, message)
	}

	s.recorder.Eventf(obj, e.EventType, e.EventReason, message)
}

func (s *sdkAPIUpdater) getLocalVolume(lv *v1alpha1.LocalVolume) (*v1alpha1.LocalVolume, error) {
	newLocalVolume := lv.DeepCopy()
	err := s.client.Get(context.TODO(), types.NamespacedName{Name: newLocalVolume.GetName(), Namespace: newLocalVolume.GetNamespace()}, newLocalVolume)
	return lv, err
}

func (s *sdkAPIUpdater) GetDiscoveryResult(name, namespace string) (*v1alpha1.LocalVolumeDiscoveryResult, error) {
	discoveryResult := &v1alpha1.LocalVolumeDiscoveryResult{}
	err := s.client.Get(context.TODO(), types.NamespacedName{Name: name, Namespace: namespace}, discoveryResult)
	return discoveryResult, err
}

func (s *sdkAPIUpdater) CreateDiscoveryResult(lvdr *v1alpha1.LocalVolumeDiscoveryResult) error {
	return s.client.Create(context.TODO(), lvdr)
}

func (s *sdkAPIUpdater) UpdateDiscoveryResultStatus(lvdr *v1alpha1.LocalVolumeDiscoveryResult) error {
	return s.client.Status().Update(context.TODO(), lvdr)
}

func (s *sdkAPIUpdater) UpdateDiscoveryResult(lvdr *v1alpha1.LocalVolumeDiscoveryResult) error {
	return s.client.Update(context.TODO(), lvdr)
}

func (s *sdkAPIUpdater) GetLocalVolumeDiscovery(name, namespace string) (*v1alpha1.LocalVolumeDiscovery, error) {
	discoveryCR := &v1alpha1.LocalVolumeDiscovery{}
	err := s.client.Get(context.TODO(), types.NamespacedName{Name: name, Namespace: namespace}, discoveryCR)
	return discoveryCR, err
}
