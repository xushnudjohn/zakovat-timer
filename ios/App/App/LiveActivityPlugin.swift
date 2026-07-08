import Foundation
import Capacitor
import ActivityKit

@objc(LiveActivityPlugin)
public class LiveActivityPlugin: CAPPlugin {

    // Held as Any? so the stored property doesn't require an availability
    // annotation; cast back to the concrete Activity type inside guards.
    private var activityRef: Any?

    @objc func startActivity(_ call: CAPPluginCall) {
        guard #available(iOS 16.2, *) else {
            call.resolve(["started": false, "reason": "unsupported"])
            return
        }
        guard ActivityAuthorizationInfo().areActivitiesEnabled else {
            call.resolve(["started": false, "reason": "disabled"])
            return
        }

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
            call.resolve(["started": true, "id": activity.id])
        } catch {
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
        // endEpochMs is the absolute wall-clock end time in milliseconds.
        let endMs = call.getDouble("endEpochMs") ?? (Date().timeIntervalSince1970 * 1000)
        let endDate = Date(timeIntervalSince1970: endMs / 1000.0)
        let label = call.getString("statusLabel") ?? ""
        let paused = call.getBool("paused") ?? false
        let remaining = call.getInt("remainingSeconds") ?? 0
        return .init(endDate: endDate, statusLabel: label, paused: paused, remainingSeconds: remaining)
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
