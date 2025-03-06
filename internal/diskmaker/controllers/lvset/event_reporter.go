package lvset

import (
	"fmt"
	"os"
	"sync"

	"github.com/darkdoc/purple-storage-rh-operator/internal/diskmaker"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/client-go/tools/record"

	"k8s.io/apimachinery/pkg/util/sets"
)

const (
	// ErrorListingExistingSymlinks is an event reason string
	ErrorListingExistingSymlinks = "ErrorListingExistingSymlinks"
	// DiscoveredNewDevice is an event reason string
	DiscoveredNewDevice = "DiscoveredNewDevice"
)

func newDiskEvent(eventReason, message, disk, eventType string) diskmaker.DiskEvent {
	return diskmaker.DiskEvent{EventReason: eventReason, Message: message, Disk: disk, EventType: eventType}
}

type eventReporter struct {
	mux            sync.Mutex
	eventRecorder  record.EventRecorder
	reportedEvents sets.String
}

func newEventReporter(eventRecorder record.EventRecorder) *eventReporter {
	er := &eventReporter{
		eventRecorder: eventRecorder,
	}
	er.reportedEvents = sets.NewString()
	return er
}

func (rep *eventReporter) Report(obj runtime.Object, e diskmaker.DiskEvent) {
	rep.mux.Lock()
	defer rep.mux.Unlock()
	eventKey := fmt.Sprintf("%s:%s:%s", e.EventReason, e.EventType, e.Disk)
	if rep.reportedEvents.Has(eventKey) {
		return
	}
	rep.recordEvent(obj, e)
	rep.reportedEvents.Insert(eventKey)
}

func (reporter *eventReporter) recordEvent(obj runtime.Object, e diskmaker.DiskEvent) {
	nodeName := os.Getenv("MY_NODE_NAME")
	message := e.Message
	if len(nodeName) != 0 {
		message = fmt.Sprintf("%s - %s", nodeName, message)
	}
	reporter.eventRecorder.Eventf(obj, e.EventType, e.EventReason, message)

}
