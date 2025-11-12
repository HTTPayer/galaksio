"use client";

import { Button, type ButtonProps } from "@coinbase/cdp-react";
import React from "react";

type Props = ButtonProps & {
  /** Override default variant if needed */
  variant?: ButtonProps["variant"];
};

export default function MyButton({ variant = "transparentPrimary", ...props }: Props) {
  return <Button variant={variant} {...props} />;
}
