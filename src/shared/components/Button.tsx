import type { ReactNode } from 'react';

const variants = {
  primary: 'btn-primary',
  outline: 'btn-outline',
  ghost: 'btn-ghost',
};

export function Button({ children, variant = 'primary' }: { children: ReactNode; variant?: keyof typeof variants }) {
  return <button className={variants[variant]}>{children}</button>;
}
