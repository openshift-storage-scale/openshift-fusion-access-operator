# Release new version steps

This is totally temporary for now. We'll automate this later

1. Change VERSION in `_VERSION` file in a PR

1. Merge the PR and wait for the three konflux PRs that change the nudges on
   the three containers

1. Take the commit of the last nudge konflux commit and pass it to
   Run `./scripts/konflux-release.sh <commit>`
   This will pull the images out of konflux and push them into quay.io/openshift-storage-scale
   and create a bundle pointing to these images

1. Add a tag for the <commit> used above and push it to github

1. It also copies this bundle under ./released-bundles/<version>. Create a PR

1. At this point the :latest catalog will contain the new bits. Test these on
   AWS or somewhere. Once you're happy tag the latest catalog image to :stable and push it
   to quay.io

1. Amend the install docs and announce it on slack
