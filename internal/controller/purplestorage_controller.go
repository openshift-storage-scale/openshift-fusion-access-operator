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
	"fmt"
	"os"

	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/runtime"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/log"
	"sigs.k8s.io/controller-runtime/pkg/reconcile"

	purplev1alpha1 "github.com/darkdoc/purple-storage-rh-operator/api/v1alpha1"
	mfc "github.com/manifestival/controller-runtime-client"
	"github.com/manifestival/manifestival"
)

// PurpleStorageReconciler reconciles a PurpleStorage object
type PurpleStorageReconciler struct {
	client.Client
	Scheme *runtime.Scheme
}

//+kubebuilder:rbac:groups=purple.purplestorage.com,resources=purplestorages,verbs=get;list;watch;create;update;patch;delete
//+kubebuilder:rbac:groups=purple.purplestorage.com,resources=purplestorages/status,verbs=get;update;patch
//+kubebuilder:rbac:groups=purple.purplestorage.com,resources=purplestorages/finalizers,verbs=update

// Reconcile is part of the main kubernetes reconciliation loop which aims to
// move the current state of the cluster closer to the desired state.
// TODO(user): Modify the Reconcile function to compare the state specified by
// the PurpleStorage object against the actual cluster state, and then
// perform operations to make the cluster state reflect the state specified by
// the user.
//
// For more details, check Reconcile and its Result here:
// - https://pkg.go.dev/sigs.k8s.io/controller-runtime@v0.17.3/pkg/reconcile
func (r *PurpleStorageReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	_ = log.FromContext(ctx)

	// TODO(user): your logic here
	purplestorage := &purplev1alpha1.PurpleStorage{}
	err := r.Get(ctx, req.NamespacedName, purplestorage)
	if err != nil {
		if errors.IsNotFound(err) {
			return ctrl.Result{}, nil
		}
		return ctrl.Result{}, err
	}
	install_path := fmt.Sprintf("files/%s/install.yaml", purplestorage.Spec.Ibm_spectrum_scale_container_native_version)
	_, err = os.Stat(install_path)
	if os.IsNotExist(err) {
		install_path = fmt.Sprintf("/%s", install_path)
		_, err = os.Stat(install_path)
		if os.IsNotExist(err) {
			return ctrl.Result{}, err
		}
	}
	installManifest, err := manifestival.NewManifest(install_path, manifestival.UseClient(mfc.NewClient(r.Client)))
	if err != nil {
		return ctrl.Result{}, err
	}
	log.Log.Info(fmt.Sprintf("Applying manifest from %s", install_path))

	if err := installManifest.Apply(); err != nil {
		log.Log.Error(err, "Error applying manifest")
		return reconcile.Result{}, err
	}
	log.Log.Info(fmt.Sprintf("Applied manifest from %s", install_path))

	log.Log.Info(fmt.Sprintf("Creating machineconfig")) //, install_path))
	mc := NewMachineConfig("label")
	// _, err = client.Resource(gvr).Namespace(namespace).Create(context.TODO(), newArgo, metav1.CreateOptions{})
	err = r.Client.Create(ctx, mc)
	if err != nil {
		return ctrl.Result{}, err
	}
	log.Log.Info(fmt.Sprintf("%#v", mc)) //, install_path))
	return ctrl.Result{}, nil
}

// SetupWithManager sets up the controller with the Manager.
func (r *PurpleStorageReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&purplev1alpha1.PurpleStorage{}).
		Complete(r)
}
