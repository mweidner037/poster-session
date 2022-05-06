import * as collabs from "@collabs/collabs";

export type ConstructorParametersMinusInitToken<
  T extends abstract new (first: collabs.InitToken, ...otherArgs: any) => any
> = T extends abstract new (
  first: collabs.InitToken,
  ...otherArgs: infer P
) => any
  ? P
  : never;
