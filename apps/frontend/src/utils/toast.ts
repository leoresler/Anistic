import toast, { type ToastOptions } from "react-hot-toast";

const maxVisibleToasts = 3;
const defaultDuration = 4000;
const warningColor = "#e5c07b";
const infoColor = "#61afef";

type AppToastOptions = ToastOptions;
type AppToastType = "success" | "error" | "loading" | "warning" | "info";

const visibleToastIds: string[] = [];
const visibleToastTimeouts = new Map<string, number>();

const getToastId = (type: AppToastType, message: string, options?: AppToastOptions) =>
  options?.id ?? `app-toast:${type}:${message}`;

const forgetToast = (id: string) => {
  const index = visibleToastIds.indexOf(id);

  if (index >= 0) {
    visibleToastIds.splice(index, 1);
  }

  const timeoutId = visibleToastTimeouts.get(id);
  if (timeoutId !== undefined) {
    window.clearTimeout(timeoutId);
    visibleToastTimeouts.delete(id);
  }
};

const rememberToast = (id: string, duration?: number) => {
  forgetToast(id);
  visibleToastIds.push(id);

  while (visibleToastIds.length > maxVisibleToasts) {
    const oldestToastId = visibleToastIds.shift();

    if (oldestToastId) {
      forgetToast(oldestToastId);
      toast.dismiss(oldestToastId);
    }
  }

  if (duration !== Infinity) {
    const timeoutId = window.setTimeout(
      () => forgetToast(id),
      (duration ?? defaultDuration) + 1000,
    );
    visibleToastTimeouts.set(id, timeoutId);
  }

  return id;
};

const limitedToast = (
  type: AppToastType,
  message: string,
  createToast: (id: string) => string,
  options?: AppToastOptions,
) => rememberToast(createToast(getToastId(type, message, options)), options?.duration);

const accentToast = (
  message: string,
  icon: string,
  color: string,
  type: Extract<AppToastType, "warning" | "info">,
  options?: AppToastOptions,
) =>
  limitedToast(
    type,
    message,
    (id) =>
      toast(message, {
        ...options,
        id,
        icon,
        style: {
          border: `1px solid ${color}`,
          ...options?.style,
        },
      }),
    options,
  );

export const appToast = {
  success: (message: string, options?: AppToastOptions) =>
    limitedToast(
      "success",
      message,
      (id) => toast.success(message, { ...options, id }),
      options,
    ),
  error: (message: string, options?: AppToastOptions) =>
    limitedToast(
      "error",
      message,
      (id) => toast.error(message, { ...options, id }),
      options,
    ),
  loading: (message: string, options?: AppToastOptions) =>
    limitedToast(
      "loading",
      message,
      (id) => toast.loading(message, { ...options, id }),
      options,
    ),
  warning: (message: string, options?: AppToastOptions) =>
    accentToast(message, "⚠️", warningColor, "warning", options),
  info: (message: string, options?: AppToastOptions) =>
    accentToast(message, "ℹ️", infoColor, "info", options),
};
