//
//  ZakovatWidgetLiveActivity.swift
//  ZakovatWidget
//

import ActivityKit
import WidgetKit
import SwiftUI

private let navy = Color(red: 0.04, green: 0.13, blue: 0.25)
private let accent = Color(red: 0.36, green: 0.55, blue: 0.93)

private func mmss(_ seconds: Int) -> String {
    let s = max(0, seconds)
    return String(format: "%d:%02d", s / 60, s % 60)
}

// A countdown that ticks by itself on the Lock Screen / Dynamic Island when
// running, or a frozen mm:ss when paused.
private struct Countdown: View {
    let state: ZakovatWidgetAttributes.ContentState
    var font: Font = .system(.title2, design: .rounded).monospacedDigit().bold()

    var body: some View {
        Group {
            if state.paused {
                Text(mmss(state.remainingSeconds))
            } else {
                Text(timerInterval: Date()...state.endDate, countsDown: true)
                    .multilineTextAlignment(.trailing)
            }
        }
        .font(font)
    }
}

struct ZakovatWidgetLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: ZakovatWidgetAttributes.self) { context in
            // Lock screen / banner
            VStack(spacing: 12) {
                HStack(spacing: 14) {
                    ZStack {
                        Circle().fill(accent.opacity(0.18)).frame(width: 46, height: 46)
                        Image(systemName: "stopwatch")
                            .font(.system(size: 24, weight: .semibold))
                            .foregroundStyle(accent)
                    }
                    VStack(alignment: .leading, spacing: 2) {
                        Text(context.attributes.title)
                            .font(.system(.headline, design: .rounded)).bold()
                            .foregroundStyle(.white)
                        Text(context.state.statusLabel)
                            .font(.system(.subheadline))
                            .foregroundStyle(.white.opacity(0.7))
                    }
                    Spacer()
                    Countdown(state: context.state,
                              font: .system(size: 38, design: .rounded).monospacedDigit().bold())
                        .foregroundStyle(.white)
                        .frame(minWidth: 92, alignment: .trailing)
                }
                if !context.state.paused {
                    ProgressView(timerInterval: context.state.startDate...context.state.endDate,
                                 countsDown: true) { EmptyView() } currentValueLabel: { EmptyView() }
                        .tint(accent)
                        .labelsHidden()
                }
            }
            .padding(16)
            .activityBackgroundTint(navy)
            .activitySystemActionForegroundColor(.white)

        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Label {
                        Text(context.attributes.title)
                            .font(.caption).bold()
                            .foregroundStyle(.white)
                    } icon: {
                        Image(systemName: "stopwatch").foregroundStyle(accent)
                    }
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Countdown(state: context.state)
                        .foregroundStyle(.white)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text(context.state.statusLabel)
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.7))
                }
            } compactLeading: {
                Image(systemName: "stopwatch").foregroundStyle(accent)
            } compactTrailing: {
                Countdown(state: context.state,
                          font: .system(.body, design: .rounded).monospacedDigit().bold())
                    .foregroundStyle(.white)
                    .frame(minWidth: 44)
            } minimal: {
                Image(systemName: "stopwatch").foregroundStyle(accent)
            }
            .keylineTint(accent)
        }
    }
}
