import type { EmailAuthInput, PhoneAuthInput } from "@template/shared";

export type AuthMode = "login" | "register";

export type CredentialAuthInput = {
  credential: string;
  password: string;
};

export type ResolvedCredential =
  | { type: "email"; payload: EmailAuthInput }
  | { type: "phone"; payload: PhoneAuthInput };

export type ValidationError = {
  field: keyof CredentialAuthInput;
  message: string;
};

export type FormProps = {
  mode: AuthMode;
  setMode: (mode: AuthMode) => void;
  loading: boolean;
  onSubmit: (payload: ResolvedCredential) => Promise<unknown>;
};

export type FieldProps = {
  icon: React.ReactNode;
  hasError?: boolean;
} & React.ComponentProps<"input">;
