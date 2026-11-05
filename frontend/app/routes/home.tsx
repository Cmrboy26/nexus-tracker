import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth0 } from '@auth0/auth0-react';
import  { Sections,Section, SectionTitle, SectionDropdown, closeSectionDropdown } from "~/components/Sections";
import { useAuthFetch } from "~/hooks/useAuthFetch";
import { useProfile } from "~/hooks/useProfile";
import { TabBar } from "~/components/TabBar";
import { Tab } from "~/components/Tab";
import { LabelSelector } from "~/components/LabelSelector";
import { NumberSelector } from "~/components/NumberSelector";
import { Button } from "~/components/Button";
import type { Drink, DrinkEntry, MealEntry, MoodEntry, TrackingSuggestions } from "~/models/tracking";
import { getSuggestions } from "~/module/trackingApi";

export function meta() {
  return [
    { title: "Nexus Tracker" },
    { name: "description", content: "Nexus Tracker" },
  ];
}

function formatTime(time: Date) {
  return time.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
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
  const { profile, refreshProfile } = useProfile();
  const { isAuthenticated, user } = useAuth0();
  const authFetch = useAuthFetch();
  const displayName = profile?.display_name ?? "";

  const dayTimes = ["am", "mid", "pm"];
  const greeting = ["Good morning", "Good afternoon", "Good evening"];
  const currentHour = new Date().getHours();
  const currentDayTime = currentHour < 12 ? "am" : currentHour < 18 ? "mid" : "pm";
  const currentGreeting = greeting[dayTimes.indexOf(currentDayTime)];
  const personalizedGreeting = `${currentGreeting}${displayName ? `, ${displayName}` : ""}.`;

  const [mealSelectedTab, setMealSelectedTab] = useState<MealEntry["period"]>(currentDayTime);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState(new Date()); 

  const [latestLoggedTime, setLatestLoggedTime] = useState<Record<"mood" | "meal" | "drinks", Date | null>>({
    mood: null,
    meal: null,
    drinks: null
  });
  const [, setColorTick] = useState(0);

  useEffect(() => {
    const now = Date.now();
    const timers = Object.values(latestLoggedTime).flatMap(loggedTime => {
      if (!loggedTime) return [];
      return [2, 4].flatMap(hours => {
        const delay = loggedTime.getTime() + hours * 60 * 60 * 1000 - now;
        return delay > 0 ? [setTimeout(() => setColorTick(previous => previous + 1), delay)] : [];
      });
    });
    return () => timers.forEach(clearTimeout);
  }, [latestLoggedTime]);

  function determineColor(category: "mood" | "meal" | "drinks") {
    const loggedTime = latestLoggedTime[category];
    if (!loggedTime) return "text-white";
    const elapsedHours = (Date.now() - loggedTime.getTime()) / (60 * 60 * 1000);
    if (elapsedHours < 2) return "text-green-500 dark:text-green-700";
    if (elapsedHours < 4) return "text-orange-400 dark:text-yellow-500";
    return undefined;
  }

  // Week starts sunday
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - date.getDay() + i);
    return `${date.getMonth() + 1}/${date.getDate()}`;
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

  const [ateEntries, setAteEntries] = useState<Record<"am" | "mid" | "pm", string[]>>({
    am: ["Eggs"],
    mid: [],
    pm: []
  });
  const maxVisibleEntries = 5;

  const feelingCategories = ["mood", "energy", "stress", "focus", "motivation"];
  const [feelings, setFeelings] = useState<MoodEntry["ratings"]>({});
  const [feelingLabels, setFeelingLabels] = useState<string[]>([]);
  const [selectedDrink, setSelectedDrink] = useState<string | null>(null);
  const [builtDrink, setBuiltDrink] = useState<Drink | null>(null);


  const [suggestions, setSuggestions] = useState<TrackingSuggestions | null>(null);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);
  const subject = user?.sub;

  useEffect(() => {
    setSuggestions(null);
    setSuggestionsError(null);
    if (!isAuthenticated || !subject) return;

    const controller = new AbortController();
    getSuggestions(authFetch, controller.signal)
      .then(data => {
        if (!controller.signal.aborted) setSuggestions(data);
      })
      .catch(error => {
        if (!controller.signal.aborted) {
          setSuggestionsError(error instanceof Error ? error.message : "Unable to get suggestions.");
        }
      });
    return () => controller.abort();
  }, [authFetch, isAuthenticated, subject]);

  const commonFeelings = suggestions?.mood ?? [];
  const commonMeals = suggestions?.meals ?? { am: [], mid: [], pm: [] };
  const commonDrinks = suggestions?.drinks ?? [];


  function submitMood(mood: MoodEntry) {
    console.log("Submitting mood:", mood);
    setLatestLoggedTime(previous => ({ ...previous, mood: new Date() }));
  }

  function submitMeal(meal: MealEntry) {
    console.log("Submitting meal:", meal);
    setLatestLoggedTime(previous => ({ ...previous, meal: new Date() }));
  }

  function submitDrink(entry: DrinkEntry) {
    console.log("Submitting drink:", entry);
    setLatestLoggedTime(previous => ({ ...previous, drinks: new Date() }));
  }

  const lastDrinkTime = latestLoggedTime.drinks ? formatTime(latestLoggedTime.drinks) : null;

  return (
    <>
      <Sections>
        {suggestionsError && <p role="alert">{suggestionsError}</p>}
        <SectionTitle>
          {personalizedGreeting}
        </SectionTitle>
        <Section>
          <div className="flex flex-row flex-wrap justify-center items-center gap-4 w-full">
            <TabBar>
              {
                weekDates.map((date) => {
                  return (
                    <div className="flex flex-col items-center">
                      <p>{weekDays[weekDates.indexOf(date)]}</p>
                      <Tab key={date} onClick={() => {
                        setSelectedDate(date);
                      }} label={date} icon={`/icons/${weekStatus[weekDates.indexOf(date)]}.svg`} isActive={selectedDate === date} />
                    </div>
                  );
                })
              }
            </TabBar>
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
        <IconSection image="/icons/smile.svg" iconColor={determineColor("mood")}>
          <SectionDropdown summary={
              <>
                <SectionTitle>
                  Moods & Feelings
                </SectionTitle>
              </>
          }>
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
            <Button className="w-full" onClick={(event) => {
              submitMood({ ratings: feelings, labels: feelingLabels, time: selectedTime });
              closeSectionDropdown(event.currentTarget);
            }}>
              Log Moods & Feelings
            </Button>
          </SectionDropdown>
        </IconSection>
        <IconSection image="/icons/meal.svg" iconColor={determineColor("meal")}>
          <SectionDropdown summary={
              <>
                <SectionTitle>
                  Meals
                </SectionTitle>
              </>
          }>
            <TabBar>
              <Tab key="am" label="AM" icon="/icons/meal.svg" isActive={mealSelectedTab === "am"} onClick={() => setMealSelectedTab("am")} />
              <Tab key="mid" label="MID" icon="/icons/meal.svg" isActive={mealSelectedTab === "mid"} onClick={() => setMealSelectedTab("mid")} />
              <Tab key="pm" label="PM" icon="/icons/meal.svg" isActive={mealSelectedTab === "pm"} onClick={() => setMealSelectedTab("pm")} />
            </TabBar>
            <LabelSelector
              mode="chips"
              value={ateEntries[mealSelectedTab]}
              onChange={(entries) => {
                if (entries.length > ateEntries[mealSelectedTab].length) {
                  submitMeal({ name: entries[entries.length - 1], period: mealSelectedTab });
                }
                setAteEntries(previous => ({ ...previous, [mealSelectedTab]: entries }));
              }}
              options={commonMeals[mealSelectedTab].map((label, index, entries) => ({ label, rank: entries.length - index }))}
              inputLabel="Add new meal"
              addLabel="Add Meal"
              selectedLabel="Ate:"
              suggestionsLabel="... or select from common entries"
              maxVisibleSelected={maxVisibleEntries}
            />
          </SectionDropdown>
        </IconSection>
        <IconSection image="/icons/water.svg" iconColor={determineColor("drinks")}>
            <SectionDropdown summary={
              <>
                <SectionTitle>
                  Caffeine & Drinks
                </SectionTitle>
              </>
            }>
              <TimeSelector selectedTime={selectedTime} onSelect={setSelectedTime} />
              {
                !selectedDrink && (
                <LabelSelector
                  mode="single"
                  value={selectedDrink ? [selectedDrink] : []}
                  onChange={(entries) => {
                    const name = entries[0] ?? null;
                    const preset = commonDrinks.find(drink => drink.name === name);
                    setSelectedDrink(name);
                    setBuiltDrink(name ? { ...(preset ?? { name }) } : null);
                  }}
                  options={commonDrinks.map((drink, index, entries) => ({ label: drink.name, rank: entries.length - index }))}
                  inputLabel="Find or enter a drink"
                  addLabel="Select"
                  suggestionsLabel="Common drinks"
                />)
              }
              {
                selectedDrink && (
                  <>
                    <div className="flex items-center justify-between">
                      <p>Selected drink: {selectedDrink}</p>
                      <Button compact onClick={() => {setSelectedDrink(null); setBuiltDrink(null);}}>Clear</Button>
                    </div>
                    <DrinkBuilder drink={builtDrink} onChange={setBuiltDrink} onSubmit={(event, drink) => {
                      submitDrink({ drink, time: selectedTime });
                      setSelectedDrink(null);
                      setBuiltDrink(null);
                      closeSectionDropdown(event.currentTarget);
                    }} />
                  </>
                )
              }
            </SectionDropdown>
        </IconSection>
      </Sections>
    </>
  );
}
