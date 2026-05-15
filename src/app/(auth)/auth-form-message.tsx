import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type AuthFormMessageProps = {
  error?: string;
  message?: string;
};

export function AuthFormMessage({ error, message }: AuthFormMessageProps) {
  if (!error && !message) {
    return null;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Authentication error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert>
      <AlertTitle>Almost there</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
