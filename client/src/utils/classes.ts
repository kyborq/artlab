type TClassName = string | number | boolean | null | undefined;

export const classes = (...names: TClassName[]) => {
  return names.filter(Boolean).join(" ");
};
