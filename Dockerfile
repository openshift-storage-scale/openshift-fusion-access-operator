ARG TARGETARCH=amd64

FROM --platform=linux/$TARGETARCH brew.registry.redhat.io/rh-osbs/openshift-golang-builder:v1.23 AS builder

USER 0
# Build the manager binary

WORKDIR /workspace

# Copy the go source
COPY go.mod go.mod
COPY go.sum go.sum

# Copy the go source
COPY vendor/ vendor/
COPY cmd/main.go cmd/main.go
COPY api/ api/
COPY internal/ internal/
COPY files/ files/
COPY hack/ hack/
COPY version/ version/
COPY assets assets/
# Needed to get the git versions in there
COPY .git/ .git/
RUN mkdir licenses
COPY LICENSE licenses/

# Build
RUN --mount=type=secret,id=pull hack/build.sh

# UBI is larger (158Mb vs. 56Mb) but approved by RH
FROM registry.access.redhat.com/ubi9/ubi-minimal:latest
WORKDIR /
COPY --from=builder /workspace/files/ /files/
COPY --from=builder /workspace/manager .
COPY --from=builder /workspace/licenses/ /licenses/
USER 65532:65532

ENTRYPOINT ["/manager"]
