import { LockKeyhole, UserRound } from "lucide-react";
import { useForm } from "react-hook-form";

import { emailAuthSchema, phoneAuthSchema } from "@template/shared";

import { appToast } from "../../../utils/toast";
import type { CredentialAuthInput, ResolvedCredential, ValidationError } from "../types";
import { AuthField } from "./AuthField";
import { AuthSubmitBlock } from "./AuthSubmitBlock";
import type { FormProps } from "../types";

const phoneLikePattern = /^[\d+\s\-()]+$/;

const normalizePhone = (phone: string) => phone.trim().replace(/[\s\-()]/g, "");

const mapSchemaErrors = (
  issues: Array<{ path: PropertyKey[]; message: string }>,
  credentialKey: "email" | "phone",
): ValidationError[] => {
  const errors = issues.map((issue) => ({
    field: issue.path[0] === credentialKey ? "credential" : "password",
    message: issue.message,
  })) satisfies ValidationError[];

  return errors.length > 0
    ? errors
    : [{ field: "credential", message: "Revisá los datos ingresados" }];
};

const resolveCredential = (
  values: CredentialAuthInput,
):
  | { ok: true; value: ResolvedCredential }
  | { ok: false; errors: ValidationError[] } => {
  const credential = values.credential.trim();
  const password = values.password;

  if (credential.includes("@")) {
    const result = emailAuthSchema.safeParse({ email: credential, password });

    if (result.success) {
      return { ok: true, value: { type: "email", payload: result.data } };
    }

    return { ok: false, errors: mapSchemaErrors(result.error.issues, "email") };
  }

  if (phoneLikePattern.test(credential)) {
    const result = phoneAuthSchema.safeParse({
      phone: normalizePhone(credential),
      password,
    });

    if (result.success) {
      return { ok: true, value: { type: "phone", payload: result.data } };
    }

    return { ok: false, errors: mapSchemaErrors(result.error.issues, "phone") };
  }

  const errors: ValidationError[] = [
    {
      field: "credential",
      message: "Ingresá un email o un número de teléfono valido.",
    },
  ];

  const passwordResult = phoneAuthSchema.shape.password.safeParse(password);
  if (!passwordResult.success) {
    errors.push({
      field: "password",
      message: passwordResult.error.issues[0].message,
    });
  }

  return { ok: false, errors };
};

export const UnifiedAuthForm = ({ mode, setMode, loading, onSubmit }: FormProps) => {
  const form = useForm<CredentialAuthInput>({
    defaultValues: {
      credential: "",
      password: "",
    },
  });

  const submit = async (values: CredentialAuthInput) => {
    form.clearErrors();

    const resolved = resolveCredential(values);
    if (!resolved.ok) {
      for (const fieldError of resolved.errors) {
        form.setError(fieldError.field, { message: fieldError.message });
      }
      appToast.error(resolved.errors[0]?.message ?? "Revisá los datos ingresados");
      return;
    }

    try {
      await onSubmit(resolved.value);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No pudimos autenticarte";
      form.setError("credential", { message });
      appToast.error(message);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
      <AuthField
        icon={<UserRound size={18} />}
        placeholder="Email o número de teléfono"
        type="text"
        autoComplete="username"
        hasError={Boolean(form.formState.errors.credential)}
        {...form.register("credential")}
      />
      <AuthField
        icon={<LockKeyhole size={18} />}
        placeholder="Contraseña"
        type="password"
        autoComplete={mode === "login" ? "current-password" : "new-password"}
        hasError={Boolean(form.formState.errors.password)}
        {...form.register("password")}
      />
      <p className="text-[11px] text-cream-secondary">La contraseña debe tener al menos 6 caracteres</p>
      <AuthSubmitBlock mode={mode} setMode={setMode} loading={loading} />
    </form>
  );
};
