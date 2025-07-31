package main

import (
	"fmt"
	"os"
)

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Usage: devicefinder discover")
		os.Exit(1)
	}

	switch os.Args[1] {
	case "discover":
		if err := startDeviceDiscovery(); err != nil {
			fmt.Println(err)
			os.Exit(1)
		}
	default:
		fmt.Printf("Unknown command: %s\n", os.Args[1])
		fmt.Println("Usage: devicefinder discover")
		os.Exit(1)
	}
}
