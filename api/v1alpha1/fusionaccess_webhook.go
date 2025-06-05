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

package v1alpha1

import (
	"context"
	"fmt"

	"github.com/openshift-storage-scale/openshift-fusion-access-operator/internal/utils"
	configclient "github.com/openshift/client-go/config/clientset/versioned"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/client-go/rest"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	logf "sigs.k8s.io/controller-runtime/pkg/log"
	"sigs.k8s.io/controller-runtime/pkg/webhook"
	"sigs.k8s.io/controller-runtime/pkg/webhook/admission"
)

// log is for logging in this package.
var fusionaccesslog = logf.Log.WithName("fusionaccess-resource")

// +kubebuilder:object:generate=false
// +k8s:deepcopy-gen=false
// +k8s:openapi-gen=false
// FusionAccessValidator is responsible for setting default values on the FusionAccess resources
// when created or updated.
//
// NOTE: The +kubebuilder:object:generate=false and +k8s:deepcopy-gen=false marker prevents controller-gen from generating DeepCopy methods,
// as it is used only for temporary operations and does not need to be deeply copied.
type FusionAccessValidator struct {
	Client       client.Client
	config       *rest.Config
	configClient configclient.Interface
}

// FIXME(bandini): This needs to be reviewed more in detail. I added sideEffects=none to get it passing but not 100% sure about it
//nolint:lll
// +kubebuilder:webhook:verbs=create;update,path=/validate-fusion-storage-openshift-io-v1alpha1-fusionaccess,mutating=false,failurePolicy=fail,groups=fusion.storage.openshift.io,resources=fusionaccesses,versions=v1alpha1,name=fusion.storage.openshift.io,admissionReviewVersions=v1,sideEffects=none

var _ webhook.CustomValidator = &FusionAccessValidator{}

// SetupWebhookWithManager will setup the manager to manage the webhooks
func (r *FusionAccessValidator) SetupWebhookWithManager(mgr ctrl.Manager) error {
	r.Client = mgr.GetClient()
	r.config = mgr.GetConfig()
	var err error
	if r.configClient, err = configclient.NewForConfig(r.config); err != nil {
		return err
	}
	return ctrl.NewWebhookManagedBy(mgr).
		For(&FusionAccess{}).
		WithValidator(r).
		Complete()
}

// ValidateCreate implements webhook.Validator so a webhook will be registered for the type
func (r *FusionAccessValidator) ValidateCreate(ctx context.Context, obj runtime.Object) (admission.Warnings, error) {
	p, err := convertToFusionAccess(obj)
	if err != nil {
		fusionaccesslog.Error(err, "validate create", "name", p.Name)
		return nil, err
	}

	// Make sure the FusionAccess object is a singleton
	var fusionaccesses FusionAccessList
	if err = r.Client.List(ctx, &fusionaccesses); err != nil {
		return nil, fmt.Errorf("failed to list FusionAccess resources: %v", err)
	}
	if len(fusionaccesses.Items) > 0 {
		return nil, fmt.Errorf("only one FusionAccess resource is allowed")
	}

	clusterVersions, err := r.configClient.ConfigV1().ClusterVersions().Get(context.Background(), "version", metav1.GetOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to list ClusterVersions: %v", err)
	}

	// Check if the IBM version we are running is an allowed one
	ocpVersion, err := utils.GetCurrentClusterVersion(clusterVersions)
	if err != nil {
		return nil, fmt.Errorf("failed to get current cluster version: %v", err)
	}
	if !utils.IsOpenShiftSupported(string(p.Spec.StorageScaleVersion), *ocpVersion) {
		// FIXME(bandini): we currently only log this so QE can test on upcoming versions that are not yet supported by IBM
		fusionaccesslog.Info("IBM Storage Scale version not supported", "OCP Version", ocpVersion, "IBM Storage ScaleVersion", p.Spec.StorageScaleVersion)
		// FIXME(bandini): return nil, fmt.Errorf("IBM Storage Scale version %s is not supported", ocpVersion)
	} else {
		fusionaccesslog.Info("validate create", "name", p.Name, "OCP Version", ocpVersion, "IBM Storage Scale Version", p.Spec.StorageScaleVersion)
	}
	return nil, nil
}

// ValidateUpdate implements webhook.Validator so a webhook will be registered for the type
func (r *FusionAccessValidator) ValidateUpdate(_ context.Context, oldObj, newObj runtime.Object) (admission.Warnings, error) {
	p, err := convertToFusionAccess(oldObj)
	if err != nil {
		fusionaccesslog.Error(err, "validate update", "name", p.Name)
		return nil, err
	}
	pNew, err := convertToFusionAccess(newObj)
	if err != nil {
		fusionaccesslog.Error(err, "validate update", "name", pNew.Name)
		return nil, err
	}

	// FIXME(bandini): IBM CNSA version cannot be updated for now
	// FIXME(bandini): Maybe here we could introduce code to double check which upgrades paths we allow
	// but for now we just log things
	// if pNew.Spec.IbmCnsaVersion != p.Spec.IbmCnsaVersion {
	// 	return nil, fmt.Errorf("IBM CNSA version cannot be updated")
	// }
	fusionaccesslog.Info(
		"validate update",
		"name",
		p.Name,
		"new version",
		pNew.Spec.StorageScaleVersion,
		"old version",
		p.Spec.StorageScaleVersion,
	)

	return nil, nil
}

// ValidateDelete implements webhook.Validator so a webhook will be registered for the type
func (r *FusionAccessValidator) ValidateDelete(
	_ context.Context,
	obj runtime.Object,
) (admission.Warnings, error) {
	p, err := convertToFusionAccess(obj)
	if err != nil {
		fusionaccesslog.Error(err, "validate delete", "name", p.Name)
		return nil, err
	}
	fusionaccesslog.Info("validate delete", "name", p.Name)

	return nil, nil
}

func convertToFusionAccess(obj runtime.Object) (*FusionAccess, error) {
	p, ok := obj.(*FusionAccess)
	if !ok {
		return nil, fmt.Errorf("expected a FusionAccess object but got %T", obj)
	}
	return p, nil
}
