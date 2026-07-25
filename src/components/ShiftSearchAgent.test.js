import { fireEvent, render, screen } from "@testing-library/react";
import ShiftSearchAgent from "./ShiftSearchAgent";

test("opens and submits a worker shift search", () => {
    const onSearch = jest.fn();

    render(
        <ShiftSearchAgent
            onSearch={onSearch}
            onClear={jest.fn()}
            isSearching={false}
            error=""
            hasActiveSearch={false}
        />
    );

    fireEvent.click(screen.getByRole("button", { name: "AI Assistant" }));
    fireEvent.change(
        screen.getByPlaceholderText("e.g. waiter shifts Friday night, at least $18/hr"),
        { target: { value: "Friday waiter shifts" } }
    );
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(onSearch).toHaveBeenCalledWith("Friday waiter shifts");
});

test("clears an active worker shift search", () => {
    const onClear = jest.fn();

    render(
        <ShiftSearchAgent
            onSearch={jest.fn()}
            onClear={onClear}
            isSearching={false}
            error=""
            hasActiveSearch
        />
    );

    fireEvent.click(screen.getByRole("button", { name: "AI Assistant" }));
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));

    expect(onClear).toHaveBeenCalledTimes(1);
});
