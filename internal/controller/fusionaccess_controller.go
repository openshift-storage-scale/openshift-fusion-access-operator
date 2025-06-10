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

package controller

import (
	"context"
	"errors"
	"fmt"
	"reflect"

	mfc "github.com/manifestival/controller-runtime-client"
	"github.com/manifestival/manifestival"
	corev1 "k8s.io/api/core/v1"
	kerrors "k8s.io/apimachinery/pkg/api/errors"

	meta "k8s.io/apimachinery/pkg/api/meta"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/builder"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/event"
	"sigs.k8s.io/controller-runtime/pkg/handler"
	"sigs.k8s.io/controller-runtime/pkg/log"
	"sigs.k8s.io/controller-runtime/pkg/predicate"
	"sigs.k8s.io/controller-runtime/pkg/reconcile"

	fusionv1alpha1 "github.com/openshift-storage-scale/openshift-fusion-access-operator/api/v1alpha1"
	"github.com/openshift-storage-scale/openshift-fusion-access-operator/internal/controller/console"
	"github.com/openshift-storage-scale/openshift-fusion-access-operator/internal/controller/localvolumediscovery"
	"github.com/openshift-storage-scale/openshift-fusion-access-operator/internal/utils"
)

type CanPullImageFunc func(ctx context.Context, client kubernetes.Interface, ns, image, pullSecret string) (bool, error)

// FusionAccessReconciler reconciles a FusionAccess object
type FusionAccessReconciler struct {
	client.Client
	Scheme        *runtime.Scheme
	config        *rest.Config
	dynamicClient dynamic.Interface
	fullClient    kubernetes.Interface
	// Need this for mocking when needed
	CanPullImage CanPullImageFunc
}

func NewFusionAccessReconciler(
	myClient client.Client,
	scheme *runtime.Scheme,
) *FusionAccessReconciler {
	return &FusionAccessReconciler{
		Client:       myClient,
		Scheme:       scheme,
		CanPullImage: utils.CanPullImage,
	}
}

// const storageScaleFinalizer = "fusion.storage.openshift.io/finalizer"

// Basic Operator RBACs
//+kubebuilder:rbac:groups=fusion.storage.openshift.io,resources=fusionaccesses,verbs=get;list;watch;create;update;patch;delete
//+kubebuilder:rbac:groups=fusion.storage.openshift.io,resources=fusionaccesses/status,verbs=get;update;patch
//+kubebuilder:rbac:groups=fusion.storage.openshift.io,resources=fusionaccesses/finalizers,verbs=update

//+kubebuilder:rbac:groups="",namespace=ibm-fusion-access,resources=secrets,verbs=get;list;watch

