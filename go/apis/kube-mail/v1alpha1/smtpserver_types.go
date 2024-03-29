package v1alpha1

import metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

type SMTPAuthType string

const (
	SMTPAuthTypePlain     SMTPAuthType = "PLAIN"
	SMTPAuthTypeLogin     SMTPAuthType = "LOGIN"
	SMTPAuthTypeCRAMMD5   SMTPAuthType = "CRAM-MD5"
	SMTPAuthTypeSCRAMSHA1 SMTPAuthType = "SCRAM-SHA-1"
)

type SMTPConnectType string

const (
	SMTPConnectTypePlain     SMTPConnectType = "plain"
	SMTPConnectTypeSSL     SMTPConnectType = "ssl"
	SMTPConnectTypeSTARTTLS SMTPConnectType = "starttls"
)

type SMTPServerSpec struct {
	Server string `json:"server"`

	// +optional
	Port int `json:"port,omitempty"`

	// DEPRECATED: Use Connect, instead
	// +kubebuilder:deprecatedversion:warning="TLS is deprecated use Connect instead."
	// +optional
	TLS bool `json:"tls,omitempty"`
	
	// +kubebuilder:validation:Enum=plain;ssl;starttls
	// +optional
	Connect SMTPConnectType `json:"connect,omitempty" ts_type:"connect"`

	// +optional
	// +kubebuilder:validation:Enum=PLAIN;LOGIN;CRAM-MD5;SCRAM-SHA-1
	AuthType SMTPAuthType `json:"authType,omitempty" ts_type:"authType"`
}

type SMTPServerStatus struct {
}

// +kubebuilder:object:root=true
// +kubebuilder:subresource:status
// +kubebuilder:resource:path=smtpservers,scope=Namespaced,shortName=smtpserver
// +kubebuilder:printcolumn:name="SMTP Server",type="string",JSONPath=".spec.server",description="SMTP server hostname"

// SMTPServer is the Schema for the smtpserver API
type SMTPServer struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   SMTPServerSpec   `json:"spec,omitempty"`
	Status SMTPServerStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true

// SMTPServerList contains a list of Project
type SMTPServerList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []SMTPServer `json:"items"`
}

func init() {
	SchemeBuilder.Register(&SMTPServer{}, &SMTPServerList{})
}
