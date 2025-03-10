// Code generated by informer-gen. DO NOT EDIT.

package v1alpha1

import (
	context "context"
	time "time"

	apimachineconfigurationv1alpha1 "github.com/openshift/api/machineconfiguration/v1alpha1"
	versioned "github.com/openshift/client-go/machineconfiguration/clientset/versioned"
	internalinterfaces "github.com/openshift/client-go/machineconfiguration/informers/externalversions/internalinterfaces"
	machineconfigurationv1alpha1 "github.com/openshift/client-go/machineconfiguration/listers/machineconfiguration/v1alpha1"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	runtime "k8s.io/apimachinery/pkg/runtime"
	watch "k8s.io/apimachinery/pkg/watch"
	cache "k8s.io/client-go/tools/cache"
)

// PinnedImageSetInformer provides access to a shared informer and lister for
// PinnedImageSets.
type PinnedImageSetInformer interface {
	Informer() cache.SharedIndexInformer
	Lister() machineconfigurationv1alpha1.PinnedImageSetLister
}

type pinnedImageSetInformer struct {
	factory          internalinterfaces.SharedInformerFactory
	tweakListOptions internalinterfaces.TweakListOptionsFunc
}

// NewPinnedImageSetInformer constructs a new informer for PinnedImageSet type.
// Always prefer using an informer factory to get a shared informer instead of getting an independent
// one. This reduces memory footprint and number of connections to the server.
func NewPinnedImageSetInformer(client versioned.Interface, resyncPeriod time.Duration, indexers cache.Indexers) cache.SharedIndexInformer {
	return NewFilteredPinnedImageSetInformer(client, resyncPeriod, indexers, nil)
}

// NewFilteredPinnedImageSetInformer constructs a new informer for PinnedImageSet type.
// Always prefer using an informer factory to get a shared informer instead of getting an independent
// one. This reduces memory footprint and number of connections to the server.
func NewFilteredPinnedImageSetInformer(client versioned.Interface, resyncPeriod time.Duration, indexers cache.Indexers, tweakListOptions internalinterfaces.TweakListOptionsFunc) cache.SharedIndexInformer {
	return cache.NewSharedIndexInformer(
		&cache.ListWatch{
			ListFunc: func(options v1.ListOptions) (runtime.Object, error) {
				if tweakListOptions != nil {
					tweakListOptions(&options)
				}
				return client.MachineconfigurationV1alpha1().PinnedImageSets().List(context.TODO(), options)
			},
			WatchFunc: func(options v1.ListOptions) (watch.Interface, error) {
				if tweakListOptions != nil {
					tweakListOptions(&options)
				}
				return client.MachineconfigurationV1alpha1().PinnedImageSets().Watch(context.TODO(), options)
			},
		},
		&apimachineconfigurationv1alpha1.PinnedImageSet{},
		resyncPeriod,
		indexers,
	)
}

func (f *pinnedImageSetInformer) defaultInformer(client versioned.Interface, resyncPeriod time.Duration) cache.SharedIndexInformer {
	return NewFilteredPinnedImageSetInformer(client, resyncPeriod, cache.Indexers{cache.NamespaceIndex: cache.MetaNamespaceIndexFunc}, f.tweakListOptions)
}

func (f *pinnedImageSetInformer) Informer() cache.SharedIndexInformer {
	return f.factory.InformerFor(&apimachineconfigurationv1alpha1.PinnedImageSet{}, f.defaultInformer)
}

func (f *pinnedImageSetInformer) Lister() machineconfigurationv1alpha1.PinnedImageSetLister {
	return machineconfigurationv1alpha1.NewPinnedImageSetLister(f.Informer().GetIndexer())
}