// Below rules are inserted via `make rbac-generate` automatically
// IBM_RBAC_MARKER_START
//+kubebuilder:rbac:groups=admissionregistration.k8s.io,resources=mutatingwebhookconfigurations,verbs=list;watch;delete;update;get;create;patch
//+kubebuilder:rbac:groups=admissionregistration.k8s.io,resources=validatingwebhookconfigurations,verbs=list;watch;delete;update;get;create;patch
//+kubebuilder:rbac:groups=apiextensions.k8s.io,resources=customresourcedefinitions,verbs=list;watch;delete;update;get;create;patch
//+kubebuilder:rbac:groups=apps,resources=daemonsets,verbs=create;delete;get;list;update;watch
//+kubebuilder:rbac:groups=apps,resources=daemonsets,verbs=create;get;list;patch;watch
//+kubebuilder:rbac:groups=apps,resources=deployments/finalizers,verbs=get;update
//+kubebuilder:rbac:groups=apps,resources=deployments,verbs=create;delete;get;list;patch;update;watch
//+kubebuilder:rbac:groups=apps,resources=deployments,verbs=create;delete;get;list;update;watch
//+kubebuilder:rbac:groups=apps,resources=deployments,verbs=get;list
//+kubebuilder:rbac:groups=apps,resources=deployments,verbs=list;watch;delete;update;get;create;patch
//+kubebuilder:rbac:groups=apps,resources=replicasets,verbs=create;delete;get;list;update;watch
//+kubebuilder:rbac:groups=apps,resources=statefulsets,verbs=create;delete;get;list;patch
//+kubebuilder:rbac:groups=apps,resources=statefulsets,verbs=create;delete;get;list;update;watch
//+kubebuilder:rbac:groups=apps,resources=statefulsets,verbs=get;list
//+kubebuilder:rbac:groups=config.openshift.io,resources=clusterversions,verbs=get;list;watch
//+kubebuilder:rbac:groups=config.openshift.io,resources=dnses,verbs=get;list;watch
//+kubebuilder:rbac:groups=config.openshift.io,resources=infrastructures,verbs=get;list;watch
//+kubebuilder:rbac:groups=config.openshift.io,resources=networks,verbs=get;list;watch
//+kubebuilder:rbac:groups=coordination.k8s.io,resources=configmaps,verbs=get;list;watch;create;update;patch;delete
//+kubebuilder:rbac:groups=coordination.k8s.io,resources=leases,verbs=create;delete;get;list;update;watch
//+kubebuilder:rbac:groups=coordination.k8s.io,resources=leases,verbs=get;list;watch;create;update;patch;delete
//+kubebuilder:rbac:groups=csi.ibm.com,resources=csiscaleoperators/finalizers,verbs=update
//+kubebuilder:rbac:groups=csi.ibm.com,resources=csiscaleoperators/status,verbs=get;patch;update
//+kubebuilder:rbac:groups=csi.ibm.com,resources=csiscaleoperators,verbs=create;delete;get;list;patch;update;watch
//+kubebuilder:rbac:groups=csi.ibm.com,resources=*,verbs=*
//+kubebuilder:rbac:groups=discovery.k8s.io,resources=endpointslices,verbs=get;list;watch
//+kubebuilder:rbac:groups=machineconfiguration.openshift.io,resources=machineconfigpools,verbs=get;list;watch
//+kubebuilder:rbac:groups=monitoring.coreos.com,resources=servicemonitors,verbs=create;get
//+kubebuilder:rbac:groups=networking.k8s.io,resources=networkpolicies/finalizers,verbs=update
//+kubebuilder:rbac:groups=networking.k8s.io,resources=networkpolicies/status,verbs=get;patch;update
//+kubebuilder:rbac:groups=networking.k8s.io,resources=networkpolicies,verbs=create;delete;get;list;patch;update;watch
//+kubebuilder:rbac:groups=oauth.openshift.io,resources=oauthclients,verbs=create;get;list;patch;watch
//+kubebuilder:rbac:groups=policy,resources=poddisruptionbudgets,verbs=create;delete;get;list;patch;watch
//+kubebuilder:rbac:groups=rbac.authorization.k8s.io,resources=clusterrolebindings,verbs=*
//+kubebuilder:rbac:groups=rbac.authorization.k8s.io,resources=clusterrolebindings,verbs=list;watch;delete;update;get;create;patch
//+kubebuilder:rbac:groups=rbac.authorization.k8s.io,resources=clusterroles,verbs=*
//+kubebuilder:rbac:groups=rbac.authorization.k8s.io,resources=clusterroles,verbs=list;watch;delete;update;get;create;patch
//+kubebuilder:rbac:groups=rbac.authorization.k8s.io,resources=rolebindings,verbs=list;watch;delete;update;get;create;patch
//+kubebuilder:rbac:groups=rbac.authorization.k8s.io,resources=roles,verbs=list;watch;delete;update;get;create;patch
//+kubebuilder:rbac:groups="",resources=configmaps,verbs=*
//+kubebuilder:rbac:groups="",resources=configmaps,verbs=create;delete;get;list;patch;update;watch
//+kubebuilder:rbac:groups="",resources=configmaps,verbs=get;list;watch;create;update;patch;delete
//+kubebuilder:rbac:groups="",resources=configmaps,verbs=list;watch;delete;update;get;create;patch
//+kubebuilder:rbac:groups="",resources=configmap,verbs=create;get;list;patch;update;watch
//+kubebuilder:rbac:groups="",resources=endpoints/restricted,verbs=create;get;list;patch;update;watch
//+kubebuilder:rbac:groups="",resources=endpoints,verbs=*
//+kubebuilder:rbac:groups="",resources=endpoints,verbs=create;get;list;patch;update;watch
//+kubebuilder:rbac:groups="",resources=events,verbs=*
//+kubebuilder:rbac:groups="",resources=events,verbs=create;patch
//+kubebuilder:rbac:groups="",resources=leases,verbs=get;list;watch;create;update;patch;delete
//+kubebuilder:rbac:groups="",resources=namespaces,verbs=get;list;patch;watch
//+kubebuilder:rbac:groups="",resources=namespaces,verbs=list;watch;delete;update;get;create;patch
//+kubebuilder:rbac:groups="",resources=nodes,verbs=get;list;patch;watch
//+kubebuilder:rbac:groups="",resources=persistentvolumeclaims/finalizers,verbs=update
//+kubebuilder:rbac:groups="",resources=persistentvolumeclaims/status,verbs=get
//+kubebuilder:rbac:groups="",resources=persistentvolumeclaims,verbs=*
//+kubebuilder:rbac:groups="",resources=persistentvolumeclaims,verbs=create;delete;get;list;patch;update;watch
//+kubebuilder:rbac:groups="",resources=persistentvolumes,verbs=create;delete;get;list;patch;update;watch
//+kubebuilder:rbac:groups="",resources=PersistentVolume,verbs=get;list
//+kubebuilder:rbac:groups="",resources=pods/eviction,verbs=create
//+kubebuilder:rbac:groups="",resources=pods/exec,verbs=create
//+kubebuilder:rbac:groups="",resources=pods/status,verbs=get;list;patch;update;watch
//+kubebuilder:rbac:groups="",resources=pods,verbs=*
//+kubebuilder:rbac:groups="",resources=pods,verbs=create;delete;get;list;patch;update;watch
//+kubebuilder:rbac:groups="",resources=pods,verbs=get;list
//+kubebuilder:rbac:groups="",resources=secrets/status,verbs=*
//+kubebuilder:rbac:groups="",resources=secrets,verbs=*
//+kubebuilder:rbac:groups="",resources=secrets,verbs=create;delete;get;list;patch;update;watch
//+kubebuilder:rbac:groups="",resources=secrets,verbs=get
//+kubebuilder:rbac:groups="",resources=serviceaccounts,verbs=*
//+kubebuilder:rbac:groups="",resources=serviceaccounts,verbs=create;delete;patch
//+kubebuilder:rbac:groups="",resources=serviceaccounts,verbs=get;list;watch
//+kubebuilder:rbac:groups="",resources=serviceaccounts,verbs=list;watch;delete;update;get;create;patch
//+kubebuilder:rbac:groups="",resources=services/finalizers,verbs=*
//+kubebuilder:rbac:groups="",resources=services/finalizers,verbs=update
//+kubebuilder:rbac:groups="",resources=services,verbs=*
//+kubebuilder:rbac:groups="",resources=services,verbs=create;delete;get;list;patch;update;watch
//+kubebuilder:rbac:groups="",resources=services,verbs=create;delete;patch
//+kubebuilder:rbac:groups="",resources=services,verbs=get;list
//+kubebuilder:rbac:groups="",resources=services,verbs=list;watch;delete;update;get;create;patch
//+kubebuilder:rbac:groups=route.openshift.io,resources=routes,verbs=create;get;list;patch;update;watch
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=approvalrequests/status,verbs=get;patch;update
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=approvalrequests,verbs=create;delete;get;list;patch;update;watch
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=asyncreplications/finalizers,verbs=update
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=asyncreplications/status,verbs=get;patch;update
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=asyncreplications,verbs=create;delete;get;list;patch;update;watch
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=asyncreplications,verbs=get;list;watch
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=callhomes/finalizers,verbs=update
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=callhomes/status,verbs=get;patch;update
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=callhomes,verbs=create;delete;get;list;patch;update;watch
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=cloudcsidisks/finalizers,verbs=update
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=cloudcsidisks/status,verbs=get;patch;update
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=cloudcsidisks,verbs=create;delete;get;list;patch;update;watch
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=clusterinterconnects,verbs=get;list;watch
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=clusters/finalizers,verbs=update
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=clusters/status,verbs=get;patch;update
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=clusters,verbs=create
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=clusters,verbs=create;delete;get;list;patch;update;watch
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=clusters,verbs=get
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=compressionjobs/finalizers,verbs=update
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=compressionjobs/status,verbs=get;patch;update
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=compressionjobs,verbs=create;delete;get;list;patch;update;watch
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=consistencygroups/status,verbs=get;patch;update
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=consistencygroups,verbs=create;delete;get;list;patch;update;watch
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=consistencygroups,verbs=get;list;watch
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=daemons/finalizers,verbs=update
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=daemons/status,verbs=get;patch;update
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=daemons,verbs=create;delete;get;list;patch;update;watch
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=diskjobs/finalizers,verbs=update
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=diskjobs/status,verbs=get;patch;update
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=diskjobs,verbs=create;delete;get;list;patch;update;watch
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=dnss/finalizers,verbs=update
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=dnss/status,verbs=get;patch;update
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=dnss,verbs=create;delete;get;list;patch;update;watch
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=encryptionconfigs/finalizers,verbs=update
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=encryptionconfigs/status,verbs=get;patch;update
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=encryptionconfigs,verbs=create;delete;get;list;patch;update;watch
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=filesystems/finalizers,verbs=update
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=filesystems/status,verbs=get;list;patch;update;watch
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=filesystems,verbs=create;delete;get;list;patch;update;watch
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=*/finalizers,verbs=update
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=grafanabridges/finalizers,verbs=update
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=grafanabridges/status,verbs=delete;get;patch;update
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=grafanabridges,verbs=create;delete;get;list;patch;update;watch
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=guis/finalizers,verbs=update
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=guis/status,verbs=get;patch;update
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=guis,verbs=create;delete;get;list;patch;update;watch
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=localdisks/finalizers,verbs=update
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=localdisks/status,verbs=get;patch;update
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=localdisks,verbs=create;delete;get;list;patch;update;watch
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=pmcollectors/finalizers,verbs=update
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=pmcollectors/status,verbs=get;patch;update
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=pmcollectors,verbs=create;delete;get;list;patch;update;watch
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=recoverygroups/finalizers,verbs=update
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=recoverygroups/status,verbs=get;patch;update
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=recoverygroups,verbs=create;delete;get;list;patch;update;watch
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=regionaldrexports/finalizers,verbs=update
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=regionaldrexports/status,verbs=get;patch;update
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=regionaldrexports,verbs=create;get;list;patch;update;watch
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=regionaldrs/finalizers,verbs=get;patch;update
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=regionaldrs/status,verbs=get;patch;update
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=regionaldrs,verbs=get;list;patch;update;watch
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=regionaldrs,verbs=get;list;watch
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=remoteclusters/finalizers,verbs=update
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=remoteclusters/status,verbs=get;patch;update
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=remoteclusters,verbs=create;delete;get;list;patch;update;watch
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=restripefsjobs/finalizers,verbs=update
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=restripefsjobs/status,verbs=get;patch;update
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=restripefsjobs,verbs=create;delete;get;list;patch;update;watch
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=*/status,verbs=get;patch;update
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=stretchclusterinitnodes/finalizers,verbs=update
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=stretchclusterinitnodes/status,verbs=get;patch;update
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=stretchclusterinitnodes,verbs=create;delete;get;list;patch;update;watch
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=stretchclusters/finalizers,verbs=update
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=stretchclusters/status,verbs=get;patch;update
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=stretchclusters,verbs=create;delete;get;list;patch;update;watch
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=stretchclustertiebreaker/finalizers,verbs=update
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=stretchclustertiebreaker/status,verbs=get;patch;update
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=stretchclustertiebreaker,verbs=create;delete;get;list;patch;update;watch
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=upgradeapprovals/status,verbs=get;patch;update
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=upgradeapprovals,verbs=create;delete;get;list;patch;update;watch
//+kubebuilder:rbac:groups=scale.spectrum.ibm.com,resources=*,verbs=create;delete;get;list;patch;update;watch
//+kubebuilder:rbac:groups=security.openshift.io,resources=securitycontextconstraints,verbs=*
//+kubebuilder:rbac:groups=security.openshift.io,resources=securitycontextconstraints,verbs=list;watch;delete;update;get;create;patch
//+kubebuilder:rbac:groups=security.openshift.io,resources=securitycontextconstraints,verbs=use
//+kubebuilder:rbac:groups=storage.k8s.io,resources=csidrivers,verbs=create;delete;get;list;patch;update;watch
//+kubebuilder:rbac:groups=storage.k8s.io,resources=csidrivers,verbs=get;list;watch
//+kubebuilder:rbac:groups=storage.k8s.io,resources=storageclasses,verbs=create;delete;get;list;patch;update;watch
//+kubebuilder:rbac:groups=storage.k8s.io,resources=volumeattachments,verbs=create;delete;get;list;patch;update;watch
// IBM_RBAC_MARKER_END

