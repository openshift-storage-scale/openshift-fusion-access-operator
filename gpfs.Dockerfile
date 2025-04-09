FROM quay.io/openshift-storage-scale/data-management/ibm-spectrum-scale-daemon:5.2.3.0.rc1
RUN sed -i 's/^myopt=""/myopt="SKIP_UNLOADING_THE_MODULE"/' /usr/lpp/mmfs/bin/mmfsenv
