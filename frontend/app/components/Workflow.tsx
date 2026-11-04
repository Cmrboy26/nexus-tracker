import { createContext, useContext, Children, useState } from "react";
import { Centered } from "./Centered";

const WorkflowContext = createContext<{ next: () => void } | null>(null);

export function useWorkflow() {
    const context = useContext(WorkflowContext);
    if (!context) {
        throw new Error("useWorkflow must be used within a WorkflowProvider");
    }
    return context;
}

export function Workflow({ children, initialStep = 0, onFinish = () => {} }: { children: React.ReactNode, initialStep?: number, onFinish?: () => void }) {
    const sections = Children.toArray(children);
    const [step, setStep] = useState(initialStep);

    function next() {
        if (step + 1 >= sections.length) {
            onFinish();
        } else {
            setStep((prevStep) => Math.min(prevStep + 1, sections.length - 1));
        }
    }

    return (
        <WorkflowContext.Provider value={{ next }}>
            <Centered>
                {sections[step]}
            </Centered>
        </WorkflowContext.Provider>
    )
}
export function WorkflowSection({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col justify-center items-center">
            {children}
        </div>
    )
}