// Reconcile is part of the main kubernetes reconciliation loop which aims to
// move the current state of the cluster closer to the desired state.
// TODO(user): Modify the Reconcile function to compare the state specified by
// the FusionAccess object against the actual cluster state, and then
// perform operations to make the cluster state reflect the state specified by
// the user.
//
// For more details, check Reconcile and its Result here:
// - https://pkg.go.dev/sigs.k8s.io/controller-runtime@v0.17.3/pkg/reconcile
func (r *FusionAccessReconciler) Reconcile(
	ctx context.Context,
	req ctrl.Request,
) (ctrl.Result, error) {
	_ = log.FromContext(ctx)

	// TODO(user): your logic here
	fusionaccess := &fusionv1alpha1.FusionAccess{}
	err := r.Get(ctx, req.NamespacedName, fusionaccess)
	if err != nil {
		if kerrors.IsNotFound(err) {
			return ctrl.Result{}, nil
		}
		return ctrl.Result{}, err
	}

	// // Check if the FusionAccess instance is marked to be deleted, which is
	// // indicated by the deletion timestamp being set.
	// isFusionAccessMarkedToBeDeleted := fusionaccess.GetDeletionTimestamp() != nil
	// if isFusionAccessMarkedToBeDeleted {
	// 	if controllerutil.ContainsFinalizer(fusionaccess, storageScaleFinalizer) {
	// 		// Run finalization logic for storageScaleFinalizer. If the
	// 		// finalization logic fails, don't remove the finalizer so
	// 		// that we can retry during the next reconciliation.
	// 		if err := r.finalizeFusionAccess(log.Log, fusionaccess); err != nil {
	// 			return ctrl.Result{}, err
	// 		}

	// 		// Remove memcachedFinalizer. Once all finalizers have been
	// 		// removed, the object will be deleted.
	// 		controllerutil.RemoveFinalizer(fusionaccess, storageScaleFinalizer)
	// 		err := r.Update(ctx, fusionaccess)
	// 		if err != nil {
	// 			return ctrl.Result{}, err
	// 		}
	// 	}
	// 	return ctrl.Result{}, nil
	// }
	// // Add finalizer for this CR
	// if !controllerutil.ContainsFinalizer(fusionaccess, storageScaleFinalizer) {
	// 	controllerutil.AddFinalizer(fusionaccess, storageScaleFinalizer)
	// 	err = r.Update(ctx, fusionaccess)
	// 	if err != nil {
	// 		return ctrl.Result{}, err
	// 	}
	// }
	ns, err := utils.GetDeploymentNamespace()
	if err != nil {
		return ctrl.Result{}, err
	}

	install_path, err := getIbmManifest(fusionaccess.Spec)
	if err != nil {
		return ctrl.Result{}, err
	}

	installManifest, err := manifestival.NewManifest(
		install_path,
		manifestival.UseClient(mfc.NewClient(r.Client)),
	)
	if err != nil {
		return ctrl.Result{}, err
	}
	log.Log.Info(fmt.Sprintf("Applying manifest from %s", install_path))

	if err := installManifest.Apply(); err != nil {
		log.Log.Error(err, "Error applying manifest")
		fusionaccess.Status.Status = "Error"
		meta.SetStatusCondition(&fusionaccess.Status.Conditions,
			v1.Condition{Type: "ManifestApply", Status: v1.ConditionFalse, Reason: "ReconcileCompleted", Message: "Storage Scale manifest apply failed"})
		serr := r.Status().Update(ctx, fusionaccess)
		if serr != nil {
			return ctrl.Result{}, errors.Join(serr, err)
		}
		return ctrl.Result{}, err
	}
	log.Log.Info(fmt.Sprintf("Applied manifest from %s", install_path))
	meta.SetStatusCondition(&fusionaccess.Status.Conditions,
		v1.Condition{Type: "ManifestApply", Status: v1.ConditionTrue, Reason: "ReconcileCompleted", Message: "Storage Scale manifest was applied"})
	serr := r.Status().Update(ctx, fusionaccess)
	if serr != nil {
		return ctrl.Result{}, serr
	}
	// We try and create the entitlement secrets only if we found the "fusion-pullsecret" in our namespace
	// If we don't find it, we don't create the entitlement secrets and we keep going as a user might be
	// patching the global pull secret
	secret, err := getPullSecretContent(FUSIONPULLSECRETNAME, ns, ctx, r.fullClient)
	if err != nil {
		log.Log.Info(
			"Pull secret not found, skipping entitlement secret creation, we will watch this secret",
		)
	} else {
		// Create entitlement secrets
		err = updateEntitlementPullSecrets(secret, ctx, r.fullClient, ns)
		if err != nil {
			log.Log.Error(err, "Error creating entitlement secrets")
			return reconcile.Result{}, err
		}
		log.Log.Info("Entitlement secrets created")
	}

	// Check if can pull the image if we have not already or if it failed previously
	// Only do this check if we have a set cnsa version
	if fusionaccess.Spec.StorageScaleVersion != "" {
		err = r.runPullImageCheck(ctx, ns, fusionaccess)
		if err != nil {
			fusionaccess.Status.Status = "ErrImagePull"
			meta.SetStatusCondition(&fusionaccess.Status.Conditions,
				v1.Condition{Type: "ImagePull", Status: v1.ConditionFalse, Reason: "ImagePullDone", Message: "protected images can't be pulled"})
			serr := r.Status().Update(ctx, fusionaccess)
			if serr != nil {
				return ctrl.Result{}, errors.Join(serr, err)
			}
			return ctrl.Result{}, err
		}
		meta.SetStatusCondition(&fusionaccess.Status.Conditions,
			v1.Condition{Type: "ImagePull", Status: v1.ConditionTrue, Reason: "ImagePullDone", Message: "protected images pulled successfully"})
		serr := r.Status().Update(ctx, fusionaccess)
		if serr != nil {
			return ctrl.Result{}, serr
		}
	} else {
		log.Log.Info("Skipping image pull check as we are not using a Storage Scale version in the spec")
	}

	if err := console.CreateOrUpdatePlugin(ctx, r.Client); err != nil {
		return ctrl.Result{}, err
	}
	log.Log.Info("Successfully created / updated console plugin resources")

	if err := console.EnablePlugin(ctx, r.Client); err != nil {
		return ctrl.Result{}, err
	}
	log.Log.Info("Successfully enabled console plugin")

	if fusionaccess.Spec.LocalVolumeDiscovery.Create {
		// Create Device discovery

		lvd := localvolumediscovery.NewLocalVolumeDiscovery(ns)
		if err := localvolumediscovery.CreateOrUpdateLocalVolumeDiscovery(ctx, lvd, r.Client); err != nil {
			return ctrl.Result{}, err
		}
	}

	fusionaccess.Status.Status = "Ready"
	err = r.Status().Update(ctx, fusionaccess)
	if err != nil {
		return ctrl.Result{}, err
	}
	return ctrl.Result{}, nil
}

