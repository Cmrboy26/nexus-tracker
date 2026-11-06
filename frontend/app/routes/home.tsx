import { useEffect, useRef, useState } from "react";
import { useAuth0 } from '@auth0/auth0-react';
import  { Sections,Section, SectionTitle, SectionDropdown, closeSectionDropdown } from "~/components/Sections";
import { useAuthFetch } from "~/hooks/useAuthFetch";
import { useProfile } from "~/hooks/useProfile";
import { TabBar } from "~/components/TabBar";
import { Tab } from "~/components/Tab";
import { LabelSelector } from "~/components/LabelSelector";
import { NumberSelector } from "~/components/NumberSelector";
import { Button } from "~/components/Button";
import type { DailyLog, Drink, MealEntry, MoodEntry, TrackingSuggestions } from "~/models/tracking";
import { deleteEntry, getDay, getSuggestions, saveDrink, saveMeal, saveMood } from "~/module/trackingApi";

export function meta() {
  return [
    { title: "Nexus Tracker" },
    { name: "description", content: "Nexus Tracker" },
  ];
}

function localDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function latestTime(entries: { time: Date }[]) {
  return entries.reduce<number | null>((latest, entry) => {
    const time = entry.time.getTime();
    return latest === null ? time : Math.max(latest, time);
  }, null);
}

export function IconSection({ children, image, iconColor }: { children: React.ReactNode, image: string, iconColor?: string }) {
  return (
    <Section>
      <div className="grid grid-cols-2 gap-4 grid-cols-[50px_1fr]">
        <div>
          {iconColor ? (
            <span
              role="img"
              aria-label="Overview"
              className={`block w-12 h-12 bg-current [mask-position:center] [mask-size:contain] [mask-repeat:no-repeat] ${iconColor}`}
              style={{ maskImage: `url("${image}")` }}
            />
          ) : (
            <img
              src={image}
              alt="Overview"
              className="w-12 h-12 dark:invert"
            />
          )}
        </div>
        {children}
      </div>
    </Section>
  );
}

export function DrinkBuilder({ drink, onChange, onSubmit }: { drink: Drink | null, onChange: (drink: Drink | null) => void, onSubmit: (event: React.MouseEvent<HTMLButtonElement>, drink: Drink) => void }) {
  if (!drink) return null;

  return (
    <div className="flex flex-wrap gap-0">
      <label>
        <p>Caffeine (mg)</p>
        <input
          type="number"
          min="0"
          step="any"
          value={drink.caffeineMg ?? ""}
          onChange={(event) => onChange({ ...drink, caffeineMg: event.target.value === "" ? undefined : event.target.valueAsNumber })}
          className="border rounded-lg p-2 m-2 w-28 bg-white dark:bg-gray-900 dark:text-white"
        />
      </label>
      <label>
        <p>Volume</p>
        <input
          type="number"
          min="0"
          step="any"
          value={drink.volume ?? ""}
          onChange={(event) => onChange({ ...drink, volume: event.target.value === "" ? undefined : event.target.valueAsNumber })}
          className="border rounded-lg p-2 m-2 w-28 bg-white dark:bg-gray-900 dark:text-white"
        />
      </label>
      <label>
        <p>Unit</p>
        <select
          value={drink.unit ?? ""}
          onChange={(event) => onChange({ ...drink, unit: (event.target.value || undefined) as Drink["unit"] })}
          className="border rounded-lg p-2 m-2 bg-white dark:bg-gray-900 dark:text-white"
        >
          <option value="">Not specified</option>
          <option value="cups">cups</option>
          <option value="oz">oz</option>
          <option value="ml">ml</option>
        </select>
      </label>
      <div className="w-full flex">
        <Button className="m-2 flex-1" onClick={(event) => onSubmit(event, drink)}>
          Log Drink
        </Button>
      </div>
    </div>
  );
}

export function TimeSelector({ selectedTime, onSelect }: { selectedTime: Date, onSelect: (time: Date) => void }) {
  return (
    <div>
      <p>
        At time: &nbsp;
        <input 
          type="time" value={`${String(selectedTime.getHours()).padStart(2, "0")}:${String(selectedTime.getMinutes()).padStart(2, "0")}`} onChange={(e) => {
            if (!e.target.value) return;
            const [hours, minutes] = e.target.value.split(":").map(Number);
            const newDate = new Date(selectedTime);
            newDate.setHours(hours);
            newDate.setMinutes(minutes);
            onSelect(newDate);
          }}
        />
      </p>
    </div>
  )
}

