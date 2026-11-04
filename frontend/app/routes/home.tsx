import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { api_url } from "~/module/api";
import { useAuth0 } from '@auth0/auth0-react';
import  { Sections,Section, SectionTitle, SectionDropdown } from "~/components/Sections";
import { useProfile } from "~/hooks/useProfile";
import { TabBar } from "~/components/TabBar";
import { Tab } from "~/components/Tab";
import { TextField } from "~/components/TextField";
import { Button } from "~/components/Button";

export function meta() {
  return [
    { title: "Nexus Tracker" },
    { name: "description", content: "Nexus Tracker" },
  ];
}

export function IconSection({ children, image }: { children: React.ReactNode, image: string }) {
  return (
    <Section>
      <div className="grid grid-cols-2 gap-4 grid-cols-[50px_1fr]">
        <div>
          <img
            src={image}
            alt="Overview"
            className="w-12 h-12 dark:invert"
          />
        </div>
        {children}
      </div>
    </Section>
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
  const displayName = profile?.display_name ?? "";

  const dayTimes = ["am", "mid", "pm"];
  const greeting = ["Good morning", "Good afternoon", "Good evening"];
  const currentHour = new Date().getHours();
  const currentDayTime = currentHour < 12 ? "am" : currentHour < 18 ? "mid" : "pm";
  const currentGreeting = greeting[dayTimes.indexOf(currentDayTime)];
  const personalizedGreeting = `${currentGreeting}${displayName ? `, ${displayName}` : ""}.`;

  const [mealSelectedTab, setMealSelectedTab] = useState<"am" | "mid" | "pm">(currentDayTime);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [mealEntry, setMealEntry] = useState("");
  const [selectedTime, setSelectedTime] = useState(new Date()); 

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

  const commonEntries = {
    "am": ["Eggs", "Sausage", "Toast", "Bacon"],
    "mid": [],
    "pm": ["Fried Rice", "Cookies"]
  }

  const feelingCategories = ["mood", "energy", "stress", "focus", "motivation"];

  return (
    <>
      <Sections>
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
        <IconSection image="/icons/smile.svg">
          <SectionDropdown summary={
            <SectionTitle>Moods & Feelings</SectionTitle>
          }>
            <TimeSelector selectedTime={selectedTime} onSelect={setSelectedTime} />
            {
              feelingCategories.map((category) => (
                <>
                  <p key={category} className="text-center capitalize">{category}</p>
                  <TabBar>
                    <Tab key="low" label="Low" icon="/icons/sad.svg" isActive={false} onClick={() => {}} />
                    <Tab key="medium" label="Medium" icon="/icons/meh.svg" isActive={false} onClick={() => {}} />
                    <Tab key="high" label="High" icon="/icons/smile.svg" isActive={false} onClick={() => {}} />
                  </TabBar>
                </>
              ))
            }
          </SectionDropdown>
        </IconSection>
        <IconSection image="/icons/meal.svg">
          <SectionDropdown summary={
            <SectionTitle>Meals</SectionTitle>
          }>
            <TabBar>
              <Tab key="am" label="AM" icon="/icons/meal.svg" isActive={mealSelectedTab === "am"} onClick={() => setMealSelectedTab("am")} />
              <Tab key="mid" label="MID" icon="/icons/meal.svg" isActive={mealSelectedTab === "mid"} onClick={() => setMealSelectedTab("mid")} />
              <Tab key="pm" label="PM" icon="/icons/meal.svg" isActive={mealSelectedTab === "pm"} onClick={() => setMealSelectedTab("pm")} />
            </TabBar>
            {
              mealSelectedTab === "am" && (
                <>
                  <p>Ate:</p>
                  {
                    commonEntries[mealSelectedTab].map((entry, index) => (
                      <Button key={index} className="px-4 py-2 border rounded mx-2 cursor-pointer">
                        {entry}
                        <img src="/icons/delete.svg" alt="(Remove)" className="w-6 h-6 inline-block ml-2 dark:invert" />
                      </Button>
                    ))
                  }
                </>
              )
            }
            {
              mealSelectedTab === "mid" && (
                <p>Ate: Nothing</p>
              )
            }
            {
              mealSelectedTab === "pm" && (
                <p>Ate: Nothing</p>
              )
            }
            <hr className="w-full my-2" />
            <div className="flex flex-row justify-between items-top">
              <div className="flex-1 min-w-0 m-2">
                <TextField
                  placeholder="Add new meal" 
                  value={mealEntry}
                  onChange={setMealEntry}
                  className="w-full !m-0"
                />
              </div>
              <Button onClick={() => {}} className="flex-shrink-0">
                Add Meal
              </Button>
            </div>
            <p>... or select from common entries</p>
            {
              commonEntries[mealSelectedTab].map((entry, index) => (
                <Button key={index} className="px-4 py-2 border rounded mx-2 cursor-pointer">
                  {entry}  
                  <img src="/icons/add.svg" alt="(Quick Add)" className="w-4 h-4 inline-block ml-2 dark:invert" />
                </Button>
              ))
            }
          </SectionDropdown>
        </IconSection>
      </Sections>
    </>
  );
}
