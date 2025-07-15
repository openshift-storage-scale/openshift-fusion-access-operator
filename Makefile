# VERSION defines the project version for the bundle.
# Update this value when you upgrade the version of your project.
# To re-generate a bundle for another specific version without changing the standard setup, you can:
# - use the VERSION as arg of the bundle target (e.g make bundle VERSION=0.0.2)
# - use environment variables to overwrite this value (e.g export VERSION=0.0.2)
export VERSION ?= $(shell cat VERSION.txt)


OPERATOR_DOCKERFILE ?= operator.Dockerfile
DEVICEFINDER_DOCKERFILE ?= devicefinder.Dockerfile
CONSOLE_PLUGIN_DOCKERFILE ?= console-plugin.Dockerfile

# Version of yaml file to generate rbacs from
RBAC_VERSION ?= v5.2.3.0.1

PULLFILE ?= internal/controller/pull.txt

# CHANNELS define the bundle channels used in the bundle.
# Add a new line here if you would like to change its default config. (E.g CHANNELS = "candidate,fast,stable")
# To re-generate a bundle for other specific channels without changing the standard setup, you can:
# - use the CHANNELS as arg of the bundle target (e.g make bundle CHANNELS=candidate,fast,stable)
# - use environment variables to overwrite this value (e.g export CHANNELS="candidate,fast,stable")
ifneq ($(origin CHANNELS), undefined)
BUNDLE_CHANNELS := --channels=$(CHANNELS)
endif

USE_IMAGE_DIGESTS ?= --use-image-digests

# DEFAULT_CHANNEL defines the default channel used in the bundle.
# Add a new line here if you would like to change its default config. (E.g DEFAULT_CHANNEL = "stable")
# To re-generate a bundle for any other default channel without changing the default setup, you can:
# - use the DEFAULT_CHANNEL as arg of the bundle target (e.g make bundle DEFAULT_CHANNEL=stable)
# - use environment variables to overwrite this value (e.g export DEFAULT_CHANNEL="stable")
ifneq ($(origin DEFAULT_CHANNEL), undefined)
BUNDLE_DEFAULT_CHANNEL := --default-channel=$(DEFAULT_CHANNEL)
endif
BUNDLE_METADATA_OPTS ?= $(BUNDLE_CHANNELS) $(BUNDLE_DEFAULT_CHANNEL) $(USE_IMAGE_DIGESTS)

# IMAGE_TAG_BASE defines the docker.io namespace and part of the image name for remote images.
# This variable is used to construct full image tags for bundle and catalog images.
#
# For example, running 'make bundle-build bundle-push catalog-build catalog-push' will build and push both
# fusion.storage.openshift.io/openshift-fusion-access-operator-bundle:$VERSION and fusion.storage.openshift.io/openshift-fusion-access-operator-catalog:$VERSION.
IMAGE_TAG_BASE ?= quay.io/openshift-storage-scale/openshift-fusion-access


# always release the console with the same tag as the operator and the other way around!
# Image base URL of the console plugin
CONSOLE_PLUGIN_IMAGE_BASE ?= $(IMAGE_TAG_BASE)-console
export CONSOLE_PLUGIN_IMAGE ?= $(CONSOLE_PLUGIN_IMAGE_BASE):$(VERSION)


# BUNDLE_IMG defines the image:tag used for the bundle.
# You can use it as an arg. (E.g make bundle-build BUNDLE_IMG=<some-registry>/<project-name-bundle>:<tag>)
BUNDLE_IMG ?= $(IMAGE_TAG_BASE)-bundle:$(VERSION)

# BUNDLE_GEN_FLAGS are the flags passed to the operator-sdk generate bundle command
BUNDLE_GEN_FLAGS ?= -q --overwrite --version $(VERSION) $(BUNDLE_METADATA_OPTS)

export DEVICEFINDER_IMAGE ?= $(IMAGE_TAG_BASE)-devicefinder:$(VERSION)

REV=$(shell git describe --long --tags --match='v*' --dirty 2>/dev/null || git rev-list -n1 HEAD)
CURPATH=$(PWD)
TARGET_DIR=$(CURPATH)/_output/bin

CSV ?= ./bundle/manifests/openshift-fusion-access-operator.clusterserviceversion.yaml


