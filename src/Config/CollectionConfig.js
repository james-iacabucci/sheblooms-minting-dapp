const CollectionConfig = {
  contractName: 'SheBloomsCollection',
  tokenName: 'She Blooms',
  tokenSymbol: 'SBNFT',
  hiddenMetadataUri: 'ipfs://QmPSsZraxSBSk9eYdUQzVXozJQdw8ztG2KmvMuNzeSG6J9/sheblooms_presale.json',
  maxSupply: 10,
  whitelistSale: {
    price: 0.05,
    maxMintAmountPerTx: 1,
  },
  preSale: {
    price: 0.07,
    maxMintAmountPerTx: 2,
  },
  publicSale: {
    price: 0.09,
    maxMintAmountPerTx: 5,
  },
  contractAddress: "0x14ee41128c4733FFC17f60367EEad7d8f6D7d4CD",
  //contractAddress: "0xFFbBbCCC990bf3205467F8Fd3f656aa72F86817a",
  stakingAddress: "0x00D393033DC6a029e2A4952fBd6960A712E02C2f",
  tokenAddress: "0x60A0E01A1AFc273533aE03F8693dce52F8cD0C1b"
};

export default CollectionConfig;