// SetupWithManager sets up the controller with the Manager.
func (r *FusionAccessReconciler) SetupWithManager(mgr ctrl.Manager) error {
	var err error
	r.config = mgr.GetConfig()
	if r.dynamicClient, err = dynamic.NewForConfig(r.config); err != nil {
		return err
	}
	if r.fullClient, err = kubernetes.NewForConfig(r.config); err != nil {
		return err
	}
	return ctrl.NewControllerManagedBy(mgr).
		For(&fusionv1alpha1.FusionAccess{}).
		Watches(
			&corev1.Secret{},
			handler.EnqueueRequestsFromMapFunc(r.getPullSecretSelector),
			isItOurPullSecret(),
		).
		Complete(r)
}

func (r *FusionAccessReconciler) getPullSecretSelector(
	ctx context.Context,
	_ client.Object,
) []reconcile.Request {
	ns, err := utils.GetDeploymentNamespace()
	if err != nil {
		return []reconcile.Request{}
	}
	if _, err := getPullSecretContent(FUSIONPULLSECRETNAME, ns, ctx, r.fullClient); err != nil {
		// The secret in the namespace is not there yet
		return []reconcile.Request{}
	}
	fusionAccessList := &fusionv1alpha1.FusionAccessList{}
	if err := r.List(ctx, fusionAccessList, client.InNamespace(ns)); err != nil {
		return nil
	}
	if len(fusionAccessList.Items) == 0 {
		log.Log.Info("No FusionAccess instance found, skipping pull secret")
		return []reconcile.Request{}
	}

	// We enforce a single fusionAccess instance via webhooks so we can take the first
	req := reconcile.Request{
		NamespacedName: client.ObjectKeyFromObject(&fusionAccessList.Items[0]),
	}
	log.Log.Info("Enqueueing request for", "request", req)
	return []reconcile.Request{req}
}