# USE_IMAGE_DIGESTS defines if images are resolved via tags or digests
# You can enable this value if you would like to use SHA Based Digests
# To enable set flag to true
USE_IMAGE_DIGESTS ?= false
ifeq ($(USE_IMAGE_DIGESTS), true)
	BUNDLE_GEN_FLAGS += --use-image-digests
endif

# Image URL to use all building/pushing image targets
export OPERATOR_IMG ?= $(IMAGE_TAG_BASE)-operator:$(VERSION)
# ENVTEST_K8S_VERSION refers to the version of kubebuilder assets to be downloaded by envtest binary.
ENVTEST_K8S_VERSION ?= $(shell go list -m -f "{{ .Version }}" k8s.io/api | awk -F'[v.]' '{printf "1.%d", $$3}')

# Get the currently used golang install path (in GOPATH/bin, unless GOBIN is set)
ifeq (,$(shell go env GOBIN))
GOBIN=$(shell go env GOPATH)/bin
else
GOBIN=$(shell go env GOBIN)
endif

# CONTAINER_TOOL defines the container tool to be used for building images.
# Be aware that the target commands are only tested with Docker which is
# scaffolded by default. However, you might want to replace it to use other
# tools. (i.e. podman)
CONTAINER_TOOL ?= podman

# Setting SHELL to bash allows bash commands to be executed by recipes.
# Options are set to exit when a recipe line exits non-zero or a piped command fails.
SHELL = /usr/bin/env bash -o pipefail
.SHELLFLAGS = -ec

.PHONY: all
all: build

##@ General

# The help target prints out all targets with their descriptions organized
# beneath their categories. The categories are represented by '##@' and the
# target descriptions by '##'. The awk command is responsible for reading the
# entire set of makefiles included in this invocation, looking for lines of the
# file as xyz: ## something, and then pretty-format the target and help. Then,
# if there's a line with ##@ something, that gets pretty-printed as a category.
# More info on the usage of ANSI control characters for terminal formatting:
# https://en.wikipedia.org/wiki/ANSI_escape_code#SGR_parameters
# More info on the awk command:
# http://linuxcommand.org/lc3_adv_awk.php

.PHONY: help
help: ## Display this help.
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_0-9-]+:.*?##/ { printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Development

.PHONY: manifests
manifests: yq controller-gen ## Generate WebhookConfiguration, ClusterRole and CustomResourceDefinition objects.
	$(CONTROLLER_GEN) rbac:roleName=manager-role crd webhook paths="./..." output:crd:artifacts:config=config/crd/bases
	# This reads config/samples/fusion_v1alpha1_fusionaccess.yaml and keeps it in sync
	# with the initialization-resource
	sed -i "s|^\(.*operatorframework.io/initialization-resource:\).*|\1 '$$($(YQ) -o=json -I=0 config/samples/fusion_v1alpha1_fusionaccess.yaml)'|" config/manifests/bases/openshift-fusion-access-operator.clusterserviceversion.yaml

.PHONY: cnsa-supported-versions
cnsa-supported-versions: ## Generates CNSA supported version metadata from files/ folder
	@./scripts/update-cnsa-versions-metadata.sh

.PHONY: generate
generate: controller-gen ## Generate code containing DeepCopy, DeepCopyInto, and DeepCopyObject method implementations.
	$(CONTROLLER_GEN) object:headerFile="hack/boilerplate.go.txt" paths="./..."

.PHONY: fmt
fmt: ## Run go fmt against code.
	go fmt ./...

.PHONY: vet
vet: ## Run go vet against code.
	go vet ./...

.PHONY: test
test: pull manifests generate fmt vet envtest ## Run tests.
	KUBEBUILDER_ASSETS="$(shell $(ENVTEST) use $(ENVTEST_K8S_VERSION) --bin-dir $(LOCALBIN) -p path)" go run github.com/onsi/ginkgo/v2/ginkgo -r --randomize-all --randomize-suites --fail-on-pending --keep-going -coverprofile cover.out
	go tool cover -html="cover.out" -o coverage.html
	# Test the scripts as well
	# go test -v ./scripts/rbacs/*.go 2>&1

