// Code generated by applyconfiguration-gen. DO NOT EDIT.

package v1

import (
	corev1 "k8s.io/api/core/v1"
)

// BuildOverridesApplyConfiguration represents a declarative configuration of the BuildOverrides type for use
// with apply.
type BuildOverridesApplyConfiguration struct {
	ImageLabels  []ImageLabelApplyConfiguration `json:"imageLabels,omitempty"`
	NodeSelector map[string]string              `json:"nodeSelector,omitempty"`
	Tolerations  []corev1.Toleration            `json:"tolerations,omitempty"`
	ForcePull    *bool                          `json:"forcePull,omitempty"`
}

// BuildOverridesApplyConfiguration constructs a declarative configuration of the BuildOverrides type for use with
// apply.
func BuildOverrides() *BuildOverridesApplyConfiguration {
	return &BuildOverridesApplyConfiguration{}
}

// WithImageLabels adds the given value to the ImageLabels field in the declarative configuration
// and returns the receiver, so that objects can be build by chaining "With" function invocations.
// If called multiple times, values provided by each call will be appended to the ImageLabels field.
func (b *BuildOverridesApplyConfiguration) WithImageLabels(values ...*ImageLabelApplyConfiguration) *BuildOverridesApplyConfiguration {
	for i := range values {
		if values[i] == nil {
			panic("nil value passed to WithImageLabels")
		}
		b.ImageLabels = append(b.ImageLabels, *values[i])
	}
	return b
}

// WithNodeSelector puts the entries into the NodeSelector field in the declarative configuration
// and returns the receiver, so that objects can be build by chaining "With" function invocations.
// If called multiple times, the entries provided by each call will be put on the NodeSelector field,
// overwriting an existing map entries in NodeSelector field with the same key.
func (b *BuildOverridesApplyConfiguration) WithNodeSelector(entries map[string]string) *BuildOverridesApplyConfiguration {
	if b.NodeSelector == nil && len(entries) > 0 {
		b.NodeSelector = make(map[string]string, len(entries))
	}
	for k, v := range entries {
		b.NodeSelector[k] = v
	}
	return b
}

// WithTolerations adds the given value to the Tolerations field in the declarative configuration
// and returns the receiver, so that objects can be build by chaining "With" function invocations.
// If called multiple times, values provided by each call will be appended to the Tolerations field.
func (b *BuildOverridesApplyConfiguration) WithTolerations(values ...corev1.Toleration) *BuildOverridesApplyConfiguration {
	for i := range values {
		b.Tolerations = append(b.Tolerations, values[i])
	}
	return b
}

// WithForcePull sets the ForcePull field in the declarative configuration to the given value
// and returns the receiver, so that objects can be built by chaining "With" function invocations.
// If called multiple times, the ForcePull field is set to the value of the last call.
func (b *BuildOverridesApplyConfiguration) WithForcePull(value bool) *BuildOverridesApplyConfiguration {
	b.ForcePull = &value
	return b
}