func (r *FusionAccessReconciler) runPullImageCheck(ctx context.Context, ns string, fusionaccess *fusionv1alpha1.FusionAccess) error {
	testImage, err := utils.GetExternalTestImage(string(fusionaccess.Spec.StorageScaleVersion))
	if err != nil {
		log.Log.Error(err, "Could not figure out test image", "testImage", testImage)
		return err
	}
	ok, err := r.CanPullImage(ctx, r.fullClient, ns, testImage, IBMENTITLEMENTNAME)
	if ok {
		log.Log.Info("Image pull test succeeded", "ns", ns, "testImage", testImage)
	} else {
		log.Log.Error(err, "Image pull test failed", "ns", ns, "testImage", testImage)
	}
	return nil
}

func getIbmManifest(fusionobj fusionv1alpha1.FusionAccessSpec) (string, error) {
	extManifestURL := fusionobj.ExternalManifestURL
	ibmCnsaVersion := fusionobj.StorageScaleVersion
	if extManifestURL != "" {
		log.Log.Info(fmt.Sprintf("Using external manifest URL: %s", extManifestURL))
		if utils.IsExternalManifestURLAllowed(extManifestURL) {
			return extManifestURL, nil
		}
		return "", fmt.Errorf("disallowed URL for external manifest: %s", extManifestURL)
	} else if ibmCnsaVersion != "" {
		log.Log.Info(fmt.Sprintf("Using IBM repo manifest: %s", ibmCnsaVersion))
		install_path, err := utils.GetInstallPath(string(ibmCnsaVersion))
		if err != nil {
			return "", err
		}
		return install_path, nil
	}
	return "", fmt.Errorf("no Storage Scale manifest version and no external manifest specified")
}

