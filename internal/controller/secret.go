package controller

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"

	"sigs.k8s.io/controller-runtime/pkg/client"

	"github.com/openshift-storage-scale/openshift-fusion-access-operator/internal/kubeutils"
	"github.com/openshift-storage-scale/openshift-fusion-access-operator/internal/utils"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	"sigs.k8s.io/controller-runtime/pkg/log"
)

const FUSIONPULLSECRETNAME = "fusion-pullsecret"            //nolint:gosec
const EXTRAFUSIONPULLSECRETNAME = "fusion-pullsecret-extra" //nolint:gosec
const IBMENTITLEMENTNAME = "ibm-entitlement-key"
const IBMREGISTRY = "cp.icr.io"
const IBMREGISTRYUSER = "cp"

// IbmEntitlementSecrets returns the list of namespaces where the entitlement secret should be created
// plus the namespace of the operator because in that namespace we do the pod pull check
func IbmEntitlementSecrets(ourNs string) []string {
	return []string{
		ourNs,
		"ibm-spectrum-scale",
		"ibm-spectrum-scale-dns",
		"ibm-spectrum-scale-csi",
		"ibm-spectrum-scale-operator",
	}
}

func newSecret(name, namespace string, secret map[string][]byte, secretType corev1.SecretType, labels map[string]string) *corev1.Secret {
	k8sSecret := &corev1.Secret{
		ObjectMeta: metav1.ObjectMeta{
			Name:      name,
			Namespace: namespace,
			Labels:    labels,
		},
		Data: secret,
		Type: secretType,
	}
	return k8sSecret
}

func getPullSecretContent(name, namespace string, ctx context.Context, cl client.Client) ([]byte, error) { //nolint:unparam
	secret := &corev1.Secret{}
	err := cl.Get(ctx, types.NamespacedName{Namespace: namespace, Name: name}, secret)
	if err != nil {
		return nil, err
	}
	if secret.Type != corev1.SecretTypeOpaque {
		return nil, fmt.Errorf("secret %s is not of type %s", name, corev1.SecretTypeOpaque)
	}
	if secret.Data == nil {
		return nil, fmt.Errorf("secret %s has no data", name)
	}
	secData, ok := secret.Data[IBMENTITLEMENTNAME]
	if !ok {
		return nil, fmt.Errorf("secret %s does not contain %s", name, IBMENTITLEMENTNAME)
	}
	return secData, nil
}

func getDockerConfigSecretJSON(secret []byte) ([]byte, error) {
	auth := base64.StdEncoding.EncodeToString([]byte(fmt.Sprintf("%s:%s", IBMREGISTRYUSER, secret)))
	auths := map[string]any{
		"auths": map[string]any{
			IBMREGISTRY: map[string]string{
				"auth":     auth,
				"username": IBMREGISTRYUSER,
			},
		},
	}
	authsJSON, err := json.Marshal(auths)
	if err != nil {
		return nil, err
	}
	return authsJSON, nil
}

func updateEntitlementPullSecrets(secret []byte, ctx context.Context, cl client.Client, ns string) error {
	secretJson, err := getDockerConfigSecretJSON(secret)
	if err != nil {
		return err
	}

	secretData := map[string][]byte{
		".dockerconfigjson": secretJson,
	}
	destSecretName := IBMENTITLEMENTNAME //nolint:gosec

	extraPullSecret := &corev1.Secret{}
	err = cl.Get(ctx, types.NamespacedName{Namespace: ns, Name: EXTRAFUSIONPULLSECRETNAME}, extraPullSecret)
	if err != nil {
		log.Log.Info(
			"No extra pull secret found",
		)
	}

	for _, destNamespace := range IbmEntitlementSecrets(ns) {
		ibmPullSecret := newSecret(
			destSecretName,
			destNamespace,
			secretData,
			"kubernetes.io/dockerconfigjson",
			nil,
		)
		mergedSecret, err := utils.MergeDockerSecrets(ibmPullSecret, extraPullSecret)
		if err == nil {
			ibmPullSecret = mergedSecret
		}

		if err := kubeutils.CreateOrUpdateResource(ctx, cl, ibmPullSecret, func(existing, desired *corev1.Secret) error {
			existing.Type = desired.Type
			existing.Data = desired.Data
			return nil
		}); err != nil {
			return fmt.Errorf("failed to update secret in updateEntitlementPullSecrets: %w", err)
		}
		continue
		// // err = client.Get(ctx, types.NamespacedName{Namespace: ns, Name: EXTRAFUSIONPULLSECRETNAME}, _)
		// _, err = client.CoreV1().Secrets(destNamespace).Get(ctx, destSecretName, metav1.GetOptions{})
		// if err != nil {
		// 	if kerrors.IsNotFound(err) {
		// 		// Resource does not exist, create it
		// 		_, err := client.CoreV1().Secrets(destNamespace).Create(context.TODO(), ibmPullSecret, metav1.CreateOptions{})
		// 		if err != nil {
		// 			return err
		// 		}
		// 		log.Log.Info(fmt.Sprintf("Created Secret %s in ns %s", destSecretName, destNamespace))
		// 		continue
		// 	}
		// 	return err
		// }
		// // The destination secret already exists so we upate it and return an error if they were different so the reconcile loop can restart
		// _, err = client.CoreV1().Secrets(destNamespace).Update(context.TODO(), ibmPullSecret, metav1.UpdateOptions{})
		// if err == nil {
		// 	log.Log.Info(fmt.Sprintf("Updated Secret %s in ns %s", destSecretName, destNamespace))
		// 	continue
		// }
	}
	return nil
}
