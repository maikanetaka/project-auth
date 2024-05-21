import { RegistrationForm } from "./components/RegistrationForm"; 
import { LoginForm } from "./components/LoginForm";
import { ProtectedContent } from "./components/ProtectedContent"; 
import { LogoutButton } from "./components/LogoutButton";

export const App = () => {
  return (
    <div className="App">
      <h1>Autentication</h1>
      <RegistrationForm />
      <LoginForm />
      <ProtectedContent />
      <LogoutButton />
    </div>
  );
}
