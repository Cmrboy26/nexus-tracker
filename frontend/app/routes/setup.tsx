import { TabBar } from "~/components/TabBar";
import { Tab } from "~/components/Tab";
import { useWorkflow, Workflow, WorkflowSection } from "~/components/Workflow";
import { Form } from "react-router";
import { useAuth0 } from "@auth0/auth0-react";

export function meta() {
  return [
    { title: "Nexus Tracker" },
    { name: "description", content: "Nexus Tracker" },
  ];
}

function NextButton({ content }: { content: string }) {
  const { next } = useWorkflow();
  return (
    <button onClick={next} className="mt-8 px-6 py-3 bg-blue-600 text-white text-xl font-bold rounded-lg hover:bg-blue-700">
      {content}
    </button>
  );
}

export default function Home() {

  const { loginWithRedirect, isAuthenticated } = useAuth0();

  const handleRegister = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Handle form submission logic here
    const button = event.nativeEvent.submitter;
    const choice = button instanceof HTMLButtonElement ? button.value : null;

    if (choice === "manual") {
      // Handle login/register
      const formData = new FormData(event.currentTarget);
      const email = formData.get("email");
      const password = formData.get("password");
      console.log("Manual login/register with:", { email, password });
    } else if (choice === "google") {
      // Handle Google login
      console.log("Google login initiated");
      loginWithRedirect({authorizationParams: { connection: "google-oauth2" }});
    }
  };

  

  return (
    <>
      <Workflow initialStep={isAuthenticated ? 2 : 0}>
        <WorkflowSection>
          <h1 className="text-6xl font-bold text-center">Welcome to<br/>NEXUS</h1>
          <NextButton content="Register" />
        </WorkflowSection>
        <WorkflowSection>
          <h1 className="text-2xl font-bold text-center mb-4">Please login or register to continue</h1>
          <Form className="grid grid-cols-1" onSubmit={handleRegister}>
            <div className="flex flex-col">
              <label>
                Email
              </label>
              <input type="text" name="email" className="border rounded-lg p-2 m-2" />
            </div>
            <div className="flex flex-col">
              <label>
                Password
              </label>
              <input type="password" name="password" className="border rounded-lg p-2 m-2" />
            </div>
            <div className="col-span-1 flex justify-center gap-2">
              <button value="manual" type="submit" className="mt-4 px-6 py-3 bg-blue-600 text-white text-xl font-bold rounded-lg hover:bg-blue-700">
                Login / Register
              </button>
              <button value="google" type="submit" className="mt-4 px-6 py-3 bg-blue-600 text-white text-xl font-bold rounded-lg hover:bg-blue-700">
                With Google
              </button>
            </div>
          </Form>
        </WorkflowSection>
        <WorkflowSection>
          <h1 className="text-4xl font-bold text-center">Tell us about yourself</h1>
          <Form>
            <label>
              What is your name?
              <input type="text" name="name" className="border rounded-lg p-2 m-2" />
            </label>
          </Form>
          <NextButton content="Next" />
        </WorkflowSection>
      </Workflow>
    </>
  );
}
