export const parseBigintString = (payload: any) => {
  return JSON.stringify(payload, (key, value) =>
    typeof value === "bigint" ? value.toString() : value
  );
};
