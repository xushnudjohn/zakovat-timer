import Foundation
import Capacitor
import ActivityKit

@objc(LiveActivityPlugin)
public class LiveActivityPlugin: CAPPlugin, CAPBridgedPlugin {

    // CAPBridgedPlugin: lets Capacitor 6+ auto-discover this plugin via the
    // Objective-C runtime, no CAP_PLUGIN macro / .m file needed.
    public let identifier = "LiveActivityPlugin"
    public let jsName = "LiveActivity"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "startActivity", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "updateActivity", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "endActivity", returnType: CAPPluginReturnPromise),
    ]

    // Held as Any? so the stored property doesn't require an availability
    // annotation; cast back to the concrete Activity type inside guards.
    private var activityRef: Any?

    @objc func startActivity(_ call: CAPPluginCall) {
        guard #available(iOS 16.2, *) else {
            NSLog("[LiveActivity] unsupported iOS version")
            call.resolve(["started": false, "reason": "unsupported"])
            return
        }
        guard ActivityAuthorizationInfo().areActivitiesEnabled else {
            NSLog("[LiveActivity] activities disabled in Settings")
            call.resolve(["started": false, "reason": "disabled"])
            return
        }
        NSLog("[LiveActivity] starting activity…")

        let title = call.getString("title") ?? "Zakovat taymeri"
        let state = contentState(from: call)

        // Replace any existing activity.
        endCurrentActivity()

        do {
            let attributes = ZakovatWidgetAttributes(title: title)
            let activity = try Activity.request(
                attributes: attributes,
                content: .init(state: state, staleDate: nil)
            )
            self.activityRef = activity
            NSLog("[LiveActivity] started id=\(activity.id)")
            call.resolve(["started": true, "id": activity.id])
        } catch {
            NSLog("[LiveActivity] request failed: \(error.localizedDescription)")
            call.resolve(["started": false, "reason": error.localizedDescription])
        }
    }

    @objc func updateActivity(_ call: CAPPluginCall) {
        guard #available(iOS 16.2, *),
              let activity = activityRef as? Activity<ZakovatWidgetAttributes> else {
            call.resolve()
            return
        }
        let state = contentState(from: call)
        Task {
            await activity.update(.init(state: state, staleDate: nil))
            call.resolve()
        }
    }

    @objc func endActivity(_ call: CAPPluginCall) {
        endCurrentActivity()
        call.resolve()
    }

    // MARK: - Helpers

    @available(iOS 16.2, *)
    private func contentState(from call: CAPPluginCall) -> ZakovatWidgetAttributes.ContentState {
        // endEpochMs / startEpochMs are absolute wall-clock times in milliseconds.
        let nowMs = Date().timeIntervalSince1970 * 1000
        let endMs = call.getDouble("endEpochMs") ?? nowMs
        let startMs = call.getDouble("startEpochMs") ?? nowMs
        let endDate = Date(timeIntervalSince1970: endMs / 1000.0)
        let startDate = Date(timeIntervalSince1970: startMs / 1000.0)
        let label = call.getString("statusLabel") ?? ""
        let paused = call.getBool("paused") ?? false
        let remaining = call.getInt("remainingSeconds") ?? 0
        return .init(startDate: startDate, endDate: endDate, statusLabel: label, paused: paused, remainingSeconds: remaining)
    }

    private func endCurrentActivity() {
        guard #available(iOS 16.2, *),
              let activity = activityRef as? Activity<ZakovatWidgetAttributes> else {
            return
        }
        self.activityRef = nil
        Task {
            await activity.end(nil, dismissalPolicy: .immediate)
        }
    }
}