export default function Home() {
  const { profile } = useProfile();
  const { isAuthenticated, user } = useAuth0();
  const subject = user?.sub;
  const authFetch = useAuthFetch();
  const displayName = profile?.display_name ?? "";

  const dayTimes = ["am", "mid", "pm"];
  const greeting = ["Good morning", "Good afternoon", "Good evening"];
  const currentHour = new Date().getHours();
  const currentDayTime = currentHour < 12 ? "am" : currentHour < 18 ? "mid" : "pm";
  const currentGreeting = greeting[dayTimes.indexOf(currentDayTime)];
  const personalizedGreeting = `${currentGreeting}${displayName ? `, ${displayName}` : ""}.`;

  const [mealSelectedTab, setMealSelectedTab] = useState<MealEntry["period"]>(currentDayTime);
  const [selectedDate, setSelectedDate] = useState(() => localDate(new Date()));
  const [selectedTime, setSelectedTime] = useState(new Date()); 
  const [dayLog, setDayLog] = useState<{ date: string, subject: string, log: DailyLog } | null>(null);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [reloadDay, setReloadDay] = useState(0);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const currentLog = dayLog?.date === selectedDate && dayLog.subject === subject ? dayLog.log : null;

  const [lastMeal, setLastMeal] = useState<{ date: string, subject: string, time: number } | null>(null);
  const lastMealTime = lastMeal?.date === selectedDate && lastMeal.subject === subject ? lastMeal.time : null;
  const lastMoodTime = latestTime(currentLog?.mood ?? []);
  const lastDrinkTime = latestTime(currentLog?.drinks ?? []);
  const [, setColorTick] = useState(0);

  useEffect(() => {
    const now = Date.now();
    const timers = [lastMoodTime, lastMealTime, lastDrinkTime].flatMap(loggedTime => {
      if (loggedTime === null) return [];
      return [2, 4].flatMap(hours => {
        const delay = loggedTime + hours * 60 * 60 * 1000 - now;
        return delay > 0 ? [setTimeout(() => setColorTick(previous => previous + 1), delay)] : [];
      });
    });
    return () => timers.forEach(clearTimeout);
  }, [lastMoodTime, lastMealTime, lastDrinkTime]);

  function determineColor(loggedTime: number | null) {
    if (loggedTime === null) return "text-white";
    const elapsedHours = (Date.now() - loggedTime) / (60 * 60 * 1000);
    if (elapsedHours < 2) return "text-green-500 dark:text-green-700";
    if (elapsedHours < 4) return "text-orange-400 dark:text-yellow-500";
    return undefined;
  }

  // Week starts sunday
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - date.getDay() + i);
    return { date, key: localDate(date), label: `${date.getMonth() + 1}/${date.getDate()}` };
  });
  const weekDays = ["S", "M", "T", "W", "T", "F", "S"];
  const weekStatusTypes = ["budding", "bloomed", "evergreen"];
  const weekStatus = Array.from({ length: 7 }, (_, i) => {
    const randomIndex = Math.floor(Math.random() * weekStatusTypes.length);
    const date = new Date();
    date.setDate(date.getDate() - date.getDay() + i);
    // Days past today should have status "none"
    if (date > new Date()) {
      return "none";
    }
    return weekStatusTypes[randomIndex];
  });

  const ateEntries = Array.from(new Set(currentLog?.meals.filter(meal => meal.period === mealSelectedTab).map(meal => meal.name) ?? []));
  const maxVisibleEntries = 5;

  const feelingCategories = ["mood", "energy", "stress", "focus", "motivation"];
  const [feelings, setFeelings] = useState<MoodEntry["ratings"]>({});
  const [feelingLabels, setFeelingLabels] = useState<string[]>([]);
  const [builtDrink, setBuiltDrink] = useState<Drink | null>(null);


  const [suggestions, setSuggestions] = useState<{ subject: string, data: TrackingSuggestions } | null>(null);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);
  const [reloadSuggestions, setReloadSuggestions] = useState(0);
  const currentSuggestions = isAuthenticated && suggestions && suggestions.subject === subject ? suggestions.data : null;

  useEffect(() => {
    setSuggestionsError(null);
    if (!isAuthenticated || !subject) return;

    const controller = new AbortController();
    getSuggestions(authFetch, controller.signal)
      .then(data => {
        if (!controller.signal.aborted) setSuggestions({ subject, data });
      })
      .catch(error => {
        if (!controller.signal.aborted) {
          setSuggestionsError(error instanceof Error ? error.message : "Unable to get suggestions.");
        }
      });
    return () => controller.abort();
  }, [authFetch, isAuthenticated, subject, reloadSuggestions]);

  useEffect(() => {
    setDayLog(null);
    setTrackingError(null);
    if (!isAuthenticated || !subject) return;

    const controller = new AbortController();
    getDay(authFetch, selectedDate, controller.signal)
      .then(log => {
        if (controller.signal.aborted) return;
        setDayLog({ date: selectedDate, subject, log });
      })
      .catch(error => {
        if (!controller.signal.aborted) setTrackingError(error instanceof Error ? error.message : "Unable to load entries.");
      });
    return () => controller.abort();
  }, [authFetch, isAuthenticated, subject, selectedDate, reloadDay]);

  const commonFeelings = currentSuggestions?.mood ?? [];
  const commonMeals = currentSuggestions?.meals ?? { am: [], mid: [], pm: [] };
  const commonDrinks = currentSuggestions?.drinks ?? [];


  async function updateDay<T>(action: () => Promise<T>, update: (log: DailyLog, result: T) => DailyLog) {
    if (!currentLog || !subject || savingRef.current) return false;
    const date = selectedDate;
    savingRef.current = true;
    setSaving(true);
    setTrackingError(null);
    try {
      const result = await action();
      setDayLog(previous => previous?.date === date && previous.subject === subject ? { date, subject, log: update(previous.log, result) } : previous);
      setReloadSuggestions(previous => previous + 1);
      return true;
    } catch (error) {
      setTrackingError(error instanceof Error ? error.message : "Unable to save entry.");
      return false;
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return (
    <>
      <Sections>
        {suggestionsError && <p role="alert">{suggestionsError}</p>}
        {trackingError && <p role="alert">{trackingError} {!currentLog && <Button compact onClick={() => setReloadDay(previous => previous + 1)}>Retry</Button>}</p>}
        <SectionTitle>
          {personalizedGreeting}
        </SectionTitle>
        <Section>
          <div className="flex flex-row flex-wrap justify-between items-center gap-4 w-full">
            <fieldset aria-label="Select day" disabled={saving} className="w-full">
            <TabBar>
              {
                weekDates.map((date, index) => {
                  return (
                    <div key={date.key} className="flex flex-col items-center">
                      <p>{weekDays[index]}</p>
                      <Tab onClick={() => {
                        setSelectedDate(date.key);
                        setSelectedTime(previous => {
                          const time = new Date(previous);
                          time.setFullYear(date.date.getFullYear(), date.date.getMonth(), date.date.getDate());
                          return time;
                        });
                      }} label={date.label} icon={`/icons/${weekStatus[index]}.svg`} isActive={selectedDate === date.key} />
                    </div>
                  );
                })
              }
            </TabBar>
            </fieldset>
          </div>
        </Section>
        <IconSection image="/icons/today.svg">
          <SectionDropdown summary={
            <SectionTitle>Overview</SectionTitle>
          }>
            <p>Content Here</p>
            <p>Content Here</p>
            <p>Content Here</p>
          </SectionDropdown>
        </IconSection>
        <IconSection image="/icons/smile.svg" iconColor={determineColor(lastMoodTime)}>
          <SectionDropdown summary={
              <>
                <SectionTitle>
                  Moods & Feelings
                </SectionTitle>
              </>
          }>
            <fieldset aria-label="Mood entry" disabled={!currentLog || saving}>
            <TimeSelector selectedTime={selectedTime} onSelect={setSelectedTime} />
            {
              feelingCategories.map((category) => (
                <NumberSelector
                  key={category}
                  label={category}
                  value={feelings[category]}
                  allowDeselect
                  onChange={(value) => setFeelings(previous => ({ ...previous, [category]: value }))}
                />
              ))
            }
            <p>Feelings</p>
            <LabelSelector
              mode="toggle"
              value={feelingLabels}
              onChange={setFeelingLabels}
              options={commonFeelings.map((label, index) => ({ label, rank: commonFeelings.length - index }))}
              inputLabel="Add or find a feeling"
              addLabel="Add"
              compact
            />
            <Button className="w-full" onClick={async (event) => {
              const button = event.currentTarget;
              const mood = { ratings: feelings, labels: feelingLabels, time: selectedTime };
              if (await updateDay(() => saveMood(authFetch, selectedDate, mood), (log, saved) => ({ ...log, mood: [...log.mood, saved] }))) {
                closeSectionDropdown(button);
              }
            }}>
              Log Moods & Feelings
            </Button>
            </fieldset>
          </SectionDropdown>
        </IconSection>
        <IconSection image="/icons/meal.svg" iconColor={determineColor(lastMealTime)}>
          <SectionDropdown summary={
              <>
                <SectionTitle>
                  Meals
                </SectionTitle>
              </>
          }>
            <fieldset aria-label="Meal entry" disabled={!currentLog || saving}>
            <TabBar>
              <Tab key="am" label="AM" icon="/icons/meal.svg" isActive={mealSelectedTab === "am"} onClick={() => setMealSelectedTab("am")} />
              <Tab key="mid" label="MID" icon="/icons/meal.svg" isActive={mealSelectedTab === "mid"} onClick={() => setMealSelectedTab("mid")} />
              <Tab key="pm" label="PM" icon="/icons/meal.svg" isActive={mealSelectedTab === "pm"} onClick={() => setMealSelectedTab("pm")} />
            </TabBar>
            <LabelSelector
              mode="chips"
              value={ateEntries}
              onChange={async (entries) => {
                if (entries.length > ateEntries.length) {
                  const meal = { name: entries[entries.length - 1], period: mealSelectedTab };
                  if (await updateDay(() => saveMeal(authFetch, selectedDate, meal), (log, saved) => ({ ...log, meals: [...log.meals, saved] }))) {
                    if (subject) setLastMeal({ date: selectedDate, subject, time: Date.now() });
                    return true;
                  }
                  return false;
                } else {
                  const removed = currentLog?.meals.find(meal => meal.period === mealSelectedTab && !entries.includes(meal.name));
                  if (removed) return updateDay(() => deleteEntry(authFetch, removed.id), log => ({ ...log, meals: log.meals.filter(meal => meal.id !== removed.id) }));
                  return false;
                }
              }}
              options={commonMeals[mealSelectedTab].map((label, index, entries) => ({ label, rank: entries.length - index }))}
              inputLabel="Add new meal"
              addLabel="Add Meal"
              selectedLabel="Ate:"
              suggestionsLabel="... or select from common entries"
              maxVisibleSelected={maxVisibleEntries}
            />
            </fieldset>
          </SectionDropdown>
        </IconSection>
        <IconSection image="/icons/water.svg" iconColor={determineColor(lastDrinkTime)}>
            <SectionDropdown summary={
              <>
                <SectionTitle>
                  Caffeine & Drinks
                </SectionTitle>
              </>
            }>
              <fieldset aria-label="Drink entry" disabled={!currentLog || saving}>
              <TimeSelector selectedTime={selectedTime} onSelect={setSelectedTime} />
              {
                !builtDrink && (
                <LabelSelector
                  mode="single"
                  value={[]}
                  onChange={(entries) => {
                    const name = entries[0] ?? null;
                    const preset = commonDrinks.find(drink => drink.name === name);
                    setBuiltDrink(name ? { ...(preset ?? { name }) } : null);
                  }}
                  options={commonDrinks.map((drink, index, entries) => ({ label: drink.name, rank: entries.length - index }))}
                  inputLabel="Find or enter a drink"
                  addLabel="Select"
                  suggestionsLabel="Common drinks"
                />)
              }
              {
                builtDrink && (
                  <>
                    <div className="flex items-center justify-between">
                      <p>Selected drink: {builtDrink.name}</p>
                      <Button compact onClick={() => setBuiltDrink(null)}>Clear</Button>
                    </div>
                    <DrinkBuilder drink={builtDrink} onChange={setBuiltDrink} onSubmit={async (event, drink) => {
                      const button = event.currentTarget;
                      const entry = { drink, time: selectedTime };
                      if (await updateDay(() => saveDrink(authFetch, selectedDate, entry), (log, saved) => ({ ...log, drinks: [...log.drinks, saved] }))) {
                        setBuiltDrink(null);
                        closeSectionDropdown(button);
                      }
                    }} />
                  </>
                )
              }
              </fieldset>
            </SectionDropdown>
        </IconSection>
      </Sections>
    </>
  );
}
