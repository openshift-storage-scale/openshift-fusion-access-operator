package main

import (
	"fmt"
	"runtime"

	"github.com/openshift-storage-scale/openshift-fusion-access-operator/internal/devicefinder/discovery"
	"github.com/spf13/cobra"
	"k8s.io/klog/v2"
)

func startDeviceDiscovery(_ *cobra.Command, _ []string) error {
	printVersion()

	discoveryObj, err := discovery.NewDeviceDiscovery()
	if err != nil {
		return fmt.Errorf("failed to discover devices: %w", err)
	}

	err = discoveryObj.Start()
	if err != nil {
		return fmt.Errorf("failed to discover devices: %w", err)
	}

	return nil
}

func printVersion() {
	klog.Infof("Go Version: %s", runtime.Version())
	klog.Infof("Go OS/Arch: %s/%s", runtime.GOOS, runtime.GOARCH)
}
