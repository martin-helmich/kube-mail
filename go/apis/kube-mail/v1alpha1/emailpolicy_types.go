package v1alpha1

import (
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type RateLimitingPeriod string

const (
	RateLimitingPeriodHour   RateLimitingPeriod = "hour"
	RateLimitingPeriodMinute RateLimitingPeriod = "minute"
)

type ObjectReference struct {
	Name string `json:"name"`
	// +optional
	Namespace string `json:"namespace,omitempty"`
}

type EmailPolicySMTPSink struct {
	Server ObjectReference `json:"server"`

	// +optional
	Credentials ObjectReference `json:"credentials,omitempty"`
}

type EmailPolicyRateLimiting struct {
	Maximum int `json:"maximum"`

	// +optional
	// +kubebuilder:validation:Enum=hour;minute
	Period RateLimitingPeriod `json:"period,omitempty" ts_type:"policyPeriod"`
}

type EmailPolicySink struct {
	SMTP EmailPolicySMTPSink `json:"smtp"`
}

type EmailPolicySpec struct {
	// +optional
	Default bool `json:"default,omitempty"`

	// +optional
	PodSelector metav1.LabelSelector `json:"podSelector,omitempty" ts_type:"LabelSelector"`

	// +optional
	RateLimiting EmailPolicyRateLimiting `json:"ratelimiting,omitempty"`

	Sink EmailPolicySink `json:"sink"`
}

type EmailPolicyStatus struct {
}

// +kubebuilder:object:root=true
// +kubebuilder:subresource:status
// +kubebuilder:resource:path=emailpolicies,scope=Namespaced,shortName=emailpolicy
// +kubebuilder:printcolumn:name="default",type="boolean",JSONPath=".spec.default",description="describes if this is the default policy"
// +kubebuilder:printcolumn:name="SMTP Server",type="string",JSONPath=".spec.sink.smtp.server",description="which SMTP server mails are forwarded to"

// EmailPolicy is the Schema for the emailpolicy API
type EmailPolicy struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   EmailPolicySpec   `json:"spec,omitempty"`
	Status EmailPolicyStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true

// EmailPolicyList contains a list of Project
type EmailPolicyList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []EmailPolicy `json:"items"`
}

func init() {
	SchemeBuilder.Register(&EmailPolicy{}, &EmailPolicyList{})
}