// isItOurPullSecret returns true for Create or changed Update events
func isItOurPullSecret() builder.WatchesOption {
	return builder.WithPredicates(predicate.Funcs{
		CreateFunc: func(e event.CreateEvent) bool {
			ns, err := utils.GetDeploymentNamespace()
			if err != nil {
				return false
			}
			newSecret, ok := e.Object.DeepCopyObject().(*corev1.Secret)
			if !ok {
				return false
			}
			return checkPullSecret(newSecret, ns)
		},
		UpdateFunc: func(e event.UpdateEvent) bool {
			ns, err := utils.GetDeploymentNamespace()
			if err != nil {
				return false
			}
			newSecret, ok := e.ObjectNew.DeepCopyObject().(*corev1.Secret)
			if !ok {
				return false
			}
			oldSecret, ok := e.ObjectOld.DeepCopyObject().(*corev1.Secret)
			if !ok {
				return true
			}
			if !checkPullSecret(newSecret, ns) {
				return false
			}
			return !reflect.DeepEqual(oldSecret.Data, newSecret.Data)
		},
		DeleteFunc: func(_ event.DeleteEvent) bool {
			return false
		},
		GenericFunc: func(_ event.GenericEvent) bool {
			return false
		},
	})
}

func checkPullSecret(secret *corev1.Secret, ns string) bool {
	if secret.Type != "Opaque" {
		return false
	}
	if secret.Name != FUSIONPULLSECRETNAME {
		return false
	}
	if secret.Namespace != ns {
		return false
	}
	return true
}

// func (r *FusionAccessReconciler) finalizeFusionAccess(reqLogger logr.Logger, sc *v1alpha1.FusionAccess) error {
// 	// TODO(user): Add the cleanup steps that the operator
// 	// needs to do before the CR can be deleted. Examples
// 	// of finalizers include performing backups and deleting
// 	// resources that are not owned by this CR, like a PVC.
// 	reqLogger.Info("Successfully finalized FusionAccess")
// 	return nil
// }
