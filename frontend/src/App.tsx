import { WalletContextProvider } from "./components/WalletContextProvider";
import { ProgramProvider } from "./contexts/ProgramContext";
import { Dashboard } from "./components/Dashboard";

function App() {
  return (
    <WalletContextProvider>
      <ProgramProvider>
        <div className="min-h-screen bg-background">
          <Dashboard />
        </div>
      </ProgramProvider>
    </WalletContextProvider>
  );
}

export default App;
