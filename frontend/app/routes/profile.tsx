import { Centered } from "~/components/Centered";
import { Sections, Section, SectionTitle } from "~/components/Sections";
import { TextField } from "~/components/TextField";
import { useAuthFetch } from "~/hooks/useAuthFetch";
import { useProfile } from "~/hooks/useProfile";
import { useState, useEffect } from "react";
import StyledButton from "~/components/StyledButton";
import { updateProfile } from "~/module/profileApi";

export function meta() {
  return [
    { title: "Nexus Tracker" },
    { name: "description", content: "Nexus Tracker" },
  ];
}

export default function Profile() { 
  const { profile, refreshProfile } = useProfile();
  const authFetch = useAuthFetch();

  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [birthday, setBirthday] = useState(profile?.birthday || "");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleUpdateProfile() {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await updateProfile(authFetch, { display_name: displayName, birthday });
      await refreshProfile();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to update profile.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {profile && (
        <Sections>
          <SectionTitle>
            Profile
          </SectionTitle>
          <Section flex>
            <TextField
              label={"Update Name (Currently: " + (profile.display_name || "Not provided") + ")"}
              name="display_name"
              value={displayName}
              onChange={setDisplayName}
            />
            <TextField
              label={"Update Birthday (Currently: " + (profile.birthday || "Not provided") + ")"}
              type="date"
              name="birthday"
              value={birthday}
              onChange={setBirthday}
            />
            <div className="flex justify-end">
              <StyledButton onClick={() => void handleUpdateProfile()}>
                {isSubmitting ? "Updating..." : "Update Profile"}
              </StyledButton>
            </div>
            {submitError && <p role="alert">{submitError}</p>}
          </Section>
        </Sections>
      )}
    </>
  );
}
