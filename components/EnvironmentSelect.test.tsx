import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EnvironmentSelect } from "./EnvironmentSelect";
import { ENVIRONMENTS, ENVIRONMENT_ORDER } from "@/lib/environments";

describe("EnvironmentSelect", () => {
  it("renders the Environment label", () => {
    render(<EnvironmentSelect value="production" onChange={vi.fn()} />);
    expect(screen.getByText("Environment")).toBeInTheDocument();
  });

  it("renders an option for every environment in order", () => {
    render(<EnvironmentSelect value="production" onChange={vi.fn()} />);
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(ENVIRONMENT_ORDER.length);
    ENVIRONMENT_ORDER.forEach((env, i) => {
      expect(options[i]).toHaveValue(env);
      expect(options[i]).toHaveTextContent(ENVIRONMENTS[env].label);
    });
  });

  it("reflects the selected value", () => {
    render(<EnvironmentSelect value="staging" onChange={vi.fn()} />);
    expect(screen.getByRole("combobox")).toHaveValue("staging");
  });

  it("calls onChange with the selected environment", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<EnvironmentSelect value="production" onChange={onChange} />);

    await user.selectOptions(screen.getByRole("combobox"), "development");

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith("development");
  });

  it("is disabled when the disabled prop is true", () => {
    render(<EnvironmentSelect value="production" onChange={vi.fn()} disabled />);
    expect(screen.getByRole("combobox")).toBeDisabled();
  });

  it("is enabled by default", () => {
    render(<EnvironmentSelect value="production" onChange={vi.fn()} />);
    expect(screen.getByRole("combobox")).toBeEnabled();
  });

  it("renders only the environments it is given", () => {
    render(
      <EnvironmentSelect
        value="production"
        onChange={vi.fn()}
        environments={["production", "staging"]}
      />,
    );
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveValue("production");
    expect(options[1]).toHaveValue("staging");
  });
});
