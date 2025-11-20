# Releasing a new internal release

This is totally temporary for now. We'll automate this later

1. In the *main* branch change the version in file *VERSION.txt* to the new release version and submit a PR.

1. Merge the PR to *main*. It isn't necessary to wait for the three konflux PRs that change the nudges on the three containers before moving on the next step.

1. Merge *main* via a PR into branch *v1*. _(Eventually we may wish to cherry-pick from main into v1)_

1. Wait for the three Konflux PRs in the [operator (release-1-0) application](https://konflux-ui.apps.stone-prd-rh01.pg1f.p1.openshiftapps.com/ns/storage-scale-releng-tenant/applications/operator-1-0/), and then take the commit of the last nudge konflux commit and pass it to run
   ```
   ./scripts/konflux-release.sh <commit>
   ```
   _(Before running the script you need to be logged in to the Konflux cluster[^1] and to `quay.io/openshift-storage-scale`[^2]. If you are not logged in the script will error out and then once you have logged in it is safe to re-run the script.)_

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

1. Amend the [Fusion Access for SAN Install](https://docs.google.com/document/d/16dCr9wtK9j5l7nY8w-CCfju93tIV3rcMvslelGkUvEw/edit?tab=t.h0mrtvcsp9vb) doc and announce it on Slack in @team-ecoeng-forum-access mentioning _@fusion-access-qe_ and _@fusion-access-eng_


# Releasing a new official release in the Certified Operators catalog

1. Do a build following the same steps as for a new internal release. This is necessary to get the release version reflected in the metadata.

1. Ensure that the images are tagged in `quay.io/openshift-storage-scale` with the release version number. This is so they won't be garbage collected.

1. Poke Socheat Sou _(IBM associate @ssou in #scale-cnsa-redhat-guest)_ to pull them by digest and upload them to the icr.io registry. The commands will be something like:
   ```
   skopeo copy docker://quay.io/openshift-storage-scale/devicefinder-rhel9@sha256:.... docker://icr.io/cpopen/fusion-access/devicefinder-rhel9
   skopeo copy docker://quay.io/openshift-storage-scale/console-plugin-rhel9@sha256:.... docker://icr.io/cpopen/fusion-access/console-plugin-rhel9
   skopeo copy docker://quay.io/openshift-storage-scale/controller-rhel9-operator@sha256:.... docker://icr.io/cpopen/controller-rhel9-operator
   ```
   The image digest for the devicefinder image can be obtained like this and the digests for the other images similarly:
   ```
   skopeo inspect docker://quay.io/openshift-storage-scale/devicefinder-rhel9:$(cat VERSION.txt) | jq -r .Digest
   ```

1. Once the images have been uploaded to icr.io, generate a bundle/folder + image which points to the icr.io images.
Then we rebuild the latest catalog and do a smoke test, so we can also have qe take a look. Once everything is okay
we commit the released-bundle and use that to generate a PR for their certified-operators repo

1. Then we can do the ISV release on the web page:

   - Run the preflight checks for all three images:
      ```
      preflight-linux-amd64 check container icr.io/cpopen/fusion-access/devicefinder-rhel9@sha256:fef20a... \
      --pyxis-api-token= --certification-component-id=... \
      --certification-project-id=... --submit --loglevel trace
      ```
   - After the preflight is submitted we can create the PR to the certified-operators
   - Once the PR is merged we can publish (or it might happen automatically, to be checked)


# Releasing a new locally built internal release with a new Storage Scale drop

These are the steps for releasing a new locally built internal release incorporating a new drop of Storage Scale from IBM.

First the images in the drop must be uploaded to `quay.io` and a Spectrum Scale install manifest created.

1. Unpack the IBM drop

    A drop from IBM comes in the form of a .zip file downloaded from the IBM Box.
    This zip file contains a compressed tar file which must be extracted. Once this is done you will have a directory with a name of the form `cnsa-v*` containing a script `load_and_push_images.sh` and other files/directories.
1. Login to `quay.io/openshift-storage-scale` [^2]
1. Ensure that your Fusion Access repo is at the tip of main.
1. Upload the drop to `quay.io`

    Change directory to the previously extracted `cnsa-v*` directory and run the script `scripts/upload-cnsa-drop.sh` from your Fusion Access repo.
    When the script completes it will have uploaded the images and created a Spectrum Scale install manifest `install.yaml`. Follow the instructions printed at the end of the script run, to commit the install manifest to the `openshift-fusion-access-manifests` repo.

Next the release is built.

1. Login to `registry.redhat.com` [^3] and `registry.connect.redhat.com` [^4]
1. Change directory to the top of your Fusion Access repo which should be at the tip of main.
1. Edit VERSION.txt to set the desired release version.
1. Edit CNSA_VERSION.txt to set the version of Spectrum Scale.

    The version is derived from the directory name of the drop, by removing the `cnsa-` prefix, replacing the first _ with a dash and all subsequent ones with a period.
    ```
    echo "<dirname>" | sed -e 's/^cnsa-//' -e 's/_/-/' -e 's/_/./g' > CNSA_VERSION.txt
    ```
1. Delete the install.yaml for the current Spectrum Scale version from the `files` directory.
1. Add the new Spectrum Scale version's install.yaml in directory `files/<CNSA_VERSION>/`. This is the same file as was committed when doing the drop upload.
1. Create a template for a catalog containing the version of Fusion Access we are building in `catalog-templates/<VERSION>.yaml`

    Copy the prior versions template and then edit to add the new version and set the digest of the current version which can be obtained with the command
    ```
    skopeo inspect docker://quay.io/openshift-storage-scale/openshift-fusion-access-bundle:<current-version> | jq -r .Digest
    ```
1. Run `./scripts/update-cnsa-versions-metadata.sh` to update the metadata with the new Spectrum Scale version.
1. Tag the current repo commit with the version number.
    ```
    git tag $(cat VERSION.txt)
    ```
1. Build the release.
    ```
    make VERSION=$(cat VERSION.txt) REGISTRY=quay.io/openshift-storage-scale CHANNELS=alpha CHANNEL=alpha release
    ```
1. Create a catalog for the new version. Run
    ```
    make VERSION=$(cat VERSION.txt) REGISTRY=quay.io/openshift-storage-scale CHANNEL=alpha fbc
    ```
    to create it in `catalog-template.yaml`. Verify that it looks sane and all the placeholders have been replaced.
1. Push the catalog to **your private quay**
    ```
    make REGISTRY=quay.io/<user-name> CHANNEL=alpha fbc-push
    ```
   and then sanity test the build using a CatalogSource pointing to this catalog in your private quay.
1. Once you are satisfied with the build, push the catalog to `quay.io/openshift-storage-scale` which will make the build available internally.
    ```
    make REGISTRY=quay.io/openshift-storage-scale CHANNEL=alpha fbc-push
    ```
1. Commit all the changes made to the repo while making the build and re-tag with the version number.
    ```
    git add ...
    git commit
    git tag -f $(cat VERSION.txt)
    ```
1. Submit a PR to main.
1. Update the [Changelog](https://docs.google.com/document/d/16dCr9wtK9j5l7nY8w-CCfju93tIV3rcMvslelGkUvEw/edit?tab=t.h0mrtvcsp9vb) and [Installing or upgrading to 1.1.0-* internal releases](https://docs.google.com/document/d/16dCr9wtK9j5l7nY8w-CCfju93tIV3rcMvslelGkUvEw/edit?tab=t.p6fuw5gwctzy) sections in our `IBM Scale Container Native - Fusion Access for SAN Install` document.
1. Announce the availability of the new release on the #team-ecoeng-fusion-access Slack channel mentioning @fusion-access-qe and @fusion-access-eng. See previous release announcements for examples.

[^1]: `oc login --web --server=https://api.stone-prd-rh01.pg1f.p1.openshiftapps.com:6443`

[^2]: `podman login quay.io/openshift-storage-scale`

[^3]: `podman login registry.redhat.com`

[^4]: `podman login registry.connect.redhat.com`
