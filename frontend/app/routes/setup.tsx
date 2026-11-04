import { TabBar } from "~/components/TabBar";
import { Tab } from "~/components/Tab";
import { useWorkflow, Workflow, WorkflowSection } from "~/components/Workflow";
import { Form } from "react-router";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router"; 
import { useState, type FormEvent } from "react";
import { useAuthFetch } from "~/hooks/useAuthFetch";
import { useAppDispatch, useAppSelector } from "~/hooks/redux";

export function meta() {
  return [
    { title: "Nexus Tracker" },
    { name: "description", content: "Nexus Tracker" },
  ];
}

function StyledButton({ children, onClick }: { children: React.ReactNode, onClick?: () => void }) {
  return (
    <button onClick={onClick} className="mt-8 px-6 py-3 bg-blue-600 text-white text-xl font-bold rounded-lg hover:bg-blue-700">
      {children}
    </button>
  );
}

function NextButton({ content, action }: { content: string, action?: (next: () => void) => void }) {
  const { next } = useWorkflow();
  return (
    <StyledButton onClick={() => { if (action) {action(next)} else next() }}>
      {content}
    </StyledButton>
  );
}

function NameBirthdayForm() {
  const { next } = useWorkflow();
  const authFetch = useAuthFetch();
  const dispatch = useAppDispatch();
  const [errors, setErrors] = useState({ name: false, birthday: false });
  const [submitError, setSubmitError] = useState<string | null>(null);

  
  async function createProfile(name: string, birthday: string) {
    const response = await authFetch("/profile/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        "display_name": name,
        "birthday": birthday
      }) });
    if (!response.ok) {
      throw new Error("Unable to create profile.");
    }
    await refreshProfile().catch(() => {});
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = formData.get("name");
    const birthday = formData.get("birthday");
    console.log({ name, birthday });

    // Name must be >= 3 characters
    // Birthday must be a valid date

    const nextErrors = { name: !name || (typeof name === "string" && name.trim().length < 3), birthday: !birthday || isNaN(Date.parse(birthday as string)) };
    setErrors(nextErrors);
    if (!nextErrors.name && !nextErrors.birthday) {
      setSubmitError(null);
      try {
        await createProfile(name as string, birthday as string);
        next();
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : "Unable to create profile.");
      }
    }
  }

  return (
    <Form className="flex flex-col" onSubmit={handleSubmit}>
      <label>
        What is your name?
        <input type="text" name="name" aria-invalid={errors.name} aria-describedby={errors.name ? "name-error" : undefined} className="border rounded-lg p-2 m-2" />
        {errors.name && <p id="name-error" className="text-sm text-red-500">Please enter your name.</p>}
      </label>
      <label>
        When is your birthday?
        <input type="date" name="birthday" aria-invalid={errors.birthday} aria-describedby={errors.birthday ? "birthday-error" : undefined} className="border rounded-lg p-2 m-2" />
        {errors.birthday && <p id="birthday-error" className="text-sm text-red-500">Please enter your birthday.</p>}
      </label>
      {submitError && <p role="alert" className="text-red-500">{submitError}</p>}
      <input type="submit" className="mt-8 px-6 py-3 bg-blue-600 text-white text-xl font-bold rounded-lg hover:bg-blue-700" />
    </Form>
  );
}

export default function Home() {
  const { loginWithRedirect, isAuthenticated, logout } = useAuth0();
  const navigate = useNavigate();

  function handleContinue(next: () => void) {
      if (!isAuthenticated) {
        loginWithRedirect();
      } else {
        next();
      }
  }

  function onFinish() {
    navigate("/home");
  }

  return (
    <>
      <Workflow initialStep={isAuthenticated ? 2 : 0} onFinish={onFinish}>
        <WorkflowSection>
          <h1 className="text-6xl font-bold text-center">Welcome to<br/>NEXUS</h1>
          <NextButton content={
            isAuthenticated ? "Continue" : "Login to Get Started"
          } action={handleContinue} />
          {/* <NextButton content="Register" /> */}
        </WorkflowSection>
        <WorkflowSection>
          <h1 className="text-4xl font-bold text-center">Tell us about yourself</h1>
          <NameBirthdayForm />
        </WorkflowSection>
      </Workflow>
    </>
  );
}
