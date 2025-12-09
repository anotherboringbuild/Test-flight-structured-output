import { TopBar } from "../TopBar";

export default function TopBarExample() {
  return (
    <TopBar
      onSettingsClick={() => console.log("Settings clicked")}
      hasApiKey={false}
    />
  );
}
