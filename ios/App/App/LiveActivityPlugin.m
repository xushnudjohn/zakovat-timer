#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

// Registers the Swift LiveActivityPlugin with Capacitor's runtime so it is
// reachable from JS via registerPlugin('LiveActivity').
CAP_PLUGIN(LiveActivityPlugin, "LiveActivity",
    CAP_PLUGIN_METHOD(startActivity, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(updateActivity, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(endActivity, CAPPluginReturnPromise);
)
