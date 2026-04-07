declare module './deployed.json' {
  const value: {
    network: string;
    chainId: number;
    deployedAt: string;
    contracts: {
      RuleRegistry: string;
      AnchorRegistry: string;
    };
    defaultRule: string;
  };
  export default value;
}
