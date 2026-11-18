# Dashboard Analytics

ClinicFlow's dashboard analytics are calculated from synchronized PHC records; they are not demo counters.

## Metrics

- **Total Queue:** currently waiting, called, or in-progress General, ANC, and EPI tickets.
- **Completed:** tickets marked `done` during the current local calendar day.
- **Clinic Capacity Used:** today's active arrivals plus completed tickets, divided by the PHC's configured **Daily Patient Capacity**. The display is capped at 100%.
- **Overdue Reminders:** scheduled reminders whose due time has passed.
- **Low Stock:** inventory items whose current stock is at or below their configured low-stock threshold.

PHC administrators can change **Daily Patient Capacity** under **Administration → PHC Settings → Clinic Profile**. Existing PHCs start at 100 patients per day until an administrator configures the facility-specific value.

## Sync health

Sync health is a deterministic operational indicator, not a network-speed measurement:

- live/idle starts at 100, connecting at 85, stale at 70, error at 50, and offline at 0;
- a device that has not completed a sync loses 15 points;
- each pending operation removes 2 points, capped at 40;
- each conflict removes 10 points, capped at 40.

The score is bounded between 0 and 100. Cached clinical data can remain available when the score is low, but staff should treat it as stale until synchronization recovers.

These metrics use no AI and do not provide clinical recommendations.
