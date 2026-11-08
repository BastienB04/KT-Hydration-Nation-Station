/** Home ("Pond"): today card, log a sip, reminder status, today's sips and a tip. */
import { Pond } from "../components/Pond";
import { QuickAdd } from "../components/QuickAdd";
import { ReminderStatus } from "../components/ReminderStatus";
import { TipCard } from "../components/TipCard";
import { TodayList } from "../components/TodayList";
import { todayEntries } from "../core/stats";
import { useData } from "../state/AppContext";

export function Home() {
  const data = useData();
  const now = Date.now();
  const hasEntriesToday = todayEntries(data.log, now).length > 0;

  return (
    <section className="screen">
      <Pond data={data} now={now} />
      <QuickAdd hasEntriesToday={hasEntriesToday} />
      <ReminderStatus />
      <TodayList />
      <TipCard />
    </section>
  );
}
