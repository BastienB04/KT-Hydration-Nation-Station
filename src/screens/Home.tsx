/** Home ("Pond"): progress, quick-add, today's sips, reminder status and a tip. */
import { Pond } from "../components/Pond";
import { QuickAdd } from "../components/QuickAdd";
import { ReminderStatus } from "../components/ReminderStatus";
import { TipCard } from "../components/TipCard";
import { TodayList } from "../components/TodayList";
import { todayEntries, todayTotal } from "../core/stats";
import { useData } from "../state/AppContext";

export function Home() {
  const data = useData();
  const total = todayTotal(data.log, Date.now());
  const goal = data.settings.dailyGoalMl;
  const hasEntriesToday = todayEntries(data.log, Date.now()).length > 0;

  return (
    <section className="screen">
      <Pond total={total} goal={goal} met={total >= goal} />
      <QuickAdd hasEntriesToday={hasEntriesToday} />
      <ReminderStatus />
      <TodayList />
      <TipCard />
    </section>
  );
}