# Utilize Kind or modify the e2e tests to load the image locally, enabling compatibility with other vendors.make
.PHONY: test-e2e  # Run the e2e tests against a Kind k8s instance that is spun up.
test-e2e:
	go test ./test/e2e/ -v -ginkgo.v

.PHONY: lint
lint: golangci-lint ## Run golangci-lint linter & yamllint
	$(GOLANGCI_LINT) run

.PHONY: lint-fix
lint-fix: golangci-lint ## Run golangci-lint linter and perform fixes
	$(GOLANGCI_LINT) run --fix

##@ Build

# Override GOOS and GOARCH to build for a different OS and architecture. For
# example, MacOS M series (arm64) should be: GOOS=darwin GOARCH=arm64 make build
GOOS ?= linux
GOARCH ?= amd64

.PHONY: build-devicefinder
build-devicefinder: ## Build devicefinder binary.
	env GOOS=$(GOOS) GOARCH=$(GOARCH) go build -mod=vendor -ldflags '-X main.version=$(REV)' -o $(TARGET_DIR)/devicefinder $(CURPATH)/cmd/devicefinder

.PHONY: pull
pull:
	@touch internal/controller/pull.txt

.PHONY: build
build: pull manifests generate fmt vet ## Build manager binary.
	GOOS=${GOOS} GOARCH=${GOARCH} hack/build.sh

.PHONY: run
run: manifests generate fmt vet ## Run a controller from your host.
	GOOS=${GOOS} GOARCH=${GOARCH} hack/build.sh run

