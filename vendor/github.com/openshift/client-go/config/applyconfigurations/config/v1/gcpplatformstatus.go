// Code generated by applyconfiguration-gen. DO NOT EDIT.

package v1

// GCPPlatformStatusApplyConfiguration represents a declarative configuration of the GCPPlatformStatus type for use
// with apply.
type GCPPlatformStatusApplyConfiguration struct {
	ProjectID               *string                                    `json:"projectID,omitempty"`
	Region                  *string                                    `json:"region,omitempty"`
	ResourceLabels          []GCPResourceLabelApplyConfiguration       `json:"resourceLabels,omitempty"`
	ResourceTags            []GCPResourceTagApplyConfiguration         `json:"resourceTags,omitempty"`
	CloudLoadBalancerConfig *CloudLoadBalancerConfigApplyConfiguration `json:"cloudLoadBalancerConfig,omitempty"`
}

// GCPPlatformStatusApplyConfiguration constructs a declarative configuration of the GCPPlatformStatus type for use with
// apply.
func GCPPlatformStatus() *GCPPlatformStatusApplyConfiguration {
	return &GCPPlatformStatusApplyConfiguration{}
}

// WithProjectID sets the ProjectID field in the declarative configuration to the given value
// and returns the receiver, so that objects can be built by chaining "With" function invocations.
// If called multiple times, the ProjectID field is set to the value of the last call.
func (b *GCPPlatformStatusApplyConfiguration) WithProjectID(value string) *GCPPlatformStatusApplyConfiguration {
	b.ProjectID = &value
	return b
}

// WithRegion sets the Region field in the declarative configuration to the given value
// and returns the receiver, so that objects can be built by chaining "With" function invocations.
// If called multiple times, the Region field is set to the value of the last call.
func (b *GCPPlatformStatusApplyConfiguration) WithRegion(value string) *GCPPlatformStatusApplyConfiguration {
	b.Region = &value
	return b
}

// WithResourceLabels adds the given value to the ResourceLabels field in the declarative configuration
// and returns the receiver, so that objects can be build by chaining "With" function invocations.
// If called multiple times, values provided by each call will be appended to the ResourceLabels field.
func (b *GCPPlatformStatusApplyConfiguration) WithResourceLabels(values ...*GCPResourceLabelApplyConfiguration) *GCPPlatformStatusApplyConfiguration {
	for i := range values {
		if values[i] == nil {
			panic("nil value passed to WithResourceLabels")
		}
		b.ResourceLabels = append(b.ResourceLabels, *values[i])
	}
	return b
}

// WithResourceTags adds the given value to the ResourceTags field in the declarative configuration
// and returns the receiver, so that objects can be build by chaining "With" function invocations.
// If called multiple times, values provided by each call will be appended to the ResourceTags field.
func (b *GCPPlatformStatusApplyConfiguration) WithResourceTags(values ...*GCPResourceTagApplyConfiguration) *GCPPlatformStatusApplyConfiguration {
	for i := range values {
		if values[i] == nil {
			panic("nil value passed to WithResourceTags")
		}
		b.ResourceTags = append(b.ResourceTags, *values[i])
	}
	return b
}

// WithCloudLoadBalancerConfig sets the CloudLoadBalancerConfig field in the declarative configuration to the given value
// and returns the receiver, so that objects can be built by chaining "With" function invocations.
// If called multiple times, the CloudLoadBalancerConfig field is set to the value of the last call.
func (b *GCPPlatformStatusApplyConfiguration) WithCloudLoadBalancerConfig(value *CloudLoadBalancerConfigApplyConfiguration) *GCPPlatformStatusApplyConfiguration {
	b.CloudLoadBalancerConfig = value
	return b
}
