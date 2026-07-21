import { isAiMatchSource, matchSourceLabel } from "./workerUtils";

test("recognizes hosted DeepSeek recommendations as AI", () => {
    expect(isAiMatchSource("N8N_DEEPSEEK")).toBe(true);
    expect(matchSourceLabel("N8N_DEEPSEEK")).toBe("DeepSeek AI");
    expect(matchSourceLabel("N8N_OLLAMA")).toBe("Local AI");
    expect(matchSourceLabel("FALLBACK")).toBe("Fallback");
});
