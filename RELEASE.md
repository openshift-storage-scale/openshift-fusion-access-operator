# Release new version steps

This is totally temporary for now. We'll automate this later

1. In the *main* branch change the version in file *VERSION.txt* to the new release version and submit a PR.

1. Merge the PR to *main*. It isn't necessary to wait for the three konflux PRs that change the nudges on the three containers before moving on the next step.

1. Merge *main* via a PR into branch *v1*. _(Eventually we may wish to cherry-pick from main into v1)_

1. Wait for the three Konflux PRs in the *operator (release-1-0) application*[^1], and then take the commit of the last nudge konflux commit and pass it to run
   ```
   ./scripts/konflux-release.sh <commit>
   ```
   _(Before running the script you need to be logged in to the Konflux cluster[^2] and to `quay.io/openshift-storage-scale`[^3]. If you are not logged in the script will error out and then once you have logged in it is safe to re-run the script.)_

   This will pull the images out of Konflux and push them into `quay.io/openshift-storage-scale`
   and create a bundle pointing to these images.
   It will also build them locally and push the images with the non-Konflux name (openshift-storage-scale)
   to `quay.io/openshift-storage-scale`

1. Add a tag (the release version) for the *commit* used above and push it to github.

1. It also copies this bundle under ./released-bundles/*version*. Create a PR for it and merge it
   (Hopefully we will drop this step)

1. At this point the *:latest* catalog will contain the new bits. Test these on
   AWS or somewhere. Once you're happy tag the latest catalog image to *:stable* and push it
   to quay.io

1. Amend the install docs and announce it on Slack

- Steps for offical release on ISV

Images will be the following on the non authenticated path:

- icr.io/cpopen/fusion-access/devicefinder-rhel9
- icr.io/cpopen/fusion-access/console-plugin-rhel9
- icr.io/cpopen/controller-rhel9-operator
- icr.io/cpopen/controller-rhel9-operator-bundle
- icr.io/cpopen/fusion-access/devicefinder-rhel10
- icr.io/cpopen/fusion-access/console-plugin-rhel10
- icr.io/cpopen/controller-rhel10-operator
- icr.io/cpopen/controller-rhel10-operator-bundle

We do the build as usual, upload it `quay.io/openshift-storage-scale` and add a
tag with the VERSION.txt so it won't be garbage collected.

Poke Socheat Sou _(IBM associate @ssou in #scale-cnsa-redhat-guest)_ to pull them by digest and upload them to the icr, so the commands will
be something like:
```
skopeo copy docker://quay.io/openshift-storage-scale/devicefinder-rhel9@sha256:.... docker://icr.io/cpopen/fusion-access/devicefinder-rhel9
skopeo copy docker://quay.io/openshift-storage-scale/console-plugin-rhel9@sha256:.... docker://icr.io/cpopen/fusion-access/console-plugin-rhel9
skopeo copy docker://quay.io/openshift-storage-scale/controller-rhel9-operator@sha256:.... docker://icr.io/cpopen/controller-rhel9-operator
```
Once they are uploaded to icr, we must generate a bundle/folder + image so that it points to the icr images.
Then we rebuild the latest catalog and do a smoke test, so we can also have qe take a look. Once everything is okay
we commit the released-bundle and use that to generate a PR for ther certified-operators repo

Then we can do the ISV release on the web page:

- run the preflight checks for all three images:
  ```
  preflight-linux-amd64 check container icr.io/cpopen/fusion-access/devicefinder-rhel9@sha256:fef20a... \
  --pyxis-api-token= --certification-component-id=... \
  --certification-project-id=... --submit --loglevel trace
  ```

- After the preflight is submitted we can create the PR to the certified-operators

- Once the PR is merged we can publish (or it might happen automatically, to be checked)

[^1]: https://konflux-ui.apps.stone-prd-rh01.pg1f.p1.openshiftapps.com/ns/storage-scale-releng-tenant/applications/operator-1-0/
[^2]: `oc login --web --server=https://api.stone-prd-rh01.pg1f.p1.openshiftapps.com:6443`
[^3]: `podman login quay.io/openshift-storage-scale`