.PHONY: clean
clean: ## Remove build artifacts and downloaded tools
	rm -rf ./bundle
	find bin/ -exec chmod +w "{}" \;
	rm -rf ./manager ./bin/* ./cover.out ./coverage.html
	rm -f ./config/samples/fusionaccess-catalog-*.yaml

# Generate Dockerfile using the template. It uses envsubst to replace the value of the version label in the container
.PHONY: generate-dockerfile-operator
generate-dockerfile-operator:
	envsubst < templates/operator.Dockerfile.template > $(OPERATOR_DOCKERFILE)

# Generate Dockerfile using the template. It uses envsubst to replace the value of the version label in the container
.PHONY: generate-dockerfile-devicefinder
generate-dockerfile-devicefinder:
	envsubst < templates/devicefinder.Dockerfile.template > $(DEVICEFINDER_DOCKERFILE)

# Generate Dockerfile using the template. It uses envsubst to replace the value of the version label in the container
.PHONY: generate-dockerfile-console-plugin
generate-dockerfile-console-plugin:
	envsubst '$${VERSION}' < templates/console-plugin.Dockerfile.template > $(CONSOLE_PLUGIN_DOCKERFILE)


# If you wish to build the manager image targeting other platforms you can use the --platform flag.
# (i.e. docker build --platform linux/arm64). However, you must enable docker buildKit for it.
# More info: https://docs.docker.com/develop/develop-images/build_enhancements/
TARGETARCH ?= amd64
.PHONY: docker-build
docker-build: generate-dockerfile-operator ## Build docker image with the manager.
	$(CONTAINER_TOOL) build --secret id=pull,src=$(PULLFILE) --build-arg TARGETARCH=$(TARGETARCH) -t $(OPERATOR_IMG) -f $(CURPATH)/$(OPERATOR_DOCKERFILE) .
	$(CONTAINER_TOOL) tag $(OPERATOR_IMG) $(IMAGE_TAG_BASE)-operator:latest

.PHONY: docker-push
docker-push: ## Push docker image with the manager.
	$(CONTAINER_TOOL) push $(OPERATOR_IMG)
	$(CONTAINER_TOOL) push $(IMAGE_TAG_BASE)-operator:latest

.PHONY: console-build
console-build: generate-dockerfile-console-plugin ## Build the console image
	$(CONTAINER_TOOL) build -f $(CURPATH)/$(CONSOLE_PLUGIN_DOCKERFILE) -t ${CONSOLE_PLUGIN_IMAGE} .
.PHONY: console-push
console-push: ## Push the console image
	$(CONTAINER_TOOL) push $(CONSOLE_PLUGIN_IMAGE)

.PHONY: devicefinder-docker-build
devicefinder-docker-build: generate-dockerfile-devicefinder ## Build docker image of the devicefinder
	$(CONTAINER_TOOL) build -t $(DEVICEFINDER_IMAGE) -f $(CURPATH)/${DEVICEFINDER_DOCKERFILE} .

.PHONY: devicefinder-docker-push
devicefinder-docker-push: ## Push docker image of the devicefinder
	$(CONTAINER_TOOL) push $(DEVICEFINDER_IMAGE)

# PLATFORMS defines the target platforms for the manager image be built to provide support to multiple
# architectures. (i.e. make docker-buildx IMG=myregistry/mypoperator:0.0.1). To use this option you need to:
# - be able to use docker buildx. More info: https://docs.docker.com/build/buildx/
# - have enabled BuildKit. More info: https://docs.docker.com/develop/develop-images/build_enhancements/
# - be able to push the image to your registry (i.e. if you do not set a valid value via IMG=<myregistry/image:<tag>> then the export will fail)
# To adequately provide solutions that are compatible with multiple platforms, you should consider using this option.
PLATFORMS ?= linux/arm64,linux/amd64,linux/s390x,linux/ppc64le
.PHONY: docker-buildx
docker-buildx: ## Build and push docker image for the manager for cross-platform support
	# copy existing Dockerfile and insert --platform=${BUILDPLATFORM} into Dockerfile.cross, and preserve the original Dockerfile
	sed -e '1 s/\(^FROM\)/FROM --platform=\$$\{BUILDPLATFORM\}/; t' -e ' 1,// s//FROM --platform=\$$\{BUILDPLATFORM\}/' Dockerfile > Dockerfile.cross
	- $(CONTAINER_TOOL) buildx create --name project-v3-builder
	$(CONTAINER_TOOL) buildx use project-v3-builder
	- $(CONTAINER_TOOL) buildx build --push --platform=$(PLATFORMS) --tag $(OPERATOR_IMG) -f Dockerfile.cross .
	- $(CONTAINER_TOOL) buildx rm project-v3-builder
	rm Dockerfile.cross

.PHONY: build-installer
build-installer: manifests generate kustomize ## Generate a consolidated YAML with CRDs and deployment.
	mkdir -p dist
	cd config/manager && $(KUSTOMIZE) edit set image controller=$(OPERATOR_IMG)
	$(KUSTOMIZE) build config/default > dist/install.yaml

##@ Deployment

ifndef ignore-not-found
  ignore-not-found = false
endif

.PHONY: install
install: manifests kustomize ## Install CRDs into the K8s cluster specified in ~/.kube/config.
	$(KUSTOMIZE) build config/crd | $(KUBECTL) apply -f -

.PHONY: uninstall
uninstall: manifests kustomize ## Uninstall CRDs from the K8s cluster specified in ~/.kube/config. Call with ignore-not-found=true to ignore resource not found errors during deletion.
	$(KUSTOMIZE) build config/crd | $(KUBECTL) delete --ignore-not-found=$(ignore-not-found) -f -

.PHONY: deploy
deploy: manifests kustomize ## Deploy controller to the K8s cluster specified in ~/.kube/config.
	cd config/manager && $(KUSTOMIZE) edit set image controller=$(OPERATOR_IMG)
	cd config/console-plugin && $(KUSTOMIZE) edit set image console-plugin=${CONSOLE_PLUGIN_IMAGE}
	$(KUSTOMIZE) build config/default | $(KUBECTL) apply -f -

.PHONY: undeploy
undeploy: kustomize ## Undeploy controller from the K8s cluster specified in ~/.kube/config. Call with ignore-not-found=true to ignore resource not found errors during deletion.
	$(KUSTOMIZE) build config/default | $(KUBECTL) delete --ignore-not-found=$(ignore-not-found) -f -

##@ Dependencies

## Location to install dependencies to
LOCALBIN ?= $(shell pwd)/bin
$(LOCALBIN):
	mkdir -p $(LOCALBIN)


## Tool Versions
KUSTOMIZE_VERSION ?= v5.6.0
CONTROLLER_TOOLS_VERSION ?= v0.17.3
ENVTEST_VERSION ?= $(shell go list -m -f "{{ .Version }}" sigs.k8s.io/controller-runtime | awk -F'[v.]' '{printf "release-%d.%d", $$2, $$3}')
GOLANGCI_LINT_VERSION ?= v2.2.2
# update for major version updates to YQ_VERSION!
YQ_API_VERSION = v4
YQ_VERSION = v4.45.4

## Tool Binaries
KUBECTL ?= kubectl
KUSTOMIZE ?= $(LOCALBIN)/kustomize-$(KUSTOMIZE_VERSION)
CONTROLLER_GEN ?= $(LOCALBIN)/controller-gen-$(CONTROLLER_TOOLS_VERSION)
ENVTEST ?= $(LOCALBIN)/setup-envtest-$(ENVTEST_VERSION)
GOLANGCI_LINT ?= $(LOCALBIN)/golangci-lint-$(GOLANGCI_LINT_VERSION)
YQ ?= $(LOCALBIN)/yq-$(YQ_VERSION)
OPERATOR_SDK_VERSION ?= v1.39.2
OPERATOR_SDK ?= $(LOCALBIN)/operator-sdk-$(OPERATOR_SDK_VERSION)


# go-install-tool will 'go install' any package with custom target and name of binary, if it doesn't exist
# $1 - target path with name of binary (ideally with version)
# $2 - package url which can be installed
# $3 - specific version of package
define go-install-tool
@[ -f $(1) ] || { \
set -e; \
package=$(2)@$(3) ;\
echo "Downloading $${package}" ;\
GOBIN=$(LOCALBIN) go install $${package} ;\
mv "$$(echo "$(1)" | sed "s/-$(3)$$//")" $(1) ;\
}
endef

.PHONY: kustomize
kustomize: $(KUSTOMIZE) ## Download kustomize locally if necessary.
$(KUSTOMIZE): $(LOCALBIN)
	$(call go-install-tool,$(KUSTOMIZE),sigs.k8s.io/kustomize/kustomize/v5,$(KUSTOMIZE_VERSION))

.PHONY: controller-gen
controller-gen: $(CONTROLLER_GEN) ## Download controller-gen locally if necessary.
$(CONTROLLER_GEN): $(LOCALBIN)
	$(call go-install-tool,$(CONTROLLER_GEN),sigs.k8s.io/controller-tools/cmd/controller-gen,$(CONTROLLER_TOOLS_VERSION))

.PHONY: envtest
envtest: $(ENVTEST) ## Download setup-envtest locally if necessary.
$(ENVTEST): $(LOCALBIN)
	$(call go-install-tool,$(ENVTEST),sigs.k8s.io/controller-runtime/tools/setup-envtest,$(ENVTEST_VERSION))

.PHONY: golangci-lint
golangci-lint: $(GOLANGCI_LINT) ## Download golangci-lint locally if necessary.
$(GOLANGCI_LINT): $(LOCALBIN)
	$(call go-install-tool,$(GOLANGCI_LINT),github.com/golangci/golangci-lint/v2/cmd/golangci-lint,${GOLANGCI_LINT_VERSION})

.PHONY: yq
yq: $(YQ) ## Download yq locally if necessary.
$(YQ): $(LOCALBIN)
	$(call go-install-tool,$(YQ),github.com/mikefarah/yq/${YQ_API_VERSION},${YQ_VERSION})

.PHONY: operator-sdk
operator-sdk: $(OPERATOR_SDK)
$(OPERATOR_SDK): $(LOCALBIN) ## Download operator-sdk locally if necessary.
	$(call go-install-tool,$(OPERATOR_SDK),github.com/operator-framework/operator-sdk/cmd/operator-sdk,${OPERATOR_SDK_VERSION})

.PHONY: bundle
bundle: manifests kustomize operator-sdk ## Generate bundle manifests and metadata, then validate generated files.
	$(OPERATOR_SDK) generate kustomize manifests -q
	$(KUSTOMIZE) build config/manifests | envsubst | $(OPERATOR_SDK) generate bundle $(BUNDLE_GEN_FLAGS)
	# Since https://www.github.com/operator-framework/operator-sdk/issues/6598 we copy the dependencies file on our own
	cp -f ./config/olm-dependencies.yaml ./bundle/metadata/dependencies.yaml
	./hack/add_openshift_version_annotation.sh
	$(OPERATOR_SDK) bundle validate ./bundle

.PHONY: bundle-build
bundle-build: ## Build the bundle image.
	$(CONTAINER_TOOL) build -f bundle.Dockerfile -t $(BUNDLE_IMG) .
	$(CONTAINER_TOOL) tag $(BUNDLE_IMG) $(IMAGE_TAG_BASE)-bundle:latest

.PHONY: bundle-push
bundle-push: ## Push the bundle image.
	$(CONTAINER_TOOL) push $(BUNDLE_IMG)
	$(CONTAINER_TOOL) push $(IMAGE_TAG_BASE)-bundle:latest

.PHONY: opm
OPM = $(LOCALBIN)/opm
opm: ## Download opm locally if necessary.
ifeq (,$(wildcard $(OPM)))
ifeq (,$(shell which opm 2>/dev/null))
	@{ \
	set -e ;\
	mkdir -p $(dir $(OPM)) ;\
	OS=$(shell go env GOOS) && ARCH=$(shell go env GOARCH) && \
	curl -sSLo $(OPM) https://github.com/operator-framework/operator-registry/releases/download/v1.23.0/$${OS}-$${ARCH}-opm ;\
	chmod +x $(OPM) ;\
	}
else
OPM = $(shell which opm)
endif
endif

# A comma-separated list of bundle images (e.g. make catalog-build BUNDLE_IMGS=example.com/operator-bundle:v0.1.0,example.com/operator-bundle:v0.2.0).
# These images MUST exist in a registry and be pull-able.
BUNDLE_IMGS ?= $(BUNDLE_IMG)

# The image tag given to the resulting catalog image (e.g. make catalog-build CATALOG_IMG=example.com/operator-catalog:v0.2.0).
CATALOG_IMG ?= $(IMAGE_TAG_BASE)-catalog:$(VERSION)

# Set CATALOG_BASE_IMG to an existing catalog image tag to add $BUNDLE_IMGS to that image.
ifneq ($(origin CATALOG_BASE_IMG), undefined)
FROM_INDEX_OPT := --from-index $(CATALOG_BASE_IMG)
endif

# Build a catalog image by adding bundle images to an empty catalog using the operator package manager tool, 'opm'.
# This recipe invokes 'opm' in 'semver' bundle add mode. For more information on add modes, see:
# https://github.com/operator-framework/community-operators/blob/7f1438c/docs/packaging-operator.md#updating-your-existing-operator
.PHONY: catalog-build
catalog-build: opm ## Build a catalog image.
	$(OPM) index add --container-tool docker --mode semver --tag $(CATALOG_IMG) --bundles $(BUNDLE_IMGS) $(FROM_INDEX_OPT)

# Push the catalog image.
.PHONY: catalog-push
catalog-push: ## Push a catalog image.
	$(CONTAINER_TOOL) push $(CATALOG_IMG)

.PHONY: catalog-install
catalog-install: config/samples/fusionaccess-catalog-$(VERSION).yaml ## Install the OLM catalog on a cluster (for testing).
	-oc delete -f config/samples/fusionaccess-catalog-$(VERSION).yaml
	oc create -f config/samples/fusionaccess-catalog-$(VERSION).yaml

.PHONY: config/samples/fusionaccess-catalog-$(VERSION).yaml
config/samples/fusionaccess-catalog-$(VERSION).yaml:
	cp config/samples/fusionaccess-catalog.yaml config/samples/fusionaccess-catalog-$(VERSION).yaml
	sed -i -e "s@CATALOG_IMG@$(CATALOG_IMG)@g" config/samples/fusionaccess-catalog-$(VERSION).yaml

.PHONY: fetchyaml
fetchyaml: ## Fetches install yaml files
	./scripts/fetch-install-yamls.sh

.PHONY: rbacs-generates
rbacs-generate: ## Generates RBACs and injects them in .go file
	CMD_OUTPUT=$$(go run scripts/create-rbacs.go "files/$(RBAC_VERSION)/install.yaml"); \
	sed -i '/IBM_RBAC_MARKER_START/,/IBM_RBAC_MARKER_END/{//!d}' internal/controller/fusionaccess_controller.go; \
	sed -i "/IBM_RBAC_MARKER_START/ r /dev/stdin" internal/controller/fusionaccess_controller.go <<< "$$CMD_OUTPUT"
