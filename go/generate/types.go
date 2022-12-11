package main

import (
	"fmt"
	"path"

	"github.com/mittwald/kube-mail/go/apis/kube-mail/v1alpha1"
	"github.com/tkrajina/typescriptify-golang-structs/typescriptify"
)

const tsPath = "../../src/k8s/types/v1alpha1/"

func main() {
	t := typescriptify.New()
	t.CreateInterface = true
	t.BackupDir = ""

	t.AddImport(`import {LabelSelector} from "@mittwald/kubernetes/types/meta/v1"`)
	t.AddImport(`import {policyPeriod} from "./enums"`)

	t.Add(v1alpha1.ObjectReference{})
	t.Add(v1alpha1.EmailPolicySMTPSink{})
	t.Add(v1alpha1.EmailPolicyRateLimiting{})
	t.Add(v1alpha1.EmailPolicySink{})
	t.Add(v1alpha1.EmailPolicySpec{})

	err := t.ConvertToFile(path.Join(tsPath, "emailpolicy_spec.ts"))
	if err != nil {
		panic(err.Error())
	}
	fmt.Println("OK")

	t = typescriptify.New()
	t.CreateInterface = true
	t.BackupDir = ""

	t.AddImport(`import {authType} from "./enums"`)

	t.Add(v1alpha1.SMTPServerSpec{})

	err = t.ConvertToFile(path.Join(tsPath, "smtpserver_spec.ts"))
	if err != nil {
		panic(err.Error())
	}
	fmt.Println("OK")
}
