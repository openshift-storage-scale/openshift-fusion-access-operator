FROM quay.io/konflux-ci/operator-sdk-builder:latest as builder

ARG OPERATOR_IMG="registry.stage.redhat.io/openshift-storage-scale-operator-tech-preview/controller-rhel9-operator@sha256:50bb08bc3df8801417e7e4c22485c5073b8eb6f471c28093015993f7e093637c"
ARG DEVICEFINDER_IMAGE="registry.stage.redhat.io/openshift-storage-scale-operator-tech-preview/devicefinder-rhel9@sha256:58ce8e008b8a14d98ff3ff1b3ae951c946aa1e3ebc6930d97dc7e31389368646"
ARG CONSOLE_PLUGIN_IMAGE="registry.stage.redhat.io/openshift-storage-scale-operator-tech-preview/storage-scale-operator-console-plugin-rhel9@sha256:f75874d3a4dcd4fd565b795e2884b7c5426600a3fb31ec9b98c3db905a4700fd"
ARG MUST_GATHER_IMAGE="registry.stage.redhat.io/openshift-storage-scale-operator-tech-preview/storage-scale-operator-must-gather-rhel9@sha256:c701119180467e377cdffb0df1d24cb6eb7c68999d3d375acd24d357af84979d"

COPY ./ /repo
WORKDIR /repo
RUN \
    kustomize build config/manifests/ \
    | envsubst \
    | operator-sdk generate bundle \
        -q \
        --overwrite \
        --version $(cat VERSION.txt) \
        --output-dir build \
        --channels development \
        --default-channel development && \
    operator-sdk bundle validate ./build

FROM scratch

LABEL nudge.operator="registry.stage.redhat.io/openshift-storage-scale-operator-tech-preview/controller-rhel9-operator@sha256:50bb08bc3df8801417e7e4c22485c5073b8eb6f471c28093015993f7e093637c"
LABEL nudge.devicefinder="registry.stage.redhat.io/openshift-storage-scale-operator-tech-preview/devicefinder-rhel9@sha256:58ce8e008b8a14d98ff3ff1b3ae951c946aa1e3ebc6930d97dc7e31389368646"
LABEL nudge.console="registry.stage.redhat.io/openshift-storage-scale-operator-tech-preview/storage-scale-operator-console-plugin-rhel9@sha256:f75874d3a4dcd4fd565b795e2884b7c5426600a3fb31ec9b98c3db905a4700fd"
LABEL nudge.must_gather="registry.stage.redhat.io/openshift-storage-scale-operator-tech-preview/storage-scale-operator-must-gather-rhel9@sha256:c701119180467e377cdffb0df1d24cb6eb7c68999d3d375acd24d357af84979d"

COPY --from=builder /repo/build/manifests /manifests/
COPY --from=builder /repo/build/metadata /metadata/

COPY --from=builder licenses /licenses/

USER 1001
# These are three labels needed to control how the pipeline should handle this container image
# This first label tells the pipeline that this is a bundle image and should be
# delivered via an index image
LABEL com.redhat.delivery.operator.bundle=true

# This second label tells the pipeline which versions of OpenShift the operator supports.
# This is used to control which index images should include this operator.
LABEL com.redhat.openshift.versions="v4.18"

# This third label tells the pipeline that this operator should *also* be supported on OCP 4.4 and
# earlier.  It is used to control whether or not the pipeline should attempt to automatically
# backport this content into the old appregistry format and upload it to the quay.io application
# registry endpoints.
LABEL com.redhat.delivery.backport=false

# The rest of these labels are copies of the same content in annotations.yaml and are needed by OLM
LABEL operators.operatorframework.io.bundle.mediatype.v1=registry+v1
LABEL operators.operatorframework.io.bundle.manifests.v1=manifests/
LABEL operators.operatorframework.io.bundle.metadata.v1=metadata/
LABEL operators.operatorframework.io.bundle.package.v1=mtv-operator
LABEL operators.operatorframework.io.bundle.channels.v1=release-v2.7
LABEL operators.operatorframework.io.bundle.channel.default.v1=release-v2.7

# Not sure whate these label expand to
LABEL operators.operatorframework.io.metrics.builder=operator-sdk-v1.22.0+git
LABEL operators.operatorframework.io.metrics.mediatype.v1=metrics+v1
LABEL operators.operatorframework.io.metrics.project_layout=ansible.sdk.operatorframework.io/v1
LABEL operators.operatorframework.io.test.config.v1=tests/scorecard/
LABEL operators.operatorframework.io.test.mediatype.v1=scorecard+v1



LABEL \
    com.redhat.component="OpenShift Storage Scale Operator" \
    distribution-scope="public" \
    name="openshift-storage-scale-bundle" \
    release="v1.0" \
    version="v1.0" \
    maintainer="Red Hat jgil@redhat.com" \
    url="https://github.com/openshift-storage-scale/openshift-storage-scale-operator.git" \
    vendor="Red Hat, Inc." \
    description="" \
    io.k8s.description="" \
    summary="" \
    io.k8s.display-name="OpenShift Storage Scale Operator" \
    io.openshift.tags="openshift,storage,scale" \
    License="Apache License 2.0" \