export const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export const formatUSD = (cents: number) => usd.format(Math.abs(cents) / 100);
