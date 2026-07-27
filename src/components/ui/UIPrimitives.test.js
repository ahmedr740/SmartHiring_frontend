import { fireEvent, render, screen } from "@testing-library/react";
import BrandMark from "../BrandMark";
import Button from "./Button";
import PageHeader from "./PageHeader";

describe("JobHub UI primitives", () => {
    test("renders the accessible JobHub brand", () => {
        render(<BrandMark subtitle="Hospitality staffing" />);
        expect(screen.getByLabelText("JobHub")).toBeInTheDocument();
        expect(screen.getByText("Hospitality staffing")).toBeInTheDocument();
    });

    test("forwards button interaction and disabled state", () => {
        const onClick = jest.fn();
        const { rerender } = render(<Button onClick={onClick}>Continue</Button>);
        fireEvent.click(screen.getByRole("button", { name: "Continue" }));
        expect(onClick).toHaveBeenCalledTimes(1);

        rerender(<Button onClick={onClick} disabled>Continue</Button>);
        expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
    });

    test("renders a consistent page heading hierarchy", () => {
        render(<PageHeader eyebrow="Worker dashboard" title="Your next shift" description="Personalised opportunities." />);
        expect(screen.getByRole("heading", { name: "Your next shift" })).toBeInTheDocument();
        expect(screen.getByText("Personalised opportunities.")).toBeInTheDocument();
    });
});
