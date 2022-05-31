//go:build !ignore_autogenerated
// +build !ignore_autogenerated

// Code generated by controller-gen. DO NOT EDIT.

package v1alpha1

import (
	runtime "k8s.io/apimachinery/pkg/runtime"
)

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *EmailPolicy) DeepCopyInto(out *EmailPolicy) {
	*out = *in
	out.TypeMeta = in.TypeMeta
	in.ObjectMeta.DeepCopyInto(&out.ObjectMeta)
	in.Spec.DeepCopyInto(&out.Spec)
	out.Status = in.Status
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new EmailPolicy.
func (in *EmailPolicy) DeepCopy() *EmailPolicy {
	if in == nil {
		return nil
	}
	out := new(EmailPolicy)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyObject is an autogenerated deepcopy function, copying the receiver, creating a new runtime.Object.
func (in *EmailPolicy) DeepCopyObject() runtime.Object {
	if c := in.DeepCopy(); c != nil {
		return c
	}
	return nil
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *EmailPolicyList) DeepCopyInto(out *EmailPolicyList) {
	*out = *in
	out.TypeMeta = in.TypeMeta
	in.ListMeta.DeepCopyInto(&out.ListMeta)
	if in.Items != nil {
		in, out := &in.Items, &out.Items
		*out = make([]EmailPolicy, len(*in))
		for i := range *in {
			(*in)[i].DeepCopyInto(&(*out)[i])
		}
	}
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new EmailPolicyList.
func (in *EmailPolicyList) DeepCopy() *EmailPolicyList {
	if in == nil {
		return nil
	}
	out := new(EmailPolicyList)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyObject is an autogenerated deepcopy function, copying the receiver, creating a new runtime.Object.
func (in *EmailPolicyList) DeepCopyObject() runtime.Object {
	if c := in.DeepCopy(); c != nil {
		return c
	}
	return nil
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *EmailPolicyRateLimiting) DeepCopyInto(out *EmailPolicyRateLimiting) {
	*out = *in
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new EmailPolicyRateLimiting.
func (in *EmailPolicyRateLimiting) DeepCopy() *EmailPolicyRateLimiting {
	if in == nil {
		return nil
	}
	out := new(EmailPolicyRateLimiting)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *EmailPolicySMTPSink) DeepCopyInto(out *EmailPolicySMTPSink) {
	*out = *in
	out.Server = in.Server
	out.Credentials = in.Credentials
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new EmailPolicySMTPSink.
func (in *EmailPolicySMTPSink) DeepCopy() *EmailPolicySMTPSink {
	if in == nil {
		return nil
	}
	out := new(EmailPolicySMTPSink)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *EmailPolicySink) DeepCopyInto(out *EmailPolicySink) {
	*out = *in
	out.SMTP = in.SMTP
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new EmailPolicySink.
func (in *EmailPolicySink) DeepCopy() *EmailPolicySink {
	if in == nil {
		return nil
	}
	out := new(EmailPolicySink)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *EmailPolicySpec) DeepCopyInto(out *EmailPolicySpec) {
	*out = *in
	in.PodSelector.DeepCopyInto(&out.PodSelector)
	out.RateLimiting = in.RateLimiting
	out.Sink = in.Sink
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new EmailPolicySpec.
func (in *EmailPolicySpec) DeepCopy() *EmailPolicySpec {
	if in == nil {
		return nil
	}
	out := new(EmailPolicySpec)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *EmailPolicyStatus) DeepCopyInto(out *EmailPolicyStatus) {
	*out = *in
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new EmailPolicyStatus.
func (in *EmailPolicyStatus) DeepCopy() *EmailPolicyStatus {
	if in == nil {
		return nil
	}
	out := new(EmailPolicyStatus)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *ObjectReference) DeepCopyInto(out *ObjectReference) {
	*out = *in
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new ObjectReference.
func (in *ObjectReference) DeepCopy() *ObjectReference {
	if in == nil {
		return nil
	}
	out := new(ObjectReference)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *SMTPServer) DeepCopyInto(out *SMTPServer) {
	*out = *in
	out.TypeMeta = in.TypeMeta
	in.ObjectMeta.DeepCopyInto(&out.ObjectMeta)
	out.Spec = in.Spec
	out.Status = in.Status
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new SMTPServer.
func (in *SMTPServer) DeepCopy() *SMTPServer {
	if in == nil {
		return nil
	}
	out := new(SMTPServer)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyObject is an autogenerated deepcopy function, copying the receiver, creating a new runtime.Object.
func (in *SMTPServer) DeepCopyObject() runtime.Object {
	if c := in.DeepCopy(); c != nil {
		return c
	}
	return nil
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *SMTPServerList) DeepCopyInto(out *SMTPServerList) {
	*out = *in
	out.TypeMeta = in.TypeMeta
	in.ListMeta.DeepCopyInto(&out.ListMeta)
	if in.Items != nil {
		in, out := &in.Items, &out.Items
		*out = make([]SMTPServer, len(*in))
		for i := range *in {
			(*in)[i].DeepCopyInto(&(*out)[i])
		}
	}
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new SMTPServerList.
func (in *SMTPServerList) DeepCopy() *SMTPServerList {
	if in == nil {
		return nil
	}
	out := new(SMTPServerList)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyObject is an autogenerated deepcopy function, copying the receiver, creating a new runtime.Object.
func (in *SMTPServerList) DeepCopyObject() runtime.Object {
	if c := in.DeepCopy(); c != nil {
		return c
	}
	return nil
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *SMTPServerSpec) DeepCopyInto(out *SMTPServerSpec) {
	*out = *in
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new SMTPServerSpec.
func (in *SMTPServerSpec) DeepCopy() *SMTPServerSpec {
	if in == nil {
		return nil
	}
	out := new(SMTPServerSpec)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *SMTPServerStatus) DeepCopyInto(out *SMTPServerStatus) {
	*out = *in
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new SMTPServerStatus.
func (in *SMTPServerStatus) DeepCopy() *SMTPServerStatus {
	if in == nil {
		return nil
	}
	out := new(SMTPServerStatus)
	in.DeepCopyInto(out)
	return out
}
