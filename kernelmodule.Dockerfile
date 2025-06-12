ARG IBM_SCALE=quay.io/rhsysdeseng/cp/spectrum/scale/ibm-spectrum-scale-core-init@sha256:fde69d67fddd2e4e0b7d7d85387a221359daf332d135c9b9f239fb31b9b82fe0
ARG DTK_AUTO=quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:01e0e07cc6c41638f8e9022fb9aa36a7984efcde2166d8158fb59a6c9f7dbbdf
ARG KERNEL_FULL_VERSION
FROM ${IBM_SCALE} as src_image
FROM ${DTK_AUTO} as builder
COPY --from=src_image /usr/lpp/mmfs /usr/lpp/mmfs
RUN /usr/lpp/mmfs/bin/mmbuildgpl
FROM registry.redhat.io/ubi9/ubi-minimal
ARG KERNEL_FULL_VERSION
RUN mkdir -p /opt/lib/modules/${KERNEL_FULL_VERSION}
COPY --from=builder /lib/modules/${KERNEL_FULL_VERSION}/extra/*.ko /opt/lib/modules/${KERNEL_FULL_VERSION}/

RUN microdnf install kmod -y && microdnf clean all
RUN depmod -b /opt