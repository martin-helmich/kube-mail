.PHONY: generate
generate:
	cd go && controller-gen paths=./... crd:trivialVersions=true object output:crd:artifacts:config=../deploy/helm-chart/kube-mail/crds/
	cd go/generate && go run types.go

