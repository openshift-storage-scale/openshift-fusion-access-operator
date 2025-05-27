RPM lockfile generation:

```
BASE_IMAGE=registry.redhat.io/ubi10/ubi:latest
podman run -it $BASE_IMAGE cat /etc/yum.repos.d/ubi.repo > ubi.repo
sed -i 's/\[ubi-10/[ubi-10-for-$basearch/' ubi.repo
rpm-lockfile-prototype --image $BASE_IMAGE rpms.in.yaml
```
Based on:  
https://konflux.pages.redhat.com/docs/users/building/prefetching-dependencies.html#enabling-prefetch-builds-for-rpm  
Also check this:  
https://github.com/konflux-ci/rpm-lockfile-prototype?tab=readme-ov-file#installation
