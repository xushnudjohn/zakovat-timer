import ActivityKit
import Foundation

// Shared between the App target (to start/update/end the activity) and the
// ZakovatWidget extension (to render it). This file must be a member of BOTH
// targets — ActivityKit matches the attributes type by name across the two.
struct ZakovatWidgetAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        // Absolute moment the running segment started — used for the progress bar.
        var startDate: Date
        // Absolute moment the running segment ends. Used with Text(timerInterval:)
        // so the countdown ticks on the Lock Screen / Dynamic Island without the
        // app running.
        var endDate: Date
        // Short status line, e.g. "Savol vaqti" or "Javob yozish".
        var statusLabel: String
        // When paused we show a frozen mm:ss instead of a live countdown.
        var paused: Bool
        // Seconds left, used only while paused.
        var remainingSeconds: Int
    }

    // Fixed for the whole activity.
    var title: String
}
