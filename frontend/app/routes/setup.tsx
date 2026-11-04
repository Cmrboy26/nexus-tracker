import { Centered } from "~/components/Centered";
import { Form, Navigate } from "react-router";
import { useAuth0 } from "@auth0/auth0-react";
import { useState, type FormEvent } from "react";
import { useAuthFetch } from "~/hooks/useAuthFetch";
import { useProfile } from "~/hooks/useProfile";
import { TextField } from "~/components/TextField";
import StyledButton from "~/components/StyledButton";
import { createProfile } from "~/module/profileApi";

export function meta() {
  return [
    { title: "Nexus Tracker" },
    { name: "description", content: "Nexus Tracker" },
  ];
}



function NameBirthdayForm() {
  const authFetch = useAuthFetch();
  const { refreshProfile } = useProfile();
  const [name, setName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [errors, setErrors] = useState({ name: false, birthday: false });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = formData.get("name");
    const birthday = formData.get("birthday");
    // Name must be >= 3 characters
    // Birthday must be a valid date

    const nextErrors = { name: !name || (typeof name === "string" && name.trim().length < 3), birthday: !birthday || isNaN(Date.parse(birthday as string)) };
    setErrors(nextErrors);
    if (!nextErrors.name && !nextErrors.birthday) {
      setSubmitError(null);
      setIsSubmitting(true);
      try {
        await createProfile(authFetch, { display_name: name as string, birthday: birthday as string });
        await refreshProfile();
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : "Unable to create profile.");
      } finally {
        setIsSubmitting(false);
      }
    }
  }

  return (
    <Form className="flex flex-col" onSubmit={handleSubmit}>
      <TextField name="name" label="What is your name?" value={name} onChange={setName} textError={errors.name ? "Please enter your name." : undefined} />
      <TextField name="birthday" type="date" label="When is your birthday?" value={birthday} onChange={setBirthday} textError={errors.birthday ? "Please enter your birthday." : undefined} />
      {submitError && <p role="alert" className="text-red-500">{submitError}</p>}
      <input type="submit" disabled={isSubmitting} className="mt-8 px-6 py-3 bg-blue-600 text-white text-xl font-bold rounded-lg hover:bg-blue-700" />
    </Form>
  );
}

export default function Home() {
  const { loginWithRedirect, isAuthenticated, isLoading, error } = useAuth0();
  const { status, error: profileError, refreshProfile } = useProfile();

  if (error) return <Centered><p>Authentication failed.</p></Centered>;
  if (isLoading || (isAuthenticated && status === "loading")) return <Centered><p>Loading...</p></Centered>;
  if (!isAuthenticated) {
    return (
      <Centered>
        <h1 className="text-6xl font-bold text-center">Welcome to<br/>NEXUS</h1>
        <StyledButton onClick={() => void loginWithRedirect()}>Login to Get Started</StyledButton>
      </Centered>
    );
  }
  if (status === "error") {
    return (
      <Centered>
        <p role="alert">{profileError}</p>
        <StyledButton onClick={() => void refreshProfile()}>Try again</StyledButton>
      </Centered>
    );
  }
  if (status === "ready") return <Navigate to="/home" replace />;

  return (
    <Centered>
      <h1 className="text-4xl font-bold text-center">Tell us about yourself</h1>
      <NameBirthdayForm />
    </Centered>
  );
}
