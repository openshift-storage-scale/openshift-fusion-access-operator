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

	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/runtime"
	ctrl "sigs.k8s.io/controller-runtime"
	logf "sigs.k8s.io/controller-runtime/pkg/log"
	"sigs.k8s.io/controller-runtime/pkg/webhook"
)

/*
25 minutes was chosen as the termination grace period as it should be enough time to allow almost all scenarios to
complete their kmm build. On a standard 3 node cluster, this build pod only takes a few minutes. Theoretically
it will take longer on larger clusters or with worse connections. Thus, 25 minutes should be plenty of time
for most cases. If we find many cases where this is not enough, then we can update it to be longer.
*/
const (
	TERMINATION_GRACE_PERIOD_SECONDS int64 = 60 * 25
)

var kmmPodLog = logf.Log.WithName("kmm-pod-webhook")

// +kubebuilder:object:generate=false
// +k8s:deepcopy-gen=false
// +k8s:openapi-gen=false
type KMMPodMutator struct{}

//nolint:lll
// +kubebuilder:webhook:verbs=create,path=/mutate-v1-kmm-builder-pod,mutating=true,failurePolicy=fail,groups="",resources=pods,versions=v1,name=kmm-builder-pod-protection.fusion.storage.openshift.io,admissionReviewVersions=v1,sideEffects=none

var _ webhook.CustomDefaulter = &KMMPodMutator{}

func (r *KMMPodMutator) SetupWebhookWithManager(mgr ctrl.Manager) error {
	return ctrl.NewWebhookManagedBy(mgr).
		For(&corev1.Pod{}).
		WithDefaulter(r).
		// TODO check if this is needed, I had some issues with the path being some default value, not respecting the kubebuilder annotation above
		WithCustomPath("/mutate-v1-kmm-builder-pod").
		Complete()
}

func (r *KMMPodMutator) Default(_ context.Context, obj runtime.Object) error {
	pod, ok := obj.(*corev1.Pod)
	if !ok {
		return fmt.Errorf("expected a Pod object but got %T", obj)
	}

	kmmPodLog.Info("Mutating KMM builder pod", "pod", pod.Name, "namespace", pod.Namespace)

	var terminationGracePeriod = TERMINATION_GRACE_PERIOD_SECONDS
	pod.Spec.TerminationGracePeriodSeconds = &terminationGracePeriod

	return nil
}
